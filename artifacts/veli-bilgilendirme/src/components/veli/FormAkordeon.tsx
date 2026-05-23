import type React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function FormAkordeon({
  id,
  baslik,
  aciklama,
  acik,
  onToggle,
  children,
  zorunlu,
}: {
  id: string;
  baslik: string;
  aciklama?: string;
  acik: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  zorunlu?: boolean;
}) {
  return (
    <div className={`veli-form-accordion${acik ? " veli-form-accordion--open" : ""}`}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="veli-form-accordion__trigger"
      >
        <span className="veli-form-accordion__head">
          <span className="veli-form-accordion__title">
            {acik ? "▼" : "▶"} {baslik}
          </span>
          {aciklama ? <span className="veli-form-accordion__desc">{aciklama}</span> : null}
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
