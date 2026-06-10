import type { BoardingRenderModel } from "@/modules/davet/boarding/boardingTemplateHelpers";
import type { BoardingTemplateTokens } from "@/modules/davet/boarding/boardingTemplateConfig";
import { EditableBoardingLayer } from "@/modules/davet/boarding/EditableBoardingLayer";
import { LOGO_MAX } from "@/modules/davet/invite/inviteTemplateHelpers";

export type BoardingZoneProps = {
  model: BoardingRenderModel;
  tokens: BoardingTemplateTokens;
  logoPreview: string | null;
  images: string[];
  qrDataUrl: string | null;
  variant?: "light" | "dark";
};

export function BoardingLogoZone({ model, tokens, logoPreview, variant = "light" }: BoardingZoneProps) {
  const frame =
    variant === "dark"
      ? "rounded-lg bg-white/10 p-2 ring-1 ring-white/15"
      : "rounded-lg bg-white p-2 ring-1 ring-slate-200 shadow-sm";

  if (!logoPreview) {
    return (
      <EditableBoardingLayer layerId="institution">
        <div className={`${model.kurumClass} leading-snug`} style={{ color: variant === "dark" ? tokens.institution : tokens.accent }}>
          {model.kurumLabel}
        </div>
      </EditableBoardingLayer>
    );
  }

  return (
    <EditableBoardingLayer layerId="logo">
      <div className="flex items-center gap-3">
        <div className={frame}>
          <img src={logoPreview} alt="" className="object-contain" style={{ maxWidth: LOGO_MAX.width, maxHeight: 56 }} />
        </div>
        <div className={`${model.kurumClass} truncate`} style={{ color: tokens.institution }}>
          {model.kurumLabel}
        </div>
      </div>
    </EditableBoardingLayer>
  );
}

export function BoardingTitleZone({ model, tokens }: BoardingZoneProps) {
  return (
    <EditableBoardingLayer layerId="title">
      <h1 className={`font-serif font-bold ${model.titleClass}`} style={{ color: tokens.title }}>
        {model.baslikText}
      </h1>
    </EditableBoardingLayer>
  );
}

export function BoardingDescriptionZone({ model, tokens }: BoardingZoneProps) {
  return (
    <EditableBoardingLayer layerId="description">
      <p className={`whitespace-pre-line ${model.bodyClass}`} style={{ color: tokens.body }}>
        {model.bodyText}
      </p>
    </EditableBoardingLayer>
  );
}

export function BoardingMetaGrid({
  model,
  tokens,
  variant = "light",
  compact = false,
}: BoardingZoneProps & { compact?: boolean }) {
  const cardBg = variant === "dark" ? tokens.cardBg : tokens.cardBg;
  const border = tokens.cardBorder;

  const items: Array<{ layerId: "date" | "time" | "place" | "classLevel" | "capacity"; label: string; value: string; show: boolean }> = [
    { layerId: "date", label: "Tarih", value: model.tarihLine, show: true },
    { layerId: "time", label: "Saat", value: model.saatLine ?? "", show: Boolean(model.saatLine) },
    { layerId: "place", label: "Yer", value: model.yerText ?? "", show: model.showPlace },
    { layerId: "classLevel", label: "Sınıf", value: model.sinifText, show: true },
    { layerId: "capacity", label: "Kontenjan", value: model.kontenjanText, show: true },
  ].filter((i) => i.show);

  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {items.map((item) => (
        <EditableBoardingLayer key={item.layerId} layerId={item.layerId}>
          <div className="rounded-xl border px-3 py-2.5" style={{ background: cardBg, borderColor: border }}>
            <div className={model.metaLabelClass} style={{ color: tokens.metaLabel }}>
              {item.label}
            </div>
            <div className={`${compact ? "text-[18px]" : model.metaClass} font-semibold leading-snug line-clamp-2`} style={{ color: tokens.metaValue }}>
              {item.value}
            </div>
          </div>
        </EditableBoardingLayer>
      ))}
    </div>
  );
}

