import type { LogoPalette } from "@/types/logoKimlik";

/** Açık kitap + meşale — mühür merkezi */
export function SembolKitapMesale({ palette, cx, cy, size = 130, uid }: { palette: LogoPalette; cx: number; cy: number; size?: number; uid: string }) {
  const s = size;
  return (
    <g filter={`url(#${uid}-sh)`}>
      <rect x={cx - s * 0.42} y={cy - s * 0.12} width={s * 0.84} height={s * 0.58} rx={8} fill={palette.accent} stroke={palette.primary} strokeWidth={5} />
      <line x1={cx} y1={cy - s * 0.12} x2={cx} y2={cy + s * 0.46} stroke={palette.primary} strokeWidth={4} />
      <path d={`M${cx - s * 0.32} ${cy + s * 0.02} L${cx} ${cy + s * 0.14} L${cx + s * 0.32} ${cy + s * 0.02}`} fill="none" stroke={palette.secondary} strokeWidth={3.5} />
      <rect x={cx - s * 0.09} y={cy + s * 0.22} width={s * 0.18} height={s * 0.38} rx={3} fill={palette.primary} />
      <path d={`M${cx - s * 0.24} ${cy + s * 0.22} Q${cx} ${cy - s * 0.48} ${cx + s * 0.24} ${cy + s * 0.22}`} fill="none" stroke={palette.primary} strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={cx} cy={cy - s * 0.44} rx={s * 0.16} ry={s * 0.22} fill={palette.secondary} />
      <ellipse cx={cx} cy={cy - s * 0.38} rx={s * 0.08} ry={s * 0.12} fill="#fff8e0" opacity={0.9} />
    </g>
  );
}

/** Kitap + yıldız */
export function SembolKitapYildiz({ palette, cx, cy, size = 120, uid }: { palette: LogoPalette; cx: number; cy: number; size?: number; uid: string }) {
  const s = size;
  return (
    <g filter={`url(#${uid}-sh)`}>
      <rect x={cx - s * 0.44} y={cy - s * 0.1} width={s * 0.88} height={s * 0.55} rx={8} fill={palette.accent} stroke={palette.primary} strokeWidth={5} />
      <line x1={cx} y1={cy - s * 0.1} x2={cx} y2={cy + s * 0.45} stroke={palette.primary} strokeWidth={4} />
      <polygon
        points={`${cx},${cy - s * 0.58} ${cx + s * 0.38},${cy - s * 0.02} ${cx + s * 0.14},${cy + s * 0.18} ${cx - s * 0.14},${cy + s * 0.18} ${cx - s * 0.38},${cy - s * 0.02}`}
        fill={palette.secondary}
        stroke={palette.primary}
        strokeWidth={2.5}
      />
    </g>
  );
}

/** Fakülte meşalesi — geometrik blok üzerinde */
export function SembolFakulteMesale({ palette, cx, cy, uid }: { palette: LogoPalette; cx: number; cy: number; uid: string }) {
  return (
    <g filter={`url(#${uid}-sh)`}>
      <rect x={cx - 70} y={cy - 20} width={140} height={90} rx={10} fill={palette.primary} opacity={0.12} stroke={palette.primary} strokeWidth={4} />
      <polygon points={`${cx},${cy - 55} ${cx + 55},${cy + 15} ${cx - 55},${cy + 15}`} fill={palette.primary} opacity={0.08} />
      <circle cx={cx} cy={cy - 48} r={32} fill={palette.secondary} opacity={0.95} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
        const r = (d * Math.PI) / 180;
        return (
          <line
            key={d}
            x1={cx + Math.cos(r) * 38}
            y1={cy - 48 + Math.sin(r) * 38}
            x2={cx + Math.cos(r) * 50}
            y2={cy - 48 + Math.sin(r) * 50}
            stroke={palette.secondary}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}
      <rect x={cx - 14} y={cy - 5} width={28} height={55} rx={4} fill={palette.primary} />
      <path d={`M${cx - 22} ${cy - 5} Q${cx} ${cy - 58} ${cx + 22} ${cy - 5}`} fill="none" stroke={palette.primary} strokeWidth={5} />
      <rect x={cx - 55} y={cy + 42} width={110} height={14} rx={4} fill={palette.primary} opacity={0.15} />
    </g>
  );
}

