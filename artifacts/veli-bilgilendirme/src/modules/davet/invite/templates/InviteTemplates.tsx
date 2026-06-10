import { getInviteTemplateConfig } from "@/modules/davet/invite/inviteTemplateConfig";
import type { InviteTemplateId } from "@/modules/davet/invite/inviteTemplateHelpers";
import {
  DescriptionZone,
  ImageZone,
  InfoCardsRow,
  LogoZone,
  QrZone,
  StudentZone,
  TitleZone,
} from "@/modules/davet/invite/InvitePosterZones";
import type { InviteRenderModel } from "@/modules/davet/invite/inviteTemplateHelpers";

export type InviteTemplateProps = {
  model: InviteRenderModel;
  logoPreview: string | null;
  photoPreview: string | null;
  qrDataUrl: string | null;
};

type SplitLayoutOptions = {
  templateId: InviteTemplateId;
  imageSide: "left" | "right";
  imageWidth?: string;
  imageFallback: "default" | "corporate" | "premium";
  panelBg?: string;
  logoVariant: "light" | "dark";
  studentVariant: "light" | "dark";
  infoVariant: "light" | "glass";
  qrVariant: "light" | "dark";
  infoColumns?: number;
  excludeKeys?: string[];
  topAccent?: string;
};

function SplitImageInviteLayout(props: InviteTemplateProps, opts: SplitLayoutOptions) {
  const config = getInviteTemplateConfig(opts.templateId);
  const tokens = config.tokens;
  const zp = { ...props, tokens };
  const imageW = opts.imageWidth ?? "50%";
  const contentW = `calc(100% - ${imageW})`;

  const imageCol = (
    <div className="relative h-full shrink-0" style={{ width: imageW }}>
      <ImageZone {...zp} fallback={opts.imageFallback} />
    </div>
  );

  const contentCol = (
    <div
      className="relative flex h-full shrink-0 flex-col overflow-hidden px-10 py-9"
      style={{ width: contentW, background: opts.panelBg ?? tokens.cardBg }}
    >
      {opts.topAccent ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: opts.topAccent }} aria-hidden />
      ) : null}

      <header className="shrink-0 border-b pb-5" style={{ borderColor: tokens.cardBorder }}>
        <LogoZone {...zp} variant={opts.logoVariant} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col justify-center py-5">
        <TitleZone {...zp} />
        <StudentZone {...zp} variant={opts.studentVariant} />
        <div className="mt-4">
          <DescriptionZone {...zp} />
        </div>
      </div>

      <footer className="shrink-0 space-y-3 border-t pt-5" style={{ borderColor: tokens.cardBorder }}>
        <InfoCardsRow
          {...zp}
          variant={opts.infoVariant}
          columns={opts.infoColumns ?? Math.min(2, Math.max(props.model.infoFields.length, 1))}
          excludeKeys={opts.excludeKeys}
        />
        {props.model.hasQr ? (
          <div className="flex justify-center">
            <QrZone {...zp} variant={opts.qrVariant} />
          </div>
        ) : null}
      </footer>
    </div>
  );

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: tokens.canvas }}>
      {opts.imageSide === "left" ? (
        <>
          {imageCol}
          {contentCol}
        </>
      ) : (
        <>
          {contentCol}
          {imageCol}
        </>
      )}
    </div>
  );
}

export function KurumsalDavetTemplate(props: InviteTemplateProps) {
  return SplitImageInviteLayout(props, {
    templateId: "kurumsal-davet",
    imageSide: "left",
    imageWidth: "50%",
    imageFallback: "corporate",
    panelBg: "#ffffff",
    logoVariant: "light",
    studentVariant: "light",
    infoVariant: "light",
    qrVariant: "light",
    infoColumns: 2,
    topAccent: "linear-gradient(90deg, #1e3a8a, #3b82f6, #1e3a8a)",
  });
}

export function PremiumLacivertTemplate(props: InviteTemplateProps) {
  return SplitImageInviteLayout(props, {
    templateId: "premium-lacivert",
    imageSide: "right",
    imageWidth: "48%",
    imageFallback: "premium",
    panelBg: "linear-gradient(180deg, #071526 0%, #0b1f3a 100%)",
    logoVariant: "dark",
    studentVariant: "dark",
    infoVariant: "glass",
    qrVariant: "dark",
    infoColumns: 2,
    topAccent: "linear-gradient(90deg, transparent, #d4af37, transparent)",
  });
}

export function GorselliDavetTemplate(props: InviteTemplateProps) {
  return SplitImageInviteLayout(props, {
    templateId: "gorselli-davet",
    imageSide: "left",
    imageWidth: "52%",
    imageFallback: "default",
    panelBg: "#ffffff",
    logoVariant: "light",
    studentVariant: "light",
    infoVariant: "light",
    qrVariant: "light",
    infoColumns: 2,
  });
}
