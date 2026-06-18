export type VeliPreviewMode = "normal" | "whatsapp";

type Props = {
  mode: VeliPreviewMode;
  onChange: (mode: VeliPreviewMode) => void;
  compact?: boolean;
};

export function PreviewModeToggle({ mode, onChange, compact = false }: Props) {
  return (
    <div className={`veli-preview-mode-toggle${compact ? " veli-preview-mode-toggle--compact" : ""}`}>
      <button
        type="button"
        className={mode === "normal" ? "is-active" : ""}
        onClick={() => onChange("normal")}
      >
        Normal Afiş
      </button>
      <button
        type="button"
        className={mode === "whatsapp" ? "is-active" : ""}
        onClick={() => onChange("whatsapp")}
      >
        WhatsApp Önizleme
      </button>
    </div>
  );
}
