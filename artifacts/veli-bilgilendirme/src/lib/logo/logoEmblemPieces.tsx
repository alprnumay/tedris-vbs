/** Önceden çizilmiş amblem parçaları — motor birleştirir */

interface EmblemProps {
  goldGradientId: string;
  bg: string;
}

export function EmblemAbstractFlame({ goldGradientId, bg }: EmblemProps) {
  return (
    <g transform="translate(0, -15)">
      <path d="M360 200 L400 280 L360 360 L320 280 Z" fill={`url(#${goldGradientId})`} />
      <path d="M360 230 L380 280 L360 330 L340 280 Z" fill={bg} />
      <path d="M360 255 L370 280 L360 305 L350 280 Z" fill={`url(#${goldGradientId})`} />
      <line x1={360} y1={360} x2={360} y2={450} stroke={`url(#${goldGradientId})`} strokeWidth={4} strokeLinecap="round" />
      <line x1={335} y1={440} x2={385} y2={440} stroke={`url(#${goldGradientId})`} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

export function EmblemGeometricBook({ goldGradientId, bg }: EmblemProps) {
  return (
    <g transform="translate(0, 5)">
      <path
        d="M360 210 L370 240 L400 250 L370 260 L360 290 L350 260 L320 250 L350 240 Z"
        fill={`url(#${goldGradientId})`}
      />
      <path
        d="M250 400 C310 400 345 420 360 440 C375 420 410 400 470 400"
        fill="none"
        stroke={`url(#${goldGradientId})`}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d="M250 418 C310 418 345 438 360 458 C375 438 410 418 470 418"
        fill="none"
        stroke={`url(#${goldGradientId})`}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M250 436 C310 436 345 456 360 476 C375 456 410 436 470 436"
        fill="none"
        stroke={`url(#${goldGradientId})`}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <line x1={360} y1={420} x2={360} y2={485} stroke={`url(#${goldGradientId})`} strokeWidth={3} />
    </g>
  );
}

export function EmblemCorporateCrest({ goldGradientId }: EmblemProps) {
  return (
    <g transform="translate(0, -5)">
      <path
        d="M300 250 L360 190 L420 250"
        fill="none"
        stroke={`url(#${goldGradientId})`}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M280 290 L360 210 L440 290"
        fill="none"
        stroke={`url(#${goldGradientId})`}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      <path
        d="M260 330 L360 230 L460 330"
        fill="none"
        stroke={`url(#${goldGradientId})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.4}
      />
      <rect x={320} y={370} width={15} height={80} rx={2} fill={`url(#${goldGradientId})`} />
      <rect x={345} y={350} width={15} height={100} rx={2} fill={`url(#${goldGradientId})`} />
      <rect x={370} y={360} width={15} height={90} rx={2} fill={`url(#${goldGradientId})`} />
      <rect x={395} y={380} width={15} height={70} rx={2} fill={`url(#${goldGradientId})`} />
    </g>
  );
}
