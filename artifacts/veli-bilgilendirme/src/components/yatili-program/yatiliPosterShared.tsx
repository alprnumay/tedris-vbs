import type { CSSProperties, ReactNode } from "react";
import { KayitQrImage } from "@/components/deneme/KayitQrImage";
import type { YatiliPosterTema } from "@/lib/yatili-program/yatiliTema";
import { fitKurumAdi } from "@/lib/yatili-program/yatiliAlanKurallari";
import type { YatiliProgramFormData } from "@/types/yatiliProgram";
import type { YatiliLayoutPlan } from "@/lib/yatili-program/yatiliLayoutMotor";
import { yatiliAfishBoyutlari } from "@/lib/yatili-program/yatiliPosterBoyut";

export type YatiliTemplateProps = {
  data: YatiliProgramFormData;
  tema: YatiliPosterTema;
  layout: YatiliLayoutPlan;
  dark?: boolean;
};

const boyut = yatiliAfishBoyutlari();

export function PosterCanvas({
  children,
  tema,
  layout,
}: {
  children: ReactNode;
  tema: YatiliPosterTema;
  layout: YatiliLayoutPlan;
}) {
  const dark = layout.dark;
  return (
    <div
      style={{
        width: boyut.width,
        height: boyut.minHeight,
        minHeight: boyut.minHeight,
        maxHeight: boyut.minHeight,
        background: layout.arkaPlanZemin,
        fontFamily: tema.fontFamily,
        color: dark ? "#fff" : tema.text,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PosterArkaPlanDekor layout={layout} />
      {children}
    </div>
  );
}

export function PosterArkaPlanDekor({ layout }: { layout: YatiliLayoutPlan }) {
  if (!layout.arkaPlanDekor) return null;
  return (
    <div
      style={{ position: "absolute", inset: 0, background: layout.arkaPlanDekor, pointerEvents: "none" }}
      aria-hidden
    />
  );
}

export function FlexGrow({ flex }: { flex: number }) {
  if (flex <= 0) return null;
  return <div style={{ flex, minHeight: 4 }} aria-hidden />;
}

export function KurumsalDesen({ tema, dark, layout }: { tema: YatiliPosterTema; dark?: boolean; layout?: YatiliLayoutPlan }) {
  const yuksek = layout?.dekoratifBanner ? 168 : 140;
  return (
    <div
      style={{
        borderRadius: tema.cardRadius + 2,
        minHeight: yuksek,
        height: "100%",
        background: dark
          ? `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.14), transparent), repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 14px, transparent 14px 28px), linear-gradient(165deg, ${tema.primaryDark}, ${tema.primary})`
          : `radial-gradient(ellipse 70% 50% at 30% 20%, ${tema.accentSoft}, transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, ${tema.primary}18, transparent), linear-gradient(155deg, ${tema.cream} 0%, ${tema.accentSoft} 50%, ${tema.cream} 100%)`,
        border: `2px solid ${dark ? "rgba(255,255,255,0.18)" : tema.primary}28`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: dark
            ? "linear-gradient(0deg, rgba(0,0,0,0.2), transparent 45%)"
            : `repeating-linear-gradient(135deg, ${tema.primary}08 0 2px, transparent 2px 16px)`,
          pointerEvents: "none",
        }}
      />
      <span style={{ fontSize: 28, opacity: dark ? 0.9 : 0.35 }} aria-hidden>
        🏠
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.22em",
          opacity: dark ? 0.75 : 0.5,
          color: dark ? tema.accentSoft : tema.primaryDark,
        }}
      >
        YATILI ALIŞTIRMA
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.4, letterSpacing: "0.08em" }}>Program daveti</span>
    </div>
  );
}

