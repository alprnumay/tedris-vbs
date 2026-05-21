import type { DenemeSablonu } from "@/types/denemeSinavi";

/** Önizleme bileşenleri için tema sınıfları (Tailwind). */
export type DenemePosterTema = {
  id: DenemeSablonu;
  shell: string;
  overlay: string;
  heading: string;
  body: string;
  muted: string;
  badge: string;
  odulKart: string;
  odulGorselYer: string;
  bilgiKutu: string;
  sartKutu: string;
  altSerit: string;
  cta: string;
  logoPlaceholder: string;
  kapakPlaceholder: string;
};

const TEMA_HERO_ODUL: DenemePosterTema = {
  id: "hero-odul",
  shell: "bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white ring-1 ring-amber-500/30",
  overlay: "bg-slate-950/75",
  heading: "text-white",
  body: "text-amber-50/95",
  muted: "text-white/70",
  badge: "bg-amber-400 text-slate-900",
  odulKart: "border-amber-400/50 bg-gradient-to-b from-amber-500/20 to-slate-900/60 text-white",
  odulGorselYer: "bg-gradient-to-br from-amber-600/40 via-slate-800/80 to-indigo-950/90",
  bilgiKutu: "border-amber-400/35 bg-slate-900/50 text-amber-50",
  sartKutu: "border-white/15 bg-black/30 text-white/95",
  altSerit: "bg-black/25 text-white/95",
  cta: "bg-gradient-to-r from-amber-500 to-orange-600 text-slate-900",
  logoPlaceholder: "border-white/30 bg-gradient-to-br from-amber-500/30 to-slate-800 text-amber-100",
  kapakPlaceholder: "bg-gradient-to-r from-amber-600/50 via-indigo-900/60 to-slate-900",
};

const TEMA_GRID_ODUL: DenemePosterTema = {
  id: "grid-odul",
  shell: "bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-sky-50",
  overlay: "bg-blue-950/60",
  heading: "text-sky-100",
  body: "text-sky-100/90",
  muted: "text-sky-200/65",
  badge: "bg-sky-400 text-blue-950 font-bold",
  odulKart: "border-sky-400/35 bg-blue-950/50 text-sky-50",
  odulGorselYer: "bg-gradient-to-br from-sky-500/45 to-blue-950",
  bilgiKutu: "border-sky-400/30 bg-black/25 text-sky-50",
  sartKutu: "border-sky-500/25 bg-black/35 text-sky-50",
  altSerit: "bg-black/35 text-sky-100/90",
  cta: "bg-sky-500 text-blue-950 font-bold",
  logoPlaceholder: "border-sky-500/40 bg-blue-900/40 text-sky-200",
  kapakPlaceholder: "bg-gradient-to-r from-sky-600/45 to-blue-950",
};

const TEMA_MINIMAL: DenemePosterTema = {
  id: "minimal",
  shell: "bg-zinc-50 text-zinc-900 border border-zinc-200",
  overlay: "bg-white/95",
  heading: "text-zinc-900",
  body: "text-zinc-600",
  muted: "text-zinc-500",
  badge: "bg-zinc-900 text-white",
  odulKart: "border-zinc-200 bg-white text-zinc-800 shadow-sm",
  odulGorselYer: "bg-gradient-to-br from-zinc-100 to-white",
  bilgiKutu: "border-zinc-200 bg-white text-zinc-700",
  sartKutu: "border-zinc-200 bg-zinc-50 text-zinc-600",
  altSerit: "bg-white text-zinc-600 border-t border-zinc-200",
  cta: "bg-zinc-900 text-white",
  logoPlaceholder: "border-zinc-200 bg-white text-zinc-400",
  kapakPlaceholder: "bg-gradient-to-r from-zinc-100 to-zinc-200",
};