/** Çınar + kitap */
export function SembolCinarKitap({ palette, cx, cy, uid }: { palette: LogoPalette; cx: number; cy: number; uid: string }) {
  return (
    <g filter={`url(#${uid}-sh)`}>
      <ellipse cx={cx} cy={cy + 72} rx={88} ry={22} fill={palette.primary} opacity={0.1} />
      <rect x={cx - 58} y={cy + 18} width={116} height={68} rx={8} fill={palette.accent} stroke={palette.primary} strokeWidth={5} />
      <line x1={cx} y1={cy + 18} x2={cx} y2={cy + 86} stroke={palette.primary} strokeWidth={4} />
      <path
        d={`M${cx} ${cy - 78} Q${cx - 88} ${cy - 5} ${cx - 52} ${cy + 12} M${cx} ${cy - 78} Q${cx + 88} ${cy - 5} ${cx + 52} ${cy + 12}`}
        fill="none"
        stroke={palette.primary}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy - 82} r={28} fill={palette.secondary} opacity={0.4} />
      <path d={`M${cx - 35} ${cy - 50} Q${cx - 20} ${cy - 75} ${cx - 5} ${cy - 48}`} fill={palette.secondary} opacity={0.5} />
      <path d={`M${cx + 35} ${cy - 50} Q${cx + 20} ${cy - 75} ${cx + 5} ${cy - 48}`} fill={palette.secondary} opacity={0.5} />
    </g>
  );
}

/** Nehari — kitap + güneş + yurt */
export function SembolNehari({ palette, cx, cy, uid }: { palette: LogoPalette; cx: number; cy: number; uid: string }) {
  return (
    <g filter={`url(#${uid}-sh)`}>
      <circle cx={cx} cy={cy - 55} r={44} fill={palette.secondary} opacity={0.9} />
      {[0, 50, 100, 150, 200, 250, 300].map((d) => {
        const r = (d * Math.PI) / 180;
        return (
          <line
            key={d}
            x1={cx + Math.cos(r) * 52}
            y1={cy - 55 + Math.sin(r) * 52}
            x2={cx + Math.cos(r) * 68}
            y2={cy - 55 + Math.sin(r) * 68}
            stroke={palette.secondary}
            strokeWidth={4}
            strokeLinecap="round"
          />
        );
      })}
      <rect x={cx - 62} y={cy + 5} width={124} height={70} rx={10} fill={palette.accent} stroke={palette.primary} strokeWidth={4} />
      <path d={`M${cx - 32} ${cy + 75} L${cx} ${cy + 22} L${cx + 32} ${cy + 75}`} fill="none" stroke={palette.primary} strokeWidth={3.5} />
      <rect x={cx - 22} y={cy + 28} width={44} height={32} rx={4} fill={palette.primary} opacity={0.1} />
      <line x1={cx - 18} y1={cy + 12} x2={cx + 18} y2={cy + 12} stroke={palette.primary} strokeWidth={3} />
    </g>
  );
}

