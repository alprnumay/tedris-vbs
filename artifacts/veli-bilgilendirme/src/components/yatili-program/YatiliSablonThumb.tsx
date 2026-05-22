import type { YatiliAfishSablonu } from "@/types/yatiliProgram";

const W = 88;
const H = 112;

function blok(x: number, y: number, w: number, h: number, fill = "#94a3b8") {
  return <rect x={x} y={y} width={w} height={h} rx={3} fill={fill} opacity={0.85} />;
}

export function YatiliSablonThumb({ sablon, secili }: { sablon: YatiliAfishSablonu; secili?: boolean }) {
  const stroke = secili ? "#4f46e5" : "#e2e8f0";
  const accent = secili ? "#6366f1" : "#cbd5e1";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0 rounded-lg border border-slate-200 bg-slate-50" aria-hidden>
      <rect width={W} height={H} fill="#f8fafc" stroke={stroke} strokeWidth={2} rx={6} />
      {sablon === "hero_invite" && (
        <>
          {blok(8, 8, 72, 10, accent)}
          {blok(8, 22, 48, 8)}
          {blok(8, 34, 72, 42, "#a5b4fc")}
          {blok(8, 80, 56, 6)}
          {blok(62, 92, 18, 18, accent)}
        </>
      )}
      {sablon === "program_flow" && (
        <>
          {blok(0, 0, 88, 18, accent)}
          {blok(8, 24, 28, 24, "#a5b4fc")}
          {blok(42, 24, 38, 6, accent)}
          {blok(42, 34, 38, 5)}
          {blok(42, 42, 38, 5)}
          {blok(42, 50, 38, 5)}
          {blok(8, 88, 72, 16, "#e2e8f0")}
        </>
      )}
      {sablon === "night_theme" && (
        <>
          <rect width={W} height={H} fill="#1e293b" rx={6} />
          {blok(8, 8, 72, 10, "#fbbf24")}
          {blok(20, 28, 48, 8, "#94a3b8")}
          {blok(24, 42, 40, 10, "#fbbf24")}
          {blok(10, 58, 68, 32, "rgba(255,255,255,0.12)")}
          {blok(8, 94, 72, 14, "#334155")}
        </>
      )}
      {sablon === "trust_focused" && (
        <>
          {blok(8, 8, 72, 10, accent)}
          {blok(8, 24, 72, 28, "#fde68a")}
          {blok(8, 58, 24, 20, "#a5b4fc")}
          {blok(36, 58, 44, 5)}
          {blok(36, 66, 44, 5)}
          {blok(8, 88, 72, 16, "#e2e8f0")}
        </>
      )}
    </svg>
  );
}
