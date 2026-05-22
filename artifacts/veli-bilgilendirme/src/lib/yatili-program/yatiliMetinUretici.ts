import type { YatiliProgramFormData } from "@/types/yatiliProgram";
import { varsayilanBloklar } from "@/types/yatiliProgram";
import { normalizeYatiliMetin } from "./yatiliAlanKurallari";
import { gunlukProgramPreset } from "./yatiliGunlukProgram";
import { presettenMetinUret } from "./yatiliMetinPresetleri";

export function otomatikMetinDoldur(
  form: Pick<YatiliProgramFormData, "programTuru" | "programTonu" | "kurumAdi">,
): Pick<
  YatiliProgramFormData,
  "programTitle" | "shortIntro" | "trustMessage" | "activities" | "parentNote" | "slogan" | "callToAction" | "gunlukProgram"
> {
  const raw = presettenMetinUret(form.programTuru, form.programTonu, form.kurumAdi);
  const metin = normalizeYatiliMetin(raw);
  return { ...metin, gunlukProgram: gunlukProgramPreset(form.programTuru) };
}

export function normalizeYatiliProgramForm(d: YatiliProgramFormData): YatiliProgramFormData {
  const metin = normalizeYatiliMetin({
    programTitle: d.programTitle,
    shortIntro: d.shortIntro,
    trustMessage: d.trustMessage,
    activities: d.activities,
    parentNote: d.parentNote,
    slogan: d.slogan,
    callToAction: d.callToAction,
  });
  return {
    ...d,
    ...metin,
    kurumAdi: d.kurumAdi.trim(),
    gorseller: d.gorseller.slice(0, 3),
    gorselModu: d.gorselModu ?? "buyuk_kapak",
    arkaPlanId: d.arkaPlanId ?? "sicak_gradient",
    yogunlukModu: d.yogunlukModu ?? "dengeli",
    vurguOdagi: d.vurguOdagi ?? "tarih",
    bloklar: { ...varsayilanBloklar(), ...d.bloklar },
    gunlukProgram: d.gunlukProgram ?? [],
  };
}
