import type { LucideIcon } from "lucide-react";
import { CalendarDays, FileText, Globe, Share2, ShieldCheck } from "lucide-react";

export type ModuleAccent = "blue" | "indigo" | "emerald" | "cyan" | "rose";

export const accentStyles: Record<
  ModuleAccent,
  { iconBox: string; cardHover: string; chevron: string; headerBar: string }
> = {
  blue: {
    iconBox: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    cardHover: "hover:border-blue-200 hover:shadow-blue-100/50 dark:hover:border-blue-800",
    chevron: "text-blue-400",
    headerBar: "from-blue-500/90 to-blue-600/70",
  },
  indigo: {
    iconBox: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
    cardHover: "hover:border-indigo-200 hover:shadow-indigo-100/50 dark:hover:border-indigo-800",
    chevron: "text-indigo-400",
    headerBar: "from-indigo-500/90 to-indigo-600/70",
  },
  emerald: {
    iconBox: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    cardHover: "hover:border-emerald-200 hover:shadow-emerald-100/50 dark:hover:border-emerald-800",
    chevron: "text-emerald-400",
    headerBar: "from-emerald-500/90 to-emerald-600/70",
  },
  cyan: {
    iconBox: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400",
    cardHover: "hover:border-cyan-200 hover:shadow-cyan-100/50 dark:hover:border-cyan-800",
    chevron: "text-cyan-400",
    headerBar: "from-cyan-500/90 to-cyan-600/70",
  },
  rose: {
    iconBox: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    cardHover: "hover:border-rose-200 hover:shadow-rose-100/50 dark:hover:border-rose-800",
    chevron: "text-rose-400",
    headerBar: "from-rose-500/90 to-rose-600/70",
  },
};

export type DavetModuleDef = {
  title: string;
  shortDescription?: string;
  icon: LucideIcon;
  accent: ModuleAccent;
  href: string;
  /** Ana menüde gizle (route kalabilir) */
  hidden?: boolean;
};

export const davetHomeModules: DavetModuleDef[] = [
  {
    title: "Veliye Davet Hazırla",
    shortDescription: "Veli toplantısı ve program davetleri",
    icon: FileText,
    accent: "blue",
    href: "/veli",
  },
  {
    title: "Yatılı Alıştırma Programı",
    shortDescription: "Yatılı alıştırma afişi",
    icon: CalendarDays,
    accent: "indigo",
    href: "/yatili-program",
  },
  {
    title: "Faydalı Çalışma Paylaş",
    shortDescription: "Çalışmanızı paylaşın",
    icon: Share2,
    accent: "emerald",
    href: "/calisma-paylas",
  },
  {
    title: "Yayındaki Çalışmalar",
    shortDescription: "Onaylı örnek çalışmalar",
    icon: Globe,
    accent: "cyan",
    href: "/yayindaki-calismalar",
  },
  {
    title: "Çalışma Onayı",
    shortDescription: "Onay bekleyen çalışmalar",
    icon: ShieldCheck,
    accent: "rose",
    href: "/calisma-onay",
  },
];