const TEMA_KURUMSAL_SADE: DenemePosterTema = {
  id: "kurumsal-sade",
  shell: "bg-white text-slate-900 border-2 border-slate-200",
  overlay: "bg-white/90",
  heading: "text-slate-900",
  body: "text-slate-600",
  muted: "text-slate-500",
  badge: "bg-indigo-100 text-indigo-900",
  odulKart: "border-slate-200 bg-white shadow-sm text-slate-800",
  odulGorselYer: "bg-gradient-to-br from-slate-100 via-indigo-50 to-sky-50",
  bilgiKutu: "border-slate-200 bg-slate-50 text-slate-700",
  sartKutu: "border-slate-200 bg-slate-50 text-slate-600",
  altSerit: "bg-slate-100 text-slate-700",
  cta: "bg-indigo-700 text-white",
  logoPlaceholder: "border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50 text-slate-400",
  kapakPlaceholder: "bg-gradient-to-r from-slate-100 to-indigo-100",
};

const TEMA_PREMIUM_SPOTLIGHT: DenemePosterTema = {
  id: "premium-spotlight",
  shell: "bg-gradient-to-b from-slate-950 via-amber-950/40 to-slate-950 text-amber-50 ring-1 ring-amber-500/40",
  overlay: "bg-black/50",
  heading: "text-amber-100",
  body: "text-amber-100/90",
  muted: "text-amber-200/70",
  badge: "bg-gradient-to-r from-amber-300 to-yellow-200 text-slate-900",
  odulKart: "border-amber-400/40 bg-gradient-to-b from-amber-600/25 to-slate-950/80 text-amber-50",
  odulGorselYer: "bg-gradient-to-br from-amber-600/50 to-slate-950",
  bilgiKutu: "border-amber-500/30 bg-amber-950/40 text-amber-50",
  sartKutu: "border-amber-700/40 bg-black/40 text-amber-50/95",
  altSerit: "bg-black/35 text-amber-50/90",
  cta: "bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-900",
  logoPlaceholder: "border-amber-500/40 bg-amber-900/30 text-amber-200",
  kapakPlaceholder: "bg-gradient-to-r from-amber-700/40 to-slate-900",
};

const TEMA_ENERJIK_GENCLIK: DenemePosterTema = {
  id: "enerjik-genclik",
  shell: "bg-gradient-to-br from-orange-500 via-rose-500 to-cyan-500 text-white",
  overlay: "bg-gradient-to-b from-orange-600/80 to-cyan-900/75",
  heading: "text-white drop-shadow-sm",
  body: "text-white/95",
  muted: "text-white/75",
  badge: "bg-white/90 text-rose-700",
  odulKart: "border-white/40 bg-white/20 backdrop-blur-sm text-white",
  odulGorselYer: "bg-gradient-to-br from-rose-500/50 via-orange-400/40 to-cyan-600/50",
  bilgiKutu: "border-white/40 bg-white/15 text-white",
  sartKutu: "border-white/30 bg-black/20 text-white",
  altSerit: "bg-black/20 text-white/95",
  cta: "bg-white text-rose-700",
  logoPlaceholder: "border-white/40 bg-white/20 text-white",
  kapakPlaceholder: "bg-gradient-to-r from-rose-400/60 to-cyan-500/50",
};

const TEMA_CTA_ODAKLI: DenemePosterTema = {
  id: "cta-odakli",
  shell: "bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 text-white",
  overlay: "bg-red-900/45",
  heading: "text-white font-black",
  body: "text-white/95",
  muted: "text-white/80",
  badge: "bg-white text-red-600 font-black",
  odulKart: "border-white/40 bg-white/20 backdrop-blur text-white",
  odulGorselYer: "bg-gradient-to-br from-red-500/50 to-orange-700/50",
  bilgiKutu: "border-white/35 bg-black/25 text-white",
  sartKutu: "border-white/30 bg-black/30 text-white",
  altSerit: "bg-black/30 text-white/95",
  cta: "bg-white text-red-600 font-black",
  logoPlaceholder: "border-white/40 bg-white/15 text-white",
  kapakPlaceholder: "bg-gradient-to-r from-red-500/50 to-amber-400/50",
};

