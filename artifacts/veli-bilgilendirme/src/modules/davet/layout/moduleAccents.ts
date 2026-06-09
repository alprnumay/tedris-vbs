import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, FileText, Globe, Share2, ShieldCheck } from "lucide-react";

export type ModuleAccent = "blue" | "indigo" | "emerald" | "cyan" | "rose";

export type AccentTheme = {
  iconBox: string;
  cardHover: string;
  chevron: string;
  headerBar: string;
  badge: string;
  badgeClass: string;
  ctaClass: string;
  cardStyle: CSSProperties;
};

export const accentStyles: Record<ModuleAccent, AccentTheme> = {
  blue: {
    iconBox: "bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/15",
    cardHover: "hover:border-blue-300/80 hover:shadow-[0_20px_40px_-12px_rgba(37,99,235,0.35)]",
    chevron: "text-blue-600",
    headerBar: "from-blue-500/90 to-blue-600/70",
    badge: "Davet",
    badgeClass: "bg-blue-600/10 text-blue-800 ring-blue-600/20",
    ctaClass: "bg-blue-600 text-white shadow-blue-600/25 group-hover:bg-blue-700",
    cardStyle: {
      "--nm-accent": "#2563eb",
      "--nm-accent-soft": "rgba(37, 99, 235, 0.08)",
      "--nm-accent-glow": "rgba(37, 99, 235, 0.18)",
      "--nm-gradient-from": "#eff6ff",
      "--nm-gradient-to": "#dbeafe",
      "--nm-border": "rgba(37, 99, 235, 0.2)",
    } as CSSProperties,
  },
  indigo: {
    iconBox: "bg-indigo-600/10 text-indigo-700 ring-1 ring-indigo-600/15",
    cardHover: "hover:border-indigo-300/80 hover:shadow-[0_20px_40px_-12px_rgba(79,70,229,0.35)]",
    chevron: "text-indigo-600",
    headerBar: "from-indigo-500/90 to-indigo-600/70",
    badge: "Program",
    badgeClass: "bg-indigo-600/10 text-indigo-800 ring-indigo-600/20",
    ctaClass: "bg-indigo-600 text-white shadow-indigo-600/25 group-hover:bg-indigo-700",
    cardStyle: {
      "--nm-accent": "#4f46e5",
      "--nm-accent-soft": "rgba(79, 70, 229, 0.08)",
      "--nm-accent-glow": "rgba(79, 70, 229, 0.18)",
      "--nm-gradient-from": "#eef2ff",
      "--nm-gradient-to": "#e0e7ff",
      "--nm-border": "rgba(79, 70, 229, 0.2)",
    } as CSSProperties,
  },
  emerald: {
    iconBox: "bg-emerald-600/10 text-emerald-700 ring-1 ring-emerald-600/15",
    cardHover: "hover:border-emerald-300/80 hover:shadow-[0_20px_40px_-12px_rgba(5,150,105,0.35)]",
    chevron: "text-emerald-600",
    headerBar: "from-emerald-500/90 to-emerald-600/70",
    badge: "Paylaşım",
    badgeClass: "bg-emerald-600/10 text-emerald-800 ring-emerald-600/20",
    ctaClass: "bg-emerald-600 text-white shadow-emerald-600/25 group-hover:bg-emerald-700",
    cardStyle: {
      "--nm-accent": "#059669",
      "--nm-accent-soft": "rgba(5, 150, 105, 0.08)",
      "--nm-accent-glow": "rgba(5, 150, 105, 0.18)",
      "--nm-gradient-from": "#ecfdf5",
      "--nm-gradient-to": "#d1fae5",
      "--nm-border": "rgba(5, 150, 105, 0.2)",
    } as CSSProperties,
  },
  cyan: {
    iconBox: "bg-cyan-600/10 text-cyan-700 ring-1 ring-cyan-600/15",
    cardHover: "hover:border-cyan-300/80 hover:shadow-[0_20px_40px_-12px_rgba(8,145,178,0.35)]",
    chevron: "text-cyan-600",
    headerBar: "from-cyan-500/90 to-cyan-600/70",
    badge: "Vitrin",
    badgeClass: "bg-cyan-600/10 text-cyan-800 ring-cyan-600/20",
    ctaClass: "bg-cyan-600 text-white shadow-cyan-600/25 group-hover:bg-cyan-700",
    cardStyle: {
      "--nm-accent": "#0891b2",
      "--nm-accent-soft": "rgba(8, 145, 178, 0.08)",
      "--nm-accent-glow": "rgba(8, 145, 178, 0.18)",
      "--nm-gradient-from": "#ecfeff",
      "--nm-gradient-to": "#cffafe",
      "--nm-border": "rgba(8, 145, 178, 0.2)",
    } as CSSProperties,
  },
  rose: {
    iconBox: "bg-orange-600/10 text-orange-700 ring-1 ring-orange-500/15",
    cardHover: "hover:border-orange-300/80 hover:shadow-[0_20px_40px_-12px_rgba(234,88,12,0.35)]",
    chevron: "text-orange-600",
    headerBar: "from-orange-500/90 to-rose-500/70",
    badge: "Onay",
    badgeClass: "bg-orange-600/10 text-orange-800 ring-orange-500/20",
    ctaClass: "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-orange-500/25 group-hover:from-orange-600 group-hover:to-rose-600",
    cardStyle: {
      "--nm-accent": "#ea580c",
      "--nm-accent-soft": "rgba(234, 88, 12, 0.08)",
      "--nm-accent-glow": "rgba(244, 63, 94, 0.16)",
      "--nm-gradient-from": "#fff7ed",
      "--nm-gradient-to": "#ffe4e6",
      "--nm-border": "rgba(234, 88, 12, 0.22)",
    } as CSSProperties,
  },
};

