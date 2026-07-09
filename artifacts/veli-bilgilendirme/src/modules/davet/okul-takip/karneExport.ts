import type { PosterAspectSpec } from "@/modules/davet/components/PosterCanvas";
import { renderElementAsPngBlob, slugifyFileName } from "@/modules/davet/utils/exportUtils";

export const KARNE_EXPORT_SPEC: PosterAspectSpec = {
  width: 1080,
  height: 1350,
  orientation: "portrait",
};

const DEBUG_PREFIX = "[Karne WhatsApp]";

export function buildKarneFileName(studentName: string): string {
  return `karne-${slugifyFileName(studentName || "ogrenci")}.png`;
}

export type KarneWhatsAppShareResult =
  | { mode: "shared" }
  | { mode: "cancelled" }
  | { mode: "downloaded"; waMeOpened: boolean; fileShareSupported: boolean };

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

export function formatParentPhoneForWaMe(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("90")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `90${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("5")) return `90${digits}`;
  if (digits.length === 11 && digits.startsWith("90")) return digits;
  return null;
}

export function buildWaMeUrl(phone: string | null | undefined, text: string): string | null {
  const normalized = phone?.trim() ? formatParentPhoneForWaMe(phone) : null;
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function openWaMeLink(url: string): boolean {
  try {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    console.log(DEBUG_PREFIX, "wa.me opened", Boolean(opened));
    return Boolean(opened);
  } catch (error) {
    console.warn(DEBUG_PREFIX, "wa.me open failed", error);
    return false;
  }
}

export async function waitForExportElement(
  getElement: () => HTMLElement | null,
  maxAttempts = 40,
): Promise<HTMLElement> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const element = getElement();
    if (element) return element;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  throw new Error("PREVIEW_MISSING");
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

export function buildKarneWhatsAppText(studentName: string, detailedMessage?: string): string {
  if (detailedMessage?.trim()) return detailedMessage.trim();
  return `${studentName} için hazırlanan öğrenci gelişim karnesini iletiyoruz.`;
}

export async function shareKarneViaWhatsApp(params: {
  element: HTMLElement | null;
  studentName: string;
  shareText?: string;
  parentPhone?: string | null;
  studentId?: string;
}): Promise<KarneWhatsAppShareResult> {
  const { element, studentName, shareText, parentPhone, studentId } = params;

  console.log(DEBUG_PREFIX, "whatsapp button clicked", {
    studentId: studentId ?? null,
    studentName,
    hasPhone: Boolean(parentPhone?.trim()),
  });

  if (!studentName.trim()) throw new Error("STUDENT_NAME_MISSING");

  const blob = await exportKarnePngBlob(element);
  console.log(DEBUG_PREFIX, "export blob created", { size: blob.size });

  const file = new File([blob], buildKarneFileName(studentName), { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  const canShareFiles = Boolean(
    navigator.share && (!nav.canShare || nav.canShare({ files: [file] })),
  );

  console.log(DEBUG_PREFIX, "canShare files", canShareFiles);

  const nativeShareText = `${studentName} için hazırlanan karne`;
  const waText = buildKarneWhatsAppText(studentName, shareText);

  if (canShareFiles) {
    try {
      await navigator.share({
        title: "Öğrenci Gelişim Karnesi",
        text: nativeShareText,
        files: [file],
      });
      console.log(DEBUG_PREFIX, "prompt result", { outcome: "accepted" });
      return { mode: "shared" };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log(DEBUG_PREFIX, "prompt result", { outcome: "dismissed" });
        return { mode: "cancelled" };
      }
      if (error instanceof DOMException && error.name === "InvalidStateError") {
        throw error;
      }
      console.warn(DEBUG_PREFIX, "native share failed, using download fallback", error);
    }
  }

  console.log(DEBUG_PREFIX, "fallback download used");
  downloadBlob(blob, file.name);

  const waUrl = buildWaMeUrl(parentPhone, waText);
  const waMeOpened = waUrl ? openWaMeLink(waUrl) : false;

  return { mode: "downloaded", waMeOpened, fileShareSupported: canShareFiles };
}

export function getKarneShareToastMessage(
  result: KarneWhatsAppShareResult,
  hasPhone: boolean,
): { type: "success" | "info"; message: string } | null {
  if (result.mode === "cancelled") return null;

  if (result.mode === "shared") {
    return {
      type: "success",
      message: "Paylaşım ekranı açıldı. WhatsApp'ı seçerek karnesini gönderebilirsiniz.",
    };
  }

  if (!result.fileShareSupported) {
    if (hasPhone && result.waMeOpened) {
      return {
        type: "info",
        message: "Bu tarayıcı dosya paylaşımını desteklemiyor. Karne indirildi ve WhatsApp Web açıldı; dosyayı manuel ekleyip gönderebilirsiniz.",
      };
    }
    if (hasPhone) {
      return {
        type: "info",
        message: "Bu tarayıcı dosya paylaşımını desteklemiyor. Karne indirildi; WhatsApp üzerinden veliye gönderebilirsiniz.",
      };
    }
    return {
      type: "info",
      message: "Bu tarayıcı dosya paylaşımını desteklemiyor. Karne indirildi, WhatsApp'tan manuel gönderebilirsiniz.",
    };
  }

  if (hasPhone && result.waMeOpened) {
    return {
      type: "info",
      message: "Karne indirildi. WhatsApp Web açıldı; dosyayı manuel ekleyip gönderebilirsiniz.",
    };
  }

  if (hasPhone) {
    return {
      type: "info",
      message: "Karne indirildi. WhatsApp üzerinden veliye gönderebilirsiniz.",
    };
  }

  return {
    type: "info",
    message: "Bu öğrenci için veli telefonu bulunamadı. Karne indirildi, WhatsApp'tan manuel gönderebilirsiniz.",
  };
}

/** @deprecated Use shareKarneViaWhatsApp */
export async function shareKarnePng(
  element: HTMLElement | null,
  studentName: string,
  shareText: string,
): Promise<"shared" | "downloaded"> {
  const result = await shareKarneViaWhatsApp({ element, studentName, shareText });
  if (result.mode === "cancelled") return "downloaded";
  return result.mode;
}

export const renderStudentReportCardToPng = exportKarnePngBlob;
export const exportStudentReportCard = downloadKarnePng;
export const shareStudentReportCardToWhatsapp = shareKarneViaWhatsApp;
