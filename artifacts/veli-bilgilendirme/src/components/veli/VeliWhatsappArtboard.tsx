import type { ReactNode, Ref } from "react";
import { VELI_WA_POSTER_H, VELI_WA_POSTER_W } from "@/lib/veli/veliWhatsappPosterEngine";

type Props = {
  children: ReactNode;
  artboardRef?: Ref<HTMLDivElement>;
};

export function VeliWhatsappArtboard({ children, artboardRef }: Props) {
  return (
    <div
      ref={artboardRef}
      className="veli-wa-poster-artboard"
      style={{ width: VELI_WA_POSTER_W, height: VELI_WA_POSTER_H }}
    >
      {children}
    </div>
  );
}
