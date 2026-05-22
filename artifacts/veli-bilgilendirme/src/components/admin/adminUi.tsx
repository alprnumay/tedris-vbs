import type { CSSProperties } from "react";
import type { AktiviteDurum } from "../../lib/api";

export const ROL_LABEL: Record<string, string> = {
  hoca: "Hoca",
  kurum_mesulu: "Kurum Mesulü",
  admin: "Yönetici",
};

export function formatTarih(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function DurumRozet({ durum }: { durum: AktiviteDurum | string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    today: { bg: "#dcfce7", color: "#166534", label: "Bugün giriş" },
    week: { bg: "#dbeafe", color: "#1e40af", label: "Son 7 gün aktif" },
    inactive: { bg: "#fef9c3", color: "#854d0e", label: "7+ gün pasif" },
    never: { bg: "#fee2e2", color: "#991b1b", label: "Hiç giriş yok" },
    active: { bg: "#dcfce7", color: "#166534", label: "Aktif kurum" },
    passive: { bg: "#fef9c3", color: "#854d0e", label: "Pasif kurum" },
  };
  const c = cfg[durum] ?? cfg.inactive;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: c.bg, color: c.color, whiteSpace: "nowrap" }}>
      {c.label}
    </span>
  );
}

export function StatKart({ baslik, deger, renk, simge, altMetin }: {
  baslik: string; deger: number | string; renk: string; simge: string; altMetin?: string;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: "1.5px solid #e2e8f0", flex: "1 1 140px", minWidth: 120 }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{simge}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: renk, lineHeight: 1 }}>{deger}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 600 }}>{baslik}</div>
      {altMetin && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{altMetin}</div>}
    </div>
  );
}

export const inputStyle: CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0",
  fontSize: 13, fontWeight: 500, color: "#1e293b", background: "#fff", boxSizing: "border-box",
};

export const labelStyle: CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4, display: "block",
};

export function FiltreSatir({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, alignItems: "flex-end" }}>
      {children}
    </div>
  );
}

export function FiltreAlan({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: "1 1 120px", minWidth: 100 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
