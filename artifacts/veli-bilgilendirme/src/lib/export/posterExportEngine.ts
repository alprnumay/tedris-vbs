/**
 * posterExportEngine.ts
 *
 * Tüm modüllerin (Veli Bilgilendirme, Davet, Afiş, Sertifika) ortak kullanabileceği
 * kurumsal Export Engine.
 *
 * Özellikler:
 *  – Viewport içinde opacity:0 klonlama (top:-9999 yerine)
 *  – document.fonts.ready + img.decode() + rAF×2 + settle bekleme
 *  – allowTaint:false, imageTimeout:15000 (tarayıcı güvenlik kısıtlamalarına uyumlu)
 *  – Boş canvas tespiti ve anlamlı hata fırlatma
 *  – Exception swallow yok; tüm hatalar loglanır ve PosterExportError olarak yükseltilir
 *  – Export sonrası klonlanmış DOM otomatik temizlenir
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// ─── Arayüzler ────────────────────────────────────────────────────────────────

/** Hedef poster/canvas boyutları. */
export interface PosterExportSpec {
  width: number;
  height: number;
}

/** html2canvas ve dışa aktarma seçenekleri. */
export interface PosterExportOptions {
  /** html2canvas ölçek çarpanı. Varsayılan: 2.5 */
  scale?: number;
  /** Canvas arka plan rengi. Varsayılan: #ffffff */
  backgroundColor?: string;
  /** Görsel yükleme zaman aşımı (ms). Varsayılan: 15000 */
  imageTimeout?: number;
}

export type PosterExportErrorCode = "NO_NODE" | "EMPTY_CANVAS" | "RENDER_FAILED";

/** Export sürecinde oluşan hatalar için özel hata sınıfı. */
export class PosterExportError extends Error {
  constructor(
    message: string,
    public readonly code: PosterExportErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PosterExportError";
  }
}

// ─── İç Yardımcılar ───────────────────────────────────────────────────────────

/**
 * Verilen kök element altındaki tüm <img> öğelerinin yüklenip decode edilmesini
 * bekler. Her görsel için en fazla 4 saniye beklenir.
 */
async function waitForAllImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          const done = () => resolve();

          if (img.complete && img.naturalWidth > 0) {
            typeof img.decode === "function"
              ? img.decode().then(done).catch(done)
              : done();
            return;
          }

          const onLoad = () => {
            img.removeEventListener("error", done);
            typeof img.decode === "function"
              ? img.decode().then(done).catch(done)
              : done();
          };

          img.addEventListener("load", onLoad, { once: true });
          img.addEventListener("error", done, { once: true });
          // En fazla 4 saniye bekle; sonra devam et
          window.setTimeout(done, 4000);
        }),
    ),
  );
}

/**
 * Tarayıcının tam olarak boyayıp stabilize olmasını bekler:
 *  1. rAF×2 – React commit + layout
 *  2. document.fonts.ready – fontlar
 *  3. waitForAllImages – görseller
 *  4. 80ms settle – CSS geçişler ve sub-pixel hesaplamalar
 */
async function flushPaint(root: HTMLElement): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await waitForAllImages(root);

  await new Promise<void>((resolve) => window.setTimeout(resolve, 80));
}

/**
 * Kaynak elementi klonlar; viewport içinde görünmez (opacity:0) bir sandbox'a yerleştirir.
 * Bu yaklaşım top:-9999'un aksine tarayıcının layout'u doğru hesaplamasını sağlar.
 * Döndürülen değer klon (HTMLElement)'dir; `removeExportClone` ile temizlenmelidir.
 */
