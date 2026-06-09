import type { FormData } from "@/types";

export type VeliWizardStep = 1 | 2 | 3 | 4 | 5;

export const VELI_WIZARD_STEPS = [
  { id: 1 as const, title: "Kimlik", subtitle: "Kimlik Bilgileri" },
  { id: 2 as const, title: "Çalışma", subtitle: "Çalışma Bilgileri" },
  { id: 3 as const, title: "Tasarım", subtitle: "Tasarım / Şablon" },
  { id: 4 as const, title: "Görsel", subtitle: "Görsel Ekle" },
  { id: 5 as const, title: "Önizleme", subtitle: "Önizleme ve Çıktı" },
];

export const FAALIYET_CHIPLERI = [
  "Etüt",
  "Ders",
  "Değerler Eğitimi",
  "Kitap Okuma",
  "Sosyal Etkinlik",
  "Etkinlik",
  "Diğer",
] as const;

export function wizardProgress(step: VeliWizardStep): number {
  return Math.round((step / 5) * 100);
}

export function validateVeliWizardStep(
  step: VeliWizardStep,
  form: FormData,
): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  const f0 = form.faaliyetler[0];

  if (step === 1) {
    if (!form.isim.trim()) missing.push("Ad Soyad");
    if (!form.kurumAdi.trim()) missing.push("Kurum / Yurt Adı");
    if (!form.rol.trim()) missing.push("Ünvan / Görev");
  } else if (step === 2) {
    if (!f0?.tur?.trim()) missing.push("Faaliyet türü");
    if (!f0?.alan?.trim()) missing.push("Ders / alan");
  }

  return { ok: missing.length === 0, missing };
}

export function wizardStepQualityLines(form: FormData, seciliSablon: string) {
  const f0 = form.faaliyetler[0];
  return [
    {
      ok: Boolean(form.isim.trim() && form.kurumAdi.trim() && form.rol.trim()),
      label: "Kimlik bilgileri tamamlandı",
    },
    {
      ok: Boolean(f0?.tur?.trim() && f0?.alan?.trim()),
      label: "Çalışma bilgileri tamamlandı",
    },
    { ok: Boolean(seciliSablon), label: "Şablon seçildi" },
    {
      ok: form.gorseller.length > 0,
      label: form.gorseller.length > 0 ? "Görsel eklendi" : "Görsel eklenmedi (zorunlu değil)",
      optional: form.gorseller.length === 0,
    },
  ];
}