export function KapakGorsel({
  data,
  tema,
  layout,
  dark,
}: {
  data: YatiliProgramFormData;
  tema: YatiliPosterTema;
  layout: YatiliLayoutPlan;
  dark?: boolean;
}) {
  if (!layout.visible.gorsel || data.gorselModu !== "buyuk_kapak" || layout.kapakYukseklik <= 0) return null;
  const height = layout.kapakYukseklik;
  const src = data.gorseller[0];
  return (
    <div
      style={{
        height,
        borderRadius: tema.cardRadius + 4,
        overflow: "hidden",
        boxShadow: dark ? "0 16px 40px rgba(0,0,0,0.45)" : "0 16px 40px -8px rgba(15,23,42,0.3)",
      }}
    >
      {src ? (
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <KurumsalDesen tema={tema} dark={dark} layout={layout} />
      )}
    </div>
  );
}

export function DestekGorsel({
  data,
  tema,
  layout,
}: {
  data: YatiliProgramFormData;
  tema: YatiliPosterTema;
  layout: YatiliLayoutPlan;
}) {
  if (!layout.visible.gorsel || data.gorselModu !== "kucuk_destek" || layout.destekMaxH <= 0) return null;
  const maxH = layout.destekMaxH;
  const src = data.gorseller[0];
  if (!src) return <KurumsalDesen tema={tema} />;
  return (
    <img
      src={src}
      alt=""
      style={{
        width: "100%",
        maxHeight: maxH,
        objectFit: "cover",
        borderRadius: tema.cardRadius,
        border: `3px solid ${tema.accent}`,
      }}
    />
  );
}

export function GorselYokAlani({
  data,
  tema,
  layout,
  minH = 100,
}: {
  data: YatiliProgramFormData;
  tema: YatiliPosterTema;
  layout: YatiliLayoutPlan;
  minH?: number;
}) {
  if (data.gorselModu !== "gorselsiz" || layout.visible.gorsel) return null;
  return (
    <div style={{ minHeight: minH, flex: layout.spacerUst > 0 ? 0.5 : 0 }}>
      <KurumsalDesen tema={tema} dark={layout.dark} layout={layout} />
    </div>
  );
}

