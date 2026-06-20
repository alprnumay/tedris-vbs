import type { ReactNode, Ref } from "react";
import { VELI_POSTER_H, VELI_POSTER_W } from "@/lib/sablonlar/posterShell";

type Props = {
  children: ReactNode;
  artboardRef?: Ref<HTMLDivElement>;
};

/** Sabit poster tuvali — export ve önizleme aynı boyutu kullanır. */
export function VeliPosterArtboard({ children, artboardRef }: Props) {
  return (
    <div
      ref={artboardRef}
      className="veli-poster-artboard"
      style={{
        width: VELI_POSTER_W,
        height: VELI_POSTER_H,
        minWidth: VELI_POSTER_W,
        maxWidth: VELI_POSTER_W,
        minHeight: VELI_POSTER_H,
        maxHeight: VELI_POSTER_H,
        flexShrink: 0,
      }}
    >
      <div className="veli-poster-template-root">{children}</div>
    </div>
  );
}
