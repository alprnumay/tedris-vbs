import type { FormData } from "@/types";

export function veliWhatsappMesajiOlustur(form: FormData): string {
  const faaliyet = form.faaliyetler[0];
  const tur = faaliyet?.tur?.trim();
  const alan = faaliyet?.alan?.trim();

  const calisma =
    alan && tur
      ? `${alan} ${tur.toLowerCase()}`
      : alan
        ? `${alan} çalışması`
        : tur
          ? `${tur} çalışması`
          : "etüt çalışmamız";

  return `Bugünkü ${calisma} tamamlandı 🌿 Görselleri inceleyebilirsiniz.`;
}