export function DekoratifBaslikBandı({ tema, layout }: { tema: YatiliPosterTema; layout: YatiliLayoutPlan }) {
  if (layout.visible.gorsel) return null;
  return (
    <div
      style={{
        padding: "16px 0",
        borderTop: `2px solid ${layout.dark ? "rgba(255,255,255,0.2)" : tema.accent}`,
        borderBottom: `2px solid ${layout.dark ? "rgba(255,255,255,0.12)" : tema.primary}22`,
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.25em", opacity: 0.5 }}>YATILI ALIŞTIRMA</span>
    </div>
  );
}

export function KurumAdiSatir({ data, tema, dark, style }: YatiliTemplateProps & { dark?: boolean; style?: CSSProperties }) {
  const ad = fitKurumAdi(data.kurumAdi) || "Kurum / Yurt Adı";
  return (
    <p
      style={{
        margin: 0,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: dark ? tema.accentSoft : tema.primary,
        ...style,
      }}
    >
      {ad}
    </p>
  );
}

export function ProgramBaslik({
  data,
  dark,
  tema,
  layout,
  size = "lg",
}: {
  data: YatiliProgramFormData;
  dark?: boolean;
  tema?: YatiliPosterTema;
  layout?: YatiliLayoutPlan;
  size?: "lg" | "md";
}) {
  const lines = data.programTitle.split("\n").filter(Boolean);
  const buyuk = layout?.baslikBuyuk;
  const fs = buyuk ? 38 : size === "lg" ? (lines.length > 1 ? 30 : 34) : 26;
  return (
    <h1
      style={{
        margin: 0,
        fontSize: fs,
        fontWeight: tema?.headingWeight ?? 800,
        lineHeight: 1.1,
        letterSpacing: tema?.karakter === "enerjik" ? "-0.03em" : "-0.02em",
        color: dark ? "#fff" : tema?.primaryDark,
        whiteSpace: "pre-line",
      }}
    >
      {data.programTitle || "Yatılı Alıştırma Programı"}
    </h1>
  );
}

export function TarihRozet({
  data,
  tema,
  layout,
  variant = "pill",
  dark,
}: YatiliTemplateProps & { variant?: "pill" | "ribbon" | "hero"; dark?: boolean }) {
  if (!data.programTarihi.trim()) return null;
  const sinifGoster = layout.visible.sinifYas && data.sinifYasGrubu.trim();
  if (variant === "hero" || layout.tarihHero) {
    return (
      <div
        style={{
          display: "inline-block",
          padding: "12px 20px",
          borderRadius: tema.cardRadius,
          background: tema.accent,
          color: tema.primaryDark,
          fontWeight: 800,
          fontSize: layout.tarihHero ? 17 : 16,
          boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
        }}
      >
        📅 {data.programTarihi}
        {sinifGoster ? <span style={{ display: "block", fontSize: 12, marginTop: 4 }}>{data.sinifYasGrubu}</span> : null}
      </div>
    );
  }
  if (variant === "ribbon") {
    return (
      <div
        style={{
          display: "inline-block",
          background: tema.accent,
          color: tema.primaryDark,
          padding: "8px 18px",
          fontWeight: 800,
          fontSize: 13,
          clipPath: "polygon(0 0, 100% 0, 96% 100%, 4% 100%)",
        }}
      >
        📅 {data.programTarihi}
      </div>
    );
  }
  return (
    <span
      style={{
        display: "inline-block",
        background: dark ? "rgba(255,255,255,0.15)" : tema.primary,
        color: "#fff",
        padding: "7px 14px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {data.programTarihi}
      {sinifGoster ? ` · ${data.sinifYasGrubu}` : ""}
    </span>
  );
}

export function GunlukProgramTimeline({ data, tema, layout, dark }: YatiliTemplateProps) {
  if (!layout.visible.gunlukProgram) return null;
  const satirlar = data.gunlukProgram.filter((s) => s.etkinlik.trim());
  if (satirlar.length === 0) return null;
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: tema.cardRadius,
        background: dark ? "rgba(255,255,255,0.08)" : `${tema.primary}0a`,
        border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : tema.primary}20`,
      }}
    >
      <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: dark ? tema.accentSoft : tema.primary }}>
        GÜNLÜK PROGRAM
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {satirlar.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span
              style={{
                flexShrink: 0,
                minWidth: 44,
                fontSize: 11,
                fontWeight: 800,
                color: dark ? tema.accentSoft : tema.primary,
              }}
            >
              {s.saat}
            </span>
            <span style={{ fontSize: 12, lineHeight: 1.35, color: dark ? "rgba(255,255,255,0.9)" : tema.text }}>{s.etkinlik}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GuvenMetniKutusu({ data, tema, layout, dark }: YatiliTemplateProps) {
  if (!layout.visible.guven) return null;
  const buyuk = layout.guvenBuyuk || layout.guvenGenis;
  return (
    <div
      style={{
        padding: buyuk ? "20px 22px" : "14px 16px",
        flex: layout.guvenGenis ? 1 : undefined,
        borderRadius: tema.cardRadius,
        background: dark ? "rgba(255,255,255,0.1)" : `linear-gradient(165deg, ${tema.accentSoft} 0%, ${tema.cream} 100%)`,
        border: `2px solid ${dark ? "rgba(255,255,255,0.2)" : tema.accent}55`,
      }}
    >
      <p style={{ margin: 0, fontSize: buyuk ? 16 : 13, lineHeight: 1.55, fontWeight: 500 }}>{data.trustMessage}</p>
    </div>
  );
}

export function VeliNotSatir({ data, tema, layout, dark }: YatiliTemplateProps) {
  if (!layout.visible.veliNot || !data.parentNote.trim()) return null;
  return (
    <p style={{ margin: 0, fontSize: 11, lineHeight: 1.45, fontStyle: "italic", color: dark ? "rgba(255,255,255,0.8)" : tema.textMuted }}>
      Veli notu: {data.parentNote}
    </p>
  );
}

export function KisaMetin({ children, maxLines = 3, style, dark }: { children: string; maxLines?: number; style?: CSSProperties; dark?: boolean }) {
  if (!children.trim()) return null;
  return (
    <p
      style={{
        margin: 0,
        fontSize: 13,
        lineHeight: 1.45,
        display: "-webkit-box",
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        color: dark ? "rgba(255,255,255,0.88)" : undefined,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function MaddelerListesi({
  data,
  tema,
  layout,
  dark,
  inCard,
}: YatiliTemplateProps & { dark?: boolean; inCard?: boolean }) {
  if (!layout.visible.maddeler) return null;
  const list = (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
      {data.activities.map((m, i) => (
        <li key={`${i}-${m.slice(0, 8)}`} style={{ display: "flex", gap: 8, fontSize: 12, lineHeight: 1.35, color: dark ? "rgba(255,255,255,0.92)" : tema.text }}>
          <span style={{ flexShrink: 0, width: 6, height: 6, marginTop: 5, borderRadius: 2, background: tema.accent, transform: "rotate(45deg)" }} />
          {m}
        </li>
      ))}
    </ul>
  );
  if (!inCard) return list;
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: tema.cardRadius,
        background: dark ? "rgba(255,255,255,0.08)" : `${tema.primary}08`,
        border: dark ? "1px solid rgba(255,255,255,0.12)" : `1px solid ${tema.primary}18`,
      }}
    >
      {list}
    </div>
  );
}

export function SloganSatir({ data, tema, layout, dark, large }: YatiliTemplateProps & { dark?: boolean; large?: boolean }) {
  if (!layout.visible.slogan || !data.slogan.trim()) return null;
  const buyuk = large || layout.sloganBuyuk;
  return (
    <p
      style={{
        margin: 0,
        fontStyle: "italic",
        fontWeight: 700,
        fontSize: buyuk ? 22 : 16,
        color: dark ? tema.accentSoft : tema.primary,
        textAlign: buyuk ? "center" : "left",
      }}
    >
      “{data.slogan}”
    </p>
  );
}

export function BasvuruQrKutusu({ data, tema, layout, dark }: YatiliTemplateProps & { dark?: boolean }) {
  if (!layout.visible.iletisim && !layout.visible.qr) return null;
  const hasQr = layout.visible.qr && Boolean(data.qrLink.trim());
  const tam = layout.qrTamGenislik || !hasQr;
  const bg = dark ? "rgba(255,255,255,0.1)" : `${tema.accentSoft}`;
  const border = dark ? tema.accentSoft : tema.accent;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: tam ? "column" : "row",
        alignItems: tam ? "stretch" : "center",
        gap: 14,
        padding: "14px 16px",
        borderRadius: tema.cardRadius,
        background: bg,
        border: `2px solid ${border}`,
        boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.2)" : "0 6px 20px rgba(15,23,42,0.08)",
      }}
    >
      {hasQr ? (
        <div style={{ flexShrink: 0, textAlign: "center", alignSelf: tam ? "center" : undefined }}>
          <KayitQrImage url={data.qrLink} size={tam ? 108 : 96} className="!rounded-lg !border-2 !border-white" />
          <p style={{ margin: "6px 0 0", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: dark ? tema.accentSoft : tema.primaryDark }}>
            BAŞVURU QR
          </p>
        </div>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: dark ? tema.accentSoft : tema.primary }}>
          {hasQr ? "KAYIT & İLETİŞİM" : "İLETİŞİM & BAŞVURU"}
        </p>
        {layout.visible.kontenjan && data.kontenjan ? (
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: dark ? "#fff" : tema.text }}>Kontenjan: {data.kontenjan}</p>
        ) : null}
        {data.iletisim ? (
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, color: dark ? "#fff" : tema.primaryDark }}>📞 {data.iletisim}</p>
        ) : null}
        {data.callToAction ? (
          <p style={{ margin: 0, fontSize: 11, lineHeight: 1.4, color: dark ? "rgba(255,255,255,0.9)" : tema.textMuted }}>{data.callToAction}</p>
        ) : null}
      </div>
    </div>
  );
}
