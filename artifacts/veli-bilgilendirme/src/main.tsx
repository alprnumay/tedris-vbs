import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import "./index.css";

window.addEventListener("error", (event) => {
  try {
    localStorage.setItem("son_hata_global", JSON.stringify({
      mesaj: event.message,
      dosya: event.filename,
      satir: event.lineno,
      zaman: new Date().toISOString(),
    }));
  } catch {}
});

window.addEventListener("unhandledrejection", (event) => {
  try {
    localStorage.setItem("son_hata_promise", JSON.stringify({
      mesaj: String(event.reason),
      zaman: new Date().toISOString(),
    }));
  } catch {}
});

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}
