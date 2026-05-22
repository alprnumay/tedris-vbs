import type { GunlukProgramSatiri, YatiliProgramTuru } from "@/types/yatiliProgram";

const PRESETLER: Record<YatiliProgramTuru, GunlukProgramSatiri[]> = {
  ilk_yatili: [
    { saat: "17:00", etkinlik: "Karşılama ve oda yerleşimi" },
    { saat: "18:30", etkinlik: "Akşam yemeği ve sohbet" },
    { saat: "20:00", etkinlik: "Etüt ve rehberlik" },
    { saat: "22:00", etkinlik: "Kaynaşma etkinliği" },
    { saat: "07:00", etkinlik: "Sabah programı ve kahvaltı" },
  ],
  hafta_sonu: [
    { saat: "16:00", etkinlik: "Yurda giriş ve tanışma" },
    { saat: "19:00", etkinlik: "Akşam yemeği" },
    { saat: "20:30", etkinlik: "Etüt saati" },
    { saat: "08:00", etkinlik: "Kahvaltı ve değerlendirme" },
  ],
  nehari_gecis: [
    { saat: "17:30", etkinlik: "Yatılı düzen tanıtımı" },
    { saat: "19:00", etkinlik: "Akşam yemeği" },
    { saat: "20:00", etkinlik: "Rehberlik ve soru-cevap" },
    { saat: "07:30", etkinlik: "Sabah kahvaltısı" },
  ],
  yaz_kampi_oncesi: [
    { saat: "18:00", etkinlik: "Kamp hazırlık bilgilendirmesi" },
    { saat: "19:30", etkinlik: "Akşam yemeği" },
    { saat: "21:00", etkinlik: "Motivasyon ve etüt" },
    { saat: "08:00", etkinlik: "Sabah özeti" },
  ],
  tanisma_uyum: [
    { saat: "17:00", etkinlik: "Tanışma oyunları" },
    { saat: "19:00", etkinlik: "Akşam yemeği" },
    { saat: "20:30", etkinlik: "Yurt gezisi" },
    { saat: "07:30", etkinlik: "Sabah kahvaltısı" },
  ],
};

export function gunlukProgramPreset(tur: YatiliProgramTuru): GunlukProgramSatiri[] {
  return PRESETLER[tur].map((s) => ({ ...s }));
}
