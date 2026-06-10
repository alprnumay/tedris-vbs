import { getBoardingTemplateConfig } from "@/modules/davet/boarding/boardingTemplateConfig";
import {
  BoardingDescriptionZone,
  BoardingFlowBlock,
  BoardingImagePanel,
  BoardingLogoZone,
  BoardingMetaGrid,
  BoardingNoteBlock,
  BoardingQrContactBlock,
  BoardingRequirementsBlock,
  BoardingSmallImageAccent,
  BoardingTitleZone,
  type BoardingZoneProps,
} from "@/modules/davet/boarding/BoardingPosterZones";

export type BoardingTemplateProps = {
  model: BoardingRenderModel;
  logoPreview: string | null;
  images: string[];
  qrDataUrl: string | null;
};

function zp(props: BoardingTemplateProps, templateId: Parameters<typeof getBoardingTemplateConfig>[0]): BoardingZoneProps {
  return { ...props, tokens: getBoardingTemplateConfig(templateId).tokens };
}

/** A — Program Odaklı Premium */
export function ProgramOdakliPremiumTemplate(props: BoardingTemplateProps) {
  const tokens = getBoardingTemplateConfig("program-odakli-premium").tokens;
  const z = zp(props, "program-odakli-premium");

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-8" style={{ background: tokens.canvas }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-80" />

      <header className="relative z-10 flex shrink-0 items-start justify-between gap-6 border-b pb-5" style={{ borderColor: tokens.cardBorder }}>
        <BoardingLogoZone {...z} variant="dark" />
        <div className="max-w-[420px]">
          <BoardingMetaGrid {...z} variant="dark" compact />
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 gap-5 py-5">
        <div className="flex w-[28%] shrink-0 flex-col gap-4">
          <BoardingTitleZone {...z} />
          <BoardingDescriptionZone {...z} />
          <div className="mt-auto space-y-3">
            <BoardingNoteBlock {...z} />
            <BoardingSmallImageAccent images={props.images} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <BoardingFlowBlock {...z} variant="dark" />
        </div>

        <div className="flex w-[24%] shrink-0 flex-col gap-4">
          <BoardingRequirementsBlock {...z} variant="dark" />
          <BoardingQrContactBlock {...z} variant="dark" />
        </div>
      </div>
    </div>
  );
}

/** B — Davet Odaklı Kurumsal */
export function DavetOdakliKurumsalTemplate(props: BoardingTemplateProps) {
  const tokens = getBoardingTemplateConfig("davet-odakli-kurumsal").tokens;
  const z = zp(props, "davet-odakli-kurumsal");

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: tokens.canvas }}>
      <div className="w-[46%] shrink-0">
        <BoardingImagePanel images={props.images} tokens={tokens} fallback="corporate" />
      </div>
      <div className="relative flex w-[54%] shrink-0 flex-col overflow-hidden px-10 py-8" style={{ background: tokens.panelBg }}>
        <header className="shrink-0 border-b pb-5" style={{ borderColor: tokens.cardBorder }}>
          <BoardingLogoZone {...z} variant="light" />
        </header>
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 py-5">
          <BoardingTitleZone {...z} />
          <BoardingDescriptionZone {...z} />
          <BoardingMetaGrid {...z} variant="light" />
        </div>
        <footer className="shrink-0 space-y-3 border-t pt-4" style={{ borderColor: tokens.cardBorder }}>
          {props.model.showRequirements ? (
            <div className="opacity-90">
              <BoardingRequirementsBlock {...z} variant="light" />
            </div>
          ) : null}
          <BoardingQrContactBlock {...z} variant="light" />
          <BoardingNoteBlock {...z} />
        </footer>
      </div>
    </div>
  );
}

/** C — Kayıt / Bilgilendirme */
export function KayitBilgilendirmeTemplate(props: BoardingTemplateProps) {
  const tokens = getBoardingTemplateConfig("kayit-bilgilendirme").tokens;
  const z = zp(props, "kayit-bilgilendirme");

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: tokens.canvas }}>
      <div className="flex w-[50%] shrink-0 flex-col overflow-hidden px-10 py-8" style={{ background: tokens.panelBg }}>
        <BoardingLogoZone {...z} variant="light" />
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 py-4">
          <BoardingTitleZone {...z} />
          <BoardingDescriptionZone {...z} />
          <BoardingMetaGrid {...z} variant="light" compact />
        </div>
        <div className="shrink-0 space-y-3 border-t pt-4" style={{ borderColor: tokens.cardBorder }}>
          <BoardingQrContactBlock {...z} variant="light" />
          <BoardingNoteBlock {...z} />
        </div>
      </div>
      <div className="w-[50%] shrink-0">
        <BoardingImagePanel images={props.images} tokens={tokens} fallback="default" />
      </div>
    </div>
  );
}
