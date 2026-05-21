import type { LogoIconId, LogoPalette } from "@/types/logoKimlik";

interface SymbolProps {
  iconId: LogoIconId;
  palette: LogoPalette;
  size?: number;
}

export function LogoSymbolIcon({ iconId, palette, size = 88 }: SymbolProps) {
  const c = palette.primary;
  const s = size;
  const x = 256 - s / 2;
  const y = 256 - s / 2;

  switch (iconId) {
    case "kitap":
      return (
        <g fill={c}>
          <rect x={x + 8} y={y + 12} width={s - 16} height={s - 24} rx={4} fill={palette.accent} stroke={c} strokeWidth={3} />
          <line x1={256} y1={y + 12} x2={256} y2={y + s - 12} stroke={c} strokeWidth={2.5} />
          <path d={`M${x + 18} ${y + 28} L${256} ${y + 38} L${x + s - 18} ${y + 28}`} fill="none" stroke={c} strokeWidth={2} />
        </g>
      );
    case "mesale":
      return (
        <g fill={c}>
          <rect x={x + s * 0.42} y={y + s * 0.55} width={s * 0.16} height={s * 0.32} rx={2} />
          <path d={`M${x + s * 0.35} ${y + s * 0.55} Q${256} ${y + 8} ${x + s * 0.65} ${y + s * 0.55}`} fill="none" stroke={c} strokeWidth={3} />
          <ellipse cx={256} cy={y + 18} rx={14} ry={20} fill={palette.secondary} opacity={0.85} />
        </g>
      );
    case "yildiz":
      return (
        <polygon
          points={`${256},${y + 8} ${x + s - 12},${y + s - 28} ${x + s * 0.62},${y + s} ${x + s * 0.38},${y + s} ${x + 12},${y + s - 28}`}
          fill={c}
        />
      );
    case "defne":
      return (
        <g stroke={c} strokeWidth={3} fill="none" strokeLinecap="round">
          <path d={`M${256} ${y + s - 16} Q${x + 20} ${y + 40} ${256} ${y + 16} Q${x + s - 20} ${y + 40} ${256} ${y + s - 16}`} />
          <line x1={256} y1={y + 20} x2={256} y2={y + s - 20} />
        </g>
      );
    case "kalem":
    default:
      return (
        <g fill={c}>
          <path
            d={`M${x + 20} ${y + s - 24} L${x + s - 36} ${y + 28} L${x + s - 52} ${y + 44} L${x + 36} ${y + s - 8} Z`}
            fill={palette.accent}
            stroke={c}
            strokeWidth={2.5}
          />
          <polygon points={`${x + s - 52},${y + 44} ${x + s - 28},${y + 68} ${x + s - 68},${y + 28}`} />
        </g>
      );
  }
}