/** Geometrik V + kitap */
export function SembolGeometrikEgitim({ palette, cx, cy, size = 150, uid }: { palette: LogoPalette; cx: number; cy: number; size?: number; uid: string }) {
  const h = size / 2;
  return (
    <g filter={`url(#${uid}-sh)`}>
      <polygon points={`${cx},${cy - h} ${cx + h * 0.9},${cy + h * 0.15} ${cx},${cy + h * 0.5} ${cx - h * 0.9},${cy + h * 0.15}`} fill={palette.primary} />
      <polygon points={`${cx},${cy - h + 40} ${cx + h * 0.5},${cy + h * 0.1} ${cx},${cy + h * 0.32} ${cx - h * 0.5},${cy + h * 0.1}`} fill={palette.accent} stroke={palette.secondary} strokeWidth={4} />
      <rect x={cx - 32} y={cy + 5} width={64} height={42} rx={6} fill={palette.accent} stroke={palette.primary} strokeWidth={4} />
      <line x1={cx} y1={cy + 5} x2={cx} y2={cy + 47} stroke={palette.primary} strokeWidth={3} />
    </g>
  );
}

/** Akademi — modern ikon paneli */
export function SembolAkademiPanel({ palette, cx, cy, uid }: { palette: LogoPalette; cx: number; cy: number; uid: string }) {
  return (
    <g filter={`url(#${uid}-sh)`}>
      <rect x={cx - 58} y={cy - 58} width={116} height={116} rx={16} fill={palette.primary} opacity={0.08} stroke={palette.primary} strokeWidth={4} />
      <circle cx={cx} cy={cy - 15} r={28} fill={palette.secondary} opacity={0.85} />
      <rect x={cx - 38} y={cy + 8} width={76} height={48} rx={6} fill={palette.accent} stroke={palette.primary} strokeWidth={4} />
      <line x1={cx} y1={cy + 8} x2={cx} y2={cy + 56} stroke={palette.primary} strokeWidth={3} />
      <path d={`M${cx - 28} ${cy + 22} L${cx} ${cy + 32} L${cx + 28} ${cy + 22}`} fill="none" stroke={palette.secondary} strokeWidth={3} />
    </g>
  );
}

/** Metalik üst simge */
export function SembolMetalUst({ palette, cx, cy, uid }: { palette: LogoPalette; cx: number; cy: number; uid: string }) {
  return (
    <g filter={`url(#${uid}-sh)`}>
      <polygon points={`${cx},${cy - 50} ${cx + 70},${cy + 30} ${cx - 70},${cy + 30}`} fill={palette.primary} opacity={0.9} />
      <polygon points={`${cx},${cy - 30} ${cx + 45},${cy + 15} ${cx - 45},${cy + 15}`} fill={palette.accent} stroke={palette.secondary} strokeWidth={3} />
      <rect x={cx - 35} y={cy + 5} width={70} height={40} rx={5} fill={palette.accent} stroke={palette.primary} strokeWidth={3} />
    </g>
  );
}

/** Kamp rozeti merkez */
export function SembolKampRozet({ palette, cx, cy, uid }: { palette: LogoPalette; cx: number; cy: number; uid: string }) {
  return (
    <g filter={`url(#${uid}-sh)`}>
      <circle cx={cx} cy={cy} r={52} fill={palette.primary} opacity={0.12} stroke={palette.primary} strokeWidth={4} />
      <path d={`M${cx} ${cy - 38} L${cx + 12} ${cy - 8} L${cx + 38} ${cy - 8} L${cx + 18} ${cy + 10} L${cx + 26} ${cy + 38} L${cx} ${cy + 22} L${cx - 26} ${cy + 38} L${cx - 18} ${cy + 10} L${cx - 38} ${cy - 8} L${cx - 12} ${cy - 8} Z`} fill={palette.secondary} stroke={palette.primary} strokeWidth={2} />
      <circle cx={cx} cy={cy + 5} r={18} fill={palette.accent} stroke={palette.primary} strokeWidth={2} />
      <text x={cx} y={cy + 12} textAnchor="middle" fill={palette.primary} fontSize={22} fontWeight={800}>
        ★
      </text>
    </g>
  );
}

/** Yatay amblem */
export function SembolYatayAmblem({ palette, cx, cy, uid }: { palette: LogoPalette; cx: number; cy: number; uid: string }) {
  return <SembolKitapMesale palette={palette} cx={cx} cy={cy} size={88} uid={uid} />;
}