const TEMA_LISTE_ODAKLI: DenemePosterTema = {
  id: "liste-odakli",
  shell: "bg-gradient-to-br from-rose-900 via-orange-900 to-amber-900 text-amber-50",
  overlay: "bg-orange-950/50",
  heading: "text-amber-100",
  body: "text-amber-100/90",
  muted: "text-amber-200/70",
  badge: "bg-orange-400 text-orange-950 font-black",
  odulKart: "border-orange-400/40 bg-orange-950/40 text-amber-50",
  odulGorselYer: "bg-gradient-to-br from-orange-500/50 to-rose-950",
  bilgiKutu: "border-orange-400/35 bg-black/30 text-amber-50",
  sartKutu: "border-amber-500/30 bg-black/35 text-amber-50",
  altSerit: "bg-black/35 text-amber-100/90",
  cta: "bg-orange-400 text-orange-950 font-black",
  logoPlaceholder: "border-orange-400/50 bg-orange-950/50 text-amber-200",
  kapakPlaceholder: "bg-gradient-to-r from-orange-600/50 to-rose-900",
};

const TEMA_QR_ODAKLI: DenemePosterTema = {
  id: "qr-odakli",
  shell: "bg-gradient-to-br from-zinc-950 via-slate-900 to-indigo-950 text-zinc-100",
  overlay: "bg-slate-950/70",
  heading: "text-white",
  body: "text-zinc-300",
  muted: "text-zinc-500",
  badge: "bg-indigo-500 text-white",
  odulKart: "border-zinc-700 bg-zinc-900/80 text-zinc-100",
  odulGorselYer: "bg-gradient-to-br from-indigo-900/80 to-zinc-950",
  bilgiKutu: "border-zinc-700 bg-zinc-900/60 text-zinc-200",
  sartKutu: "border-zinc-600 bg-black/40 text-zinc-200",
  altSerit: "bg-black/40 text-zinc-300",
  cta: "bg-indigo-600 text-white",
  logoPlaceholder: "border-zinc-600 bg-zinc-800 text-zinc-400",
  kapakPlaceholder: "bg-gradient-to-r from-indigo-900 to-zinc-900",
};

const TEMA_GORSEL_ODAKLI: DenemePosterTema = {
  id: "gorsel-odakli",
  shell: "bg-gradient-to-b from-purple-900 via-slate-900 to-black text-white",
  overlay: "bg-purple-950/60",
  heading: "text-white text-2xl font-black",
  body: "text-purple-100/90",
  muted: "text-purple-200/70",
  badge: "bg-pink-500 text-white",
  odulKart: "border-pink-400/40 bg-gradient-to-b from-pink-500/20 to-slate-950/80",
  odulGorselYer: "bg-gradient-to-br from-pink-600/50 to-purple-950",
  bilgiKutu: "border-pink-400/30 bg-slate-900/50 text-pink-50",
  sartKutu: "border-white/15 bg-black/40 text-white/95",
  altSerit: "bg-black/40 text-white/90",
  cta: "bg-pink-500 text-white font-bold",
  logoPlaceholder: "border-pink-400/40 bg-purple-900/40 text-pink-100",
  kapakPlaceholder: "bg-gradient-to-b from-pink-600/40 to-purple-950",
};

export const DENEME_POSTER_TEMA: Record<DenemeSablonu, DenemePosterTema> = {
  "hero-odul": TEMA_HERO_ODUL,
  "grid-odul": TEMA_GRID_ODUL,
  minimal: TEMA_MINIMAL,
  "kurumsal-sade": TEMA_KURUMSAL_SADE,
  "premium-spotlight": TEMA_PREMIUM_SPOTLIGHT,
  "enerjik-genclik": TEMA_ENERJIK_GENCLIK,
  "cta-odakli": TEMA_CTA_ODAKLI,
  "liste-odakli": TEMA_LISTE_ODAKLI,
  "qr-odakli": TEMA_QR_ODAKLI,
  "gorsel-odakli": TEMA_GORSEL_ODAKLI,
};

export function posterTemaAl(s: DenemeSablonu): DenemePosterTema {
  return DENEME_POSTER_TEMA[s] ?? DENEME_POSTER_TEMA["hero-odul"];
}
