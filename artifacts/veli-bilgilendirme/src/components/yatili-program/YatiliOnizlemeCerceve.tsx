import type { ReactNode } from "react";
import { efektifBloklar } from "@/lib/yatili-program/yatiliBloklar";
import {
  YATILI_SABLON_META,
  YATILI_RENK_TEMALARI,
  YATILI_YOGUNLUK_MODLARI,
  type YatiliProgramFormData,
} from "@/types/yatiliProgram";

export function YatiliOnizlemeCerceve({
  form,
  children,
  olcekToggle,
}: {
  form: YatiliProgramFormData;
  children: ReactNode;
  olcekToggle: ReactNode;
}) {
  const sablonAd = YATILI_SABLON_META.find((s) => s.id === form.sablon)?.ad ?? form.sablon;
  const temaAd = YATILI_RENK_TEMALARI.find((t) => t.id === form.renkTema)?.ad ?? form.renkTema;
  const paketAd = YATILI_YOGUNLUK_MODLARI.find((m) => m.id === form.yogunlukModu)?.ad ?? form.yogunlukModu;
  const aktif = Object.values(efektifBloklar(form)).filter(Boolean).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(160deg,#e2e8f0_0%,#eef2f7_40%,#f8fafc_100%)]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-sm">
        <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-600">
          <span className="truncate">
            <span className="text-slate-400">Şablon:</span> {sablonAd}
          </span>
          <span className="truncate">
            <span className="text-slate-400">Tema:</span> {temaAd}
          </span>
          <span className="truncate">
            <span className="text-slate-400">Paket:</span> {paketAd}
          </span>
          <span>
            <span className="text-slate-400">Blok:</span> {aktif}
          </span>
        </div>
        {olcekToggle}
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
