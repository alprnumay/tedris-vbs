import type { LucideIcon } from "lucide-react";

export type CategoryKartDurum = "aktif" | "yakinda" | "yeni";

export interface CategoryCardProps {
  baslik: string;
  aciklama: string;
  durum: CategoryKartDurum;
  ikon: LucideIcon;
  vurgulu?: boolean;
  onEylem: () => void;
}

export function CategoryCard({
  baslik,
  aciklama,
  durum,
  ikon: Ikon,
  vurgulu,
  onEylem,
}: CategoryCardProps) {
  const aktif = durum === "aktif" || durum === "yeni";
  const oneCikar = Boolean(vurgulu && aktif);
  const rozetMetni = durum === "yeni" ? "Yeni" : aktif ? "Aktif" : "Yakında";

  return (
    <div
      className={[
        "group h-full rounded-2xl p-[1px] transition-all duration-300 md:rounded-[1.75rem]",
        oneCikar
          ? "bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-400 shadow-[0_4px_20px_-6px_rgba(99,102,241,0.4)] md:shadow-[0_8px_40px_-8px_rgba(99,102,241,0.45)]"
          : "bg-gradient-to-br from-slate-200/70 to-slate-100/50 shadow-none md:from-slate-200/60 md:to-slate-100/40",
        "md:hover:shadow-[0_12px_48px_-10px_rgba(99,102,241,0.2)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onEylem}
        className={[
          "relative flex h-full min-w-0 w-full flex-col rounded-[0.95rem] border text-left transition-all duration-300 ease-out md:rounded-[1.7rem]",
          "active:scale-[0.98] md:active:scale-100",
          "md:hover:-translate-y-2 md:hover:shadow-[0_24px_48px_-16px_rgba(15,23,42,0.12)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
          oneCikar
            ? "border-white/80 bg-white/95 shadow-inner shadow-white/20"
            : "border-slate-100/90 bg-white/90 md:bg-white/85 md:hover:border-indigo-100/80 md:hover:bg-white",
          "shadow-[0_1px_12px_-4px_rgba(15,23,42,0.08)] md:shadow-[0_2px_24px_-8px_rgba(15,23,42,0.08)]",
          "md:hover:scale-[1.02] lg:hover:scale-105",
        ].join(" ")}
      >
        {oneCikar && (
          <div
            className="pointer-events-none absolute inset-x-2 -top-px hidden h-px bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent md:inset-x-4 md:block"
            aria-hidden
          />
        )}

        <div className="relative flex min-w-0 flex-col px-3 py-3.5 md:px-7 md:py-7">
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 md:h-16 md:w-16 md:rounded-2xl md:group-hover:scale-110",
              oneCikar
                ? "bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 text-white shadow-md shadow-indigo-500/25 md:shadow-lg md:shadow-indigo-500/30"
                : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500 ring-1 ring-slate-200/80 md:group-hover:from-indigo-50 md:group-hover:to-sky-50 md:group-hover:text-indigo-600 md:group-hover:ring-indigo-100",
            ].join(" ")}
          >
            <Ikon className="h-5 w-5 md:h-8 md:w-8" strokeWidth={1.5} />
          </div>

          <div className="mt-2.5 flex min-h-0 flex-1 flex-col gap-1 md:mt-6 md:gap-2">
            <h3
              className={[
                "text-left text-[13px] font-bold leading-tight tracking-tight text-balance md:text-2xl",
                oneCikar ? "text-slate-900" : "text-slate-700 md:text-slate-600 md:group-hover:text-slate-800",
              ].join(" ")}
            >
              {baslik}
            </h3>
            <p
              className={[
                durum === "yakinda"
                  ? "text-[10px] leading-snug text-slate-500 md:text-sm md:leading-relaxed md:text-[0.9375rem]"
                  : "hidden text-sm leading-relaxed md:block md:text-[0.9375rem]",
                oneCikar ? "text-slate-600" : "text-slate-500 md:group-hover:text-slate-600",
              ].join(" ")}
            >
              {aciklama}
            </p>
          </div>

          <div className="mt-3 flex flex-row items-center justify-between gap-2 border-t border-slate-100/80 pt-2.5 md:mt-8 md:flex-col md:items-stretch md:gap-3 md:border-t md:pt-5">
            <span
              className={[
                "inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide md:px-3 md:py-1.5 md:text-xs",
                durum === "yeni"
                  ? "bg-sky-50 text-sky-900 ring-1 ring-sky-200/90"
                  : aktif
                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/90"
                    : "bg-slate-100/90 text-slate-500 ring-1 ring-slate-200/70",
              ].join(" ")}
            >
              {rozetMetni}
            </span>
            {aktif ? (
              <span
                className={[
                  "inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-bold text-white md:min-h-11 md:w-full md:px-5 md:py-2.5 md:text-sm",
                  "bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 shadow-md shadow-indigo-500/30 ring-1 ring-white/25 md:shadow-lg md:shadow-indigo-500/35",
                  "md:ring-white/30 md:transition md:group-hover:shadow-xl md:group-hover:shadow-indigo-500/40",
                ].join(" ")}
              >
                Başla
              </span>
            ) : null}
          </div>
        </div>
      </button>
    </div>
  );
}
