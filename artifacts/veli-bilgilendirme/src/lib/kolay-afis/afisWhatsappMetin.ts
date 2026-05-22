import type { AfisBrief, KolayAfisForm } from "@/types/kolayAfis";

export function afisWhatsappMetni(form: KolayAfisForm, brief: AfisBrief): string {
  const m = brief.metin;
  const satirlar = [
    m.title,
    m.subtitle,
    form.tarih ? `📅 ${form.tarih}` : "",
    "",
    m.shortIntro,
    m.trustMessage ? m.trustMessage : "",
    "",
    m.featureItems.length ? m.featureItems.map((x) => `• ${x}`).join("\n") : "",
    "",
    m.callToAction,
    form.telefon ? `📞 ${form.telefon}` : "",
    form.qrLink ? `🔗 ${form.qrLink}` : "",
    "",
    m.slogan,
    form.kurumAdi ? `— ${form.kurumAdi}` : "",
  ].filter(Boolean);
  return satirlar.join("\n");
}
