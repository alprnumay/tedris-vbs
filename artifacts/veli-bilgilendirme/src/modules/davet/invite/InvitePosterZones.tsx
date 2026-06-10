import type { InviteRenderModel } from "@/modules/davet/invite/inviteTemplateHelpers";
import {
  getInstitutionClass,
  getMetaLabelClass,
  getMetaValueClass,
  LOGO_MAX,
} from "@/modules/davet/invite/inviteTemplateHelpers";
import type { InviteTemplateTokens } from "@/modules/davet/invite/inviteTemplateConfig";
import type { TextLayerId } from "@/modules/davet/invite/inviteLayoutAdjustments";
import { EditablePosterTextLayer } from "@/modules/davet/invite/EditablePosterTextLayer";

export type PosterZoneProps = {
  model: InviteRenderModel;
  tokens: InviteTemplateTokens;
  logoPreview: string | null;
  photoPreview: string | null;
  qrDataUrl: string | null;
};

const INFO_LAYER_IDS: TextLayerId[] = ["date", "time", "place", "note", "contact"];

function isTextLayerId(key: string): key is TextLayerId {
  return INFO_LAYER_IDS.includes(key as TextLayerId) || key === "institution" || key === "title" || key === "description" || key === "student" || key === "qrCaption";
}

export function LogoZone({
  model,
  tokens,
  logoPreview,
  variant = "light",
}: PosterZoneProps & { variant?: "light" | "dark" | "onImage" }) {
  const frameClass =
    variant === "dark"
      ? "rounded-lg bg-white/10 p-2.5 ring-1 ring-white/20"
      : variant === "onImage"
        ? "rounded-lg bg-white/92 p-2.5 ring-1 ring-black/8 shadow-md"
        : "rounded-lg bg-white p-2.5 ring-1 ring-slate-200/80 shadow-sm";

  if (logoPreview) {
    return (
      <div className="flex min-w-0 max-w-[520px] items-center gap-4">
        <div className={frameClass}>
          <img
            src={logoPreview}
            alt=""
            className="object-contain object-left"
            style={{ maxWidth: LOGO_MAX.width, maxHeight: LOGO_MAX.height, width: "auto", height: "auto" }}
          />
        </div>
        <EditablePosterTextLayer layerId="institution">
          <div
            className={`${getInstitutionClass()} truncate`}
            style={{ color: tokens.institution }}
          >
            {model.kurumLabel}
          </div>
        </EditablePosterTextLayer>
      </div>
    );
  }

  return (
    <EditablePosterTextLayer layerId="institution">
      <div
        className={`${getInstitutionClass()} max-w-[680px] leading-snug`}
        style={{ color: variant === "dark" ? tokens.institution : tokens.accent }}
      >
        {model.kurumLabel}
      </div>
    </EditablePosterTextLayer>
  );
}

export function TitleZone({ model, tokens, align = "left" }: PosterZoneProps & { align?: "left" | "center" }) {
  return (
    <EditablePosterTextLayer layerId="title">
      <h1
        className={`font-serif font-bold ${model.titleClass} ${align === "center" ? "text-center" : "text-left"}`}
        style={{ color: tokens.title }}
      >
        {model.baslikText}
      </h1>
    </EditablePosterTextLayer>
  );
}

export function DescriptionZone({ model, tokens }: PosterZoneProps) {
  if (!model.zones.description) return null;
  return (
    <EditablePosterTextLayer layerId="description">
      <p
        className={`whitespace-pre-line ${model.bodyClass}`}
        style={{ color: tokens.body }}
      >
        {model.bodyText}
      </p>
    </EditablePosterTextLayer>
  );
}

export function StudentZone({ model, tokens, variant = "light" }: PosterZoneProps & { variant?: "light" | "dark" }) {
  if (!model.selectedStudent) return null;
  const veli = model.selectedStudent.veliAdi || "Velimiz";
  return (
    <EditablePosterTextLayer layerId="student">
      <div
        className="mt-5 border-t pt-4"
        style={{ borderColor: variant === "dark" ? "rgba(255,255,255,0.12)" : tokens.cardBorder }}
      >
        <p className="text-[21px] italic" style={{ color: tokens.body }}>
          Sayın <span style={{ color: tokens.title }}>{veli}</span>,
        </p>
        <p className="mt-1 text-[19px]" style={{ color: tokens.body }}>
          Öğrencimiz{" "}
          <span className="font-semibold" style={{ color: tokens.accent }}>
            {model.selectedStudent.talebeAdi}
          </span>
        </p>
      </div>
    </EditablePosterTextLayer>
  );
}

export function PremiumDateHeaderZone({ model, tokens }: PosterZoneProps) {
  if (!model.zones.date) return null;
  return (
    <div
      className="shrink-0 rounded-2xl border px-6 py-4 text-right backdrop-blur-sm"
      style={{ borderColor: tokens.cardBorder, background: tokens.cardBg }}
    >
      <EditablePosterTextLayer layerId="date">
        <div className={`${getMetaLabelClass()} text-white/50`}>Tarih</div>
        <div
          className="mt-1 max-w-[340px] font-serif text-[24px] leading-tight line-clamp-2"
          style={{ color: tokens.accent }}
        >
          {model.tarihLine}
        </div>
      </EditablePosterTextLayer>
      {model.zones.time ? (
        <EditablePosterTextLayer layerId="time">
          <div className={`${getMetaLabelClass()} mt-3 text-white/50`}>Saat</div>
          <div className="text-[20px] font-semibold text-white/90">{model.saatLine}</div>
        </EditablePosterTextLayer>
      ) : null}
    </div>
  );
}

