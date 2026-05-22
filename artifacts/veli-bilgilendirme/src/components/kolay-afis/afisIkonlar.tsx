import type { CSSProperties } from "react";

const base: CSSProperties = { display: "block", flexShrink: 0 };

export function IkonKitap({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={base} aria-hidden>
      <path d="M5 4h8a3 3 0 013 3v14H8a3 3 0 01-3-3V4z" stroke={color} strokeWidth="1.8" />
      <path d="M9 4h8a3 3 0 013 3v14h-8a3 3 0 01-3-3V4z" stroke={color} strokeWidth="1.8" opacity="0.7" />
    </svg>
  );
}

export function IkonKalem({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={base} aria-hidden>
      <path d="M4 20h4l10-10-4-4L4 16v4z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 6l4 4" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function IkonYildiz({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={base} aria-hidden>
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L6 21l2.3-7-6-4.6h7.6L12 2z" opacity="0.9" />
    </svg>
  );
}

export function IkonCami({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={base} aria-hidden>
      <path d="M12 3v3M8 6h8M6 9h12v10H6V9z" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 6a4 4 0 014 4v1H8v-1a4 4 0 014-4z" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

export function IkonEtkinlik({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={base} aria-hidden>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.8" />
      <path d="M12 8v4l3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IkonTakvim({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={base} aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke={color} strokeWidth="1.8" />
      <path d="M4 9h16M8 3v4M16 3v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const IKON_SIRASI = [IkonCami, IkonKitap, IkonKalem, IkonYildiz, IkonEtkinlik, IkonTakvim] as const;

export function ozellikIkonu(idx: number, size: number, color: string) {
  const Ikon = IKON_SIRASI[idx % IKON_SIRASI.length];
  return <Ikon size={size} color={color} />;
}
