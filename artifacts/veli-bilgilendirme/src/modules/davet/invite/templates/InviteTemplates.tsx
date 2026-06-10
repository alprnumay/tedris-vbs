import { getInviteTemplateConfig } from "@/modules/davet/invite/inviteTemplateConfig";
import {
  AccentBar,
  DescriptionZone,
  GoldRule,
  ImageZone,
  InfoCardsRow,
  LogoZone,
  PremiumDateHeaderZone,
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

export function KurumsalDavetTemplate(props: InviteTemplateProps) {
  const tokens = getInviteTemplateConfig("kurumsal-davet").tokens;
  const zp = { ...props, tokens };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: tokens.canvas }}>
      <AccentBar tokens={tokens} position="top" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle at 85% 15%, #dbeafe 0%, transparent 42%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-col px-14 pb-12 pt-10">
        <header className="flex shrink-0 items-start justify-between gap-6 border-b pb-7" style={{ borderColor: tokens.cardBorder }}>
          <LogoZone {...zp} variant="light" />
          <div
            className="shrink-0 rounded-lg px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ background: tokens.accentSoft, color: tokens.accent }}
          >
            Resmi Davet
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-8">
          <TitleZone {...zp} />
          <StudentZone {...zp} variant="light" />
          <div className="mt-5 max-w-[920px]">
            <DescriptionZone {...zp} />
          </div>
        </div>

        <footer className="shrink-0 space-y-4 border-t pt-6" style={{ borderColor: tokens.cardBorder }}>
          <InfoCardsRow {...zp} variant="light" columns={4} />
          {props.model.hasQr ? (
            <div className="flex justify-end">
              <QrZone {...zp} variant="light" />
            </div>
          ) : null}
        </footer>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 left-0 top-0 w-[6px]"
        style={{ background: tokens.frame }}
        aria-hidden
      />
    </div>
  );
}

export function PremiumLacivertTemplate(props: InviteTemplateProps) {
  const tokens = getInviteTemplateConfig("premium-lacivert").tokens;
  const zp = { ...props, tokens };

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: "linear-gradient(145deg, #071526 0%, #0b1f3a 38%, #122847 100%)" }}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#d4af37]/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" aria-hidden />
      <AccentBar tokens={tokens} position="top" />

      <div className="relative z-10 flex h-full flex-col px-14 pb-11 pt-10">
        <header className="flex shrink-0 items-start justify-between gap-8 border-b border-white/10 pb-7">
          <LogoZone {...zp} variant="dark" />
          <PremiumDateHeaderZone {...zp} />
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-7">
          <GoldRule className="mb-5" />
          <TitleZone {...zp} />
          <StudentZone {...zp} variant="dark" />
          <div className="mt-5 max-w-[900px]">
            <DescriptionZone {...zp} />
          </div>
        </div>

        <footer className="shrink-0 border-t border-white/10 pt-6">
          <div className="flex items-end gap-5">
            <div className="min-w-0 flex-1">
              <InfoCardsRow {...zp} variant="glass" columns={3} excludeKeys={["date", "time"]} />
            </div>
            {props.model.hasQr ? <QrZone {...zp} variant="dark" /> : null}
          </div>
        </footer>
      </div>
    </div>
  );
}

export function GorselliDavetTemplate(props: InviteTemplateProps) {
  const tokens = getInviteTemplateConfig("gorselli-davet").tokens;
  const zp = { ...props, tokens };

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: tokens.canvas }}>
      <div className="relative h-full w-[52%] shrink-0">
        <ImageZone {...zp} />
      </div>

      <div
        className="relative flex h-full w-[48%] shrink-0 flex-col overflow-hidden px-10 py-9"
        style={{ background: tokens.cardBg }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-px"
          style={{ background: tokens.cardBorder }}
          aria-hidden
        />

        <header className="shrink-0 pb-5">
          <LogoZone {...zp} variant="light" />
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
          <TitleZone {...zp} />
          <StudentZone {...zp} variant="light" />
          <div className="mt-4">
            <DescriptionZone {...zp} />
          </div>
        </div>

        <footer className="shrink-0 space-y-4 border-t pt-5" style={{ borderColor: tokens.cardBorder }}>
          <InfoCardsRow
            {...zp}
            variant="light"
            columns={Math.min(2, Math.max(props.model.infoFields.length, 1))}
          />
          {props.model.hasQr ? (
            <div className="flex justify-center">
              <QrZone {...zp} variant="light" />
            </div>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
