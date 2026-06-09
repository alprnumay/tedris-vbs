import type { FormData } from "@/types";

export const VELI_WIZARD_STEPS = [
  { id: "identity", title: "Kimlik Bilgileri" },
  { id: "work", title: "Çalışma Bilgileri" },
  { id: "design", title: "Tasarım / Şablon" },
  { id: "media", title: "Görsel Ekle" },
  { id: "preview", title: "Önizleme ve Çıktı" },
] as const;

export type VeliWizardStepId = (typeof VELI_WIZARD_STEPS)[number]["id"];
export const VELI_WIZARD_STEP_COUNT = VELI_WIZARD_STEPS.length;
export const VELI_WIZARD_LAST_STEP = VELI_WIZARD_STEP_COUNT - 1;

export const FAALIYET_CHIPLERI = [
  "Etüt",
  "Ders",
  "Değerler Eğitimi",
  "Kitap Okuma",
  "Sosyal Etkinlik",
  "Etkinlik",
  "Diğer",
] as const;

export function wizardProgress(activeStep: number): number {
  return Math.round(((activeStep + 1) / VELI_WIZARD_STEP_COUNT) * 100);
}

export function validateVeliWizardStep(
  activeStep: number,
  form: FormData,
): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  const f0 = form.faaliyetler[0];

  if (activeStep === 0) {
    if (!form.isim.trim()) missing.push("Ad Soyad");
    if (!form.kurumAdi.trim()) missing.push("Kurum / Yurt Adı");
    if (!form.rol.trim()) missing.push("Ünvan / Görev");
  } else if (activeStep === 1) {
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
