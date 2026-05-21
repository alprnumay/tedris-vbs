import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

export function KayitQrImage({
  url,
  size = 160,
  className,
}: {
  url: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    const u = url.trim();
    if (!u) {
      setSrc(null);
      return;
    }
    QRCode.toDataURL(u, { width: size, margin: 1, errorCorrectionLevel: "M" })
      .then((dataUrl) => {
        if (!cancel) setSrc(dataUrl);
      })
      .catch(() => {
        if (!cancel) setSrc(null);
      });
    return () => {
      cancel = true;
    };
  }, [url, size]);

  if (!src) {
    return (
      <div
        className={cn("shrink-0 rounded-lg border border-dashed border-current/25 bg-black/10", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return <img src={src} alt="" width={size} height={size} className={cn("shrink-0 rounded-lg border border-white/20 bg-white p-1", className)} />;
}
