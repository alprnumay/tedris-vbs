import type { InviteRenderModel } from "@/modules/davet/invite/inviteTemplateHelpers";
import {
  getInstitutionClass,
  getMetaLabelClass,
  getMetaValueClass,
  LOGO_MAX,
} from "@/modules/davet/invite/inviteTemplateHelpers";
import type { InviteTemplateTokens } from "@/modules/davet/invite/inviteTemplateConfig";

export type PosterZoneProps = {
  model: InviteRenderModel;
  tokens: InviteTemplateTokens;
  logoPreview: string | null;
  photoPreview: string | null;
  qrDataUrl: string | null;
};

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
        <div
          className={`${getInstitutionClass()} truncate`}
          style={{ color: variant === "dark" ? tokens.institution : tokens.institution }}
        >
          {model.kurumLabel}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${getInstitutionClass()} max-w-[680px] leading-snug`}
      style={{ color: variant === "dark" ? tokens.institution : tokens.accent }}
    >
      {model.kurumLabel}
    </div>
  );
}

export function TitleZone({ model, tokens, align = "left" }: PosterZoneProps & { align?: "left" | "center" }) {
  return (
    <h1
      className={`font-serif font-bold ${model.titleClass} ${align === "center" ? "text-center" : "text-left"}`}
      style={{ color: tokens.title }}
    >
      {model.baslikText}
    </h1>
  );
}

export function DescriptionZone({ model, tokens }: PosterZoneProps) {
  if (!model.zones.description) return null;
  return (
    <p
      className={`whitespace-pre-line ${model.bodyClass}`}
      style={{ color: tokens.body }}
    >
      {model.bodyText}
    </p>
  );
}

export function StudentZone({ model, tokens, variant = "light" }: PosterZoneProps & { variant?: "light" | "dark" }) {
  if (!model.selectedStudent) return null;
  const veli = model.selectedStudent.veliAdi || "Velimiz";
  const accent = variant === "dark" ? tokens.accent : tokens.accent;
  return (
    <div
      className="mt-5 border-t pt-4"
      style={{ borderColor: variant === "dark" ? "rgba(255,255,255,0.12)" : tokens.cardBorder }}
    >
      <p className="text-[21px] italic" style={{ color: tokens.body }}>
        Sayın <span style={{ color: tokens.title }}>{veli}</span>,
      </p>
      <p className="mt-1 text-[19px]" style={{ color: tokens.body }}>
        Öğrencimiz{" "}
        <span className="font-semibold" style={{ color: accent }}>
          {model.selectedStudent.talebeAdi}
        </span>
      </p>
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
      {fields.map((field) => (
        <div
          key={field.key}
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
      ))}
    </div>
  );
}

export function ImageZone({ photoPreview, tokens }: PosterZoneProps) {
  if (photoPreview) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <img src={photoPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.55) 100%)",
          }}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${tokens.canvas} 0%, #1e293b 45%, #0f172a 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 28px, rgba(255,255,255,0.35) 28px, rgba(255,255,255,0.35) 29px)",
        }}
        aria-hidden
      />
      <div
        className="absolute bottom-8 left-8 right-8 rounded-2xl border px-6 py-5 backdrop-blur-sm"
        style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)" }}
      >
        <div className="text-[13px] font-bold uppercase tracking-[0.24em] text-white/50">Kurumsal Davet</div>
        <div className="mt-2 text-[28px] font-serif font-semibold text-white/90">Program Davetiyesi</div>
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
      <div className="mt-3 text-[13px] font-bold uppercase tracking-[0.16em]" style={{ color: tokens.metaLabel }}>
        Kayıt QR
      </div>
      <div className="mt-1 text-[14px] leading-snug" style={{ color: tokens.body }}>
        Katılım için tarayın
      </div>
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
