import type { PosterAspectSpec } from "@/modules/davet/components/PosterCanvas";
import { renderElementAsPngBlob, slugifyFileName } from "@/modules/davet/utils/exportUtils";

export const KARNE_EXPORT_SPEC: PosterAspectSpec = {
  width: 1080,
  height: 1350,
  orientation: "portrait",
};

export function buildKarneFileName(studentName: string): string {
  return `karne-${slugifyFileName(studentName || "ogrenci")}.png`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportKarnePngBlob(element: HTMLElement | null): Promise<Blob> {
  return renderElementAsPngBlob(element, KARNE_EXPORT_SPEC, {
    scale: 1,
    backgroundColor: "#ffffff",
  });
}

export async function downloadKarnePng(element: HTMLElement | null, studentName: string): Promise<File> {
  if (!studentName.trim()) throw new Error("STUDENT_NAME_MISSING");
  const blob = await exportKarnePngBlob(element);
  const file = new File([blob], buildKarneFileName(studentName), { type: "image/png" });
  downloadBlob(blob, file.name);
  return file;
}

export async function shareKarnePng(
  element: HTMLElement | null,
  studentName: string,
  shareText: string,
): Promise<"shared" | "downloaded"> {
  if (!studentName.trim()) throw new Error("STUDENT_NAME_MISSING");
  const blob = await exportKarnePngBlob(element);
  const file = new File([blob], buildKarneFileName(studentName), { type: "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (navigator.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
    await navigator.share({
      title: `${studentName} karnesi`,
      text: shareText,
      files: [file],
    });
    return "shared";
  }

  downloadBlob(blob, file.name);
  return "downloaded";
}
