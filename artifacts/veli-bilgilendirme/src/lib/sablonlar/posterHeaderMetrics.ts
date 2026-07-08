function pickRect(rect: DOMRect) {
  return {
    top: Math.round(rect.top * 100) / 100,
    left: Math.round(rect.left * 100) / 100,
    width: Math.round(rect.width * 100) / 100,
    height: Math.round(rect.height * 100) / 100,
    bottom: Math.round(rect.bottom * 100) / 100,
  };
}

function elementMetrics(el: HTMLElement) {
  const style = getComputedStyle(el);
  return {
    rect: pickRect(el.getBoundingClientRect()),
    scrollHeight: el.scrollHeight,
    offsetHeight: el.offsetHeight,
    clientHeight: el.clientHeight,
    lineHeight: style.lineHeight,
    marginTop: style.marginTop,
    paddingTop: style.paddingTop,
    overflow: style.overflow,
    transform: style.transform,
    position: style.position,
    clipPath: style.clipPath,
    mask: style.mask || style.webkitMask,
    contain: style.contain,
    display: style.display,
  };
}

/**
 * Export sırasında header / h1 / alt başlık ölçülerini konsola yazar.
 * h1.scrollHeight > header.clientHeight ise parent kırpıyor demektir.
 */
export function logPosterHeaderExportMetrics(root: HTMLElement, label = "export"): void {
  const header =
    root.querySelector<HTMLElement>(".veli-poster-template-header") ??
    root.querySelector<HTMLElement>("[data-poster-template-header]");

  const title = root.querySelector<HTMLElement>("[data-template-title]");
  const subtitle = root.querySelector<HTMLElement>("[data-template-subtitle]");

  console.group(`[PosterHeader:${label}] export metrikleri`);

  if (!header) {
    console.warn("Header elementi bulunamadı (.veli-poster-template-header)");
  } else {
    const headerInfo = elementMetrics(header);
    console.log("header", headerInfo);

    if (title) {
      const titleInfo = elementMetrics(title);
      const hRect = header.getBoundingClientRect();
      const tRect = title.getBoundingClientRect();
      const titleExceedsHeader = title.scrollHeight > header.clientHeight + 1;
      const titleTopAboveHeader = tRect.top < hRect.top - 0.5;

      console.log("h1", titleInfo);
      console.log("h1.scrollHeight > header.clientHeight → parent kırpıyor:", titleExceedsHeader);
      console.log("h1 üstü header üstünün üzerinde:", titleTopAboveHeader);
    } else {
      console.warn("h1 [data-template-title] bulunamadı");
    }

    if (subtitle) {
      console.log("subtitle", elementMetrics(subtitle));
    }
  }

  if (!header && title) {
    console.log("h1 (header dışında)", elementMetrics(title));
  }

  console.groupEnd();
}
