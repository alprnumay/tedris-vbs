import { Button } from "@/components/davet-ui/button";
import {
  ADJUSTMENT_LIMITS,
  clampAdjustment,
  TEXT_LAYER_LABELS,
  type TextLayerAdjustment,
} from "@/modules/davet/invite/inviteLayoutAdjustments";
import { useInviteLayoutEditor } from "@/modules/davet/invite/InviteLayoutEditorContext";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus, RotateCcw } from "lucide-react";

const MOVE_STEP = 4;

export function InviteLayerSettingsPanel({ className = "" }: { className?: string }) {
  const { selectedLayerId, getAdjustment, updateAdjustment, resetLayer } = useInviteLayoutEditor();

  if (!selectedLayerId) {
    return (
      <div className={`rounded-lg border border-dashed bg-slate-50 px-4 py-3 text-sm text-muted-foreground ${className}`}>
        Düzenlemek için afişte bir yazıya dokunun.
      </div>
    );
  }

  const current = clampAdjustment(getAdjustment(selectedLayerId) ?? { x: 0, y: 0 });
  const patch = (p: Partial<TextLayerAdjustment>) => updateAdjustment(selectedLayerId, p);
  const fontSize = current.fontSize ?? 28;

  return (
    <div className={`rounded-lg border bg-white p-3 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{TEXT_LAYER_LABELS[selectedLayerId]}</div>
          <div className="text-[11px] text-muted-foreground">Konum ve yazı boyutu</div>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 px-2 text-xs" onClick={() => resetLayer(selectedLayerId)}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Sıfırla
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 w-14 shrink-0">Konum</span>
          <div className="grid grid-cols-3 gap-1">
            <div />
            <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => patch({ y: current.y - MOVE_STEP })}>
              <ChevronUp className="h-5 w-5" />
            </Button>
            <div />
            <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => patch({ x: current.x - MOVE_STEP })}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="h-10 w-10 text-xs font-bold" onClick={() => patch({ x: 0, y: 0 })}>
              0
            </Button>
            <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => patch({ x: current.x + MOVE_STEP })}>
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div />
            <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => patch({ y: current.y + MOVE_STEP })}>
              <ChevronDown className="h-5 w-5" />
            </Button>
            <div />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 w-14 shrink-0">Boyut</span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => patch({ fontSize: Math.max(ADJUSTMENT_LIMITS.fontSize.min, fontSize - 2) })}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <span className="min-w-[44px] text-center text-sm font-semibold tabular-nums">{fontSize}px</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={() => patch({ fontSize: Math.min(ADJUSTMENT_LIMITS.fontSize.max, fontSize + 2) })}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
