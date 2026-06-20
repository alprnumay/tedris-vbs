/**
 * Nehari Platformu — /davet ana sayfası
 *
 * Route haritası:
 *  - Ana Veli Bilgilendirme  → /?modul=veli       (full-page nav, main app URL param)
 *  - Okul Takip              → /okul-takip         (wouter)
 *  - Yayındaki Çalışmalar    → /yayindaki-calismalar (wouter)
 *  - Çalışma Paylaş          → /calisma-paylas     (wouter)
 *  - Veliye Davet Hazırla    → /veli               (wouter, InvitePage)
 *  - Yatılı Alıştırma        → /yatili-program     (wouter)
 *  - Çalışma Onayı           → /calisma-onay       (wouter, admin-only)
 *  - Yönetim Raporları       → /?modul=yonetim     (full-page nav, main app URL param)
 *
 * Layout:
 *  - Mobil  (<lg): tek kolon, alt tab bar
 *  - Desktop (lg+): lacivert sol sidebar (260px) + geniş içerik alanı
 */

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  BarChart2,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Globe,
  Home,
  LayoutGrid,
  LogOut,
  Megaphone,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, kullaniciRaporGorebilirMi, type KullaniciBilgisi } from "@/lib/api";
import { APP_BRAND_SHORT, APP_BRAND_TITLE, APP_LOGO_ALT } from "@/lib/appLogo";
import { OKUL_TAKIP_MODULE_TITLE } from "@/modules/davet/okul-takip/constants";
import { NOTIFICATION_SETTINGS } from "@/modules/davet/okul-takip/routes";

async function handleCikis() {
  await api.cikisYap().catch(() => {});
  // ?force-logout=1: App.tsx'te backend session hâlâ geçerli olsa bile login ekranını anında gösterir
  window.location.assign("/?force-logout=1");
}

function isDavetAdmin(u: KullaniciBilgisi | null | undefined): boolean {
  if (!u) return false;
  const role = String(u.role ?? "").toLowerCase();
  return Boolean(u.isAdmin) || role === "admin" || role === "super_admin";
}

function displayName(u: KullaniciBilgisi | null | undefined): string {
  if (!u) return "";
  return u.name || u.email || "Kullanıcı";
}

// ─── Desktop Sidebar ─────────────────────────────────────────────────────────
type SidebarLink =
  | { label: string; icon: React.ElementType; href: string; wouter: true; exact?: boolean }
  | { label: string; icon: React.ElementType; href: string; wouter: false };

