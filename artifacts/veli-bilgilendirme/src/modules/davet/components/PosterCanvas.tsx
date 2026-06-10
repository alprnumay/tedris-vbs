import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type PosterAspect = "invite-landscape" | "boarding-landscape" | "poster-portrait";

export interface PosterAspectSpec {
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
  maxPreviewWidth: number;
}

export const POSTER_ASPECT_SPECS: Record<PosterAspect, PosterAspectSpec> = {
  "invite-landscape": {
    width: 1600,
    height: 900,
    orientation: "landscape",
    maxPreviewWidth: 920,
  },
  "boarding-landscape": {
    width: 1600,
    height: 900,
    orientation: "landscape",
    maxPreviewWidth: 920,
  },
  "poster-portrait": {
    width: 1080,
    height: 1350,
    orientation: "portrait",
    maxPreviewWidth: 480,
  },
};

export function getBoardingPosterAspect(sablon: string): PosterAspect {
  const legacyPortrait = ["3", "4"];
  if (legacyPortrait.includes(sablon)) return "poster-portrait";
  return "boarding-landscape";
}

export const PosterCanvas = forwardRef<
  HTMLDivElement,
  {
    aspect: PosterAspect;
    children: ReactNode;
    className?: string;
  }
>(function PosterCanvas({ aspect, children, className = "" }, ref) {
  const spec = POSTER_ASPECT_SPECS[aspect];
  const containerRef = useRef<HTMLDivElement>(null);
  const designRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const setDesignRef = useCallback(
    (node: HTMLDivElement | null) => {
      designRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const cw = el.clientWidth || spec.maxPreviewWidth;
      const target = Math.min(cw, spec.maxPreviewWidth);
      setScale(Math.min(1, target / spec.width));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [spec.width, spec.maxPreviewWidth]);

  const displayW = Math.round(spec.width * scale);
  const displayH = Math.round(spec.height * scale);

  return (
    <div
      ref={containerRef}
      className={`w-full min-w-0 flex justify-center ${className}`}
    >
      <div
        className="relative overflow-hidden rounded-sm bg-white shadow-xl"
        style={{ width: displayW, height: displayH }}
      >
        <div
          ref={setDesignRef}
          data-poster-design="true"
          className="absolute left-0 top-0 overflow-hidden bg-white"
          style={{
            width: spec.width,
            height: spec.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <div className="h-full w-full min-h-0 min-w-0 overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  );
});
