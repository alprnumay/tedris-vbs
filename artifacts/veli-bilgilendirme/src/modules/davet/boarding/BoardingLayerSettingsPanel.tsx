import { Button } from "@/components/davet-ui/button";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  BOARDING_ADJ_LIMITS,
  BOARDING_LAYER_LABELS,
  clampBoardingAdjustment,
  type BoardingLayerAdjustment,
} from "@/modules/davet/boarding/boardingLayoutAdjustments";
import { useBoardingLayoutEditor } from "@/modules/davet/boarding/BoardingLayoutEditorContext";

const MOVE = 4;

export function BoardingLayerSettingsPanel({ className = "" }: { className?: string }) {
  const { selectedLayerId, getAdjustment, updateAdjustment, resetLayer, resetTemplate } = useBoardingLayoutEditor();

  if (!selectedLayerId) {
    return (
      <div className={`rounded-lg border border-dashed bg-slate-50 px-4 py-3 text-sm text-muted-foreground ${className}`}>
        Düzenlemek için afişte bir alana dokunun.
      </div>
    );
  }

  const cur = clampBoardingAdjustment(getAdjustment(selectedLayerId) ?? { x: 0, y: 0 });
  const patch = (p: Partial<BoardingLayerAdjustment>) => updateAdjustment(selectedLayerId, p);
  const fontSize = cur.fontSize ?? 28;
  const width = cur.width ?? 520;
  const align = cur.align ?? "left";

  return (
    <div className={`rounded-lg border bg-white p-3 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{BOARDING_LAYER_LABELS[selectedLayerId]}</div>
          <div className="text-[11px] text-muted-foreground">Konum, boyut, hizalama</div>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => resetLayer(selectedLayerId)}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Sıfırla
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="w-12 text-xs font-medium text-slate-600">Konum</span>
          <div className="grid grid-cols-3 gap-1">
            <div />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => patch({ y: cur.y - MOVE })}><ChevronUp className="h-4 w-4" /></Button>
            <div />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => patch({ x: cur.x - MOVE })}><ChevronLeft className="h-4 w-4" /></Button>
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 text-[10px] font-bold" onClick={() => patch({ x: 0, y: 0 })}>0</Button>
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => patch({ x: cur.x + MOVE })}><ChevronRight className="h-4 w-4" /></Button>
            <div />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => patch({ y: cur.y + MOVE })}><ChevronDown className="h-4 w-4" /></Button>
            <div />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-12 text-xs font-medium text-slate-600">Boyut</span>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => patch({ fontSize: Math.max(BOARDING_ADJ_LIMITS.fontSize.min, fontSize - 2) })}><Minus className="h-4 w-4" /></Button>
          <span className="min-w-[42px] text-center text-sm font-semibold tabular-nums">{fontSize}px</span>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => patch({ fontSize: Math.min(BOARDING_ADJ_LIMITS.fontSize.max, fontSize + 2) })}><Plus className="h-4 w-4" /></Button>
        </div>

        <div className="flex items-center gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <Button key={a} type="button" variant={align === a ? "default" : "outline"} size="icon" className="h-9 w-9" onClick={() => patch({ align: a })}>
              {a === "left" ? <AlignLeft className="h-4 w-4" /> : a === "center" ? <AlignCenter className="h-4 w-4" /> : <AlignRight className="h-4 w-4" />}
            </Button>
          ))}
        </div>

        <div className="flex min-w-[180px] flex-1 items-center gap-2">
          <span className="text-xs font-medium text-slate-600 shrink-0">Genişlik</span>
          <input
            type="range"
            min={BOARDING_ADJ_LIMITS.width.min}
            max={BOARDING_ADJ_LIMITS.width.max}
            step={10}
            value={width}
            onChange={(e) => patch({ width: Number(e.target.value) })}
            className="h-2 flex-1 accent-blue-600"
          />
          <span className="text-xs tabular-nums text-muted-foreground w-12">{width}px</span>
        </div>
      </div>

      <div className="mt-3 border-t pt-2">
        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={resetTemplate}>
          Bu şablonu sıfırla
        </Button>
      </div>
    </div>
  );
}
