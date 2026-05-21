import html2canvas from "html2canvas";

/** Afiş export kodundan bağımsız logo PNG yakalama */
export async function logoToPng(element: HTMLElement, arkaPlan = "#ffffff"): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    backgroundColor: arkaPlan,
    logging: false,
  });
  return canvas.toDataURL("image/png");
}

export function pngIndir(dataUrl: string, dosyaAdi: string) {
  const link = document.createElement("a");
  link.download = dosyaAdi;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
