import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { POSTER_HEADER_CLS, posterHeaderStyle } from "@/lib/sablonlar/posterShell";
import { logPosterHeaderExportMetrics } from "@/lib/sablonlar/posterHeaderMetrics";

type Props = {
  children: ReactNode;
  style?: CSSProperties;
};

/**
 * Poster şablonları için ortak header sarmalayıcı.
 * Export sırasında html2canvas'ın üstten kırpmaması için overflow:visible ve
 * flex column stretch kullanır. Export capture aktifken metrikleri loglar.
 */
export function PosterTemplateHeader({ children, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el?.closest("[data-poster-export-capture]")) return;
    logPosterHeaderExportMetrics(el.closest(".veli-poster-artboard") ?? el, "layout-effect");
  });

  return (
    <div
      ref={ref}
      className={POSTER_HEADER_CLS}
      data-poster-template-header
      style={{ ...posterHeaderStyle, ...style }}
    >
      {children}
    </div>
  );
}