export function InfoCardsRow({
  model,
  tokens,
  variant = "light",
  columns = 4,
  excludeKeys = [],
}: PosterZoneProps & { variant?: "light" | "dark" | "glass"; columns?: number; excludeKeys?: string[] }) {
  const fields = model.infoFields.filter((f) => !excludeKeys.includes(f.key));
  if (fields.length === 0) return null;

  const cardStyle =
    variant === "dark" || variant === "glass"
      ? { background: tokens.cardBg, borderColor: tokens.cardBorder }
      : { background: tokens.cardBg, borderColor: tokens.cardBorder };

  const cols = Math.min(columns, Math.max(fields.length, 1));

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {fields.map((field) => {
        const layerId = isTextLayerId(field.key) ? field.key : null;
        const card = (
          <div
            className="rounded-xl border px-4 py-3.5"
            style={cardStyle}
          >
            <div className={getMetaLabelClass()} style={{ color: tokens.metaLabel }}>
              {field.label}
            </div>
            <div className={getMetaValueClass(field.value)} style={{ color: tokens.metaValue }}>
              {field.value}
            </div>
          </div>
        );

        if (!layerId) return <div key={field.key}>{card}</div>;

        return (
          <EditablePosterTextLayer key={field.key} layerId={layerId}>
            {card}
          </EditablePosterTextLayer>
        );
      })}
    </div>
  );
}

export function ImageZone({
  photoPreview,
  tokens,
  fallback = "default",
}: PosterZoneProps & { fallback?: "default" | "corporate" | "premium" }) {
  if (photoPreview) {
    const overlay =
      fallback === "premium"
        ? "linear-gradient(270deg, rgba(7,21,38,0.2) 0%, rgba(7,21,38,0.65) 100%)"
        : fallback === "corporate"
          ? "linear-gradient(90deg, rgba(15,23,42,0.12) 0%, rgba(30,58,138,0.45) 100%)"
          : "linear-gradient(90deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.55) 100%)";

    return (
      <div className="relative h-full w-full overflow-hidden">
        <img src={photoPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: overlay }} aria-hidden />
      </div>
    );
  }

  const fallbackStyles: Record<typeof fallback, { bg: string; label: string; title: string }> = {
    default: {
      bg: `linear-gradient(145deg, ${tokens.canvas} 0%, #1e293b 45%, #0f172a 100%)`,
      label: "Program Daveti",
      title: "Kurumsal Davet",
    },
    corporate: {
      bg: "linear-gradient(145deg, #1e3a8a 0%, #1e40af 35%, #334155 100%)",
      label: "Resmi Davet",
      title: "Veli Toplantısı",
    },
    premium: {
      bg: "linear-gradient(145deg, #071526 0%, #0b1f3a 40%, #1a365d 100%)",
      label: "Premium Davet",
      title: "Program Davetiyesi",
    },
  };

  const fb = fallbackStyles[fallback];

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: fb.bg }}>
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 28px, rgba(255,255,255,0.35) 28px, rgba(255,255,255,0.35) 29px)",
        }}
        aria-hidden
      />
      {fallback === "premium" ? (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-80" aria-hidden />
      ) : null}
      <div
        className="absolute bottom-8 left-8 right-8 rounded-2xl border px-6 py-5 backdrop-blur-sm"
        style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)" }}
      >
        <div className="text-[13px] font-bold uppercase tracking-[0.24em] text-white/50">{fb.label}</div>
        <div className="mt-2 font-serif text-[28px] font-semibold text-white/90">{fb.title}</div>
      </div>
    </div>
  );
}

export function QrZone({ model, qrDataUrl, tokens, variant = "light" }: PosterZoneProps & { variant?: "light" | "dark" }) {
  if (!model.hasQr || !qrDataUrl) return null;

  const bg = variant === "dark" ? "rgba(255,255,255,0.95)" : tokens.cardBg;
  const border = variant === "dark" ? "rgba(255,255,255,0.2)" : tokens.cardBorder;

  return (
    <div
      className="flex shrink-0 flex-col items-center rounded-2xl border px-5 py-4 text-center shadow-lg"
      style={{ background: bg, borderColor: border, width: 200 }}
    >
      <img src={qrDataUrl} alt="" className="h-[128px] w-[128px] rounded-lg bg-white p-1.5" />
      <EditablePosterTextLayer layerId="qrCaption">
        <div className={`${getMetaLabelClass()} mt-3`} style={{ color: tokens.metaLabel }}>
          Kayıt QR
        </div>
        <div className="mt-1 text-[14px] leading-snug" style={{ color: tokens.body }}>
          Katılım için tarayın
        </div>
      </EditablePosterTextLayer>
    </div>
  );
}

export function AccentBar({ tokens, position = "top" }: { tokens: InviteTemplateTokens; position?: "top" | "bottom" }) {
  return (
    <div
      className={`absolute inset-x-0 ${position === "top" ? "top-0" : "bottom-0"} h-[5px]`}
      style={{ background: `linear-gradient(90deg, ${tokens.frame} 0%, ${tokens.accent} 50%, ${tokens.frame} 100%)` }}
      aria-hidden
    />
  );
}

export function GoldRule({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-[3px] w-24 rounded-full ${className}`}
      style={{ background: "linear-gradient(90deg, #d4af37, #f0d78c, #d4af37)" }}
      aria-hidden
    />
  );
}
