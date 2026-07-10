export type PushSendErrorKind = "vapid_mismatch" | "expired" | "other";

export type ClassifiedPushSendError = {
  kind: PushSendErrorKind;
  message: string;
};

export function isPushVapidMismatchError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status = (err as { statusCode?: number }).statusCode;
  const body = String((err as { body?: string }).body ?? "").toLowerCase();
  if (status === 403) return true;
  return body.includes("vapid credentials") || body.includes("vapid key");
}

export function isPushSubscriptionExpiredError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status = (err as { statusCode?: number }).statusCode;
  return status === 404 || status === 410;
}

export function classifyPushSendError(err: unknown): ClassifiedPushSendError {
  if (isPushVapidMismatchError(err)) {
    return {
      kind: "vapid_mismatch",
      message:
        "Bildirim aboneliği eski anahtarla oluşturulmuş. Lütfen aboneliği yeniden oluşturun.",
    };
  }
  if (isPushSubscriptionExpiredError(err)) {
    return {
      kind: "expired",
      message: "Bildirim aboneliği geçersiz. Lütfen yeniden oluşturun.",
    };
  }
  return {
    kind: "other",
    message: err instanceof Error ? err.message : "Gönderim hatası",
  };
}

export function shouldDeactivateSubscriptionOnPushError(kind: PushSendErrorKind): boolean {
  return kind === "vapid_mismatch" || kind === "expired";
}
