import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { slugifyFileName } from "@/modules/davet/utils/layoutUtils";
import type { PosterAspectSpec } from "@/modules/davet/components/PosterCanvas";

async function waitForImages(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

async function flushPaint(element: HTMLElement): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await waitForImages(element);
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await new Promise((resolve) => setTimeout(resolve, 80));
}

function prepareExportNode(source: HTMLElement, spec: PosterAspectSpec): HTMLElement {
  const sandbox = document.createElement("div");
  sandbox.setAttribute("data-poster-export", "true");
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

function removeExportNode(clone: HTMLElement) {
  const sandbox = clone.parentElement;
  sandbox?.remove();
}

function isCanvasEmpty(canvas: HTMLCanvasElement): boolean {
  return canvas.width < 10 || canvas.height < 10;
}

async function renderCanvas(
  element: HTMLElement,
  spec: PosterAspectSpec,
  options?: { scale?: number; backgroundColor?: string },
): Promise<HTMLCanvasElement> {
  const scale = options?.scale ?? 2;

  await flushPaint(element);

  const canvas = await html2canvas(element, {
    scale,
    width: spec.width,
    height: spec.height,
    windowWidth: spec.width,
    windowHeight: spec.height,
    useCORS: true,
    allowTaint: false,
    backgroundColor: options?.backgroundColor ?? "#ffffff",
    logging: false,
    imageTimeout: 15000,
  });

  if (isCanvasEmpty(canvas)) {
    throw new Error("EMPTY_EXPORT");
  }

  return canvas;
}

export async function renderElementAsPngBlob(
  element: HTMLElement | null,
  spec: PosterAspectSpec,
  options?: { scale?: number; backgroundColor?: string },
): Promise<Blob> {
  if (!element) throw new Error("PREVIEW_MISSING");

  const clone = prepareExportNode(element, spec);
  try {
    const canvas = await renderCanvas(clone, spec, options);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob || blob.size < 100) {
      throw new Error("EMPTY_EXPORT");
    }
    return blob;
  } finally {
    removeExportNode(clone);
  }
}

function triggerDownload(href: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = href;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportElementAsPng(
  element: HTMLElement | null,
  fileName: string,
  spec: PosterAspectSpec,
  options?: { scale?: number; backgroundColor?: string },
): Promise<void> {
  if (!element) throw new Error("PREVIEW_MISSING");
  const blob = await renderElementAsPngBlob(element, spec, options);
  const dataUrl = URL.createObjectURL(blob);

  try {
    triggerDownload(dataUrl, fileName.endsWith(".png") ? fileName : `${fileName}.png`);
  } finally {
    setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
  }
}

export async function exportElementAsPdf(
  element: HTMLElement | null,
  fileName: string,
  orientation: "landscape" | "portrait",
  spec: PosterAspectSpec,
  options?: { scale?: number; backgroundColor?: string },
): Promise<void> {
  if (!element) throw new Error("PREVIEW_MISSING");

  const clone = prepareExportNode(element, spec);
  let canvas: HTMLCanvasElement;
  try {
    canvas = await renderCanvas(clone, spec, options);
  } finally {
    removeExportNode(clone);
  }
  const imgData = canvas.toDataURL("image/png");
  if (!imgData || imgData.length < 100) {
    throw new Error("EMPTY_EXPORT");
  }

  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [spec.width, spec.height],
    compress: true,
  });
  pdf.addImage(imgData, "PNG", 0, 0, spec.width, spec.height, undefined, "FAST");
  pdf.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

/** Önizlemedeki tasarım katmanını tam boyutta klonlayıp dışa aktarır. */
export async function exportPosterDesign(
  source: HTMLElement | null,
  fileName: string,
  spec: PosterAspectSpec,
  format: "png" | "pdf",
  options?: { scale?: number; backgroundColor?: string },
): Promise<void> {
  if (!source) throw new Error("PREVIEW_MISSING");

  const clone = prepareExportNode(source, spec);
  try {
    if (format === "png") {
      await exportElementAsPng(clone, fileName, spec, options);
    } else {
      await exportElementAsPdf(clone, fileName, spec.orientation, spec, options);
    }
  } finally {
    removeExportNode(clone);
  }
}

export function buildExportFileName(prefix: string, kurumAdi: string, ext: "png" | "pdf"): string {
  const slug = slugifyFileName(kurumAdi);
  return `${prefix}-${slug}.${ext}`;
}

export { slugifyFileName };
