import type { RefObject, ReactNode } from "react";

type Props = {
  children: ReactNode;
  stageRef?: RefObject<HTMLDivElement | null>;
};

export function PreviewPanel({ children, stageRef }: Props) {
  return (
    <div className="veli-preview-panel flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-md">
      <div className="border-b border-slate-100 bg-slate-50 px-3 py-2.5">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-700">Canlı Önizleme</p>
        <p className="text-[11px] text-slate-500">Formu doldurdukça afiş otomatik sığdırılır</p>
      </div>
      <div ref={stageRef} className="veli-preview-stage previewStage flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_24%,#ffffff_0%,#eef2f7_68%)] p-3">
        <div className="posterPreview flex max-h-full max-w-full items-center justify-center overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
