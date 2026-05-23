import type React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function FormAkordeon({
  id,
  baslik,
  acik,
  onToggle,
  children,
  zorunlu,
}: {
  id: string;
  baslik: string;
  acik: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  zorunlu?: boolean;
}) {
  return (
    <div style={{ ...cardStyle }}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>
          {acik ? "▼" : "▶"} {baslik}
        </span>
        {zorunlu && !acik && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309", background: "#fffbeb", padding: "2px 8px", borderRadius: 8 }}>
            Devam edin
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 20,
  padding: "14px 14px",
  border: "1px solid #e8edf2",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.06)",
};
