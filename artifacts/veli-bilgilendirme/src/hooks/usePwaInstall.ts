import { useCallback, useEffect, useState } from "react";
import { isStandalonePwa } from "@/lib/pushNotifications";

const DEBUG_PREFIX = "[PWA Install]";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type PwaInstallFeedback = {
  type: "success" | "info" | "cancelled";
  message: string;
} | null;

let deferredPromptGlobal: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

function notifyPromptListeners() {
  promptListeners.forEach((listener) => listener(deferredPromptGlobal));
}

function subscribeDeferredPrompt(listener: (prompt: BeforeInstallPromptEvent | null) => void) {
  promptListeners.add(listener);
  listener(deferredPromptGlobal);
  return () => {
    promptListeners.delete(listener);
  };
}

async function logPwaDiagnostics() {
  const standalone = isStandalonePwa();
  console.log(DEBUG_PREFIX, "diagnostics", {
    standalone,
    hasDeferredPrompt: Boolean(deferredPromptGlobal),
    secureContext: typeof window !== "undefined" ? window.isSecureContext : false,
    displayMode: typeof window !== "undefined"
      ? window.matchMedia("(display-mode: standalone)").matches
      : false,
    iosStandalone:
      typeof navigator !== "undefined"
        ? (navigator as Navigator & { standalone?: boolean }).standalone === true
        : false,
  });

  if (typeof document === "undefined") return;

  const manifestHref = document.querySelector('link[rel="manifest"]')?.getAttribute("href");
  if (!manifestHref) {
    console.warn(DEBUG_PREFIX, "manifest link missing");
    return;
  }

  try {
    const response = await fetch(manifestHref);
    const manifest = (await response.json()) as {
      name?: string;
      short_name?: string;
      start_url?: string;
      display?: string;
      icons?: Array<{ sizes?: string; src?: string }>;
    };
    const iconSizes = manifest.icons?.map((icon) => icon.sizes).filter(Boolean) ?? [];
    console.log(DEBUG_PREFIX, "manifest", {
      linked: manifestHref,
      name: manifest.name,
      short_name: manifest.short_name,
      start_url: manifest.start_url,
      display: manifest.display,
      iconSizes,
      has192: iconSizes.some((size) => size?.includes("192")),
      has512: iconSizes.some((size) => size?.includes("512")),
    });
  } catch (error) {
    console.warn(DEBUG_PREFIX, "manifest fetch failed", error);
  }

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      console.log(DEBUG_PREFIX, "service worker", {
        registered: Boolean(registration),
        active: Boolean(registration?.active),
        controlling: Boolean(navigator.serviceWorker.controller),
      });
    } catch (error) {
      console.warn(DEBUG_PREFIX, "service worker check failed", error);
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPromptGlobal = event as BeforeInstallPromptEvent;
    console.log(DEBUG_PREFIX, "beforeinstallprompt captured");
    notifyPromptListeners();
  });

  window.addEventListener("appinstalled", () => {
    console.log(DEBUG_PREFIX, "appinstalled");
    deferredPromptGlobal = null;
    notifyPromptListeners();
  });
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => deferredPromptGlobal,
  );
  const [isStandalone, setIsStandalone] = useState(() => isStandalonePwa());
  const [installed, setInstalled] = useState(false);
  const [feedback, setFeedback] = useState<PwaInstallFeedback>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => subscribeDeferredPrompt(setDeferredPrompt), []);

  useEffect(() => {
    const syncStandalone = () => {
      const standalone = isStandalonePwa();
      setIsStandalone(standalone);
      console.log(DEBUG_PREFIX, "standalone check", { standalone });
    };

    syncStandalone();
    void logPwaDiagnostics();

    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    standaloneMedia.addEventListener("change", syncStandalone);

    const onInstalled = () => {
      setInstalled(true);
      setIsStandalone(true);
      setFeedback({
        type: "success",
        message: "Uygulama kuruldu.",
      });
    };

    window.addEventListener("appinstalled", onInstalled);

    return () => {
      standaloneMedia.removeEventListener("change", syncStandalone);
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

    const prompt = deferredPromptGlobal;
    console.log(DEBUG_PREFIX, "install clicked", {
      hasDeferredPrompt: Boolean(prompt),
      standalone: isStandalonePwa(),
    });

    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        console.log(DEBUG_PREFIX, "prompt result", { outcome });

        deferredPromptGlobal = null;
        notifyPromptListeners();

        if (outcome === "accepted") {
          setFeedback({
            type: "success",
            message: "Uygulama kuruluyor...",
          });
        }
      } catch (error) {
        console.warn(DEBUG_PREFIX, "prompt failed", error);
        setGuideOpen(true);
      }
      return;
    }

    console.log(DEBUG_PREFIX, "opening install guide (no deferredPrompt)");
    setGuideOpen(true);
  }, []);

  const closeGuide = useCallback(() => {
    setGuideOpen(false);
    try {
      localStorage.setItem("pwa-install-guide-dismissed", Date.now().toString());
    } catch {
      // ignore storage errors
    }
  }, []);

  const showInstallUi = !isStandalone && !installed;
  const canNativeInstall = Boolean(deferredPrompt);

  return {
    showInstallUi,
    canNativeInstall,
    feedback,
    guideOpen,
    setGuideOpen,
    install,
    closeGuide,
  };
}
