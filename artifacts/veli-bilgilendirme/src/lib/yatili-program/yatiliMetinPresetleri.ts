import type { YatiliOtomatikMetin, YatiliProgramTonu, YatiliProgramTuru } from "@/types/yatiliProgram";

export type YatiliMetinPreset = YatiliOtomatikMetin & {
  titleVariants: string[];
};

const ORTAK_MADDELER = [
  "Akşam etüdü ve rehberlik",
  "Sohbet ve kaynaşma ortamı",
  "Birlikte akşam yemeği",
  "Sabah namazı ve kahvaltı",
  "Oda düzeni ve yurt ortamını tanıma",
  "Yatılı düzene alışma",
  "Eğitici ve keyifli program akışı",
  "Hocalar eşliğinde güvenli takip",
  "Arkadaşlık ve grup uyumu",
  "Sorumluluk alışkanlığı kazanma",
] as const;

export const YATILI_MADDE_HAVUZU: readonly string[] = ORTAK_MADDELER;

const PRESETS: Record<YatiliProgramTuru, YatiliMetinPreset> = {
  ilk_yatili: {
    titleVariants: [
      "Yatılı Alıştırma Programı",
      "İlk Yatılı Deneyimine Davet",
      "Yurtta Kalma Alıştırma Gecesi",
    ],
    programTitle: "Yatılı Alıştırma Programı",
    shortIntro: "Yurda ısınma, kaynaşma ve yatılı düzene alışma için özel program.",
    trustMessage: "Talebelerimiz güvenli ve sıcak ortamda yakından takip edilecektir.",
    activities: ["Yurt ve oda tanıtımı", "Akşam etüdü ve rehberlik", "Kaynaşma ortamı", "Akşam yemeği", "Sabah programı"],
    parentNote: "Program süresince veli bilgilendirmesi yapılacaktır.",
    slogan: "Yurda alışmanın en güzel başlangıcı",
    callToAction: "Kontenjan sınırlı. Katılım için iletişime geçin.",
  },
  hafta_sonu: {
    titleVariants: [
      "Hafta Sonu Yatılı Programı",
      "Yatılıya Alışma Hafta Sonu",
      "Yurtta Kalma Tecrübe Programı",
    ],
    programTitle: "Hafta Sonu Yatılı Programı",
    shortIntro: "Hafta sonu yurt deneyimi ve yatılı ortama alışma programı.",
    trustMessage: "Eğitim ve rehberlik boyunca yakın takip sağlanacaktır.",
    activities: ["Yurt deneyimi", "Akşam etüdü", "Kaynaşma ortamı", "Akşam yemeği", "Sabah programı"],
    parentNote: "Program sonunda veli bilgilendirmesi yapılır.",
    slogan: "Bir gece, güzel bir başlangıç",
    callToAction: "Kayıt için bizimle irtibata geçin.",
  },
  nehari_gecis: {
    titleVariants: [
      "Nehari Talebelerine Özel Yatılı Alıştırma",
      "Yatılı Sürece Hazırlık Programı",
      "Nehari'den Yatılıya Geçiş Gecesi",
    ],
    programTitle: "Yatılı Sürece Hazırlık Programı",
    shortIntro: "Nehari talebeler için yatılı sürece hazırlık programı.",
    trustMessage: "Rehberlik desteğiyle güvenli geçiş sağlanacaktır.",
    activities: ["Yatılı düzen tanıtımı", "Oda hazırlığı", "Akşam etüdü", "Grup uyumu", "Güvenli takip"],
    parentNote: "Geçiş sürecinde veli bilgilendirmesi yapılır.",
    slogan: "Adım adım yatılı hayata",
    callToAction: "Ön kayıt için iletişime geçin.",
  },
  yaz_kampi_oncesi: {
    titleVariants: [
      "Yaz Kampı Öncesi Yatılı Alıştırma Programı",
      "Kampa Hazırlık ve Uyum Gecesi",
      "Yaz Öncesi Yatılı Alıştırma",
    ],
    programTitle: "Kampa Hazırlık Alıştırması",
    shortIntro: "Yaz kampı öncesi yurt düzenine alışma ve hazırlık gecesi.",
    trustMessage: "Disiplinli ve güvenli ortamda yakın takip sağlanır.",
    activities: ["Kamp bilgilendirmesi", "Yurt tanıtımı", "Akşam etüdü", "Ekip ruhu", "Sabah özeti"],
    parentNote: "Kamp öncesi veli notu paylaşılır.",
    slogan: "Kampa güçlü bir başlangıç",
    callToAction: "Erken kayıt için iletişime geçin.",
  },
  tanisma_uyum: {
    titleVariants: ["Tanışma ve Uyum Programı", "Yurt Hayatına İlk Adım", "Tanışma ve Uyum Gecesi"],
    programTitle: "Tanışma ve Uyum Programı",
    shortIntro: "Yurt ortamı ve arkadaşlarla tanışma için uyum programı.",
    trustMessage: "Rehber öğretmenler eşliğinde güvenli karşılama.",
    activities: ["Tanışma oyunları", "Yurt tanıtımı", "Akşam etkinlik", "Akşam yemeği", "Grup uyumu"],
    parentNote: "Veli bilgilendirmesi ve iletişim desteği sunulur.",
    slogan: "Yurt hayatına sıcak bir merhaba",
    callToAction: "Kayıt için iletişime geçin.",
  },
};

const TON_KISA_GIRIS: Record<YatiliProgramTonu, (base: string) => string> = {
  sicak: (b) => b,
  kurumsal: (b) => b.replace(/hazırladık/gi, "planladık").replace(/davetlisiniz/gi, "davet edilmektedir"),
  ikna_edici: (b) => fitShort(b, 160),
  enerjik: (b) => fitShort(b.replace(/\.$/, "") + " Heyecan dolu bir gece!", 160),
};

const TON_CTA: Record<YatiliProgramTonu, (base: string) => string> = {
  sicak: (b) => b,
  kurumsal: (b) => b,
  ikna_edici: (b) => b.replace(/iletişime geç/gi, "hemen iletişime geç"),
  enerjik: (b) => fitShort(b.replace(/\.$/, "") + " Yerinizi ayırtın!", 100),
};

function fitShort(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

export function presetAl(tur: YatiliProgramTuru): YatiliMetinPreset {
  return PRESETS[tur];
}

export function presettenMetinUret(
  tur: YatiliProgramTuru,
  ton: YatiliProgramTonu,
  kurumAdi?: string,
): YatiliOtomatikMetin {
  const p = presetAl(tur);
  const titleIdx = ton === "enerjik" ? 0 : ton === "kurumsal" ? 1 : 0;
  const programTitle = p.titleVariants[titleIdx] ?? p.programTitle;
  const shortIntro = TON_KISA_GIRIS[ton](p.shortIntro);
  const callToAction = TON_CTA[ton](p.callToAction);

  return {
    programTitle,
    shortIntro,
    trustMessage: p.trustMessage,
    activities: [...p.activities],
    parentNote: p.parentNote,
    slogan: p.slogan,
    callToAction,
  };
}
