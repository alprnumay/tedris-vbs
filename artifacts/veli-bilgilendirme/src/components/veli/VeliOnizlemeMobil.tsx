import { useState, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FormData, SablonTuru } from "@/types";
import { VeliOnizlemeIcerik } from "./VeliOnizlemeIcerik";
import { VeliYanPanel } from "./VeliYanPanel";

const POSTER_W = 520;

export function VeliOnizlemeMobil({
  form,
  sablon,
  zoom,
  wrapperRef,
  onSablonOner,
  paylasBtnlari,
}: {
  form: FormData;
  sablon: SablonTuru;
  zoom: number;
  wrapperRef: RefObject<HTMLDivElement | null>;
  onSablonOner: (id: SablonTuru) => void;
  paylasBtnlari: React.ReactNode;
}) {
  const [detayAcik, setDetayAcik] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-4 pb-6" style={{ background: "#e8edf2" }}>
      <div
        ref={wrapperRef}
        style={{
          width: "100%",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(15,23,42,0.18)",
        }}
      >
        <div style={{ zoom } as React.CSSProperties}>
          <div style={{ width: POSTER_W }}>
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
