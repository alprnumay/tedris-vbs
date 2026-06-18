import { useState, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FormData, SablonTuru } from "@/types";
import { VeliOnizlemeIcerik } from "./VeliOnizlemeIcerik";
import { VeliYanPanel } from "./VeliYanPanel";
import { VeliPreviewScaler } from "./VeliPreviewScaler";

export function VeliOnizlemeMobil({
  form,
  sablon,
  wrapperRef,
  onSablonOner,
  paylasBtnlari = null,
  compact = false,
}: {
  form: FormData;
  sablon: SablonTuru;
  wrapperRef: RefObject<HTMLDivElement | null>;
  onSablonOner: (id: SablonTuru) => void;
  paylasBtnlari?: React.ReactNode;
  /** Form adımlarında daha düşük önizleme yüksekliği. */
  compact?: boolean;
}) {
  const [detayAcik, setDetayAcik] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-4 pb-6" style={{ background: "#e8edf2" }}>
      <div
        ref={wrapperRef}
        className={`veli-mobile-preview-stage${compact ? " veli-mobile-preview-stage--compact" : ""}`}
      >
        <VeliPreviewScaler observeRef={wrapperRef} deps={[form, sablon]}>
          <VeliOnizlemeIcerik form={form} sablon={sablon} />
        </VeliPreviewScaler>
      </div>

      {paylasBtnlari}

      <button
        type="button"
        onClick={() => setDetayAcik((v) => !v)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          background: "rgba(255,255,255,0.9)",
          fontSize: 13,
          fontWeight: 700,
          color: "#475569",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Kalite kontrol ve paylaşım metni
        <span style={{ fontSize: 11, color: "#94a3b8" }}>{detayAcik ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence initial={false}>
        {detayAcik && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <VeliYanPanel form={form} seciliSablon={sablon} onSablonOner={onSablonOner} kompakt />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
