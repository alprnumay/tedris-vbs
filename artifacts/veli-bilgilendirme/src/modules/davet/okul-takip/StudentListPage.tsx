import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Archive, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Student, ViewerInstitutionOption } from "@/modules/davet/okul-takip/types";
import {
  OKUL_TAKIP_HOME_BACK_LABEL,
  OKUL_TAKIP_INSTITUTION_HINT,
} from "@/modules/davet/okul-takip/constants";
import { OKUL_TAKIP_HOME } from "@/modules/davet/okul-takip/routes";
import {
  fetchMyInstitutions,
  getOkulTakipUserMessage,
} from "@/modules/davet/okul-takip/okulTakipApi";
import {
  deleteStudent,
  reloadOkulTakipStore,
  upsertStudent,
  useOkulTakipStore,
} from "@/modules/davet/okul-takip/store";
import {
  buildStudentImportPreview,
  buildImportRowMessage,
  formatLeftSignalSources,
  importStatusLabel,
  reapplyStudentImportOptions,
  recalculateStudentImportSummary,
  type StudentImportRow,
  type StudentImportSummary,
} from "@/modules/davet/okul-takip/studentExcelImport";

type StudentForm = Omit<Student, "id">;

const emptyForm: StudentForm = {
  name: "",
  grade: "",
  institution: "",
  institutionName: "",
  institutionId: null,
  mintikaName: "",
  group: "",
  parentPhone: "",
  isActive: true,
};

const emptyImportSummary: StudentImportSummary = {
  totalRows: 0,
  addable: 0,
  existing: 0,
  left: 0,
  institutionMismatch: 0,
  mintikaMismatch: 0,
  error: 0,
  added: 0,
  failed: 0,
};

