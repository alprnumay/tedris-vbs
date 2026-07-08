export const PORTRAIT_RATIO_THRESHOLD = 1.05;
export const PANORAMA_RATIO_THRESHOLD = 3.2;

export const POSTER_IMAGE_PORTRAIT_MESSAGE =
  "Bu görsel dikey olduğu için afiş tasarımını bozabilir. Lütfen yatay çekilmiş bir görsel yükleyin.";

export const POSTER_IMAGE_TOO_WIDE_MESSAGE =
  "Bu görsel çok geniş olduğu için afişte kırpılabilir. Daha dengeli bir yatay görsel yüklemeniz önerilir.";

export const POSTER_IMAGE_FIELD_HINT = "Yatay görsel önerilir. Dikey görseller kabul edilmez.";

export type PosterImageRejectReason = "portrait" | "unreadable";
export type PosterImageWarnReason = "too_wide";
export type PosterImageReason = PosterImageRejectReason | PosterImageWarnReason;

export type PosterImageValidationResult = {
  valid: boolean;
  reason?: PosterImageRejectReason;
  warning?: PosterImageWarnReason;
  message?: string;
  warningMessage?: string;
  width: number;
  height: number;
  ratio: number;
};

export function validatePosterImageDimensions(width: number, height: number): PosterImageValidationResult {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const ratio = safeW / safeH;

  if (safeH > safeW * PORTRAIT_RATIO_THRESHOLD) {
    return {
      valid: false,
      reason: "portrait",
      message: POSTER_IMAGE_PORTRAIT_MESSAGE,
      width: safeW,
      height: safeH,
      ratio,
    };
  }

  const tooWide = ratio > PANORAMA_RATIO_THRESHOLD;
  return {
    valid: true,
    warning: tooWide ? "too_wide" : undefined,
    warningMessage: tooWide ? POSTER_IMAGE_TOO_WIDE_MESSAGE : undefined,
    width: safeW,
    height: safeH,
    ratio,
  };
}

export function readImageDimensionsFromFile(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel okunamadı"));
    };
    img.src = url;
  });
}

export async function validatePosterImageFile(file: File): Promise<PosterImageValidationResult> {
  try {
    const { width, height } = await readImageDimensionsFromFile(file);
    return validatePosterImageDimensions(width, height);
  } catch {
    return {
      valid: false,
      reason: "unreadable",
      message: "Görsel dosyası okunamadı. Lütfen başka bir görsel deneyin.",
      width: 0,
      height: 0,
      ratio: 1,
    };
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export type PosterImageUploadResult = {
  dataUrls: string[];
  errorMessage: string | null;
  warningMessage: string | null;
  rejectedCount: number;
};

/** Dosyaları doğrular; yalnızca geçerli olanları base64 data URL olarak döndürür. */
export async function processPosterImageFiles(files: File[], maxCount: number): Promise<PosterImageUploadResult> {
  const dataUrls: string[] = [];
  let errorMessage: string | null = null;
  let warningMessage: string | null = null;
  let rejectedCount = 0;

  for (const file of files.slice(0, maxCount)) {
    const validation = await validatePosterImageFile(file);
    if (!validation.valid) {
      rejectedCount += 1;
      if (!errorMessage) errorMessage = validation.message ?? POSTER_IMAGE_PORTRAIT_MESSAGE;
      continue;
    }
    if (validation.warning === "too_wide" && !warningMessage) {
      warningMessage = validation.warningMessage ?? POSTER_IMAGE_TOO_WIDE_MESSAGE;
    }
    dataUrls.push(await fileToDataUrl(file));
  }

  return { dataUrls, errorMessage, warningMessage, rejectedCount };
}
