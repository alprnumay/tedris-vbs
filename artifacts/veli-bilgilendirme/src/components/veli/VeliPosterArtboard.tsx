import type { ReactNode, Ref } from "react";
import type { FormData } from "@/types";
import {
  VELI_POSTER_H,
  VELI_POSTER_W,
  veliPosterCssVars,
  veliPosterDensity,
} from "@/lib/veli/veliPosterEngine";

type Props = {
  form: FormData;
  children: ReactNode;
  className?: string;
  /** PNG/PDF yakalama — dış artboard öğesine ref. */
  artboardRef?: Ref<HTMLDivElement>;
};

export function VeliPosterArtboard({ form, children, className, artboardRef }: Props) {
  const density = veliPosterDensity(form);

  return (
    <div
      ref={artboardRef}
      className={`veli-poster-artboard${className ? ` ${className}` : ""}`}
      data-density={density}
      style={{
        width: VELI_POSTER_W,
        height: VELI_POSTER_H,
        ...veliPosterCssVars(form),
      }}
    >
      <div className="veli-poster-artboard__inner">{children}</div>
    </div>
  );
}