export type DavetModuleDef = {
  title: string;
  shortDescription?: string;
  description: string;
  ctaLabel: string;
  icon: LucideIcon;
  accent: ModuleAccent;
  href: string;
  hidden?: boolean;
};

export const davetHomeModules: DavetModuleDef[] = [
  {
    title: "Veliye Davet Hazırla",
    shortDescription: "Veli toplantısı ve program davetleri",
    description:
      "Veli toplantısı, tanıtım, kahvaltı ve özel programlar için profesyonel davet görselleri hazırlayın.",
    ctaLabel: "Davet oluştur",
    icon: FileText,
    accent: "blue",
    href: "/veli",
  },
  {
    title: "Yatılı Alıştırma Programı",
    shortDescription: "Yatılı alıştırma afişi",
    description:
      "Tarih, saat, akış ve bilgilendirme metinleriyle yatılı alıştırma afişini hızlıca hazırlayın.",
    ctaLabel: "Program hazırla",
    icon: CalendarDays,
    accent: "indigo",
    href: "/yatili-program",
  },
  {
    title: "Faydalı Çalışma Paylaş",
    shortDescription: "Çalışmanızı paylaşın",
    description:
      "Kurumunuzda yapılan güzel çalışmaları görsel ve kısa açıklamayla paylaşın, topluluğa ilham olun.",
    ctaLabel: "Paylaşım yap",
    icon: Share2,
    accent: "emerald",
    href: "/calisma-paylas",
  },
  {
    title: "Yayındaki Çalışmalar",
    shortDescription: "Onaylı örnek çalışmalar",
    description:
      "Diğer kurumların onaylı örnek çalışmalarını inceleyin, fikir alın ve uygulama örneklerini keşfedin.",
    ctaLabel: "Çalışmaları incele",
    icon: Globe,
    accent: "cyan",
    href: "/yayindaki-calismalar",
  },
  {
    title: "Çalışma Onayı",
    shortDescription: "Onay bekleyen çalışmalar",
    description:
      "Onay bekleyen paylaşımları inceleyin, yayına alın, düzenleme isteyin veya reddedin.",
    ctaLabel: "Onay ekranı",
    icon: ShieldCheck,
    accent: "rose",
    href: "/calisma-onay",
  },
];
