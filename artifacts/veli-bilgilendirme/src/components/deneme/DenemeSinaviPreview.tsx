import { useEffect, useMemo, useState, type CSSProperties, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Calendar, Clock, Gift, MapPin, Phone, Sparkles, Trophy, Instagram, Globe, Award, Megaphone, Ticket } from "lucide-react";
import { afisBoyutlari } from "@/lib/denemePosterBoyut";
import { denemeTarihEtiketi } from "@/lib/denemeOrnekVeri";
import { afisKatilimVurguMetni, afisKisaAciklamaSatir, odulMetinOzetleri } from "@/lib/denemeMetinUret";
import { posterTemaAl } from "@/lib/denemePosterTema";
import { bolumKatmani, normalizeOncelikler, oncelikGenelOlcek } from "@/lib/denemeOncelikMotor";
import {
  baslikAkilliSinif,
  birincilOncelik,
  blokSarici,
  kolonHizalamaSinifi,
  layoutProfili,
  odulAkilliGridSinifi,
  odulKartZenginlik,
  odulKompaktMod,
  type PosterLayoutProfili,
} from "@/lib/denemeLayoutIntelligence";
import { afisBolumSirasi, odulYerlesimModu, type BolumAnahtari, type OdulYerlesimModu } from "@/lib/denemeSablonYerlesim";
import type { DenemeSinaviFormData, Odul, OncelikOgesi } from "@/types/denemeSinavi";
import { afisGorselDizisi, ilkXKazananEtiketi, katilimHedefBasligi, secimHakkiEtiketi, sinifBadgeMetni, siraliOdulSirala } from "@/types/denemeSinavi";
import { cn } from "@/lib/utils";
import { gorselAlanSinifi, gorselThumbMinH, hesaplaOncelik, hesaplaYerlesim, type YerlesimSonuc } from "@/lib/denemePosterAkilli";
import { KayitQrImage } from "./KayitQrImage";
import { DenemePosterSceneEditor } from "./DenemePosterSceneEditor";
import { autoFixSceneLayout, initialPosterScene, SCENE_DESKTOP_MIN_PX, type PosterSceneState } from "@/lib/denemePosterScene";

function DekorGorsel({
  src,
  minH,
  className,
  placeholderClass,
  children,
}: {
  src?: string;
  minH: string;
  className?: string;
  placeholderClass: string;
  children: ReactNode;
}) {
  if (src) {
    return (
      <div className={cn("w-full overflow-hidden rounded-xl", className)} style={{ minHeight: minH }}>
        <img src={src} alt="" className="h-full min-h-[inherit] w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-slate-600 via-indigo-900 to-slate-900 text-[10px] font-bold text-white/95 shadow-inner",
        placeholderClass,
        className,
      )}
      style={{ minHeight: minH }}
    >
      {children}
    </div>
  );
}

