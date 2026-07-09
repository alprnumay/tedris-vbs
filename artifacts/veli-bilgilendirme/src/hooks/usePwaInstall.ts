import { useCallback, useEffect, useState } from "react";
import { isStandalonePwa } from "@/lib/pushNotifications";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type PwaInstallFeedback = {
  type: "success" | "info" | "cancelled";
  message: string;
} | null;

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() => isStandalonePwa());
  const [installed, setInstalled] = useState(false);
  const [feedback, setFeedback] = useState<PwaInstallFeedback>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const syncStandalone = () => setIsStandalone(isStandalonePwa());
    syncStandalone();

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
      setIsStandalone(true);
      setFeedback({
        type: "success",
        message: "Uygulama başarıyla cihazınıza kuruldu.",
      });
    };

    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    standaloneMedia.addEventListener("change", syncStandalone);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      standaloneMedia.removeEventListener("change", syncStandalone);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 6000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const install = useCallback(async () => {
    setFeedback(null);

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);

        if (outcome === "accepted") {
          setFeedback({
            type: "success",
            message: "Uygulama kurulumu başlatıldı.",
          });
        } else {
          setFeedback({
            type: "cancelled",
            message: "Kurulum iptal edildi.",
          });
        }
      } catch {
        setGuideOpen(true);
      }
      return;
    }

    setGuideOpen(true);
  }, [deferredPrompt]);

  const closeGuide = useCallback(() => {
    setGuideOpen(false);
    try {
      localStorage.setItem("pwa-install-guide-dismissed", Date.now().toString());
    } catch {
      // ignore storage errors
    }
  }, []);

  const showInstallUi = !isStandalone && !installed;

  return {
    showInstallUi,
    canNativeInstall: Boolean(deferredPrompt),
    feedback,
    guideOpen,
    setGuideOpen,
    install,
    closeGuide,
  };
}