export default function StudentListPage() {
  const { students, loading, ready, apiIssue } = useOkulTakipStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("");
  const [institutions, setInstitutions] = useState<ViewerInstitutionOption[]>([]);
  const [needsInstitutionMapping, setNeedsInstitutionMapping] = useState(false);
  const [institutionMessage, setInstitutionMessage] = useState<string | null>(null);
  const [institutionsLoading, setInstitutionsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [importRows, setImportRows] = useState<StudentImportRow[]>([]);
  const [importSummary, setImportSummary] = useState<StudentImportSummary>(emptyImportSummary);
  const [importLoading, setImportLoading] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);
  const [importLeftAsActive, setImportLeftAsActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setInstitutionsLoading(true);
    void fetchMyInstitutions()
      .then((res) => {
        if (cancelled) return;
        setInstitutions(res.institutions);
        setNeedsInstitutionMapping(res.needsInstitutionMapping);
        setInstitutionMessage(res.message ?? null);
        if (res.defaultInstitutionId) {
          setSelectedInstitutionId(res.defaultInstitutionId);
        } else if (res.institutions.length === 1) {
          setSelectedInstitutionId(res.institutions[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInstitutions([]);
          setNeedsInstitutionMapping(true);
          setInstitutionMessage("Kullanıcının bağlı olduğu yurt/kurum bulunamadı.");
        }
      })
      .finally(() => {
        if (!cancelled) setInstitutionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedInstitution = useMemo(() => {
    if (selectedInstitutionId) {
      return institutions.find((item) => item.id === selectedInstitutionId) ?? null;
    }
    return institutions.length === 1 ? institutions[0] : null;
  }, [institutions, selectedInstitutionId]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      institution: selectedInstitution?.institutionName ?? "",
      institutionName: selectedInstitution?.institutionName ?? "",
      institutionId: selectedInstitution?.id ?? null,
      mintikaName: selectedInstitution?.mintikaName ?? "",
    });
    if (selectedInstitution) setSelectedInstitutionId(selectedInstitution.id);
    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      name: s.name,
      grade: s.grade,
      institution: s.institutionName ?? s.institution,
      institutionName: s.institutionName ?? s.institution,
      institutionId: s.institutionId ?? null,
      mintikaName: s.mintikaName ?? "",
      needsInstitutionMapping: s.needsInstitutionMapping,
      group: s.group,
      parentPhone: s.parentPhone,
      isActive: s.isActive,
    });
    if (s.institutionId) setSelectedInstitutionId(s.institutionId);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Ad soyad gerekli.");
      return;
    }
    if (needsInstitutionMapping || (!selectedInstitution && institutions.length === 0 && !editing?.institutionId)) {
      toast.error("Bu kullanıcı için yurt/kurum eşleştirmesi yapılmamış. Lütfen yönetici ile görüşün.");
      return;
    }
    if (institutions.length > 1 && !selectedInstitutionId && !editing?.institutionId) {
      toast.error("Lütfen yurt/kurum seçin.");
      return;
    }

    setSaving(true);
    try {
      const institutionId = selectedInstitutionId || editing?.institutionId || selectedInstitution?.id || null;
      const student: Student = {
        id: editing?.id ?? "",
        ...form,
        institution: selectedInstitution?.institutionName ?? form.institutionName ?? form.institution,
        institutionName: selectedInstitution?.institutionName ?? form.institutionName ?? form.institution,
        institutionId,
        mintikaName: selectedInstitution?.mintikaName ?? form.mintikaName ?? "",
        studentCode: editing?.studentCode,
        nationalId: editing?.nationalId,
        rawImportData: editing?.rawImportData ?? null,
        importedAt: editing?.importedAt ?? null,
      };
      await upsertStudent(student, institutionId);
      setModalOpen(false);
      toast.success(editing ? "Öğrenci güncellendi." : "Öğrenci eklendi.");
    } catch (err) {
      toast.error(getOkulTakipUserMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Bu öğrenciyi silmek istediğinize emin misiniz?")) return;
    try {
      await deleteStudent(id);
      toast.success("Öğrenci silindi.");
    } catch (err) {
      toast.error(getOkulTakipUserMessage(err, "Öğrenci silinemedi. Lütfen tekrar deneyin."));
    }
  };

  const archive = async (student: Student) => {
    try {
      await upsertStudent({ ...student, isActive: false }, student.institutionId);
      toast.success("Öğrenci arşivlendi (pasif).");
    } catch (err) {
      toast.error(getOkulTakipUserMessage(err));
    }
  };

  const resetImport = () => {
    setImportFileName("");
    setImportRows([]);
    setImportSummary(emptyImportSummary);
    setImportLoading(false);
    setImportSaving(false);
    setImportCompleted(false);
    setImportLeftAsActive(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openImport = () => {
    if (needsInstitutionMapping || institutions.length === 0) {
      toast.error("Bu kullanıcı için yurt/kurum eşleştirmesi yapılmamış. Lütfen yönetici ile görüşün.");
      return;
    }
    resetImport();
    setImportOpen(true);
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    setImportLoading(true);
    setImportCompleted(false);
    setImportFileName(file.name);
    try {
      const preview = await buildStudentImportPreview({
        file,
        existingStudents: students,
        institutions,
        selectedInstitutionId: selectedInstitutionId || selectedInstitution?.id || null,
        options: { importLeftStudentsAsActive: importLeftAsActive },
      });
      setImportRows(preview.rows);
      setImportSummary(preview.summary);
      toast.success("Dosya kontrol edildi.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Excel dosyası okunamadı. Lütfen doğru formatta .xlsx dosyası yükleyin.";
      toast.error(message);
      setImportRows([]);
      setImportSummary(emptyImportSummary);
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLeftImportOptionChange = (checked: boolean) => {
    setImportLeftAsActive(checked);
    if (importRows.length === 0 || importCompleted) return;
    const preview = reapplyStudentImportOptions(importRows, students, {
      importLeftStudentsAsActive: checked,
    });
    setImportRows(preview.rows);
    setImportSummary(preview.summary);
  };

  const confirmImport = async () => {
    const addableRows = importRows.filter((row) => row.status === "addable");
    if (addableRows.length === 0) {
      toast.info("İçe aktarılacak yeni öğrenci yok.");
      return;
    }

    setImportSaving(true);
    const importedAt = new Date().toISOString();
    const nextRows = [...importRows];

    for (const row of addableRows) {
      const idx = nextRows.findIndex((item) => item.rowNumber === row.rowNumber);
      try {
        const student: Student = {
          id: "",
          name: row.name,
          grade: row.grade,
          group: row.group,
          institution: row.targetInstitutionName,
          institutionName: row.targetInstitutionName,
          institutionId: row.targetInstitutionId,
          mintikaName: row.targetMintikaName,
          parentPhone: row.parentPhone,
          isActive: true,
          studentCode: row.studentCode,
          nationalId: row.nationalId,
          rawImportData: row.rawImportData,
          importedAt,
        };
        await upsertStudent(student, row.targetInstitutionId);
        if (idx >= 0) {
          const leftIgnored = importLeftAsActive && row.leftSignals.length > 0;
          nextRows[idx] = {
            ...row,
            status: "added",
            leftIgnored,
            message: buildImportRowMessage("added", row.leftSignals, leftIgnored),
          };
          setImportRows([...nextRows]);
          setImportSummary(recalculateStudentImportSummary(nextRows));
        }
      } catch (err) {
        if (idx >= 0) {
          nextRows[idx] = {
            ...row,
            status: "failed",
            message: importStatusLabel("failed"),
          };
          setImportRows([...nextRows]);
          setImportSummary(recalculateStudentImportSummary(nextRows));
        }
      }
    }

    await reloadOkulTakipStore();
    setImportCompleted(true);
    setImportSaving(false);
    const summary = recalculateStudentImportSummary(nextRows);
    toast.success(`${summary.added} öğrenci içe aktarıldı.`);
  };

  const activeStudents = students.filter((s) => s.isActive);
  const archivedStudents = students.filter((s) => !s.isActive);
  const unmappedCount = students.filter((s) => s.needsInstitutionMapping).length;

  if (!ready && loading) {
    return (
      <DavetLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Öğrenciler yükleniyor…
        </div>
      </DavetLayout>
    );
  }

  return (
    <DavetLayout>
      <div className="space-y-5 pb-8">
        <BackButton label={OKUL_TAKIP_HOME_BACK_LABEL} href={OKUL_TAKIP_HOME} />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Öğrencilerim</h1>
            <p className="text-sm text-slate-600">Kendi öğrenci listenizi yönetin</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={openImport}
              disabled={institutionsLoading || needsInstitutionMapping || institutions.length === 0}
            >
              <Upload size={16} className="mr-2" />
              Excel’den Talebe Yükle
            </Button>
            <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700" disabled={institutionsLoading}>
              <Plus size={16} className="mr-2" />
              Öğrenci ekle
            </Button>
          </div>
        </div>

        {apiIssue ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {apiIssue}
          </div>
        ) : null}

        {!institutionsLoading && (needsInstitutionMapping || institutions.length === 0) ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {institutionMessage ?? "Bu kullanıcı için yurt/kurum eşleştirmesi yapılmamış. Lütfen yönetici ile görüşün."}
          </div>
        ) : null}

        {unmappedCount > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {unmappedCount} öğrencinin yurt eşleştirmesi eksik. Kayıtlar raporlarda “Eşleştirilmemiş
            Kayıtlar” altında görünür; yönetici eşleştirme yapabilir.
          </div>
        ) : null}

        {activeStudents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm text-slate-600">Henüz öğrenci eklemediniz.</p>
            <Button onClick={openAdd} className="mt-4 bg-violet-600 hover:bg-violet-700">
              İlk öğrenciyi ekle
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeStudents.map((s) => (
              <StudentCard
                key={s.id}
                student={s}
                onEdit={() => openEdit(s)}
                onArchive={() => void archive(s)}
                onDelete={() => void remove(s.id)}
              />
            ))}
          </div>
        )}

        {archivedStudents.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Arşiv (pasif)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {archivedStudents.map((s) => (
                <StudentCard
                  key={s.id}
                  student={s}
                  onEdit={() => openEdit(s)}
                  onRestore={async () => {
                    try {
                      await upsertStudent({ ...s, isActive: true }, s.institutionId);
                      toast.success("Öğrenci tekrar aktif edildi.");
                    } catch (err) {
                      toast.error(getOkulTakipUserMessage(err));
                    }
                  }}
                  onDelete={() => void remove(s.id)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Öğrenci düzenle" : "Yeni öğrenci"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Ad Soyad</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sınıf</Label>
                <Input
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                />
              </div>
              <div>
                <Label>Grup</Label>
                <Input
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                />
              </div>
            </div>

            {institutions.length > 1 ? (
              <div>
                <Label>Yurt / Kurum</Label>
                <Select value={selectedInstitutionId} onValueChange={setSelectedInstitutionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Yurt seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.institutionName} · {item.mintikaName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Yurt / Kurum</Label>
                  <Input
                    readOnly
                    value={selectedInstitution?.institutionName ?? form.institutionName ?? form.institution}
                    className="bg-slate-50"
                  />
                </div>
                <div>
                  <Label>Mıntıka</Label>
                  <Input
                    readOnly
                    value={selectedInstitution?.mintikaName ?? form.mintikaName ?? ""}
                    className="bg-slate-50"
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500">{OKUL_TAKIP_INSTITUTION_HINT}</p>

            <div>
              <Label>Veli telefonu (isteğe bağlı)</Label>
              <Input
                value={form.parentPhone}
                onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label>Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => void save()}
              disabled={saving || needsInstitutionMapping || institutions.length === 0}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open && !importSaving) resetImport();
        }}
      >
        <DialogContent className="flex max-h-[92vh] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl top-[4vh] translate-x-[-50%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
          <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12">
            <DialogTitle>Excel’den Talebe Yükle</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">Excel dosyanızı seçin</p>
                  <p className="text-xs text-slate-500">
                    Sadece .xlsx kabul edilir. Dosya kontrol edilir, onay vermeden kayıt yapılmaz.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => void handleImportFile(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importLoading || importSaving}
                >
                  {importLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
                  Dosya seç
                </Button>
              </div>
              {importFileName ? <p className="mt-3 text-xs text-slate-600">Seçilen dosya: {importFileName}</p> : null}
            </div>

            {importRows.length > 0 ? (
              <>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="font-semibold text-emerald-950">Dosya kontrol edildi</p>
                  <p className="mt-1 text-sm text-emerald-900">
                    {importSummary.addable} yeni öğrenci eklenecek, {importSummary.existing} öğrenci zaten kayıtlı.
                  </p>
                </div>

                <ImportSummaryGrid summary={importSummary} />

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <Checkbox
                    checked={importLeftAsActive}
                    onCheckedChange={(checked) => handleLeftImportOptionChange(checked === true)}
                    disabled={importLoading || importSaving || importCompleted}
                  />
                  <span className="text-sm leading-5 text-slate-700">
                    Ayrıldı görünen öğrencileri de aktif olarak içe aktar
                  </span>
                </label>

                <div className="max-h-[min(360px,38vh)] overflow-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Satır</th>
                        <th className="px-3 py-2">Ad Soyad</th>
                        <th className="px-3 py-2">Sınıf</th>
                        <th className="px-3 py-2">Kurum / Mıntıka</th>
                        <th className="px-3 py-2">Veli telefonu</th>
                        <th className="px-3 py-2">Ayrıldı kaynağı</th>
                        <th className="px-3 py-2">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {importRows.map((row) => (
                        <tr key={row.rowNumber}>
                          <td className="px-3 py-2 text-slate-500">{row.rowNumber}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{row.name || "—"}</td>
                          <td className="px-3 py-2 text-slate-600">{row.grade || "—"}</td>
                          <td className="px-3 py-2 text-slate-600">
                            {row.institutionName || row.targetInstitutionName || "—"}
                            {row.mintikaName || row.targetMintikaName ? ` · ${row.mintikaName || row.targetMintikaName}` : ""}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{row.parentPhone || "—"}</td>
                          <td className="px-3 py-2 text-slate-600">
                            {row.leftSignals.length > 0 ? formatLeftSignalSources(row.leftSignals) : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <span className={statusBadgeClass(row.status)}>{row.message}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importSaving}>
              {importCompleted ? "Kapat" : "İptal"}
            </Button>
            <Button
              onClick={() => void confirmImport()}
              disabled={importSaving || importLoading || importSummary.addable === 0 || importCompleted}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {importSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Onayla ve İçe Aktar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DavetLayout>
  );
}

function ImportSummaryGrid({ summary }: { summary: StudentImportSummary }) {
  const items = [
    ["Toplam satır", summary.totalRows],
    ["Eklenecek", summary.addable],
    ["Eklendi", summary.added],
    ["Zaten kayıtlı", summary.existing],
    ["Ayrıldı diye atlanan", summary.left],
    ["Kurum uyuşmayan", summary.institutionMismatch],
    ["Mıntıka uyuşmayan", summary.mintikaMismatch],
    ["Hatalı", summary.error + summary.failed],
  ] as const;

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}

function statusBadgeClass(status: StudentImportRow["status"]): string {
  const base = "rounded-full px-2 py-0.5 text-xs font-semibold";
  if (status === "addable") return `${base} bg-blue-100 text-blue-800`;
  if (status === "added") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "existing") return `${base} bg-slate-100 text-slate-700`;
  if (status === "left") return `${base} bg-amber-100 text-amber-800`;
  if (status === "institution_mismatch" || status === "mintika_mismatch") return `${base} bg-orange-100 text-orange-800`;
  return `${base} bg-red-100 text-red-800`;
}

function StudentCard({
  student,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  student: Student;
  onEdit: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-slate-900">{student.name}</p>
          <p className="text-xs text-slate-500">
            {student.grade} · {student.group}
          </p>
          {student.institutionName || student.institution ? (
            <p className="mt-1 text-xs text-slate-500">
              {student.institutionName ?? student.institution}
              {student.mintikaName ? ` · ${student.mintikaName}` : ""}
            </p>
          ) : null}
          {student.needsInstitutionMapping ? (
            <p className="mt-1 text-[10px] font-semibold text-amber-700">Yurt eşleştirmesi eksik</p>
          ) : null}
        </div>
        <span
          className={
            student.isActive
              ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
              : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
          }
        >
          {student.isActive ? "Aktif" : "Pasif"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil size={14} className="mr-1" />
          Düzenle
        </Button>
        {onArchive ? (
          <Button variant="outline" size="sm" onClick={onArchive}>
            <Archive size={14} className="mr-1" />
            Arşivle
          </Button>
        ) : null}
        {onRestore ? (
          <Button variant="outline" size="sm" onClick={onRestore}>
            Aktifleştir
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600">
          <Trash2 size={14} className="mr-1" />
          Sil
        </Button>
      </div>
    </div>
  );
}
