import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Briefcase,
  CalendarDays,
  GraduationCap,
  Megaphone,
  Menu,
  Share2,
  Sparkles,
  Users,
  MessageCircle,
  LayoutTemplate,
  X,
} from "lucide-react";
import { CategoryCard } from "./CategoryCard";

export interface CategoryHomeProps {
  kullaniciAdi: string;
  isAdmin: boolean;
  onVeliBilgilendirme: () => void;
  onDenemeSinavi: () => void;
  onYakinda: (modulAdi: string) => void;
  onDestek: () => void;
  onYonetim: () => void;
  onCikis: () => void;
}

const rozetler = [
  { emoji: "⚡", label: "Hızlı üretim" },
  { emoji: "📄", label: "PDF / PNG çıktı", mobilEtiket: "PDF / PNG" },
  { emoji: "📱", label: "WhatsApp paylaşım", mobilEtiket: "WhatsApp" },
  { emoji: "🧩", label: "Hazır şablonlar", mobilEtiket: "Şablonlar" },
] as const;

export function CategoryHome({
  kullaniciAdi,
  isAdmin,
  onVeliBilgilendirme,
  onDenemeSinavi,
  onYakinda,
  onDestek,
  onYonetim,
  onCikis,
}: CategoryHomeProps) {
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false);
  const mobilMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function disariTikla(e: MouseEvent) {
      if (!mobilMenuAcik) return;
      if (mobilMenuRef.current && !mobilMenuRef.current.contains(e.target as Node)) {
        setMobilMenuAcik(false);
      }
    }
    document.addEventListener("mousedown", disariTikla);
    return () => document.removeEventListener("mousedown", disariTikla);
  }, [mobilMenuAcik]);

  const menuKapat = () => setMobilMenuAcik(false);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#eef2ff] text-slate-900">
      <div
        className="pointer-events-none absolute -left-40 top-0 h-[28rem] w-[28rem] rounded-full bg-indigo-300/25 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-32 h-[22rem] w-[22rem] rounded-full bg-sky-300/30 blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-24 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-violet-200/20 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-indigo-200/20 blur-[80px]"
        aria-hidden
      />

      <header className="sticky top-0 z-30 border-b border-slate-200/40 bg-white/70 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 md:px-8 md:py-3.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-900/90 md:text-[11px] md:tracking-[0.22em]">
              Tedris VBS
            </p>
            <p className="hidden text-xs text-slate-500 md:block">Akıllı afiş ve veli bilgilendirme</p>
          </div>

          <div ref={mobilMenuRef} className="relative md:hidden">
            <button
              type="button"
              onClick={() => setMobilMenuAcik((a) => !a)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/95 text-slate-800 shadow-sm transition active:scale-95"
              aria-expanded={mobilMenuAcik}
              aria-label={mobilMenuAcik ? "Menüyü kapat" : "Menüyü aç"}
            >
              {mobilMenuAcik ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
            </button>
            {mobilMenuAcik && (
              <div
                className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5"
                role="menu"
              >
                <p className="truncate border-b border-slate-100 px-3 py-2 text-[11px] font-medium text-slate-500">
                  {kullaniciAdi}
                </p>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  onClick={() => {
                    onDestek();
                    menuKapat();
                  }}
                >
                  <MessageCircle className="h-4 w-4 text-indigo-600" strokeWidth={2} />
                  Destek
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-violet-900 transition hover:bg-violet-50"
                    onClick={() => {
                      onYonetim();
                      menuKapat();
                    }}
                  >
                    Yönetim
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  onClick={() => {
                    onCikis();
                    menuKapat();
                  }}
                >
                  Çıkış
                </button>
              </div>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <span className="mr-1 max-w-[160px] truncate text-xs font-medium text-slate-500">{kullaniciAdi}</span>
            <button
              type="button"
              onClick={onDestek}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 hover:shadow-md"
              title="Destek"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={onYonetim}
                className="rounded-xl border border-violet-200/80 bg-gradient-to-b from-violet-50 to-white px-3.5 py-2 text-xs font-bold text-violet-900 shadow-sm transition hover:border-violet-300 hover:shadow-md"
              >
                Yönetim
              </button>
            )}
            <button
              type="button"
              onClick={onCikis}
              className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl min-w-0 px-3 py-4 pb-12 pt-5 md:px-8 md:py-6 md:pb-20 md:pt-14 lg:pb-28">
        <div className="relative mx-auto min-w-0 max-w-5xl">
          <div
            className={[
              "relative overflow-hidden rounded-2xl border border-white/70 md:rounded-[2rem]",
              "bg-gradient-to-b from-white/90 via-white/75 to-indigo-50/30",
              "p-4 py-4 shadow-[0_32px_80px_-24px_rgba(15,23,42,0.14),0_0_0_1px_rgba(255,255,255,0.9)_inset]",
              "backdrop-blur-xl md:p-10 lg:p-14",
            ].join(" ")}
          >
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-400/15 to-sky-400/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl"
              aria-hidden
            />

            <div className="relative mx-auto min-w-0 max-w-4xl px-0 text-center">
              <h1 className="text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-5xl md:leading-[1.08] lg:text-6xl">
                Bugün ne{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 bg-clip-text text-transparent">
                  hazırlamak
                </span>{" "}
                istiyorsun?
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-pretty text-sm font-medium leading-snug text-slate-600 md:hidden">
                Veli bilgilendirmesi ve kurumsal afişlerini birkaç adımda profesyonelleştir.
              </p>
              <p className="mx-auto mt-6 hidden max-w-3xl text-pretty text-lg font-medium leading-relaxed text-slate-600 md:block md:text-xl">
                Veli bilgilendirme, deneme duyurusu, etkinlik afişi ve kurumsal paylaşımlarını birkaç adımda profesyonel
                görünüme kavuştur.
              </p>
              <p className="mx-auto mt-3 hidden max-w-2xl text-pretty text-base leading-relaxed text-slate-500 md:mt-4 md:block md:text-lg">
                Kurum duyurularını, veli bilgilendirmelerini ve afişlerini hızlıca oluştur. Metni gir, şablonu seç,
                profesyonel çıktıyı indir veya paylaş.
              </p>

              <div className="mt-4 max-w-full md:mt-10">
                <div className="-mx-0.5 flex flex-wrap items-center justify-center gap-1.5 px-0.5 md:mx-0 md:gap-2.5 lg:gap-3">
                  {rozetler.map((r) => {
                    const label = "mobilEtiket" in r && r.mobilEtiket ? r.mobilEtiket : r.label;
                    const masaustu = r.label;
                    return (
                    <span
                      key={r.label}
                      className="inline-flex max-w-full shrink-0 items-center gap-1 rounded-full border border-slate-200/60 bg-white/90 px-2 py-1 text-[9px] font-bold text-slate-700 shadow-sm ring-1 ring-white/80 md:gap-2 md:px-4 md:py-2 md:text-xs md:shadow-[0_4px_14px_-4px_rgba(15,23,42,0.1)] md:ring-white/80 lg:text-sm"
                    >
                      <span className="shrink-0 text-xs leading-none md:text-base" aria-hidden>
                        {r.emoji}
                      </span>
                      <span className="min-w-0 text-balance md:hidden">{label}</span>
                      <span className="hidden min-w-0 text-balance md:inline">{masaustu}</span>
                    </span>
                    );
                  })}
                </div>
              </div>

              <p className="mx-auto mt-3 max-w-2xl text-pretty text-[10px] font-medium leading-snug text-slate-500 md:mt-8 md:text-sm lg:text-[0.9375rem]">
                Binlerce veli bilgilendirmesi ve kurumsal afiş bu sistemle hazırlandı.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 grid min-w-0 max-w-7xl grid-cols-2 gap-2 max-md:[&>:first-child]:col-span-2 md:mt-16 md:grid-cols-2 md:gap-7 lg:mt-20 lg:grid-cols-3 lg:gap-8">
          <CategoryCard
            baslik="Veli Bilgilendirme"
            aciklama="Günlük faaliyetleri, dersleri ve öğrenci gelişimini velilere profesyonel görselle aktar."
            durum="aktif"
            ikon={Users}
            vurgulu
            onEylem={onVeliBilgilendirme}
          />
          <CategoryCard
            baslik="Deneme Sınavı"
            aciklama="Ödüllü deneme, sınav duyurusu ve katılım afişlerini hızlıca hazırla."
            durum="yeni"
            ikon={GraduationCap}
            onEylem={onDenemeSinavi}
          />
          <CategoryCard
            baslik="Duyuru"
            aciklama="Kurum içi bilgilendirme, toplantı ve genel duyurular için sade afişler oluştur."
            durum="yakinda"
            ikon={Bell}
            onEylem={() => onYakinda("Duyuru")}
          />
          <CategoryCard
            baslik="İş İlanı"
            aciklama="Personel, öğretmen, yardımcı ekip ve kurum ilanlarını kurumsal görselle paylaş."
            durum="yakinda"
            ikon={Briefcase}
            onEylem={() => onYakinda("İş İlanı")}
          />
          <CategoryCard
            baslik="Reklam / Kampanya"
            aciklama="Kurs, kayıt dönemi, ürün veya hizmet tanıtımlarını dikkat çekici hale getir."
            durum="yakinda"
            ikon={Megaphone}
            onEylem={() => onYakinda("Reklam / Kampanya")}
          />
          <CategoryCard
            baslik="Etkinlik"
            aciklama="Seminer, gezi, kermes, program ve özel gün etkinliklerini afişe dönüştür."
            durum="yakinda"
            ikon={CalendarDays}
            onEylem={() => onYakinda("Etkinlik")}
          />
        </div>

        <section
          className={[
            "relative mx-auto mt-8 min-w-0 max-w-4xl overflow-hidden rounded-2xl border border-white/60 p-4 py-5 shadow-[0_24px_64px_-20px_rgba(15,23,42,0.1)] backdrop-blur-md md:mt-20 md:rounded-[2rem] md:p-10",
            "bg-gradient-to-br from-white/90 via-slate-50/80 to-indigo-50/40",
          ].join(" ")}
        >
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" aria-hidden />
          <div className="relative flex flex-col items-center gap-2 text-center md:flex-row md:items-start md:justify-between md:gap-3 md:text-left">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 md:text-2xl">3 adımda profesyonel çıktı</h2>
              <p className="mt-1 text-xs font-medium text-slate-500 md:mt-2 md:text-sm">Türünü seç → bilgileri doldur → paylaş.</p>
            </div>
            <Sparkles className="h-7 w-7 shrink-0 text-indigo-500 drop-shadow-sm md:h-9 md:w-9" strokeWidth={1.5} />
          </div>
          <ol className="relative mt-5 grid min-w-0 gap-3 md:mt-10 md:grid-cols-3 md:gap-6">
            {[
              { adim: 1, baslik: "Türünü seç", aciklama: "İhtiyacına uygun modülü seç.", ikon: LayoutTemplate },
              { adim: 2, baslik: "Bilgileri doldur", aciklama: "Metin ve kurum bilgilerini gir.", ikon: Users },
              {
                adim: 3,
                baslik: "PNG / PDF / WhatsApp ile paylaş",
                aciklama: "İndir veya anında paylaş.",
                ikon: Share2,
              },
            ].map(({ adim, baslik, aciklama, ikon: I }) => (
              <li
                key={adim}
                className="group/step flex min-w-0 flex-col items-center rounded-xl border border-slate-100/80 bg-white/60 px-3 py-3.5 text-center shadow-sm transition hover:border-indigo-100 hover:shadow-md md:items-start md:rounded-2xl md:p-5 md:text-left"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-md shadow-indigo-500/25 md:h-12 md:w-12 md:rounded-xl md:text-sm">
                  {adim}
                </span>
                <I className="mt-2 h-4 w-4 text-indigo-500 md:mt-4 md:h-5 md:w-5" strokeWidth={2} />
                <p className="mt-2 text-balance text-xs font-bold leading-snug text-slate-900 md:mt-3 md:text-base">
                  {baslik}
                </p>
                <p className="mt-1 hidden text-xs leading-relaxed text-slate-500 md:mt-2 md:block md:text-sm">{aciklama}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
