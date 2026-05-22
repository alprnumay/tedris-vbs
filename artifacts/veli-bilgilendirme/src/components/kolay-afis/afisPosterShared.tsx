import type { CSSProperties, ReactNode } from "react";
import { KayitQrImage } from "@/components/deneme/KayitQrImage";
import type { AfisBrief, KolayAfisForm } from "@/types/kolayAfis";
import type { AfisTema } from "@/lib/kolay-afis/afisTemaSistemi";
import { afisPosterBoyutlari } from "@/lib/kolay-afis/afisPosterBoyut";
import { ozellikIkonu } from "./afisIkonlar";

const boyut = afisPosterBoyutlari();

export type AfisTemplateProps = {
  form: KolayAfisForm;
  brief: AfisBrief;
  tema: AfisTema;
  ikonlu?: boolean;
};

export function AfisCanvas({ tema, children }: { tema: AfisTema; children: ReactNode }) {
  return (
    <div
      style={{
        width: boyut.width,
        minHeight: boyut.minHeight,
        maxHeight: boyut.minHeight,
        height: boyut.minHeight,
        position: "relative",
        overflow: "hidden",
        fontFamily: tema.fontFamily,
        color: tema.text,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}

export function GokyuzuDekor({ tema }: { tema: AfisTema }) {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: tema.skyGradient }} aria-hidden />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(ellipse 40% 25% at 85% 15%, rgba(255,255,255,0.5), transparent)",
        }}
      />
      <svg
        style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 120, opacity: 0.35 }}
        viewBox="0 0 520 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0,80 Q130,40 260,70 T520,50 L520,120 L0,120 Z" fill={tema.accentSoft} />
        <path d="M0,95 Q200,60 400,85 L520,75 L520,120 L0,120 Z" fill="rgba(255,255,255,0.25)" />
      </svg>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 40,
          right: 24,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "radial-gradient(circle, #fef08a 0%, #fbbf24 70%, transparent 72%)",
          opacity: 0.85,
        }}
      />
    </>
  );
}

export function KurumUst({ form, tema, brief }: AfisTemplateProps) {
  if (!brief.bloklar.kurum || !form.kurumAdi.trim()) return null;
  return (
    <p
      style={{
        margin: 0,
        textAlign: "center",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: tema.primaryDark,
        textShadow: "0 1px 0 rgba(255,255,255,0.5)",
      }}
    >
      {form.kurumAdi}
    </p>
  );
}

export function AnaBaslik({
  brief,
  tema,
  buyuk,
  onLight,
}: {
  brief: AfisBrief;
  tema: AfisTema;
  buyuk?: boolean;
  onLight?: boolean;
}) {
  const fs = buyuk || brief.varyant === "enerjik" ? 42 : brief.varyant === "sade" ? 32 : 36;
  return (
    <h1
      style={{
        margin: 0,
        textAlign: "center",
        fontSize: fs,
        fontWeight: 900,
        lineHeight: 1.05,
        letterSpacing: "-0.02em",
        color: onLight ? tema.primaryDark : "#fff",
        textShadow: onLight ? "none" : `0 3px 12px ${tema.primaryDark}88, 0 0 40px ${tema.primary}44`,
      }}
    >
      {brief.metin.title}
    </h1>
  );
}

export function AltBaslikSatir({ brief, tema }: { brief: AfisBrief; tema: AfisTema }) {
  if (!brief.bloklar.altBaslik || !brief.metin.subtitle.trim()) return null;
  return (
    <p style={{ margin: "8px 0 0", textAlign: "center", fontSize: 13, fontWeight: 700, color: tema.primaryDark }}>
      {brief.metin.subtitle}
    </p>
  );
}

