import { useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";

type TextTier = "short" | "medium" | "long";

interface TextSizeOptions {
  base: number;
  medium?: number;
  long?: number;
  lineHeight?: number;
  maxLines?: number;
}

interface ClampOptions {
  fontSize: number;
  lineHeight?: number;
  maxLines: number;
}

interface PhotoOptions {
  height?: number | string;
  radius?: number;
}

interface CardSpacingOptions {
  itemCount?: number;
  textLength?: number;
  baseGap?: number;
}

export interface TemplateQualityReport {
  titleOverflow: boolean;
  subtitleOverflow: boolean;
  descriptionOverflow: boolean;
  footerOverlap: boolean;
  photoStretchRisk: boolean;
}

export function textTier(text: string): TextTier {
  const length = text.trim().length;
  if (length <= 42) return "short";
  if (length <= 86) return "medium";
  return "long";
}

export function calculateTitleSize(text: string, options: TextSizeOptions): CSSProperties {
  const tier = textTier(text);
  const fontSize = tier === "short" ? options.base : tier === "medium" ? options.medium ?? options.base - 2 : options.long ?? options.base - 4;

  return headerTextClampStyle({
    fontSize,
    lineHeight: options.lineHeight ?? 1.38,
    maxLines: options.maxLines ?? 3,
  });
}

export function calculateSubtitleSize(text: string, options: TextSizeOptions): CSSProperties {
  const tier = textTier(text);
  const fontSize = tier === "short" ? options.base : tier === "medium" ? options.medium ?? options.base - 1 : options.long ?? options.base - 2;

  return headerTextClampStyle({
    fontSize,
    lineHeight: options.lineHeight ?? 1.4,
    maxLines: options.maxLines ?? 2,
  });
}

export function calculateDescriptionClamp(text: string, options: ClampOptions): CSSProperties {
  const extraLines = text.length < 220 ? 1 : 0;

  return lineClampStyle({
    fontSize: options.fontSize,
    lineHeight: options.lineHeight ?? 1.7,
    maxLines: Math.max(2, options.maxLines + extraLines),
  });
}

export function calculatePhotoLayout(count: number, options: PhotoOptions = {}) {
  const height = options.height ?? (count <= 1 ? 200 : count === 2 ? 150 : 140);

  return {
    frame: {
      overflow: "hidden",
      borderRadius: options.radius,
      minWidth: 0,
      minHeight: 0,
    } satisfies CSSProperties,
    image: {
      width: "100%",
      height,
      objectFit: "cover",
      objectPosition: "center",
      display: "block",
      maxWidth: "100%",
      flexShrink: 0,
    } satisfies CSSProperties,
  };
}

export function calculateCardSpacing(options: CardSpacingOptions = {}): CSSProperties {
  const density = (options.itemCount ?? 0) + Math.ceil((options.textLength ?? 0) / 180);
  const baseGap = options.baseGap ?? 14;

  return {
    gap: Math.max(8, baseGap - Math.min(4, density)),
  };
}

export function headerTextClampStyle(options: ClampOptions): CSSProperties {
  const lineHeight = options.lineHeight ?? 1.38;

  return {
    fontSize: options.fontSize,
    lineHeight,
    display: "block",
    overflow: "visible",
    paddingTop: "0.18em",
    paddingBottom: "0.12em",
    boxSizing: "content-box",
    overflowWrap: "anywhere",
    wordBreak: "normal",
    maxWidth: "100%",
    transform: "none",
    position: "relative",
  };
}

export function lineClampStyle(options: ClampOptions): CSSProperties {
  return {
    fontSize: options.fontSize,
    lineHeight: options.lineHeight,
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: options.maxLines,
    overflow: "hidden",
    textOverflow: "ellipsis",
    overflowWrap: "anywhere",
    wordBreak: "normal",
    maxWidth: "100%",
  };
}

export function templatePhotoStyle(options: PhotoOptions = {}): CSSProperties {
  return calculatePhotoLayout(1, options).image;
}

export function TemplateTitle({
  children,
  text,
  style,
  baseSize,
}: {
  children: ReactNode;
  text: string;
  style?: CSSProperties;
  baseSize: number;
}) {
  return (
    <h1 data-template-title style={{ ...style, ...calculateTitleSize(text, { base: baseSize }) }}>
      {children}
    </h1>
  );
}

export function TemplateSubtitle({
  children,
  text,
  style,
  baseSize,
}: {
  children: ReactNode;
  text: string;
  style?: CSSProperties;
  baseSize: number;
}) {
  return (
    <div data-template-subtitle style={{ ...style, ...calculateSubtitleSize(text, { base: baseSize }) }}>
      {children}
    </div>
  );
}

export function TemplateDescription({
  children,
  text,
  style,
  fontSize,
  maxLines,
}: {
  children: ReactNode;
  text: string;
  style?: CSSProperties;
  fontSize: number;
  maxLines: number;
}) {
  return (
    <p data-template-description style={{ ...style, ...calculateDescriptionClamp(text, { fontSize, maxLines }) }}>
      {children}
    </p>
  );
}

export function TemplateQualityGate({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const report = useMemo<TemplateQualityReport>(
    () => ({
      titleOverflow: false,
      subtitleOverflow: false,
      descriptionOverflow: false,
      footerOverlap: false,
      photoStretchRisk: false,
    }),
    [],
  );

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const title = root.querySelector<HTMLElement>("[data-template-title]");
    const subtitle = root.querySelector<HTMLElement>("[data-template-subtitle]");
    const description = root.querySelector<HTMLElement>("[data-template-description]");
    const footer = root.querySelector<HTMLElement>(".veli-poster-template-footer");
    const body = root.querySelector<HTMLElement>(".veli-poster-template-body");
    const photos = Array.from(root.querySelectorAll<HTMLImageElement>("img"));

    report.titleOverflow = Boolean(title && title.scrollHeight > title.clientHeight + 1);
    report.subtitleOverflow = Boolean(subtitle && subtitle.scrollHeight > subtitle.clientHeight + 1);
    report.descriptionOverflow = Boolean(description && description.scrollHeight > description.clientHeight + 1);
    report.footerOverlap = Boolean(body && footer && body.getBoundingClientRect().bottom > footer.getBoundingClientRect().top + 1);
    report.photoStretchRisk = photos.some((img) => {
      const style = getComputedStyle(img);
      return style.objectFit !== "cover" || style.objectPosition !== "50% 50%";
    });

    root.dataset.templateQuality = Object.entries(report)
      .filter(([, failed]) => failed)
      .map(([key]) => key)
      .join(",");
  });

  return (
    // display:contents html2canvas tarafından desteklenmez; flex wrapper ile değiştirildi
    <div ref={ref} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  );
}
