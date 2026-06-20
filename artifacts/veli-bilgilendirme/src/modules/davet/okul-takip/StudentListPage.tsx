import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Archive, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
  upsertStudent,
  useOkulTakipStore,
} from "@/modules/davet/okul-takip/store";

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

export default function StudentListPage() {
  const { students, loading, ready, apiIssue } = useOkulTakipStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("");
  const [institutions, setInstitutions] = useState<ViewerInstitutionOption[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setInstitutionsLoading(true);
    void fetchMyInstitutions()
      .then((list) => {
        if (cancelled) return;
        setInstitutions(list);
        if (list.length === 1) setSelectedInstitutionId(list[0].id);
      })
      .catch(() => {
        if (!cancelled) setInstitutions([]);
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
    if (!selectedInstitution && institutions.length === 0 && !editing?.institutionId) {
      toast.error("Hesabınıza bağlı yurt/kurum bulunamadı. Lütfen yönetici ile iletişime geçin.");
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
          <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700" disabled={institutionsLoading}>
            <Plus size={16} className="mr-2" />
            Öğrenci ekle
          </Button>
        </div>

        {apiIssue ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {apiIssue}
          </div>
        ) : null}

        {!institutionsLoading && institutions.length === 0 ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            Hesabınıza bağlı yurt/kurum tanımı bulunamadı. Öğrenci eklemek için yöneticinizden kurum
            eşleştirmesi isteyin.
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
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DavetLayout>
  );
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
