import type { LogoPalette, LogoShapeId, LogoBorderId } from "@/types/logoKimlik";

interface ShapeProps {
  shapeId: LogoShapeId;
  borderId: LogoBorderId;
  palette: LogoPalette;
}

export function LogoShapeFrame({ shapeId, borderId, palette }: ShapeProps) {
  const stroke = palette.secondary;
  const fill = palette.accent;
  const sw = borderId === "kalin" ? 5 : borderId === "cift" ? 3 : borderId === "yok" ? 0 : 2.5;

  if (shapeId === "kalkan") {
    return (
      <path
        d="M256 72 L380 130 L360 300 Q256 420 152 300 L132 130 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    );
  }
  if (shapeId === "rozet") {
    return (
      <>
        <circle cx={256} cy={256} r={168} fill={fill} stroke={stroke} strokeWidth={sw} />
        {borderId === "cift" ? (
          <circle cx={256} cy={256} r={148} fill="none" stroke={stroke} strokeWidth={1.5} opacity={0.6} />
        ) : null}
      </>
    );
  }
  if (shapeId === "minimal_yuvarlak") {
    return <circle cx={256} cy={256} r={150} fill={fill} stroke={stroke} strokeWidth={sw * 0.8} />;
  }
  return (
    <>
      <circle cx={256} cy={256} r={175} fill={fill} stroke={stroke} strokeWidth={sw} />
      {borderId === "cift" ? (
        <circle cx={256} cy={256} r={158} fill="none" stroke={stroke} strokeWidth={1.2} opacity={0.5} />
      ) : null}
    </>
  );
}
