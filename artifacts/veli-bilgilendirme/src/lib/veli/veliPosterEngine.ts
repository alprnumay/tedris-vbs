import type { CSSProperties } from "react";
import type { FormData } from "@/types";
import { baslikAlternatifleri } from "@/lib/dil";

/** Sabit afiş artboard boyutu — önizleme ve PNG/PDF çıktısı aynı tuvali kullanır. */
export const VELI_POSTER_W = 520;
export const VELI_POSTER_H = 720;

export type VeliPosterDensity = "short" | "normal" | "dense";

export function veliPosterBaslik(form: FormData): string {
  return baslikAlternatifleri(form)[form.seciliBaslikIdx ?? 0] ?? "";
}

export function veliPosterDensity(form: FormData): VeliPosterDensity {
  const titleLen = veliPosterBaslik(form).length;
  const bodyLen = form.posterMetni.length;
  const faaliyetSkor = form.faaliyetSayisi * 36;
  const ekNotLen = form.ekNot?.trim().length ?? 0;
  const skor = titleLen + bodyLen * 0.38 + faaliyetSkor + ekNotLen * 0.5;

  if (skor > 700 || titleLen > 50 || bodyLen > 580) return "dense";
  if (skor > 430 || titleLen > 36 || bodyLen > 400) return "normal";
  return "short";
}

export function veliPosterOverflowRisk(form: FormData): boolean {
  return veliPosterDensity(form) === "dense";
}

export function veliPosterCssVars(form: FormData): CSSProperties {
  const density = veliPosterDensity(form);
  const titleScale = density === "dense" ? 0.8 : density === "normal" ? 0.9 : 1;
  const bodyScale = density === "dense" ? 0.86 : density === "normal" ? 0.93 : 1;
  const lineHeight = density === "dense" ? 1.26 : density === "normal" ? 1.32 : 1.38;
  const titleLines = density === "dense" ? 2 : density === "normal" ? 3 : 4;
  const bodyLines = density === "dense" ? 6 : density === "normal" ? 8 : 10;

  return {
    ["--veli-title-scale" as string]: String(titleScale),
    ["--veli-body-scale" as string]: String(bodyScale),
    ["--veli-line-height" as string]: String(lineHeight),
    ["--veli-title-lines" as string]: String(titleLines),
    ["--veli-body-lines" as string]: String(bodyLines),
  };
}

export function veliPosterUzunMetinUyarisi(form: FormData): string | null {
  if (!veliPosterOverflowRisk(form)) return null;
  return "Bu şablonda metin uzun olabilir. Daha kısa metin önerilir.";
}
