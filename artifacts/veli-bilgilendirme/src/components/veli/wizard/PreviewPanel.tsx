import type { RefObject, ReactNode } from "react";
import { Maximize2 } from "lucide-react";

type Props = {
  children: ReactNode;
  zoomLabel: string;
  onFit?: () => void;
  onFullscreen?: () => void;
  hint?: string;
  stageRef?: RefObject<HTMLDivElement | null>;
};

export function PreviewPanel({ children, zoomLabel, onFit, onFullscreen, hint, stageRef }: Props) {
  return (
    <div className="veli-preview-panel flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-md">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-700">Canlı Önizleme</p>
          <p className="text-[11px] text-slate-500">Formu doldurdukça afiş güncellenir</p>
        </div>
        <div className="flex items-center gap-2">
          {onFit ? (
            <button
              type="button"
              onClick={onFit}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
            >
              Sığdır
            </button>
          ) : null}
          <span className="text-[11px] font-bold text-slate-500">{zoomLabel}</span>
          {onFullscreen ? (
            <button
              type="button"
              onClick={onFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              title="Tam ekran"
            >
              <Maximize2 size={16} />
            </button>
          ) : null}
        </div>
      </div>
      <div ref={stageRef} className="veli-preview-stage previewStage flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_24%,#ffffff_0%,#eef2f7_68%)] p-3">
        <div className="posterPreview flex max-h-full max-w-full items-center justify-center">{children}</div>
      </div>
      {hint ? <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-center text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}