export function SinifSeritleri({ brief, tema }: { brief: AfisBrief; tema: AfisTema }) {
  if (!brief.bloklar.sinifSerit) return null;
  const parcalar = brief.metin.subtitle.includes("İlkokul")
    ? ["İlkokul", "Ortaokul"]
    : brief.metin.subtitle.split(/ ve | \/ /).filter(Boolean).slice(0, 2);
  if (parcalar.length < 2) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
      {parcalar.map((p) => (
        <span
          key={p}
          style={{
            padding: "6px 16px",
            borderRadius: 999,
            background: tema.accent,
            color: tema.primaryDark,
            fontSize: 11,
            fontWeight: 800,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {p.trim()}
        </span>
      ))}
    </div>
  );
}

export function TarihKutusu({ form, brief, tema }: AfisTemplateProps) {
  if (!brief.bloklar.tarih || !form.tarih.trim()) return null;
  const buyuk = brief.tarihBuyuk;
  return (
    <div
      style={{
        margin: "12px auto 0",
        display: "inline-flex",
        alignSelf: "center",
        padding: buyuk ? "12px 28px" : "8px 20px",
        borderRadius: 12,
        background: tema.cardBg,
        border: `2px solid ${tema.accent}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      <span style={{ fontSize: buyuk ? 15 : 13, fontWeight: 800, color: tema.primaryDark }}>📅 {form.tarih}</span>
    </div>
  );
}

export function KisaAciklama({ brief, tema }: { brief: AfisBrief; tema: AfisTema }) {
  if (!brief.bloklar.kisaAciklama || !brief.metin.shortIntro.trim()) return null;
  return (
    <p
      style={{
        margin: "12px 8px 0",
        padding: "10px 12px",
        textAlign: "center",
        fontSize: 12,
        lineHeight: 1.45,
        color: tema.text,
        background: "rgba(255,255,255,0.75)",
        borderRadius: 10,
      }}
    >
      {brief.metin.shortIntro}
    </p>
  );
}

export function GuvenKutusu({ brief, tema }: { brief: AfisBrief; tema: AfisTema }) {
  if (!brief.bloklar.guven || !brief.metin.trustMessage.trim()) return null;
  return (
    <div
      style={{
        marginTop: 12,
        padding: "14px 16px",
        borderRadius: 12,
        background: `linear-gradient(135deg, ${tema.accentSoft}, ${tema.cardBg})`,
        border: `1px solid ${tema.primary}22`,
      }}
    >
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, fontWeight: 500 }}>{brief.metin.trustMessage}</p>
    </div>
  );
}

export function OzellikGrid({ brief, tema, ikonlu }: AfisTemplateProps) {
  if (!brief.bloklar.ozellikler) return null;
  const items = brief.metin.featureItems.filter(Boolean);
  if (!items.length) return null;
  const cols = items.length <= 3 ? items.length : items.length <= 4 ? 2 : 3;

  return (
    <div
      style={{
        marginTop: 14,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8,
      }}
    >
      {items.map((label, i) => (
        <div
          key={i}
          style={{
            padding: "10px 8px",
            borderRadius: 10,
            background: tema.cardBg,
            border: `1px solid ${tema.primary}18`,
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            textAlign: "center",
            minHeight: ikonlu !== false && brief.ozellikIkonlu ? 72 : 56,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {ikonlu !== false && brief.ozellikIkonlu ? ozellikIkonu(i, 20, tema.primary) : null}
          <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.25, color: tema.primaryDark }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function AltIletisimAlani({
  form,
  brief,
  tema,
  style,
}: AfisTemplateProps & { style?: CSSProperties }) {
  const qr = brief.bloklar.qr && form.qrLink.trim();
  const tel = brief.bloklar.telefon && form.telefon.trim();
  if (!qr && !tel && !brief.metin.callToAction.trim()) return null;

  return (
    <div
      style={{
        marginTop: 14,
        display: "flex",
        gap: 12,
        alignItems: "stretch",
        flexWrap: "wrap",
        ...style,
      }}
    >
      {qr ? (
        <div
          style={{
            flex: brief.qrBuyuk ? "1 1 100%" : "0 0 auto",
            display: "flex",
            flexDirection: brief.qrBuyuk ? "row" : "column",
            alignItems: "center",
            gap: 10,
            padding: 12,
            borderRadius: 12,
            background: tema.cardBg,
            border: `2px solid ${tema.primary}33`,
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          }}
        >
          <KayitQrImage url={form.qrLink} size={brief.qrBuyuk ? 100 : 72} />
          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, lineHeight: 1.35, color: tema.textMuted, flex: 1 }}>
            {brief.metin.callToAction}
          </p>
        </div>
      ) : null}
      {tel ? (
        <div
          style={{
            flex: qr && !brief.qrBuyuk ? 1 : "1 1 auto",
            padding: "12px 14px",
            borderRadius: 12,
            background: tema.primary,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: qr ? 140 : undefined,
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.85, letterSpacing: "0.1em" }}>TELEFON</span>
          <span style={{ fontSize: 12, fontWeight: 800, marginTop: 4, lineHeight: 1.3 }}>{form.telefon}</span>
        </div>
      ) : !qr && brief.metin.callToAction ? (
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, flex: 1 }}>{brief.metin.callToAction}</p>
      ) : null}
    </div>
  );
}

export function AltBant({ brief, tema }: { brief: AfisBrief; tema: AfisTema }) {
  if (!brief.bloklar.altBant) return null;
  const metin = brief.metin.slogan || brief.metin.footerBand;
  if (!metin.trim()) return null;
  return (
    <div
      style={{
        marginTop: "auto",
        padding: "14px 20px",
        background: tema.footerBg,
        textAlign: "center",
      }}
    >
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>{metin}</p>
    </div>
  );
}

export function IcerikPadding({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: "relative", zIndex: 1, padding: "20px 22px 16px", flex: 1, display: "flex", flexDirection: "column", ...style }}>
      {children}
    </div>
  );
}

export function KlasikZemin({ tema }: { tema: AfisTema }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, ${tema.surface} 0%, ${tema.accentSoft}55 100%)`,
      }}
      aria-hidden
    />
  );
}
