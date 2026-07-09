import { Download, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const GUIDE_SECTIONS = [
  {
    title: "Android / Chrome",
    steps: [
      "Sağ üstteki üç noktaya dokunun.",
      "“Uygulamayı yükle” veya “Ana ekrana ekle” seçeneğini seçin.",
    ],
  },
  {
    title: "iPhone / Safari",
    steps: [
      "Safari'de paylaş simgesine dokunun.",
      "“Ana Ekrana Ekle” seçeneğini seçin.",
    ],
  },
  {
    title: "Bilgisayar / Chrome",
    steps: [
      "Adres çubuğundaki yükleme simgesine tıklayın.",
      "“Yükle” seçeneğini seçin.",
    ],
  },
] as const;

export default function PwaInstallSection() {
  const { showInstallUi, canNativeInstall, feedback, guideOpen, setGuideOpen, install, closeGuide } =
    usePwaInstall();

  if (!showInstallUi) return null;

  const buttonLabel = canNativeInstall ? "Uygulamayı Kur" : "Kurulum Yardımı";
  const helperText = canNativeInstall
    ? "Telefonunuza veya bilgisayarınıza uygulama gibi kurabilirsiniz."
    : "Tarayıcınıza göre adım adım kurulum yönergelerini gösteririz.";

  return (
    <>
      <div
        style={{
          marginTop: 20,
          paddingTop: 20,
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <button
          type="button"
          onClick={() => void install()}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 12,
            border: "1.5px solid #cbd5e1",
            background: "#f8fafc",
            color: "#334155",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
            e.currentTarget.style.borderColor = "#94a3b8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#cbd5e1";
          }}
        >
          <Download size={18} strokeWidth={2.25} />
          {buttonLabel}
        </button>

        <p
          style={{
            marginTop: 10,
            fontSize: 12,
            lineHeight: 1.5,
            color: "#64748b",
            textAlign: "center",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Smartphone size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{helperText}</span>
        </p>

        {feedback ? (
          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              fontWeight: 600,
              textAlign: "center",
              color:
                feedback.type === "success"
                  ? "#15803d"
                  : feedback.type === "cancelled"
                    ? "#b45309"
                    : "#475569",
            }}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>

      <Dialog
        open={guideOpen}
        onOpenChange={(open) => {
          if (open) setGuideOpen(true);
          else closeGuide();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Uygulamayı Cihaza Kur</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 text-sm text-slate-600">
            {GUIDE_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="mb-2 font-semibold text-slate-900">{section.title}</p>
                <ol className="list-decimal space-y-1 pl-5">
                  {section.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
