import { Button } from "@/components/davet-ui/button";
import { Label } from "@/components/davet-ui/label";
import {
  ADJUSTMENT_LIMITS,
  clampAdjustment,
  TEXT_LAYER_LABELS,
  type TextLayerAdjustment,
  type TextLayerId,
} from "@/modules/davet/invite/inviteLayoutAdjustments";
import { useInviteLayoutEditor } from "@/modules/davet/invite/InviteLayoutEditorContext";
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

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <Label className="text-xs font-medium">{label}</Label>
        <span className="tabular-nums text-muted-foreground">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-blue-600"
      />
    </div>
  );
}

function StepButtons({
  onDec,
  onInc,
  ariaLabel,
}: {
  onDec: () => void;
  onInc: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex gap-1">
      <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={onDec} aria-label={`${ariaLabel} azalt`}>
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={onInc} aria-label={`${ariaLabel} artır`}>
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function InviteLayerSettingsPanel({ className = "" }: { className?: string }) {
  const { selectedLayerId, getAdjustment, updateAdjustment, resetLayer, resetTemplate, resetAll } =
    useInviteLayoutEditor();

  if (!selectedLayerId) {
    return (
      <div className={`rounded-xl border border-dashed bg-slate-50/80 p-4 text-sm text-muted-foreground ${className}`}>
        Düzenlemek için afiş üzerindeki bir yazıyı seçin.
      </div>
    );
  }

  const current = clampAdjustment(getAdjustment(selectedLayerId) ?? { x: 0, y: 0 });
  const patch = (p: Partial<TextLayerAdjustment>) => updateAdjustment(selectedLayerId, p);

  const fontSize = current.fontSize ?? 32;
  const width = current.width ?? 600;
  const lineHeight = current.lineHeight ?? 1.2;
  const align = current.align ?? "left";
  const fontWeight = current.fontWeight ?? 600;

  return (
    <div className={`space-y-4 rounded-xl border bg-white p-4 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">Seçili Alan Ayarları</div>
          <div className="text-xs text-blue-700">Seçili alan: {TEXT_LAYER_LABELS[selectedLayerId]}</div>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 px-2" onClick={() => resetLayer(selectedLayerId)}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Sıfırla
        </Button>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <SliderRow
          label="Yazı boyutu"
          value={fontSize}
          min={ADJUSTMENT_LIMITS.fontSize.min}
          max={ADJUSTMENT_LIMITS.fontSize.max}
          step={ADJUSTMENT_LIMITS.fontSize.step}
          onChange={(v) => patch({ fontSize: v })}
          format={(v) => `${v}px`}
        />
        <StepButtons
          ariaLabel="Yazı boyutu"
          onDec={() => patch({ fontSize: Math.max(ADJUSTMENT_LIMITS.fontSize.min, fontSize - 2) })}
          onInc={() => patch({ fontSize: Math.min(ADJUSTMENT_LIMITS.fontSize.max, fontSize + 2) })}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Konum</Label>
        <div className="grid grid-cols-3 gap-1.5 max-w-[140px]">
          <div />
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => patch({ y: current.y - 1 })}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <div />
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => patch({ x: current.x - 1 })}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => patch({ x: 0, y: 0 })} title="Merkeze al">
            <span className="text-[10px] font-bold">0</span>
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => patch({ x: current.x + 1 })}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div />
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => patch({ y: current.y + 1 })}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SliderRow
          label="X konumu"
          value={current.x}
          min={ADJUSTMENT_LIMITS.x.min}
          max={ADJUSTMENT_LIMITS.x.max}
          step={ADJUSTMENT_LIMITS.x.step}
          onChange={(v) => patch({ x: v })}
          format={(v) => `${v}px`}
        />
        <SliderRow
          label="Y konumu"
          value={current.y}
          min={ADJUSTMENT_LIMITS.y.min}
          max={ADJUSTMENT_LIMITS.y.max}
          step={ADJUSTMENT_LIMITS.y.step}
          onChange={(v) => patch({ y: v })}
          format={(v) => `${v}px`}
        />
      </div>

      <SliderRow
        label="Genişlik"
        value={width}
        min={ADJUSTMENT_LIMITS.width.min}
        max={ADJUSTMENT_LIMITS.width.max}
        step={ADJUSTMENT_LIMITS.width.step}
        onChange={(v) => patch({ width: v })}
        format={(v) => `${v}px`}
      />

      <SliderRow
        label="Satır aralığı"
        value={lineHeight}
        min={ADJUSTMENT_LIMITS.lineHeight.min}
        max={ADJUSTMENT_LIMITS.lineHeight.max}
        step={ADJUSTMENT_LIMITS.lineHeight.step}
        onChange={(v) => patch({ lineHeight: v })}
      />

      <div className="space-y-2">
        <Label className="text-xs font-medium">Hizalama</Label>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <Button
              key={a}
              type="button"
              variant={align === a ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => patch({ align: a })}
            >
              {a === "left" ? <AlignLeft className="h-4 w-4" /> : a === "center" ? <AlignCenter className="h-4 w-4" /> : <AlignRight className="h-4 w-4" />}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Kalınlık</Label>
        <div className="grid grid-cols-3 gap-1">
          {([
            { w: 400 as const, label: "Normal" },
            { w: 500 as const, label: "Orta" },
            { w: 700 as const, label: "Kalın" },
          ]).map(({ w, label }) => (
            <Button
              key={w}
              type="button"
              variant={fontWeight === w ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => patch({ fontWeight: w })}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-3">
        <Button type="button" variant="outline" size="sm" onClick={resetTemplate}>
          Bu şablonu sıfırla
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={resetAll}>
          Tüm düzenlemeleri sıfırla
        </Button>
      </div>
    </div>
  );
}
