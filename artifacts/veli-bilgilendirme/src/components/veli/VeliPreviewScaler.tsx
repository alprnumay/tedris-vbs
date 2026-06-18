import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type RefObject,
} from "react";
import { VELI_POSTER_H, VELI_POSTER_W } from "@/lib/veli/veliPosterEngine";

type Props = {
  children: ReactNode;
  artboardWidth?: number;
  artboardHeight?: number;
  padding?: number;
  frameClassName?: string;
  onScaleChange?: (scale: number) => void;
  /** Dış konteyner (ör. PreviewPanel sahnesi) — boyut buradan ölçülür. */
  observeRef?: RefObject<HTMLElement | null>;
  /** Yeniden hesaplama tetikleyicisi (form / şablon değişimi). */
  deps?: unknown[];
};

export function VeliPreviewScaler({
  children,
  artboardWidth = VELI_POSTER_W,
  artboardHeight = VELI_POSTER_H,
  padding = 0,
  frameClassName,
  onScaleChange,
  observeRef,
  deps = [],
}: Props) {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const containerRef = observeRef ?? fallbackRef;
  const [scale, setScale] = useState(0.72);

  const recalc = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const aw = Math.max(1, container.clientWidth - padding * 2);
    const ah = Math.max(1, container.clientHeight - padding * 2);
    const s = Math.min(aw / artboardWidth, ah / artboardHeight, 1);
    setScale(s);
    onScaleChange?.(s);
  }, [artboardHeight, artboardWidth, containerRef, onScaleChange, padding]);

  useEffect(() => {
    recalc();
    const t1 = requestAnimationFrame(recalc);
    const t2 = window.setTimeout(recalc, 120);
    const obs = new ResizeObserver(recalc);
    const el = containerRef.current;
    if (el) obs.observe(el);
    return () => {
      cancelAnimationFrame(t1);
      window.clearTimeout(t2);
      obs.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recalc, ...deps]);

  const scaledW = Math.round(artboardWidth * scale);
  const scaledH = Math.round(artboardHeight * scale);

  const frame = (
    <div
      className={`veli-preview-scaler__frame${frameClassName ? ` ${frameClassName}` : ""}`}
      style={{
        width: scaledW,
        height: scaledH,
        overflow: "hidden",
        flexShrink: 0,
        margin: "0 auto",
      }}
    >
      <div
        className="veli-preview-scaler__artboard"
        style={{
          width: artboardWidth,
          height: artboardHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );

  if (observeRef) {
    return frame;
  }

  return (
    <div
      ref={fallbackRef}
      className="veli-preview-scaler"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {frame}
    </div>
  );
}
