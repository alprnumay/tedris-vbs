import type { FormData } from "@/types";

export function veliWhatsappMesajiOlustur(form: FormData): string {
  const kurum = form.kurumAdi.trim() || "kurumumuz";
  const faaliyet = form.faaliyetler[0];
  const tur = faaliyet?.tur?.trim() || "çalışma";
  const alan = faaliyet?.alan?.trim();
  const ton = form.metinTonu ?? "kurumsal";

  const hitap =
    ton === "sicak"
      ? "Saygıdeğer velimiz"
      : "Değerli velimiz";

  const calisma =
    alan && tur
      ? `${alan} alanında ${tur.toLowerCase()}`
      : alan
        ? `${alan} çalışması`
        : tur
          ? `${tur} faaliyeti`
          : "bugünkü çalışma";

  return `${hitap}, bugün talebelerimizle ${calisma} gerçekleştirilmiştir. ${kurum} tarafından hazırlanan bilgilendirme görselini inceleyebilirsiniz. Sorularınız için bizimle iletişime geçebilirsiniz.`;
}