function DesktopSidebar({
  user,
  admin,
  reportViewer,
}: {
  user: KullaniciBilgisi | null | undefined;
  admin: boolean;
  reportViewer: boolean;
}) {
  const [location] = useLocation();
  const name = displayName(user);

  const navLinks: SidebarLink[] = [
    { label: "Ana Sayfa", icon: Home, href: "/", wouter: true, exact: true },
    { label: "Yurt Ödev ve Yoklama", icon: ClipboardCheck, href: "/okul-takip", wouter: true },
    { label: "Faydalı Çalışmalar", icon: BookOpen, href: "/yayindaki-calismalar", wouter: true },
    { label: "Veli Bilgilendirme", icon: Megaphone, href: "/?modul=veli", wouter: false },
    { label: "Davet ve Programlar", icon: FileText, href: "/veli", wouter: true },
  ];

  function NavItem({ link }: { link: SidebarLink }) {
    const isActive = link.wouter
      ? link.exact
        ? location === link.href
        : location.startsWith(link.href)
      : false;

    const cls = cn(
      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
      isActive
        ? "bg-blue-600/20 text-white"
        : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
    );

    const Icon = link.icon;
    const inner = (
      <>
        <Icon
          size={18}
          strokeWidth={isActive ? 2.5 : 1.8}
          className={isActive ? "text-blue-300" : "text-slate-400"}
          aria-hidden
        />
        <span>{link.label}</span>
        {isActive && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden />
        )}
      </>
    );

    if (link.wouter) {
      return (
        <Link href={link.href} className={cls}>
          {inner}
        </Link>
      );
    }
    return (
      <a href={link.href} className={cls}>
        {inner}
      </a>
    );
  }

  return (
    <aside className="hidden lg:flex h-screen w-[260px] flex-col bg-[#0f1c36] fixed left-0 top-0 z-40 border-r border-white/[0.06]">
      {/* Marka */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <img
          src="/app-logo.png"
          alt={APP_LOGO_ALT}
          className="h-10 w-10 shrink-0 rounded-xl object-contain bg-white p-0.5 shadow-md"
        />
        <div>
          <p className="text-[13px] font-extrabold leading-none text-white">{APP_BRAND_TITLE}</p>
          <p className="mt-0.5 text-[10px] leading-none text-slate-400">{APP_BRAND_SHORT} · Çalışma Paneli</p>
        </div>
      </div>

      {/* Navigasyon */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Ana menü">
        {/* Ana bölüm */}
        <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
          Ana Araçlar
        </p>
        {navLinks.slice(0, 3).map((link) => (
          <NavItem key={link.label} link={link} />
        ))}

        <div className="my-3 border-t border-white/[0.06]" />

        <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
          Araçlar
        </p>
        {navLinks.slice(3).map((link) => (
          <NavItem key={link.label} link={link} />
        ))}

        {/* Yönetim — rapor yetkisi olanlar */}
        {reportViewer && (
          <>
            <div className="my-3 border-t border-white/[0.06]" />
            <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
              Yönetim
            </p>
            <a
              href="/?modul=yonetim"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              <BarChart2 size={18} strokeWidth={1.8} className="text-slate-400" aria-hidden />
              Yönetim Paneli
            </a>
            {admin && (
            <Link
              href="/calisma-onay"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              <ShieldCheck size={18} strokeWidth={1.8} className="text-slate-400" aria-hidden />
              Çalışma Onayı
            </Link>
            )}
          </>
        )}
      </nav>

      {/* Kullanıcı + Çıkış */}
      <div className="border-t border-white/[0.06] px-3 py-3 space-y-1">
        <Link
          href={NOTIFICATION_SETTINGS}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white"
        >
          <Bell size={16} strokeWidth={1.8} aria-hidden />
          Bildirim Ayarları
        </Link>
        <button
          type="button"
          onClick={handleCikis}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={16} strokeWidth={1.8} aria-hidden />
          Çıkış Yap
        </button>
        {name && (
          <div className="flex items-center gap-2.5 px-3 pt-2 pb-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700/50 text-xs font-black text-blue-200">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-300">{name}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Mobile Tab Bar ──────────────────────────────────────────────────────────
function MobileTabBar({ admin }: { admin: boolean }) {
  const [location] = useLocation();
  const [profilAcik, setProfilAcik] = useState(false);

  type Tab =
    | { label: string; icon: React.ElementType; href: string; wouter: true; exact?: boolean }
    | { label: string; icon: React.ElementType; href: string; wouter: false }
    | { label: string; icon: React.ElementType; action: () => void };

  const tabs: Tab[] = [
    { label: "Ana Sayfa", icon: Home, href: "/", wouter: true, exact: true },
    { label: "Takip", icon: ClipboardCheck, href: "/okul-takip", wouter: true },
    { label: "Çalışmalar", icon: BookOpen, href: "/yayindaki-calismalar", wouter: true },
    { label: "Bilgilendirme", icon: Megaphone, href: "/?modul=veli", wouter: false },
    admin
      ? { label: "Yönetim", icon: BarChart2, href: "/?modul=yonetim", wouter: false }
      : { label: "Profil", icon: LogOut, action: () => setProfilAcik(true) },
  ];

  return (
    <>
      {/* lg ve üstünde hiç görünmesin */}
      <nav
        aria-label="Ana gezinti"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[58px] items-stretch border-t border-slate-200 bg-white/96 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const label = tab.label;

          if ("action" in tab) {
            return (
              <button
                key={label}
                type="button"
                onClick={tab.action}
                className="flex flex-1 flex-col items-center justify-center gap-[3px] text-[10px] font-semibold text-slate-400 transition-colors"
              >
                <Icon size={21} strokeWidth={1.8} aria-hidden />
                <span className="leading-none">{label}</span>
              </button>
            );
          }

          const isActive = tab.wouter
            ? tab.exact
              ? location === tab.href
              : location.startsWith(tab.href)
            : false;

          const cls = cn(
            "flex flex-1 flex-col items-center justify-center gap-[3px] text-[10px] font-semibold transition-colors",
            isActive ? "text-blue-600" : "text-slate-400",
          );

          if (tab.wouter) {
            return (
              <Link key={label} href={tab.href} className={cls}>
                <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} aria-hidden />
                <span className="leading-none">{label}</span>
              </Link>
            );
          }
          return (
            <a key={label} href={tab.href} className={cls}>
              <Icon size={21} strokeWidth={1.8} aria-hidden />
              <span className="leading-none">{label}</span>
            </a>
          );
        })}
      </nav>

      {/* Profil bottom sheet — sadece mobil */}
      {profilAcik && (
        <div
          className="fixed inset-0 z-[60] flex items-end lg:hidden"
          onClick={() => setProfilAcik(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-hidden />
          <div
            className="relative w-full rounded-t-3xl border-t border-slate-200 bg-white px-5 pb-8 pt-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="text-base font-extrabold text-slate-800">Hesap</p>
              <button
                type="button"
                onClick={() => setProfilAcik(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>
            <p className="mb-5 text-xs text-slate-400">Nehari Platformu oturumu</p>
            <Link
              href={NOTIFICATION_SETTINGS}
              onClick={() => setProfilAcik(false)}
              className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]"
            >
              <Bell size={17} className="text-slate-500" aria-hidden />
              Bildirim Ayarları
            </Link>
            <button
              type="button"
              onClick={handleCikis}
              className="flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
            >
              <LogOut size={17} aria-hidden />
              Çıkış yap
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
      {children}
    </h2>
  );
}

// ─── Mobile Top Bar (sadece mobil'de) ─────────────────────────────────────────
function MobileTopBar({ user }: { user: KullaniciBilgisi | null | undefined }) {
  const name = displayName(user);
  return (
    <div className="flex items-center justify-between gap-3 lg:hidden">
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src="/app-logo.png"
          alt={APP_LOGO_ALT}
          className="h-9 w-9 shrink-0 rounded-xl object-contain bg-white p-0.5 shadow-sm"
        />
        <div className="min-w-0">
          <p className="text-[13px] font-extrabold leading-none text-slate-800">{APP_BRAND_SHORT}</p>
          {name && (
            <p className="mt-0.5 truncate text-[11px] leading-none text-slate-400">
              Hoş geldiniz, <span className="font-semibold text-slate-600">{name}</span>
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href={NOTIFICATION_SETTINGS}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-700 active:scale-95"
          aria-label="Bildirim Ayarları"
        >
          <Bell size={17} aria-hidden />
        </Link>
        <button
          type="button"
          onClick={handleCikis}
          title="Çıkış yap"
          aria-label="Çıkış yap"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95"
        >
          <LogOut size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}

// ─── Desktop Top Bar (sadece desktop'ta) ─────────────────────────────────────
function DesktopTopBar({ user }: { user: KullaniciBilgisi | null | undefined }) {
  const name = displayName(user);
  return (
    <div className="hidden lg:flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-4 sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
          Nehari Çalışma Paneli
        </h1>
        <p className="text-xs text-slate-500">
          Günlük takip, veli bilgilendirme ve faydalı çalışma araçlarına hızlı erişin.
        </p>
      </div>
      <div className="flex items-center gap-3">
        {name && (
          <span className="hidden xl:inline-block rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {name}
          </span>
        )}
        <Link
          href={NOTIFICATION_SETTINGS}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-700"
          aria-label="Bildirim Ayarları"
        >
          <Bell size={17} aria-hidden />
        </Link>
        <button
          type="button"
          onClick={handleCikis}
          title="Çıkış yap"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
        >
          <LogOut size={14} aria-hidden />
          <span className="hidden xl:inline">Çıkış</span>
        </button>
      </div>
    </div>
  );
}

// ─── Kart Bileşenleri ─────────────────────────────────────────────────────────

function OkulTakipCard() {
  return (
    <Link href="/okul-takip" className="block select-none h-full">
      <div className="relative h-full overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1740b0] via-[#2056d8] to-[#1755c4] p-5 text-white shadow-xl shadow-blue-700/20 transition-all hover:shadow-2xl hover:shadow-blue-700/25 active:scale-[0.985] sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/[0.05]" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 right-4 h-28 w-28 rounded-full bg-white/[0.04]" aria-hidden />

        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-200">
                BUGÜNKÜ ANA İŞ
              </p>
              <h3 className="mb-2 text-xl font-extrabold leading-tight tracking-tight sm:text-[22px]">
                {OKUL_TAKIP_MODULE_TITLE}
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-blue-100/90">
                Bugünkü yoklamayı alın, okul ödevlerini takip edin ve hafta sonunda kişisel karne oluşturun.
              </p>
            </div>
            <div className="hidden shrink-0 lg:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.12]">
              <ClipboardCheck size={32} strokeWidth={1.5} className="text-white" aria-hidden />
            </div>
          </div>
          <div className="mt-auto">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-blue-700 shadow-sm">
              Günlük takibe başla
              <ArrowRight size={14} aria-hidden />
            </span>
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-2 border-t border-white/[0.15] pt-3">
          <CheckCircle2 size={13} className="shrink-0 text-blue-200" aria-hidden />
          <span className="text-[11px] text-blue-200">Yoklama · Ödev Takibi · Haftalık Karne</span>
        </div>
      </div>
    </Link>
  );
}

function VeliBilgilendirmeCard() {
  return (
    <a href="/?modul=veli" className="block select-none h-full">
      <div className="relative h-full overflow-hidden rounded-[22px] bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-xl shadow-emerald-600/20 transition-all hover:shadow-2xl hover:shadow-emerald-600/25 active:scale-[0.985] sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/[0.05]" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 right-4 h-28 w-28 rounded-full bg-white/[0.04]" aria-hidden />

        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-100">
                VELİ BİLGİLENDİRME
              </p>
              <h3 className="mb-2 text-xl font-extrabold leading-tight tracking-tight sm:text-[22px]">
                Veli Bilgilendirme Oluştur
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-emerald-100/90">
                Günlük faaliyet ve çalışma bilgilendirmesi için 20+ şablondan afiş hazırlayın.
              </p>
            </div>
            <div className="hidden shrink-0 lg:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.12]">
              <Megaphone size={32} strokeWidth={1.5} className="text-white" aria-hidden />
            </div>
          </div>
          <div className="mt-auto">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-emerald-700 shadow-sm">
              Bilgilendirme hazırla
              <ArrowRight size={14} aria-hidden />
            </span>
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-2 border-t border-white/[0.15] pt-3">
          <CheckCircle2 size={13} className="shrink-0 text-emerald-200" aria-hidden />
          <span className="text-[11px] text-emerald-100">20+ Şablon · PDF · PNG · WhatsApp</span>
        </div>
      </div>
    </a>
  );
}

function FaydaliCalismalarSection() {
  return (
    <section className="space-y-2.5">
      <SectionLabel>Faydalı Çalışmalar</SectionLabel>
      {/* Desktop'ta yan yana grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Link href="/yayindaki-calismalar" className="block select-none">
          <div className="flex h-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-sky-200 hover:shadow-md active:scale-[0.99]">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-50">
              <Globe size={26} className="text-sky-500" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800">Yayındaki Çalışmalar</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                Onaylanmış örnek çalışmaları görüntüleyin.
              </p>
              <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white">
                Çalışmaları gör
                <ArrowRight size={11} aria-hidden />
              </span>
            </div>
          </div>
        </Link>

        <Link href="/calisma-paylas" className="block select-none">
          <div className="flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 hover:shadow active:scale-[0.98]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <Share2 size={22} className="text-emerald-500" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800">Çalışma Paylaş</p>
              <p className="mt-0.5 text-xs text-slate-500">Faydalı bir çalışmayı paylaşın.</p>
            </div>
            <ChevronRight size={17} className="shrink-0 text-slate-300" aria-hidden />
          </div>
        </Link>
      </div>
    </section>
  );
}

type QuickColor = "blue" | "indigo";

const QUICK_COLORS: Record<QuickColor, { bg: string; iconBg: string; iconText: string; border: string; arrow: string }> = {
  blue: {
    bg: "bg-blue-50 hover:border-blue-200",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    border: "border-blue-100",
    arrow: "text-blue-600",
  },
  indigo: {
    bg: "bg-indigo-50 hover:border-indigo-200",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-600",
    border: "border-indigo-100",
    arrow: "text-indigo-600",
  },
};

function QuickCard({
  title,
  description,
  ctaLabel,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  icon: React.ElementType;
  href: string;
  color: QuickColor;
}) {
  const c = QUICK_COLORS[color];
  return (
    <Link href={href} className="block select-none">
      <div
        className={cn(
          "flex h-full flex-col gap-3 rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.97]",
          c.bg,
          c.border,
        )}
      >
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.iconBg)}>
          <Icon size={20} className={c.iconText} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold leading-snug text-slate-800">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
        <span className={cn("inline-flex items-center gap-1 text-xs font-bold", c.arrow)}>
          {ctaLabel}
          <ChevronRight size={12} aria-hidden />
        </span>
      </div>
    </Link>
  );
}

function DavetProgramSection() {
  return (
    <section className="space-y-2.5">
      <SectionLabel>Davet ve Program Araçları</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <QuickCard
          title="Veliye Davet Hazırla"
          description="Veli toplantısı ve program davetleri hazırlayın."
          ctaLabel="Davet oluştur"
          icon={FileText}
          href="/veli"
          color="blue"
        />
        <QuickCard
          title="Yatılı Alıştırma Programı"
          description="Yatılı program için afiş ve bilgilendirme hazırlayın."
          ctaLabel="Programa git"
          icon={CalendarDays}
          href="/yatili-program"
          color="indigo"
        />
      </div>
    </section>
  );
}

function YonetimSection({ admin, reportViewer }: { admin: boolean; reportViewer: boolean }) {
  if (!reportViewer) return null;
  return (
    <section className="space-y-2.5">
      <SectionLabel>Yönetim</SectionLabel>
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3.5 space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-orange-400">
          {admin ? "Sadece Yöneticiler İçin" : "Rapor Yetkisi"}
        </p>
        <a href="/?modul=yonetim" className="block select-none">
          <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white p-3 shadow-sm transition-all hover:border-orange-200 hover:shadow-md active:scale-[0.98]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
              <BarChart2 size={20} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-800">Yönetim Paneli</p>
              <p className="mt-0.5 text-xs text-slate-500">Kullanım, kurum ve rapor ekranlarını görüntüleyin.</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-slate-400" aria-hidden />
          </div>
        </a>
        {admin && (
        <Link href="/calisma-onay" className="block select-none">
          <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white p-3 shadow-sm transition-all hover:border-orange-200 hover:shadow-md active:scale-[0.98]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 text-white">
              <ShieldCheck size={20} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-800">Çalışma Onayı</p>
              <p className="mt-0.5 text-xs text-slate-500">Paylaşılan çalışmaları inceleyin ve onaylayın.</p>
            </div>
            <span className="shrink-0 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm">
              Yönet
            </span>
          </div>
        </Link>
        )}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [user, setUser] = useState<KullaniciBilgisi | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((r) => { if (!cancelled) setUser(r.user ?? null); })
      .catch(() => { if (!cancelled) setUser(null); });
    return () => { cancelled = true; };
  }, []);

  const admin = isDavetAdmin(user);
  const reportViewer = kullaniciRaporGorebilirMi(user);

  return (
    <div className="nehari-home-v2 min-h-screen bg-[#f5f7fb]">

      {/* ── Desktop Sidebar (lg+) ── */}
      <DesktopSidebar user={user} admin={admin} reportViewer={reportViewer} />

      {/* ── Sayfa İçeriği ── */}
      {/*
        Desktop: sidebar 260px sabit → main area ml-[260px]
        Mobil: margin yok, tam genişlik
      */}
      <div className="lg:ml-[260px] flex flex-col min-h-screen">

        {/* Desktop üst bar */}
        <DesktopTopBar user={user} />

        {/* Mobil / sayfa başı */}
        <main className="flex-1 px-4 pb-28 pt-4 sm:pb-12 sm:pt-5 lg:px-8 lg:pb-12 lg:pt-6">

          {/* Mobil top bar — sadece mobil */}
          <MobileTopBar user={user} />

          {/* Mobil sayfa başlığı */}
          <div className="mb-6 mt-5 lg:hidden">
            <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-slate-900">
              Nehari Çalışma Paneli
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Günlük takip, veli bilgilendirme ve faydalı çalışma araçlarına hızlı erişin.
            </p>
          </div>

          <div className="space-y-6 lg:space-y-8">

            {/* ── Bölüm 1: Ana Araçlar ── */}
            <section className="space-y-3 lg:space-y-4">
              <SectionLabel>Ana Araçlar</SectionLabel>
              {/* Desktop: yan yana; Mobil: alt alta */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-5 lg:[&>*]:min-h-[210px]">
                <OkulTakipCard />
                <VeliBilgilendirmeCard />
              </div>
            </section>

            {/* ── Bölüm 2: Faydalı Çalışmalar ── */}
            <FaydaliCalismalarSection />

            {/* ── Bölüm 3: Davet ve Program ── */}
            <DavetProgramSection />

            {/* ── Bölüm 4: Yönetim (sadece admin) ── */}
            {reportViewer && <YonetimSection admin={admin} reportViewer={reportViewer} />}

            {/* Alt link */}
            <div className="flex justify-center pb-1 pt-2">
              <Link
                href={NOTIFICATION_SETTINGS}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600"
              >
                <Bell size={12} aria-hidden />
                Bildirim Ayarları
              </Link>
            </div>

          </div>
        </main>
      </div>

      {/* Mobil alt navigasyon — lg+ breakpointte gizleniyor */}
      <MobileTabBar admin={admin} />

    </div>
  );
}
