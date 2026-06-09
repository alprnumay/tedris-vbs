import type { InviteRenderModel } from "@/modules/davet/invite/inviteTemplateHelpers";
import { InviteLogo, InviteMetaCards, InvitePhotoLayer, InviteQrPanel, InviteStudentBanner } from "@/modules/davet/invite/InviteSharedParts";

export type InviteTemplateProps = {
  model: InviteRenderModel;
  logoPreview: string | null;
  photoPreview: string | null;
  qrDataUrl: string | null;
};

export function KurumsalKlasikTemplate({ model, logoPreview }: InviteTemplateProps) {
  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#f8fafc] text-slate-900">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300" />
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300" />

      <div className="flex h-full w-full flex-col px-12 py-10">
        <header className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <InviteLogo model={model} logoPreview={logoPreview} photoPreview={null} qrDataUrl={null} />
          <div className="hidden shrink-0 text-right md:block">
            <div className={`${model.metaLabelClass} text-slate-400`}>Program Daveti</div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-6">
          <h1 className={`font-serif font-bold text-slate-900 ${model.titleClass}`}>{model.baslikText}</h1>
          <InviteStudentBanner model={model} />
          <p className={`mt-5 max-w-4xl whitespace-pre-line ${model.bodyClass} text-slate-600`}>{model.bodyText}</p>
        </div>

        <footer className="border-t border-slate-200 pt-6">
          <InviteMetaCards model={model} className="grid-cols-1 sm:grid-cols-3" />
        </footer>
      </div>
    </div>
  );
}

export function ModernBolmeliTemplate({ model, logoPreview }: InviteTemplateProps) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-gradient-to-br from-[#eef2ff] via-white to-[#f8fafc]">
      <div className="flex w-[58%] flex-col justify-center px-12 py-10 min-h-0">
        <InviteLogo model={model} logoPreview={logoPreview} photoPreview={null} qrDataUrl={null} />
        <h1 className={`mt-8 font-bold text-slate-900 ${model.titleClass}`}>{model.baslikText}</h1>
        <InviteStudentBanner model={model} />
        <p className={`mt-5 whitespace-pre-line ${model.bodyClass} text-slate-600 max-w-2xl`}>{model.bodyText}</p>
      </div>
      <div className="flex w-[42%] flex-col justify-center border-l border-indigo-100 bg-white/70 px-10 py-10 backdrop-blur-sm min-h-0">
        <div className="mb-4 text-[13px] font-bold uppercase tracking-[0.18em] text-indigo-500">Program Bilgileri</div>
        <InviteMetaCards model={model} tone="panel" />
      </div>
    </div>
  );
}

export function PremiumLacivertTemplate({ model, logoPreview }: InviteTemplateProps) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-[#0b1f3a] via-[#122847] to-[#1a365d] text-white">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#d4af37]/10 blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" aria-hidden />

      <div className="relative z-10 flex h-full flex-col px-12 py-10">
        <header className="flex items-start justify-between gap-8 border-b border-white/10 pb-6">
          <InviteLogo model={model} logoPreview={logoPreview} photoPreview={null} qrDataUrl={null} variant="dark" />
          {model.showTarih ? (
            <div className="shrink-0 rounded-2xl border border-[#d4af37]/25 bg-white/5 px-6 py-4 text-right backdrop-blur-sm">
              <div className={`${model.metaLabelClass} text-white/50`}>Tarih</div>
              <div className="max-w-[320px] text-[26px] font-serif leading-tight text-[#d4af37] line-clamp-2">{model.tarihLine}</div>
              {model.showSaat ? (
                <>
                  <div className={`${model.metaLabelClass} mt-3 text-white/50`}>Saat</div>
                  <div className="text-[22px] text-white/90">{model.saatLine}</div>
                </>
              ) : null}
            </div>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-6">
          <h1 className={`font-serif font-bold text-white ${model.titleClass}`}>{model.baslikText}</h1>
          <InviteStudentBanner model={model} tone="gold" />
          <p className={`mt-5 max-w-4xl whitespace-pre-line ${model.bodyClass} text-slate-300`}>{model.bodyText}</p>
        </div>

        <footer className="grid gap-4 border-t border-white/10 pt-6 md:grid-cols-[1fr_auto] md:items-end">
          <InviteMetaCards model={model} tone="dark" className="md:grid-cols-2" excludeKeys={["tarih", "saat"]} />
        </footer>
      </div>
    </div>
  );
}

export function FotografliTemplate({ model, logoPreview, photoPreview }: InviteTemplateProps) {
  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      <InvitePhotoLayer model={model} logoPreview={logoPreview} photoPreview={photoPreview} qrDataUrl={null} />

      <div className="relative z-10 flex h-full flex-col justify-between px-12 py-10">
        <InviteLogo model={model} logoPreview={logoPreview} photoPreview={photoPreview} qrDataUrl={null} variant="dark" />

        <div className="max-w-3xl rounded-3xl border border-white/10 bg-slate-950/45 p-8 backdrop-blur-md">
          <h1 className={`font-bold ${model.titleClass}`}>{model.baslikText}</h1>
          <InviteStudentBanner model={model} tone="dark" />
          <p className={`mt-4 whitespace-pre-line ${model.bodyClass} text-white/85`}>{model.bodyText}</p>
        </div>

        <InviteMetaCards model={model} tone="dark" className="max-w-2xl md:grid-cols-3" />
      </div>
    </div>
  );
}

export function QrKayitTemplate({ model, logoPreview, qrDataUrl }: InviteTemplateProps) {
  const hasQrPanel = model.hasQr && qrDataUrl;
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#f1f5f9]">
      <div className="flex h-24 shrink-0 items-center justify-between border-b border-slate-200 bg-[#0f172a] px-10 text-white">
        <InviteLogo model={model} logoPreview={logoPreview} photoPreview={null} qrDataUrl={null} variant="dark" />
        {model.showTarih || model.showSaat ? (
          <div className="text-right">
            {model.showTarih ? <div className="text-[22px] font-semibold">{model.tarihLine}</div> : null}
            {model.showSaat ? <div className="text-[18px] text-slate-300">{model.saatLine}</div> : null}
          </div>
        ) : null}
      </div>

      <div className={`flex min-h-0 flex-1 ${hasQrPanel ? "flex-row" : "flex-col"} p-10 gap-8`}>
        <div className={`flex flex-col justify-center min-h-0 overflow-hidden ${hasQrPanel ? "w-[68%]" : "w-full"}`}>
          <h1 className={`font-bold text-slate-900 ${model.titleClass}`}>{model.baslikText}</h1>
          <InviteStudentBanner model={model} />
          <p className={`mt-5 whitespace-pre-line ${model.bodyClass} text-slate-600`}>{model.bodyText}</p>
          <div className="mt-6 max-w-xl">
            <InviteMetaCards model={model} tone="panel" />
          </div>
        </div>

        {hasQrPanel ? (
          <div className="flex w-[32%] items-center justify-center border-l border-slate-200 pl-8">
            <InviteQrPanel model={model} logoPreview={logoPreview} photoPreview={null} qrDataUrl={qrDataUrl} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
