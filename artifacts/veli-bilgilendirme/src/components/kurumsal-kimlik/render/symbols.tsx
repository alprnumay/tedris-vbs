import type { LogoIconId, LogoPalette } from "@/types/logoKimlik";

interface SymbolProps {
  iconId: LogoIconId;
  palette: LogoPalette;
  cx?: number;
  cy?: number;
  size?: number;
  uid?: string;
}

export function LogoSymbolIcon({ iconId, palette, cx = 256, cy = 256, size = 120, uid = "lg" }: SymbolProps) {
  const s = size;
  const x = cx - s / 2;
  const y = cy - s / 2;
  const pri = palette.primary;
  const sec = palette.secondary;
  const acc = palette.accent;

  const g = (children: React.ReactNode) => (
    <g filter={uid ? `url(#${uid}-shadow)` : undefined}>{children}</g>
  );

  switch (iconId) {
    case "kitap":
      return g(
        <>
          <rect x={x + 10} y={y + 18} width={s - 20} height={s - 32} rx={6} fill={acc} stroke={pri} strokeWidth={4} />
          <line x1={cx} y1={y + 18} x2={cx} y2={y + s - 14} stroke={pri} strokeWidth={3} />
          <path d={`M${x + 22} ${y + 36} L${cx} ${y + 48} L${x + s - 22} ${y + 36}`} fill="none" stroke={sec} strokeWidth={3} />
          <path d={`M${x + 22} ${y + s - 38} L${cx} ${y + s - 26} L${x + s - 22} ${y + s - 38}`} fill="none" stroke={pri} strokeWidth={2} opacity={0.5} />
        </>,
      );
    case "mesale":
      return g(
        <>
          <rect x={cx - s * 0.1} y={y + s * 0.52} width={s * 0.2} height={s * 0.38} rx={3} fill={pri} />
          <path
            d={`M${cx - s * 0.28} ${y + s * 0.52} Q${cx} ${y + 6} ${cx + s * 0.28} ${y + s * 0.52}`}
            fill="none"
            stroke={pri}
            strokeWidth={4}
          />
          <ellipse cx={cx} cy={y + 22} rx={s * 0.18} ry={s * 0.26} fill={sec} />
          <ellipse cx={cx} cy={y + 28} rx={s * 0.1} ry={s * 0.14} fill="#fff8e7" opacity={0.9} />
        </>,
      );
    case "yildiz":
      return g(
        <polygon
          points={`${cx},${y + 10} ${x + s - 8},${y + s - 22} ${cx + s * 0.22},${y + s - 6} ${cx - s * 0.22},${y + s - 6} ${x + 8},${y + s - 22}`}
          fill={pri}
          stroke={sec}
          strokeWidth={2}
        />,
      );
    case "defne":
      return g(
        <>
          <path
            d={`M${cx} ${y + s - 14} Q${x + 14} ${y + 36} ${cx} ${y + 18} Q${x + s - 14} ${y + 36} ${cx} ${y + s - 14}`}
            fill={acc}
            stroke={pri}
            strokeWidth={4}
          />
          <line x1={cx} y1={y + 22} x2={cx} y2={y + s - 18} stroke={pri} strokeWidth={3} />
          <ellipse cx={cx - 28} cy={cy - 8} rx={22} ry={10} fill={sec} opacity={0.35} transform={`rotate(-25 ${cx - 28} ${cy - 8})`} />
          <ellipse cx={cx + 28} cy={cy - 8} rx={22} ry={10} fill={sec} opacity={0.35} transform={`rotate(25 ${cx + 28} ${cy - 8})`} />
        </>,
      );
    case "kalem":
    default:
      return g(
        <>
          <path
            d={`M${x + 24} ${y + s - 20} L${x + s - 40} ${y + 32} L${x + s - 58} ${y + 50} L${x + 42} ${y + s - 4} Z`}
            fill={acc}
            stroke={pri}
            strokeWidth={3}
          />
          <polygon points={`${x + s - 58},${y + 50} ${x + s - 32},${y + 76} ${x + s - 76},${y + 32}`} fill={pri} />
          <line x1={x + 30} y1={y + s - 26} x2={x + s - 48} y2={y + 38} stroke={sec} strokeWidth={2} />
        </>,
      );
  }
}

/** Nehari: güneş + ev silüeti */
export function NehariMotif({ palette, cx = 256, cy = 220 }: { palette: LogoPalette; cx?: number; cy?: number }) {
  return (
    <>
      <circle cx={cx} cy={cy - 40} r={36} fill={palette.secondary} opacity={0.85} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
        const r = (d * Math.PI) / 180;
        return (
          <line
            key={d}
            x1={cx + Math.cos(r) * 44}
            y1={cy - 40 + Math.sin(r) * 44}
            x2={cx + Math.cos(r) * 58}
            y2={cy - 40 + Math.sin(r) * 58}
            stroke={palette.secondary}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
      <path
        d={`M${cx - 56} ${cy + 48} L${cx} ${cy - 8} L${cx + 56} ${cy + 48} Z`}
        fill={palette.primary}
        opacity={0.15}
      />
      <rect x={cx - 40} y={cy + 8} width={80} height={52} rx={6} fill={palette.accent} stroke={palette.primary} strokeWidth={3} />
      <path d={`M${cx - 20} ${cy + 60} L${cx} ${cy + 28} L${cx + 20} ${cy + 60}`} fill="none" stroke={palette.primary} strokeWidth={2.5} />
    </>
  );
}
