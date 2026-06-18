import type { FormData } from "@/types";
import { aciklamaolustur } from "@/lib/dil";

/** WhatsApp sohbetine yapıştırılacak tam paylaşım metni (görselden daha detaylı). */
export function veliWhatsappMesajiOlustur(form: FormData): string {
  const faaliyet = form.faaliyetler[0];
  const tur = faaliyet?.tur?.trim();
  const alan = faaliyet?.alan?.trim();

  const calisma =
    alan && tur
      ? `${alan} alanında ${tur.toLowerCase()}`
      : alan
        ? `${alan} çalışması`
        : tur
          ? `${tur} çalışması`
          : "etüt çalışmamız";

  const govde = form.posterMetni.trim() || aciklamaolustur(form);

  const parcalar = [
    form.kurumAdi.trim() && `📚 *${form.kurumAdi.trim()}*`,
    `Bugün öğrencilerimizle ${calisma} gerçekleştirdik.`,
    govde,
    form.isim.trim() &&
      `— ${form.isim.trim()}${form.rol?.trim() ? `, ${form.rol.trim()}` : ""}`,
    "Katkı ve destekleriniz için teşekkür ederiz.",
  ].filter(Boolean);

  return parcalar.join("\n\n");
}
