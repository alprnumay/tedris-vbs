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
  ozet,
  durum,
}: {
  id: string;
  baslik: string;
  aciklama?: string;
  acik: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  zorunlu?: boolean;
  ozet?: string;
  durum?: { tip: "eksik" | "dikkat" | "tamam"; metin: string };
}) {
  return (
    <div className={`veli-form-accordion${acik ? " veli-form-accordion--open" : ""}${durum ? ` veli-form-accordion--${durum.tip}` : ""}`}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="veli-form-accordion__trigger"
      >
        <span className="veli-form-accordion__head">
          <span className="veli-form-accordion__title">
            {acik ? "▼" : "▶"} {baslik}
          </span>
          {acik ? (
            aciklama ? <span className="veli-form-accordion__desc">{aciklama}</span> : null
          ) : (
            <span className="veli-form-accordion__desc">{ozet || aciklama || "Düzenlemek için açın."}</span>
          )}
        </span>
        <span className={`veli-form-accordion__status veli-form-accordion__status--${durum?.tip ?? "dikkat"}`}>
          {durum?.metin ?? (zorunlu && !acik ? "Devam edin" : "Düzenle")}
        </span>
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