export function BoardingFlowBlock({ model, tokens, variant = "dark" }: BoardingZoneProps & { variant?: "light" | "dark" }) {
  if (!model.showFlow) return null;
  const gridClass = model.flow.twoColumn ? "grid grid-cols-2 gap-x-4 gap-y-2" : "space-y-2";

  return (
    <EditableBoardingLayer layerId="flowBlock" className="min-h-0 flex-1">
      <div
        className="flex h-full flex-col rounded-2xl border p-4"
        style={{ background: variant === "dark" ? tokens.cardBg : tokens.cardBg, borderColor: tokens.cardBorder }}
      >
        <h3 className="mb-3 shrink-0 text-[20px] font-bold" style={{ color: variant === "dark" ? tokens.title : tokens.accent }}>
          Program Akışı
        </h3>
        <div className={`min-h-0 flex-1 overflow-hidden ${model.flowClass} ${gridClass}`}>
          {model.flow.items.map((item, i) => (
            <div key={i} className="flex gap-2 min-w-0">
              <span className="w-12 shrink-0 font-bold" style={{ color: tokens.accent }}>
                {item.saat}
              </span>
              <div className="min-w-0">
                <div className="font-semibold line-clamp-1" style={{ color: tokens.title }}>
                  {item.baslik}
                </div>
                {item.aciklama ? (
                  <div className="text-[15px] line-clamp-1" style={{ color: tokens.body }}>
                    {item.aciklama}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {model.flow.note ? <p className="mt-2 text-[14px] italic" style={{ color: tokens.body }}>{model.flow.note}</p> : null}
      </div>
    </EditableBoardingLayer>
  );
}

export function BoardingRequirementsBlock({ model, tokens, variant = "dark" }: BoardingZoneProps & { variant?: "light" | "dark" }) {
  if (!model.showRequirements) return null;

  return (
    <EditableBoardingLayer layerId="requirementsBlock">
      <div className="rounded-2xl border p-4" style={{ background: tokens.cardBg, borderColor: tokens.cardBorder }}>
        <h3 className="mb-2 text-[16px] font-bold uppercase tracking-wider" style={{ color: tokens.accent }}>
          Gereksinimler
        </h3>
        {model.checklist.usePills ? (
          <div className="flex flex-wrap gap-2">
            {model.checklist.visible.map((item) => (
              <span
                key={item}
                className="rounded-full border px-3 py-1 text-[14px]"
                style={{ borderColor: tokens.cardBorder, color: tokens.body }}
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <ul className="space-y-1.5 text-[16px]" style={{ color: tokens.body }}>
            {model.checklist.visible.map((item) => (
              <li key={item} className="flex gap-2">
                <span style={{ color: tokens.accent }}>•</span>
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        )}
        {model.checklist.extraLabel ? (
          <p className="mt-2 text-[13px] italic" style={{ color: tokens.metaLabel }}>
            {model.checklist.extraLabel}
          </p>
        ) : null}
      </div>
    </EditableBoardingLayer>
  );
}

export function BoardingNoteBlock({ model, tokens }: BoardingZoneProps) {
  if (!model.showNote) return null;
  return (
    <EditableBoardingLayer layerId="noteBlock">
      <div
        className="rounded-xl border px-4 py-3 text-[17px] italic leading-snug line-clamp-3"
        style={{ background: tokens.accentSoft, borderColor: tokens.cardBorder, color: tokens.body }}
      >
        “{model.guvenText}”
      </div>
    </EditableBoardingLayer>
  );
}

export function BoardingQrContactBlock({ model, tokens, qrDataUrl, variant = "light" }: BoardingZoneProps) {
  if (!model.hasQr && !model.hasContact) return null;

  return (
    <div className="flex flex-wrap items-start gap-3">
      {model.hasQr && qrDataUrl ? (
        <EditableBoardingLayer layerId="qrBlock">
          <div className="flex items-center gap-3 rounded-xl border p-3" style={{ background: tokens.cardBg, borderColor: tokens.cardBorder }}>
            <img src={qrDataUrl} alt="" className="h-24 w-24 rounded-lg bg-white p-1" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: tokens.metaLabel }}>
                Kayıt QR
              </div>
              <div className="text-sm" style={{ color: tokens.body }}>
                Kayıt için tarayın
              </div>
            </div>
          </div>
        </EditableBoardingLayer>
      ) : null}
      {model.hasContact ? (
        <EditableBoardingLayer layerId="contactBlock">
          <div className="rounded-xl border px-4 py-3" style={{ background: tokens.cardBg, borderColor: tokens.cardBorder }}>
            <div className={model.metaLabelClass} style={{ color: tokens.metaLabel }}>
              İletişim
            </div>
            <div className="text-[20px] font-semibold" style={{ color: tokens.metaValue }}>
              {model.iletisimText}
            </div>
          </div>
        </EditableBoardingLayer>
      ) : null}
    </div>
  );
}

export function BoardingImagePanel({
  images,
  tokens,
  fallback = "default",
}: {
  images: string[];
  tokens: BoardingTemplateTokens;
  fallback?: "default" | "corporate" | "premium" | "program";
}) {
  if (images.length > 0) {
    return (
      <EditableBoardingLayer layerId="image" className="h-full w-full">
        <div className="relative h-full w-full overflow-hidden">
          <img src={images[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                fallback === "premium"
                  ? "linear-gradient(270deg, rgba(7,21,38,0.25) 0%, rgba(7,21,38,0.6) 100%)"
                  : "linear-gradient(90deg, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.45) 100%)",
            }}
          />
        </div>
      </EditableBoardingLayer>
    );
  }

  const gradients: Record<string, string> = {
    default: "linear-gradient(145deg, #334155 0%, #1e293b 100%)",
    corporate: "linear-gradient(145deg, #1e3a8a 0%, #334155 100%)",
    premium: "linear-gradient(145deg, #071526 0%, #0b1f3a 100%)",
    program: "linear-gradient(145deg, #0f172a 0%, #1e293b 55%, #334155 100%)",
  };

  return (
    <EditableBoardingLayer layerId="image" className="h-full w-full">
      <div className="relative flex h-full w-full flex-col justify-end p-8" style={{ background: gradients[fallback] }}>
        <div className="rounded-2xl border px-5 py-4 backdrop-blur-sm" style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)" }}>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Yatılı Alıştırma</div>
          <div className="mt-1 font-serif text-2xl font-semibold text-white/90">Program Davetiyesi</div>
        </div>
      </div>
    </EditableBoardingLayer>
  );
}

export function BoardingSmallImageAccent({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  const src = images.length > 1 ? images[1] : images[0];
  return (
    <div className="h-28 shrink-0 overflow-hidden rounded-xl border border-white/10">
      <img src={src} alt="" className="h-full w-full object-cover" />
    </div>
  );
}
