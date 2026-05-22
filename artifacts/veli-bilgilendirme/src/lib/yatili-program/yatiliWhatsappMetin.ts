import type { YatiliProgramFormData } from "@/types/yatiliProgram";

/** Afişe sığmayan detaylar için WhatsApp paylaşım metni */
export function yatiliWhatsappMetniOlustur(form: YatiliProgramFormData): string {
  const satirlar = [
    form.kurumAdi && `🏠 *${form.kurumAdi}*`,
    form.programTitle && `📋 ${form.programTitle}`,
    form.programTarihi && `📅 ${form.programTarihi}${form.sinifYasGrubu ? ` · ${form.sinifYasGrubu}` : ""}`,
    form.shortIntro && `\n${form.shortIntro}`,
    form.trustMessage && `\n✅ ${form.trustMessage}`,
    form.activities.length > 0 && `\n*Program:*\n${form.activities.map((m) => `• ${m}`).join("\n")}`,
    form.parentNote && `\n👨‍👩‍👧 ${form.parentNote}`,
    form.slogan && `\n_"${form.slogan}"_`,
    form.kontenjan && `\n📌 Kontenjan: ${form.kontenjan}`,
    form.iletisim && `📞 ${form.iletisim}`,
    form.qrLink && `🔗 ${form.qrLink}`,
    form.callToAction && `\n${form.callToAction}`,
  ].filter(Boolean);

  return satirlar.join("\n");
}
