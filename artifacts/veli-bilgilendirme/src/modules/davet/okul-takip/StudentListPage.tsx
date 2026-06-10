import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import type { Student } from "@/modules/davet/okul-takip/types";
import { OKUL_TAKIP_HOME } from "@/modules/davet/okul-takip/routes";
import {
  deleteStudent,
  generateId,
  upsertStudent,
  useOkulTakipStore,
} from "@/modules/davet/okul-takip/store";

const emptyForm: Omit<Student, "id"> = {
  name: "",
  grade: "",
  institution: "",
  group: "",
  parentPhone: "",
  isActive: true,
};

export default function StudentListPage() {
  const { students } = useOkulTakipStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      name: s.name,
      grade: s.grade,
      institution: s.institution,
      group: s.group,
      parentPhone: s.parentPhone,
      isActive: s.isActive,
    });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Ad soyad gerekli.");
      return;
    }
    const student: Student = {
      id: editing?.id ?? generateId("s"),
      ...form,
    };
    upsertStudent(student);
    setModalOpen(false);
    toast.success(editing ? "Öğrenci güncellendi." : "Öğrenci eklendi.");
  };

  const remove = (id: string) => {
    if (!confirm("Bu öğrenciyi silmek istediğinize emin misiniz?")) return;
    deleteStudent(id);
    toast.success("Öğrenci silindi.");
  };

  return (
    <DavetLayout>
      <div className="space-y-5 pb-8">
        <BackButton label="Okul Takip Ana Sayfası" href={OKUL_TAKIP_HOME} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Öğrenci Listesi</h1>
          <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700">
            <Plus size={16} className="mr-2" />
            Öğrenci ekle
          </Button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Ad Soyad</th>
                <th className="px-4 py-3">Sınıf</th>
                <th className="px-4 py-3">Kurum</th>
                <th className="px-4 py-3">Grup</th>
                <th className="px-4 py-3">Veli tel.</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.grade}</td>
                  <td className="px-4 py-3">{s.institution}</td>
                  <td className="px-4 py-3">{s.group}</td>
                  <td className="px-4 py-3">{s.parentPhone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        s.isActive
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                      }
                    >
                      {s.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <div>
              <Label>Kurum</Label>
              <Input
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
              />
            </div>
            <div>
              <Label>Veli telefonu</Label>
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
            <Button onClick={save} className="bg-violet-600 hover:bg-violet-700">
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DavetLayout>
  );
}
