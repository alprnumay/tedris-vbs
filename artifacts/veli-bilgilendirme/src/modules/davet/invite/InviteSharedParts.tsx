import type { InviteRenderModel } from "@/modules/davet/invite/inviteTemplateHelpers";
import { resolveLogoPlacement, resolveOptionalBlocks } from "@/modules/davet/invite/inviteTemplateHelpers";

type SharedProps = {
  model: InviteRenderModel;
  logoPreview: string | null;
  photoPreview: string | null;
  qrDataUrl: string | null;
};

export function InviteLogo({ logoPreview, model, variant = "default" }: SharedProps & { variant?: "default" | "dark" | "compact" }) {
  const lp = resolveLogoPlacement(model.hasLogo);
  if (!logoPreview) {
    return (
      <div className={`${model.kurumClass} ${variant === "dark" ? "text-white/90" : "text-slate-700"}`}>
        {model.kurumLabel}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-4">
      <div className={variant === "dark" ? "rounded-xl bg-white/10 p-2 ring-1 ring-white/15" : lp.logoFrameClass}>
        <img
          src={logoPreview}
          alt=""
          className={variant === "compact" ? lp.logoClassCompact : lp.logoClass}
        />
      </div>
      <div className={`${model.kurumClass} truncate ${variant === "dark" ? "text-[#d4af37]" : "text-slate-600"}`}>
        {model.kurumLabel}
      </div>
    </div>
  );
}

export function InviteStudentBanner({ model, tone = "light" }: { model: InviteRenderModel; tone?: "light" | "dark" | "gold" }) {
  if (!model.selectedStudent) return null;
  const veli = model.selectedStudent.veliAdi || "Velimiz";
  const toneClass =
    tone === "dark" ? "text-white/90" : tone === "gold" ? "text-[#d4af37]" : "text-slate-600";
  return (
    <div className={`mt-5 border-t pt-4 ${tone === "dark" ? "border-white/15" : "border-slate-200/80"}`}>
      <p className={`text-[22px] italic ${toneClass}`}>Sayın {veli},</p>
      <p className={`mt-1 text-[20px] ${tone === "dark" ? "text-white" : "text-slate-800"}`}>
        Öğrencimiz <span className="font-semibold">{model.selectedStudent.talebeAdi}</span>
      </p>
    </div>
  );
}

export function InviteMetaCards({
  model,
  tone = "light",
  className = "",
  excludeKeys = [],
}: {
  model: InviteRenderModel;
  tone?: "light" | "dark" | "panel";
  className?: string;
  excludeKeys?: string[];
}) {
  const blocks = resolveOptionalBlocks(model, excludeKeys);
  if (blocks.length === 0 && !model.showKatilim && !model.showIletisim) return null;

  const card =
    tone === "dark"
      ? "bg-white/8 border-white/12 text-white"
      : tone === "panel"
        ? "bg-white border-slate-200/90 text-slate-800 shadow-sm"
        : "bg-slate-50 border-slate-200/80 text-slate-800";

  return (
    <div className={`grid gap-3 ${className}`}>
      {blocks.map((block) => (
        <div key={block.key} className={`rounded-xl border px-4 py-3 ${card}`}>
          <div className={`${model.metaLabelClass} ${tone === "dark" ? "text-white/55" : "text-slate-400"}`}>
            {block.label}
          </div>
          <div className={`${model.metaClass} ${tone === "dark" ? "text-white" : "text-slate-900"} line-clamp-2`}>
            {block.value}
          </div>
        </div>
      ))}
      {model.showKatilim ? (
        <div className={`rounded-xl border px-4 py-3 italic text-[18px] leading-snug line-clamp-3 ${card} ${tone === "dark" ? "text-white/75" : "text-slate-600"}`}>
          {model.katilimText}
        </div>
      ) : null}
      {model.showIletisim ? (
        <div className={`rounded-xl border px-4 py-3 ${card}`}>
          <div className={`${model.metaLabelClass} ${tone === "dark" ? "text-white/55" : "text-slate-400"}`}>İletişim</div>
          <div className={`text-[22px] font-semibold ${tone === "dark" ? "text-white" : "text-slate-800"}`}>
            {model.iletisimTelefon}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function InvitePhotoLayer({ photoPreview, model }: SharedProps) {
  if (!photoPreview) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300" aria-hidden />
    );
  }
  return (
    <>
      <img src={photoPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-900/68 to-slate-900/45" aria-hidden />
    </>
  );
}

export function InviteQrPanel({ qrDataUrl, model, compact = false }: SharedProps & { compact?: boolean }) {
  if (!model.hasQr || !qrDataUrl) return null;
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border bg-white/95 p-6 text-center shadow-xl ${compact ? "p-4" : "p-6"}`}>
      <img
        src={qrDataUrl}
        alt=""
        className={compact ? "h-36 w-36 rounded-xl border border-slate-200 bg-white p-2" : "h-44 w-44 rounded-xl border border-slate-200 bg-white p-2"}
      />
      <h3 className="mt-4 text-xl font-bold text-slate-900">Kayıt İçin Tarayınız</h3>
      <p className="mt-1 max-w-[220px] text-sm text-slate-500">Katılım durumunuzu bildirmek için QR kodu okutun.</p>
    </div>
  );
}
