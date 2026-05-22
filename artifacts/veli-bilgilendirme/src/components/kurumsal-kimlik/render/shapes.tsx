import type { LogoPalette } from "@/types/logoKimlik";

/** Resmi mühür — çift halka + iç disk */
export function SealDoubleRing({
  palette,
  cx = 256,
  cy = 256,
  rOuter = 178,
  rInner = 148,
}: {
  palette: LogoPalette;
  cx?: number;
  cy?: number;
  rOuter?: number;
  rInner?: number;
}) {
  return (
    <>
      <circle cx={cx} cy={cy} r={rOuter} fill={palette.accent} stroke={palette.primary} strokeWidth={6} />
      <circle cx={cx} cy={cy} r={rOuter - 14} fill="none" stroke={palette.secondary} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={rInner} fill={palette.accent} stroke={palette.primary} strokeWidth={4} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * (rInner - 8);
        const y1 = cy + Math.sin(rad) * (rInner - 8);
        const x2 = cx + Math.cos(rad) * (rInner - 18);
        const y2 = cy + Math.sin(rad) * (rInner - 18);
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.secondary} strokeWidth={2} opacity={0.7} />
        );
      })}
    </>
  );
}

/** Premium kalkan */
export function ShieldPremium({
  palette,
  uid,
  scale = 1,
}: {
  palette: LogoPalette;
  uid: string;
  scale?: number;
}) {
  const s = scale;
  return (
    <g filter={`url(#${uid}-shadow)`} transform={`translate(${256 - 120 * s}, ${88 - 60 * s}) scale(${s})`}>
      <path
        d="M120 72 L228 118 L218 248 Q120 318 22 248 L12 118 Z"
        fill={`url(#${uid}-pri)`}
        stroke={palette.secondary}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <path
        d="M120 92 L208 128 L200 238 Q120 288 40 238 L32 128 Z"
        fill={palette.accent}
        stroke={palette.primary}
        strokeWidth={2}
        opacity={0.95}
      />
    </g>
  );
}

/** Üniversite rozeti — iç geometrik blok */
export function BadgeInnerBlock({ palette, cx = 256, cy = 248 }: { palette: LogoPalette; cx?: number; cy?: number }) {
  return (
    <>
      <polygon
        points={`${cx},${cy - 52} ${cx + 48},${cy + 8} ${cx + 28},${cy + 56} ${cx - 28},${cy + 56} ${cx - 48},${cy + 8}`}
        fill={palette.primary}
        opacity={0.12}
      />
      <rect x={cx - 36} y={cy - 20} width={72} height={48} rx={6} fill={palette.accent} stroke={palette.primary} strokeWidth={3} />
    </>
  );
}

/** Geometrik elmas amblem */
export function DiamondMark({
  palette,
  cx = 256,
  cy = 230,
  size = 140,
}: {
  palette: LogoPalette;
  cx?: number;
  cy?: number;
  size?: number;
}) {
  const h = size / 2;
  return (
    <>
      <polygon
        points={`${cx},${cy - h} ${cx + h * 0.85},${cy} ${cx},${cy + h} ${cx - h * 0.85},${cy}`}
        fill={palette.primary}
        stroke={palette.secondary}
        strokeWidth={4}
      />
      <polygon
        points={`${cx},${cy - h + 28} ${cx + h * 0.55},${cy} ${cx},${cy + h - 28} ${cx - h * 0.55},${cy}`}
        fill={palette.accent}
        stroke={palette.primary}
        strokeWidth={2}
      />
    </>
  );
}

/** Nehari yumuşak rozet */
export function SoftBadgeShape({ palette }: { palette: LogoPalette }) {
  return (
    <>
      <rect x={96} y={108} width={320} height={296} rx={48} fill={palette.accent} stroke={palette.primary} strokeWidth={4} />
      <rect x={112} y={124} width={288} height={264} rx={40} fill="none" stroke={palette.secondary} strokeWidth={2} opacity={0.5} />
    </>
  );
}

/** Alt şerit bandı */
export function BottomRibbon({
  palette,
  y = 428,
  text,
  uid,
}: {
  palette: LogoPalette;
  y?: number;
  text?: string;
  uid: string;
}) {
  return (
    <g filter={`url(#${uid}-soft)`}>
      <path d={`M96 ${y} L416 ${y} L400 ${y + 36} L112 ${y + 36} Z`} fill={palette.primary} opacity={0.92} />
      {text ? (
        <text x={256} y={y + 22} textAnchor="middle" fill={palette.accent} fontSize={13} fontWeight={700}>
          {text}
        </text>
      ) : null}
    </g>
  );
}