function prepareExportClone(source: HTMLElement, spec: PosterExportSpec): HTMLElement {
  const sandbox = document.createElement("div");
  sandbox.setAttribute("data-poster-export-sandbox", "true");
  sandbox.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${spec.width}px`,
    `height:${spec.height}px`,
    "overflow:hidden",
    "opacity:0",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");

  const clone = source.cloneNode(true) as HTMLElement;

  // Canlı önizlemede uygulanan transform/scale efektleri temizlenir
  clone.style.transform = "none";
  clone.style.position = "relative";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.width = `${spec.width}px`;
  clone.style.height = `${spec.height}px`;
  clone.style.minWidth = `${spec.width}px`;
  clone.style.minHeight = `${spec.height}px`;
  clone.style.maxWidth = `${spec.width}px`;
  clone.style.maxHeight = `${spec.height}px`;
  clone.style.opacity = "1";
  clone.style.visibility = "visible";
  clone.style.boxSizing = "border-box";

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  return clone;
}

/** Export klonunu ve sandbox'ını DOM'dan kaldırır. */
function removeExportClone(clone: HTMLElement): void {
  clone.parentElement?.remove();
}

/** Canvas'ın sıfır boyutlu (render edilememiş) olup olmadığını kontrol eder. */
function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  return canvas.width < 10 || canvas.height < 10;
}

// ─── Dışa Açık API ────────────────────────────────────────────────────────────

/**
 * Kaynak elementi klonlar, viewport içine alır, tüm beklemeleri tamamlar ve
 * html2canvas ile render eder. Hata durumunda klon yine de temizlenir.
 *
 * @throws {PosterExportError} Kaynak null, canvas boş veya render başarısız ise.
 */
export async function renderPosterCanvas(
  sourceElement: HTMLElement | null,
  spec: PosterExportSpec,
  options: PosterExportOptions = {},
): Promise<HTMLCanvasElement> {
  if (!sourceElement) {
    throw new PosterExportError(
      "Export düğümü bulunamadı — artboardRef bağlı değil",
      "NO_NODE",
    );
  }

  const { scale = 2.5, backgroundColor = "#ffffff", imageTimeout = 15000 } = options;

  const clone = prepareExportClone(sourceElement, spec);

  try {
    await flushPaint(clone);

    const canvas = await html2canvas(clone, {
      scale,
      width: spec.width,
      height: spec.height,
      windowWidth: spec.width,
      windowHeight: spec.height,
      useCORS: true,
      allowTaint: false,
      backgroundColor,
      logging: false,
      imageTimeout,
    });

    if (isCanvasBlank(canvas)) {
      throw new PosterExportError(
        "html2canvas sıfır boyutlu canvas döndürdü — şablon render edilemedi",
        "EMPTY_CANVAS",
      );
    }

    return canvas;
  } catch (err) {
    if (err instanceof PosterExportError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new PosterExportError(`html2canvas render hatası: ${msg}`, "RENDER_FAILED", err);
  } finally {
    removeExportClone(clone);
  }
}

/** PNG data URL döndürür. */
export async function renderPosterAsDataUrl(
  sourceElement: HTMLElement | null,
  spec: PosterExportSpec,
  options?: PosterExportOptions,
): Promise<string> {
  const canvas = await renderPosterCanvas(sourceElement, spec, options);
  return canvas.toDataURL("image/png");
}

/**
 * PNG olarak indirir.
 * iOS (iPhone/iPad/iPod) cihazlarda yeni sekmede açar (indirme desteği yoktur).
 */
export async function exportPosterAsPng(
  sourceElement: HTMLElement | null,
  fileName: string,
  spec: PosterExportSpec,
  options?: PosterExportOptions,
): Promise<void> {
  const dataUrl = await renderPosterAsDataUrl(sourceElement, spec, options);

  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    window.open(dataUrl, "_blank");
    return;
  }

  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** A4 dikey PDF olarak indirir. Poster, sayfa genişliğine ortalanır. */
export async function exportPosterAsPdf(
  sourceElement: HTMLElement | null,
  fileName: string,
  spec: PosterExportSpec,
  options?: PosterExportOptions,
): Promise<void> {
  const dataUrl = await renderPosterAsDataUrl(sourceElement, spec, options);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const imgW = pdfW - margin * 2;
  const imgH = (imgW * spec.height) / spec.width;
  const finalH = Math.min(imgH, pdfH - margin * 2);
  const y = (pdfH - finalH) / 2;

  pdf.addImage(dataUrl, "PNG", margin, y, imgW, finalH);
  pdf.save(fileName);
}

/** Web Share API için kullanılacak File nesnesi oluşturur. */
export async function renderPosterAsFile(
  sourceElement: HTMLElement | null,
  fileName: string,
  spec: PosterExportSpec,
  options?: PosterExportOptions,
): Promise<File> {
  const dataUrl = await renderPosterAsDataUrl(sourceElement, spec, options);
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], fileName, { type: "image/png" });
}
