import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FormData, SablonTuru } from "@/types";
import { VeliOnizlemeIcerik } from "./VeliOnizlemeIcerik";

const POSTER_W = 520;

export function VeliCanliOnizleme({
  form,
  sablon,
  onTasarimaGec,
}: {
  form: FormData;
  sablon: SablonTuru;
  onTasarimaGec?: () => void;
}) {
  const [acik, setAcik] = useState(true);
  const scale = 0.22;

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 30,
        marginTop: 8,
        paddingTop: 4,
        background: "linear-gradient(180deg, transparent 0%, #f8fafc 24%)",
      }}
    >
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: acik ? "16px 16px 0 0" : 16,
          border: "1px solid #e2e8f0",
          borderBottom: acik ? "none" : undefined,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          cursor: "pointer",
          boxShadow: "0 -4px 20px rgba(15,23,42,0.08)",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, color: "#1e3a5f" }}>Canlı afiş önizleme</span>
        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{acik ? "Gizle ▼" : "Göster ▲"}</span>
      </button>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              borderTop: "none",
              borderRadius: "0 0 16px 16px",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                padding: "8px 12px 12px",
                display: "flex",
                gap: 10,
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: Math.round(POSTER_W * scale * 1.35),
                  overflow: "hidden",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}
              >
                <div
                  style={{
                    width: POSTER_W,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    pointerEvents: "none",
                  }}
                >
                  <VeliOnizlemeIcerik form={form} sablon={sablon} />
                </div>
              </div>
              {onTasarimaGec && (
                <button
                  type="button"
                  onClick={onTasarimaGec}
                  style={{
                    flexShrink: 0,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                  }}
                >
                  Tam ekran
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