function HediyeKartlari({
  d,
  tema,
  yerlesim,
  profil,
  odulYerlesim,
}: {
  d: DenemeSinaviFormData;
  tema: ReturnType<typeof posterTemaAl>;
  yerlesim: OdulYerlesimModu;
  profil: PosterLayoutProfili;
  odulYerlesim: YerlesimSonuc;
}) {
  const oduller = d.oduller;
  const kompakt = odulKompaktMod(oduller.length);
  const Ikon = d.odulModeli === "cekilis" ? Sparkles : Gift;
  const kartSinif = odulKartZenginlik(profil, tema.odulKart);
  if (oduller.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-8 text-center", tema.bilgiKutu, "border")}>
        <Ikon className="h-10 w-10 opacity-90" />
        <p className="text-xs font-bold">Hediye kartları</p>
        <p className="text-[10px] opacity-90">Ödül ekleyerek listeyi doldurun.</p>
      </div>
    );
  }
  const tekBuyuk = oduller.length === 1;
  const baslikSinif = cn("font-extrabold leading-tight line-clamp-2", tekBuyuk ? "text-sm sm:text-base" : kompakt ? "text-[10px]" : "text-xs", yerlesim === "story-buyuk" && !kompakt && "text-sm");
  const gorselSinif = cn(
    "relative w-full overflow-hidden",
    tekBuyuk ? "aspect-[5/4] min-h-[96px] sm:min-h-[110px]" : kompakt ? "aspect-[4/3] min-h-[56px]" : "aspect-[4/3] min-h-[72px]",
    tema.odulGorselYer,
  );

  return (
    <div
      className={cn(
        odulYerlesim.odulGridSinifi,
        yerlesim === "hediye-yumusak" && "sm:gap-4",
        yerlesim === "cekilis-katman" && "gap-2 opacity-[0.98]",
        "min-w-0",
      )}
    >
      {oduller.map((o, idx) => (
        <div
          key={o.id}
          className={cn(
            "flex min-h-0 w-full max-w-full flex-col overflow-hidden rounded-xl text-center",
            kartSinif,
            tekBuyuk && "max-w-[min(100%,320px)] shadow-lg ring-1 ring-white/20",
          )}
        >
          <div className={cn(gorselSinif, !o.image && "bg-gradient-to-br from-emerald-500/30 via-slate-900/45 to-teal-600/25")}>
            {o.image ? (
              <img src={o.image} alt="" className="h-full w-full object-cover object-center" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Ikon className={cn(tekBuyuk ? "h-11 w-11 sm:h-12 sm:w-12" : "h-9 w-9", "opacity-95", idx % 2 === 0 ? "text-emerald-200" : "text-teal-200")} />
              </div>
            )}
          </div>
          <div className={cn(tekBuyuk ? "p-3" : "p-2", kompakt && "p-1.5")}>
            <p className={baslikSinif}>{o.title || "Hediye"}</p>
            {o.description ? <p className={cn("mt-0.5 line-clamp-2 opacity-80", tekBuyuk ? "text-[11px]" : "text-[9px]")}>{o.description}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function HavuzSadeceKartlar({
  d,
  tema,
  profil,
  odulYerlesim,
}: {
  d: DenemeSinaviFormData;
  tema: ReturnType<typeof posterTemaAl>;
  profil: PosterLayoutProfili;
  odulYerlesim: YerlesimSonuc;
}) {
  const havuz = d.havuzOgeleri.filter((x) => x.ad.trim());
  const kartSinif = odulKartZenginlik(profil, tema.odulKart);
  const kompakt = odulKompaktMod(havuz.length);
  if (havuz.length === 0) {
    return (
      <div className={cn("rounded-xl border px-4 py-6 text-center", tema.bilgiKutu)}>
        <Ticket className="mx-auto h-10 w-10 opacity-90" />
        <p className="mt-2 text-xs font-bold">Ödül havuzu</p>
        <p className="mt-1 text-[10px] opacity-85">Havuz öğelerini ekleyin — kartlar yalnızca havuzdan oluşur.</p>
      </div>
    );
  }
  return (
    <div className="min-w-0 space-y-2">
      <div className={cn(odulYerlesim.odulGridSinifi, "min-w-0")}>
        {havuz.map((h, idx) => (
          <div key={h.id} className={cn("flex max-w-full flex-col overflow-hidden rounded-lg text-center", kartSinif, havuz.length === 1 && "max-w-[min(100%,300px)] justify-self-center shadow-md")}>
            <div
              className={cn(
                "flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500/35 via-slate-900/40 to-violet-600/30",
                havuz.length === 1 ? "aspect-[5/4] min-h-[96px]" : kompakt ? "aspect-[4/3] min-h-[56px]" : "aspect-[4/3] min-h-[72px]",
                tema.odulGorselYer,
              )}
            >
              <Ticket className={cn(havuz.length === 1 ? "h-10 w-10" : "h-8 w-8", "opacity-90", idx % 2 === 0 ? "text-indigo-200" : "text-violet-200")} />
            </div>
            <p className={cn("line-clamp-2 font-extrabold", kompakt ? "p-1.5 text-[9px]" : "p-2 text-[10px]")}>{h.ad}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SiraliOdulSunumu({
  d,
  tema,
  yerlesim,
  profil,
  odulYerlesim,
}: {
  d: DenemeSinaviFormData;
  tema: ReturnType<typeof posterTemaAl>;
  yerlesim: OdulYerlesimModu;
  profil: PosterLayoutProfili;
  odulYerlesim: YerlesimSonuc;
}) {
  const oduller = siraliOdulSirala(d.oduller);
  const n = oduller.length;
  const kompaktHepsi = odulKompaktMod(n);
  const kartSinif = odulKartZenginlik(profil, tema.odulKart);

  if (n === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-8 text-center", tema.bilgiKutu, "border")}>
        <Trophy className="h-9 w-9 opacity-90" />
        <p className="text-xs font-bold">Ödül alanı</p>
        <p className="text-[10px] opacity-90">Derece ödüllerini ekleyin.</p>
      </div>
    );
  }

  const kart = (o: Odul, idx: number, buyuk?: boolean, kompakt?: boolean) => (
    <div
      key={o.id}
      className={cn(
        "flex min-h-0 max-w-full flex-col overflow-hidden rounded-lg text-center",
        kartSinif,
        buyuk && "ring-2 ring-amber-400/45 shadow-lg",
        yerlesim === "spot" && n === 1 && "max-w-[min(100%,280px)] self-center",
        n === 1 && "max-w-[min(100%,300px)] shadow-md ring-1 ring-amber-300/35",
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden",
          buyuk || n === 1 ? "aspect-[5/4] min-h-[100px] sm:min-h-[118px]" : kompakt ? "aspect-[4/3] min-h-[56px]" : "aspect-[4/3] min-h-[72px]",
          !o.image && "bg-gradient-to-br from-amber-500/35 via-slate-900/50 to-fuchsia-600/30",
          tema.odulGorselYer,
        )}
      >
        {o.image ? (
          <img src={o.image} alt="" className="h-full w-full min-h-[inherit] object-cover object-center" />
        ) : (
          <div className="flex h-full min-h-[inherit] items-center justify-center">
            <Award className={cn(buyuk || n === 1 ? "h-11 w-11 sm:h-12 sm:w-12" : "h-9 w-9", "opacity-95", idx % 3 === 0 && "text-amber-200", idx % 3 === 1 && "text-sky-200", idx % 3 === 2 && "text-fuchsia-200")} />
          </div>
        )}
      </div>
      <div className={cn(kompakt ? "p-1.5" : "p-2", (buyuk || n === 1) && !kompakt && "py-3")}>
        <p className={cn("font-black uppercase opacity-90", buyuk || n === 1 ? "text-sm" : kompakt ? "text-[9px]" : "text-[10px]")}>{o.rank}</p>
        <p className={cn("font-extrabold leading-tight line-clamp-2", buyuk || n === 1 ? "text-base" : kompakt ? "text-[10px]" : "text-xs")}>{o.title || "Ödül"}</p>
        {o.description && n < 4 && !kompaktHepsi ? <p className="mt-0.5 line-clamp-2 text-[9px] opacity-80">{o.description}</p> : null}
      </div>
    </div>
  );

  if (n === 1) {
    return <div className={cn(odulYerlesim.odulGridSinifi, "min-w-0")}>{kart(oduller[0], 0, true)}</div>;
  }

  if (yerlesim === "podium" && n >= 2 && n <= 3) {
    const [a, b, c] = [oduller[0], oduller[1], oduller[2]];
    return (
      <div className="grid min-w-0 grid-cols-2 gap-2">
        {a ? <div className="col-span-2">{kart(a, 0, true)}</div> : null}
        <div className="col-span-2 grid grid-cols-2 gap-2">
          {b ? kart(b, 1) : null}
          {c ? kart(c, 2) : null}
        </div>
      </div>
    );
  }

  if (yerlesim === "podium" && n >= 4) {
    const [ilk, ...diger] = oduller;
    const kRest = odulKompaktMod(diger.length);
    return (
      <div className="min-w-0 space-y-2">
        <div className="mx-auto w-full max-w-md min-w-0">{kart(ilk, 0, true)}</div>
        <div className={cn(odulAkilliGridSinifi(diger.length), profil.odulKartVurgu === "dolu" && diger.length > 3 && "gap-1.5", "min-w-0")}>
          {diger.map((o, idx) => kart(o, idx + 1, false, kRest))}
        </div>
      </div>
    );
  }

  const gridDis = cn(
    odulYerlesim.odulGridSinifi,
    yerlesim === "grid-siki" && n > 3 && "gap-1.5",
    "min-w-0",
  );

  return <div className={gridDis}>{oduller.map((o, idx) => kart(o, idx, false, kompaktHepsi))}</div>;
}

function KatilimOdulBadges({
  d,
  tema,
  odulYerlesim,
}: {
  d: DenemeSinaviFormData;
  tema: ReturnType<typeof posterTemaAl>;
  odulYerlesim: YerlesimSonuc;
}) {
  const tags = [
    ...d.oduller.map((o) => (o.title || o.rank).trim()).filter(Boolean),
    ...d.havuzOgeleri.map((h) => h.ad.trim()).filter(Boolean),
  ];
  if (tags.length === 0) {
    return (
      <div className={cn("rounded-xl border px-4 py-6 text-center text-[10px]", tema.bilgiKutu)}>
        <Gift className="mx-auto h-8 w-8 opacity-80" />
        <p className="mt-2 font-bold">Katılım hediyeleri</p>
        <p className="mt-1 opacity-80">Ödül veya havuz etiketi ekleyin.</p>
      </div>
    );
  }
  return (
    <div className={cn(odulYerlesim.odulGridSinifi, "min-w-0")}>
      {tags.map((t, i) => (
        <span key={`${t}-${i}`} className={cn("max-w-full truncate rounded-full border border-current/25 px-3 py-1.5 text-[10px] font-black sm:text-xs", tema.badge)}>
          {t}
        </span>
      ))}
    </div>
  );
}

function OdulBolgesi({
  d,
  tema,
  yerlesim,
  profil,
}: {
  d: DenemeSinaviFormData;
  tema: ReturnType<typeof posterTemaAl>;
  yerlesim: OdulYerlesimModu;
  profil: PosterLayoutProfili;
}) {
  const odulYerlesim = hesaplaYerlesim(d);
  if (d.odulModeli === "ilkX" && d.oduller.length === 0) {
    return <HavuzSadeceKartlar d={d} tema={tema} profil={profil} odulYerlesim={odulYerlesim} />;
  }
  if (d.odulModeli === "sirali") {
    return <SiraliOdulSunumu d={d} tema={tema} yerlesim={yerlesim} profil={profil} odulYerlesim={odulYerlesim} />;
  }
  if (d.odulModeli === "katilim") {
    return <KatilimOdulBadges d={d} tema={tema} odulYerlesim={odulYerlesim} />;
  }
  if (d.odulModeli === "ilkX" || d.odulModeli === "cekilis") {
    return <HediyeKartlari d={d} tema={tema} yerlesim={yerlesim} profil={profil} odulYerlesim={odulYerlesim} />;
  }
  return <SiraliOdulSunumu d={d} tema={tema} yerlesim={yerlesim} profil={profil} odulYerlesim={odulYerlesim} />;
}

function ModelUstRozet({ d, tema, birincil }: { d: DenemeSinaviFormData; tema: ReturnType<typeof posterTemaAl>; birincil: OncelikOgesi | null }) {
  const odulOnce = birincil === "odul_hediye";
  const rozetOlcek = odulOnce ? "scale-100" : "scale-[0.97] opacity-[0.96]";
  if (d.odulModeli === "ilkX") {
    const x = d.odulIlkX.trim() || "10";
    return (
      <div className={cn("rounded-xl border px-3 py-2 text-center transition-transform", tema.bilgiKutu, rozetOlcek)}>
        <p className={cn("font-black leading-tight", odulOnce ? "text-base sm:text-lg" : "text-sm")}>
          {ilkXKazananEtiketi(d)} Öğrenciye Hediye
        </p>
        <p className="mt-0.5 text-[10px] opacity-85">İlk {x} kişiye verilecek ödüller aşağıda</p>
        {d.oduller.length === 0 ? <p className="mt-1 text-[10px] opacity-90">Seçim hakkı: {secimHakkiEtiketi(d)}</p> : null}
      </div>
    );
  }
  if (d.odulModeli === "katilim") {
    return (
      <div className={cn("rounded-2xl border-2 px-3 py-3 text-center", tema.badge, "border-current/30", rozetOlcek)}>
        <Gift className={cn("mx-auto mb-1 opacity-95", odulOnce ? "h-9 w-9 sm:h-10 sm:w-10" : "h-8 w-8")} />
        <p className={cn("font-black leading-tight", odulOnce ? "text-lg sm:text-xl" : "text-base")}>{katilimHedefBasligi(d)}</p>
        {d.katilimKisiOpsiyonel.trim() ? <p className="mt-1 text-[10px] opacity-90">{d.katilimKisiOpsiyonel}</p> : null}
      </div>
    );
  }
  if (d.odulModeli === "cekilis") {
    return (
      <div className={cn("rounded-xl border px-3 py-2 text-center", tema.bilgiKutu, rozetOlcek)}>
        <Sparkles className={cn("mx-auto mb-1 text-amber-200", odulOnce ? "h-8 w-8" : "h-7 w-7")} />
        <p className={cn("font-black", odulOnce ? "text-base" : "text-sm")}>Katılanlar Arasında Çekiliş</p>
        {d.cekilisKimlerKatilir.trim() ? <p className="mt-1 text-[10px] opacity-90">Kimler: {d.cekilisKimlerKatilir}</p> : null}
        {d.cekilisKacKazanir.trim() ? <p className="text-[10px] opacity-90">Kazanan: {d.cekilisKacKazanir}</p> : null}
      </div>
    );
  }
  return null;
}

function HavuzBlok({ d, tema }: { d: DenemeSinaviFormData; tema: ReturnType<typeof posterTemaAl> }) {
  if (d.odulModeli === "sirali") return null;

  const havuz = d.havuzOgeleri.filter((x) => x.ad.trim());
  const x = d.odulIlkX.trim() || "10";
  let baslik = "Ödül havuzu";
  let aciklama = "";

  if (d.odulModeli === "ilkX") {
    baslik = `İlk ${x} kişiye verilecek ödüller`;
    aciklama = "Aşağıdaki hediyeler bu gruba dağıtılabilir.";
  } else if (d.odulModeli === "cekilis") {
    baslik = "Çekiliş ödül havuzu";
    aciklama = "Çekilişe dahil seçenekler.";
  } else if (d.odulModeli === "katilim") {
    baslik = "Hediye seçenekleri";
    aciklama = "Katılım hediyesi olarak sunulan öğeler.";
  }

  if (havuz.length === 0 && d.odulModeli !== "ilkX" && d.odulModeli !== "cekilis" && d.odulModeli !== "katilim") return null;

  return (
    <div className={cn("rounded-xl border px-3 py-2.5", tema.bilgiKutu)}>
      <p className="text-[11px] font-extrabold">{baslik}</p>
      {aciklama ? <p className="mt-0.5 text-[9px] opacity-85">{aciklama}</p> : null}
      {havuz.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {havuz.map((h) => (
            <span key={h.id} className="rounded-full border border-current/20 bg-black/10 px-2 py-0.5 text-[9px] font-bold">
              {h.ad}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-[9px] opacity-80">Havuz öğelerini formdan ekleyin.</p>
      )}
    </div>
  );
}

function SartlarKutusu({ d, tema }: { d: DenemeSinaviFormData; tema: ReturnType<typeof posterTemaAl> }) {
  const s = d.odulSartlari;
  const dolu = [s.kimKazanir, s.kacKisi, s.sartMetni, s.not].some((x) => x.trim());
  if (!dolu) return null;
  return (
    <div className={cn("rounded-xl border px-3 py-2 text-[9px] leading-snug", tema.sartKutu, d.odulModeli === "cekilis" && "ring-2 ring-amber-400/40")}>
      <p className="text-[10px] font-extrabold">Şartlar ve detaylar</p>
      {s.kimKazanir.trim() ? (
        <p className="mt-1">
          <span className="font-bold">Kim kazanır:</span> {s.kimKazanir}
        </p>
      ) : null}
      {s.kacKisi.trim() ? (
        <p className="mt-0.5">
          <span className="font-bold">Kişi sayısı:</span> {s.kacKisi}
        </p>
      ) : null}
      {s.sartMetni.trim() ? <p className="mt-1 line-clamp-6 whitespace-pre-wrap">{s.sartMetni}</p> : null}
      {s.not.trim() ? (
        <p className="mt-1 border-t border-current/15 pt-1 opacity-90 line-clamp-3">{s.not}</p>
      ) : null}
    </div>
  );
}

function CtaSerit({
  d,
  tema,
  mobilBuyuk,
  qrVurgulu,
  birincil,
}: {
  d: DenemeSinaviFormData;
  tema: ReturnType<typeof posterTemaAl>;
  mobilBuyuk: boolean;
  qrVurgulu: boolean;
  birincil: OncelikOgesi | null;
}) {
  if (d.ctaTipi === "yok") return null;
  const metin =
    d.ctaTipi === "kontenjan"
      ? "Kontenjan sınırlı — hemen başvurun"
      : d.ctaTipi === "hemen_basvur"
        ? "Hemen başvur"
        : d.ctaOzelMetin.trim() || "Detaylar için arayın";
  const kayitUrl = d.kayitQrUrl.trim();
  const qrOdak = qrVurgulu && kayitUrl;
  const ucretsizVurgu = d.katilimTuru === "Ücretsiz";
  const odulCta = birincil === "odul_hediye" || birincil === "kayit_basvuru" || birincil === "qr_kayit";
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 text-center text-sm font-black tracking-tight shadow-md ring-1 ring-black/10 transition-transform",
        tema.cta,
        mobilBuyuk && "flex min-h-[52px] items-center justify-center py-4 text-base sm:min-h-0 sm:py-3 sm:text-sm",
        ucretsizVurgu && "ring-2 ring-amber-300/90 shadow-lg sm:scale-[1.02]",
        qrOdak && odulCta && "ring-2 ring-emerald-400/70",
      )}
    >
      {metin}
      {kayitUrl && d.ctaTipi === "hemen_basvur" ? (
        <p className="mt-1 text-[9px] font-bold uppercase tracking-wider opacity-90">Kayıt için QR veya linki kullanın</p>
      ) : null}
    </div>
  );
}

function KontenjanRozet({ d, tema }: { d: DenemeSinaviFormData; tema: ReturnType<typeof posterTemaAl> }) {
  if (d.katilimTuru !== "Kontenjan sınırlı" && d.katilimTuru !== "Ön kayıt zorunlu") return null;
  return (
    <div className="flex justify-center">
      <span className={cn("rounded-full px-3 py-1 text-[10px] font-black", tema.badge)}>{d.katilimTuru.toUpperCase()}</span>
    </div>
  );
}

function QrAlan({ d, tema, qrVurgulu }: { d: DenemeSinaviFormData; tema: ReturnType<typeof posterTemaAl>; qrVurgulu: boolean }) {
  const url = d.kayitQrUrl.trim();
  if (!url) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-white/25 bg-gradient-to-br from-slate-700/50 to-indigo-950/40 px-3 py-4 text-center text-[9px] text-white/90",
          tema.bilgiKutu,
        )}
      >
        <span className="font-black tracking-wide">Kayıt linki</span>
        <span className="mt-1 opacity-85">Bağlantı ekleyince QR oluşur</span>
      </div>
    );
  }
  const qrPx = qrVurgulu ? 176 : 96;
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-stretch gap-2 rounded-xl border border-white/15 px-2.5 py-2.5 text-[9px] font-bold sm:flex-row sm:items-center sm:justify-center",
        tema.bilgiKutu,
        qrVurgulu && "scale-[1.02] py-3.5 shadow-lg ring-1 ring-emerald-400/35 sm:scale-105",
        !qrVurgulu && "opacity-[0.98] sm:max-w-md",
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-200/95">QR Tara</p>
        <KayitQrImage url={url} size={qrPx} className="mx-auto rounded-lg bg-white p-1 shadow-md" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[10px] font-bold opacity-90">Kayıt linki</p>
        <p className="mt-0.5 line-clamp-2 break-all font-mono text-[8px] opacity-95">{url}</p>
        <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Hemen Başvur</p>
      </div>
    </div>
  );
}

function DuyuruAkilliBolge({ d, tema }: { d: DenemeSinaviFormData; tema: ReturnType<typeof posterTemaAl> }) {
  const sinifTxt = sinifBadgeMetni(d);
  const sinifGecerli = sinifTxt && sinifTxt !== "Sınıf bilgisi" && sinifTxt !== "Çoklu sınıf";
  const tarihTxt = d.tarih ? denemeTarihEtiketi(d.tarih) : null;
  const saatTxt = d.saat?.trim() || null;
  const katTxt = d.katilimTuru;
  const { adlar, aciklamalar } = odulMetinOzetleri(d);
  const maddeVar = sinifGecerli || tarihTxt || katTxt;
  const bos = !maddeVar && !adlar && !aciklamalar && !d.duyuruMetni.trim();
  if (bos) {
    return <p className={cn("text-[10px] leading-relaxed opacity-80", tema.muted)}>Sınıf, tarih ve katılım bilgisini tamamlayın; özet otomatik güncellenir.</p>;
  }

  return (
    <div className={cn("min-w-0 space-y-2", tema.body)}>
      {maddeVar ? (
        <ul className="list-none space-y-1.5 text-[11px] font-semibold leading-snug">
          {sinifGecerli ? (
            <li className="flex items-start gap-2 rounded-lg bg-black/5 px-2 py-1.5 dark:bg-white/10">
              <span className="mt-0.5 shrink-0 text-[10px] opacity-70">▸</span>
              <span>Sınıf: {sinifTxt}</span>
            </li>
          ) : null}
          {tarihTxt || saatTxt ? (
            <li className="flex items-start gap-2 rounded-lg bg-black/5 px-2 py-1.5 dark:bg-white/10">
              <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
              <span>
                {tarihTxt ?? "Tarih eklenecek"}
                {saatTxt ? ` · ${saatTxt}` : ""}
              </span>
            </li>
          ) : null}
          <li className="flex items-start gap-2 rounded-lg bg-black/5 px-2 py-1.5 dark:bg-white/10">
            <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
            <span>Katılım: {katTxt}</span>
          </li>
        </ul>
      ) : null}
      {adlar || aciklamalar ? (
        <div className="rounded-lg border border-current/10 bg-black/[0.04] px-2.5 py-2 text-[10px] leading-snug dark:bg-white/[0.06]">
          {adlar ? (
            <p>
              <span className="font-extrabold opacity-90">Ödüller: </span>
              {adlar}
            </p>
          ) : null}
          {aciklamalar ? (
            <p className={cn("mt-1 opacity-90", adlar && "border-t border-current/10 pt-1")}>
              <span className="font-extrabold">Açıklama: </span>
              {aciklamalar}
            </p>
          ) : null}
        </div>
      ) : null}
      {d.duyuruMetni.trim() ? (
        <p className="line-clamp-3 text-pretty text-[10px] leading-relaxed opacity-85">{d.duyuruMetni.trim()}</p>
      ) : null}
    </div>
  );
}

function useDesktopScene(minWidth: number): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const sync = () => setOk(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [minWidth]);
  return ok;
}

export function DenemeSinaviPreview({
  data,
  posterScene: posterSceneProp,
  onPosterSceneChange,
  variant = "live",
}: {
  data: DenemeSinaviFormData;
  posterScene?: PosterSceneState;
  onPosterSceneChange?: Dispatch<SetStateAction<PosterSceneState>>;
  variant?: "live" | "export";
}) {
  const tema = posterTemaAl(data.sablon);
  const bgStyle: CSSProperties = {};
  if (data.arkaPlanGorseli) {
    bgStyle.backgroundImage = `url(${data.arkaPlanGorseli})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  }

  const sinifEtiket = sinifBadgeMetni(data);
  const yerlesim = odulYerlesimModu(data.sablon, data.odulModeli);
  const motor = normalizeOncelikler(data.oncelikler);
  const profil = layoutProfili(data.sablon);
  const birincil = birincilOncelik(motor);
  const sira = afisBolumSirasi(data.oncelikler, data.sablon);
  const genelOlcek = oncelikGenelOlcek(motor.length);
  const qrVurgulu = hesaplaOncelik(data.oncelikler).qrVurgulu;
  const gorselUrls = afisGorselDizisi(data);
  const katilimRozeti = afisKatilimVurguMetni(data);
  const kisaAciklamaSatir = afisKisaAciklamaSatir(data);

  const [internalScene, setInternalScene] = useState(() => initialPosterScene());
  const controlled = posterSceneProp !== undefined && onPosterSceneChange !== undefined;
  const scene = controlled ? posterSceneProp! : internalScene;
  const setScene = controlled ? onPosterSceneChange! : setInternalScene;
  const sceneSafe = useMemo(
    () => ({
      ...scene,
      canvasBackground: scene.canvasBackground ?? initialPosterScene().canvasBackground,
    }),
    [scene],
  );
  const desktop = useDesktopScene(SCENE_DESKTOP_MIN_PX);
  const exportMode = variant === "export";
  const useStage = sceneSafe.elements.length > 0 || (sceneSafe.editMode && desktop);
  const posterBox = useMemo(() => (useStage ? afisBoyutlari("a4") : afisBoyutlari(data.afisFormati)), [useStage, data.afisFormati]);
  const { width, minHeight } = posterBox;
  const formPosterBox = useMemo(() => afisBoyutlari(data.afisFormati), [data.afisFormati]);

  useEffect(() => {
    if (!desktop) setScene((s) => ({ ...s, editMode: false, selectedId: null }));
  }, [desktop, setScene]);

  const mkImage = () => (
    <div className={cn("min-w-0 gap-2", gorselAlanSinifi(data))}>
      {gorselUrls.length === 0 ? (
        <DekorGorsel src={undefined} minH="112px" placeholderClass={cn("text-white/95", tema.kapakPlaceholder)} className="ring-1 ring-white/15">
          <Sparkles className="h-7 w-7 shrink-0 opacity-75" />
        </DekorGorsel>
      ) : (
        gorselUrls.map((src, i) => (
          <DekorGorsel
            key={`${i}-${src.slice(0, 32)}`}
            src={src}
            minH={gorselThumbMinH(data)}
            placeholderClass={cn("border text-[9px]", tema.odulGorselYer)}
            className="border border-white/10"
          >
            <Sparkles className="h-6 w-6 opacity-90" />
            <span>Görsel {i + 1}</span>
          </DekorGorsel>
        ))
      )}
    </div>
  );

  const mkTitle = () => (
    <div className="min-w-0 space-y-2.5 text-balance">
      <h2 className={cn(baslikAkilliSinif(birincil, bolumKatmani("baslik", motor), data.afisFormati === "story"), tema.heading)}>
        {data.baslik}
      </h2>
      {katilimRozeti ? (
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex max-w-full rounded-full px-3 py-1 text-[10px] font-black tracking-wide ring-1 ring-white/20 sm:px-4 sm:py-1.5 sm:text-xs",
              tema.badge,
              katilimRozeti === "ÜCRETSİZ KATILIM" && "bg-amber-400/95 text-slate-900 shadow-md ring-amber-200/90",
              birincil === "ucretsiz_katilim" && katilimRozeti === "ÜCRETSİZ KATILIM" && "scale-105 shadow-lg ring-2 sm:scale-110",
            )}
          >
            {katilimRozeti}
          </span>
        </div>
      ) : null}
      {kisaAciklamaSatir ? (
        <p className={cn("text-xs font-bold leading-snug sm:text-sm", tema.body)}>{kisaAciklamaSatir}</p>
      ) : null}
    </div>
  );

  const mkReward = () => (
    <div className="min-w-0 space-y-2">
      <ModelUstRozet d={data} tema={tema} birincil={birincil} />
      <OdulBolgesi d={data} tema={tema} yerlesim={yerlesim} profil={profil} />
    </div>
  );

  const mkQr = () => <QrAlan d={data} tema={tema} qrVurgulu={qrVurgulu} />;

  const mkButton = () => <CtaSerit d={data} tema={tema} mobilBuyuk={profil.ctaMobilBuyuk} qrVurgulu={qrVurgulu} birincil={birincil} />;

  const bolumler: Record<BolumAnahtari, ReactNode> = {
    kurum: (
      <div
        className={cn(
          "flex min-w-0 items-start gap-2",
          birincil === "kurum_logo" ? "justify-center sm:justify-between" : "justify-between",
        )}
      >
        <div className={cn("flex min-w-0 items-center gap-2", birincil === "kurum_logo" && "mx-auto flex-col text-center sm:mx-0 sm:flex-row sm:text-left")}>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border text-[9px] font-black",
              birincil === "kurum_logo" ? "h-14 w-14 sm:h-16 sm:w-16" : "h-12 w-12",
              data.kurumLogo ? "border-white/20 bg-white/10" : tema.logoPlaceholder,
            )}
          >
            {data.kurumLogo ? <img src={data.kurumLogo} alt="" className="h-full w-full object-contain" /> : <Megaphone className="h-6 w-6 opacity-80" />}
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "font-bold",
                tema.heading,
                birincil === "kurum_logo" ? "max-w-[18rem] text-balance text-sm sm:text-base" : "truncate text-xs",
              )}
            >
              {data.kurumAdi || "Kurum adı"}
            </p>
          </div>
        </div>
      </div>
    ),
    sosyal:
      data.instagram || data.web ? (
        <p className={cn("flex flex-wrap gap-2 text-[9px]", tema.muted)}>
          {data.instagram && (
            <span className="inline-flex items-center gap-0.5">
              <Instagram className="h-3 w-3" /> {data.instagram}
            </span>
          )}
          {data.web && (
            <span className="inline-flex items-center gap-0.5">
              <Globe className="h-3 w-3" /> {data.web}
            </span>
          )}
        </p>
      ) : null,
    iletisim:
      data.telefon ? (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold", tema.body)}>
          <Phone className="h-3.5 w-3.5 shrink-0" /> {data.telefon}
        </span>
      ) : null,
    adres:
      data.adres ? (
        <span className={cn("inline-flex min-w-0 items-start gap-1 text-[10px]", tema.body)}>
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span className="line-clamp-3">{data.adres}</span>
        </span>
      ) : null,
    qr: mkQr(),
    kontenjan_rozet: <KontenjanRozet d={data} tema={tema} />,
    /* Katılım rozeti başlık bloğunda (vurgu) gösterilir; ayrı kutu tekrarını önlemek için burada boş. */
    ucretsiz: null,
    tarih: (
      <div className={cn("flex min-w-0 flex-wrap gap-2", birincil === "tarih_saat" && "justify-center")}>
        {data.tarih && (
          <span
            className={cn(
              "inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border font-bold",
              tema.bilgiKutu,
              birincil === "tarih_saat" ? "px-4 py-2 text-sm sm:text-base" : "px-3 py-1 text-xs",
            )}
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{denemeTarihEtiketi(data.tarih)}</span>
          </span>
        )}
        {data.saat && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border font-bold",
              tema.bilgiKutu,
              birincil === "tarih_saat" ? "px-4 py-2 text-sm sm:text-base" : "px-3 py-1 text-xs",
            )}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" /> {data.saat}
          </span>
        )}
      </div>
    ),
    sinif: (
      <div className="flex flex-wrap">
        <span className={cn("inline-flex max-w-full rounded-full px-3 py-1 text-center text-[10px] font-bold", tema.badge)}>{sinifEtiket}</span>
      </div>
    ),
    amac: null,
    kapak: mkImage(),
    baslik: mkTitle(),
    duyuru: <DuyuruAkilliBolge d={data} tema={tema} />,
    havuz:
      data.odulModeli !== "sirali" &&
      (data.odulModeli === "ilkX" || data.odulModeli === "cekilis" || data.odulModeli === "katilim" || data.havuzOgeleri.length > 0) ? (
        <HavuzBlok d={data} tema={tema} />
      ) : null,
    oduller: mkReward(),
    sartlar: <SartlarKutusu d={data} tema={tema} />,
    cta: mkButton(),
    alt: (
      <div className={cn("mt-auto space-y-1 rounded-xl px-3 py-2 text-[10px]", tema.altSerit)}>
        <p className="text-[9px] font-semibold opacity-80 line-clamp-2">Katılım: {data.katilimTuru}</p>
      </div>
    ),
  };

  const innerClassName = cn(
    "relative flex min-h-0 flex-1 flex-col gap-2.5 p-3 sm:gap-3 sm:p-4",
    kolonHizalamaSinifi(profil.hizalama),
    profil.kolonClass,
    profil.ctaMobilBuyuk && "gap-3 p-3.5 sm:p-4 md:p-5",
  );

  const classicInner = (
    <>
      {sira.map((key) => {
        const node = bolumler[key];
        if (node == null) return null;
        const tier = bolumKatmani(key, motor);
        return (
          <div
            key={key}
            className={cn(
              "min-w-0 max-w-full",
              key === "alt" && "mt-auto",
              blokSarici(key, tier, profil.kutuModu),
              tier === 0 && profil.kutuModu === "standart" && "shadow-sm",
              tier !== null && tier >= 3 && "origin-top scale-[0.99]",
            )}
          >
            {node}
          </div>
        );
      })}
    </>
  );

  const classicColumn = <div className={innerClassName}>{classicInner}</div>;
  const autoScale = Math.min(0.48, 260 / formPosterBox.width, 175 / formPosterBox.minHeight);

  return (
    <>
      {!exportMode && controlled && desktop && sceneSafe.editMode ? (
        <div className="mx-auto mb-3 w-full max-w-[min(100%,40rem)] rounded-xl border border-slate-200 bg-slate-50/95 p-2 shadow-sm">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">Otomatik şablon önizlemesi</p>
          <div className="flex max-h-[190px] justify-center overflow-hidden rounded-lg bg-white">
            <div
              style={{
                width: formPosterBox.width,
                transform: `scale(${autoScale})`,
                transformOrigin: "top center",
              }}
            >
              <div
                className={cn(
                  "relative flex max-w-full flex-col overflow-hidden rounded-xl shadow-md ring-1 ring-slate-200",
                  tema.shell,
                  genelOlcek,
                )}
                style={{ width: formPosterBox.width, minHeight: formPosterBox.minHeight, ...bgStyle }}
              >
                {data.arkaPlanGorseli ? <div className={cn("pointer-events-none absolute inset-0", tema.overlay)} /> : null}
                {classicColumn}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div
        className={cn(
          "relative flex max-w-full flex-col rounded-2xl shadow-xl",
          !exportMode && sceneSafe.editMode && desktop ? "overflow-visible" : "overflow-hidden",
          tema.shell,
          genelOlcek,
        )}
        style={{ width, minHeight, ...(useStage ? {} : bgStyle) }}
      >
        {data.arkaPlanGorseli && !useStage ? <div className={cn("pointer-events-none absolute inset-0", tema.overlay)} /> : null}
        {!exportMode && controlled && desktop ? (
          <button
            type="button"
            className="pointer-events-auto absolute left-2 top-2 z-[60] rounded-lg border border-white/30 bg-slate-900/85 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-md backdrop-blur-sm sm:left-3 sm:top-3 sm:px-3 sm:text-xs"
            onClick={() => {
              if (sceneSafe.editMode) {
                setScene((s) => ({ ...s, editMode: false, selectedId: null }));
              } else {
                setScene(() => ({ ...initialPosterScene(), editMode: true }));
              }
            }}
          >
            {sceneSafe.editMode ? "Bitti" : "Afişi düzenle"}
          </button>
        ) : null}
        <div className={cn("relative flex min-h-0 flex-1", useStage ? "min-w-0 flex-row" : "flex-col")}>
          {useStage ? (
            <DenemePosterSceneEditor data={data} scene={sceneSafe} onSceneChange={setScene} variant={variant} desktop={desktop} />
          ) : (
            classicColumn
          )}
        </div>
      </div>
      {!exportMode && controlled && !desktop ? (
        <div className="mx-auto mt-2 max-w-xl space-y-2 px-2 text-center">
          <p className="text-[10px] leading-snug text-slate-500">
            Gelişmiş düzenleme (parça kutusu ve sahne) masaüstünde kullanılabilir. Mobilde otomatik şablon önizlemesi gösterilir.
          </p>
          {sceneSafe.elements.length > 0 ? (
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-800 shadow-sm"
              onClick={() => setScene((s) => ({ ...s, elements: autoFixSceneLayout(s.elements) }))}
            >
              Yerleşimi düzelt
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
