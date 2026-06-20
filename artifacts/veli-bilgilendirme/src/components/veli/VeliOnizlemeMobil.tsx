import { useState, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FormData, SablonTuru } from "@/types";
import { VeliOnizlemeIcerik } from "./VeliOnizlemeIcerik";
import { VeliYanPanel } from "./VeliYanPanel";
import { VELI_POSTER_H, VELI_POSTER_W } from "@/lib/sablonlar/posterShell";

const POSTER_W = VELI_POSTER_W;
const POSTER_H = VELI_POSTER_H;

export function VeliOnizlemeMobil({
  form,
  sablon,
  zoom,
  wrapperRef,
  onSablonOner,
  paylasBtnlari = null,
}: {
  form: FormData;
  sablon: SablonTuru;
  zoom: number;
  wrapperRef: RefObject<HTMLDivElement | null>;
  onSablonOner: (id: SablonTuru) => void;
  paylasBtnlari?: React.ReactNode;
}) {
  const [detayAcik, setDetayAcik] = useState(false);
  const scaledW = Math.round(POSTER_W * zoom);
  const scaledH = Math.round(POSTER_H * zoom);

  return (
    <div
      className="flex flex-col gap-3 p-4 pb-6"
      style={{ background: "#e8edf2", overflowX: "hidden", maxWidth: "100%" }}
    >
      <div
        ref={wrapperRef}
        className="veli-mobile-preview-frame"
        style={{
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          overflowX: "hidden",
        }}
      >
        <div
          className="veli-studio-poster-wrap veli-mobile-preview-scaler"
          style={{
            width: scaledW,
            height: scaledH,
            flexShrink: 0,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            className="veli-preview-autofit__artboard"
            style={{
              width: POSTER_W,
              height: POSTER_H,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <VeliOnizlemeIcerik form={form} sablon={sablon} />
          </div>
        </div>
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
