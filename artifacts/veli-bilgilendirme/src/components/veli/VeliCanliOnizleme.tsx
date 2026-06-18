import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FormData, SablonTuru } from "@/types";
import { VeliOnizlemeIcerik } from "./VeliOnizlemeIcerik";
import { VeliPreviewScaler } from "./VeliPreviewScaler";

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
  const stageRef = useRef<HTMLDivElement>(null);

  return (
    <div className="veli-live-preview-strip">
      <button type="button" onClick={() => setAcik((v) => !v)} className="veli-live-preview-strip__toggle">
        <span>Canlı afiş önizleme</span>
        <span>{acik ? "Gizle ▼" : "Göster ▲"}</span>
      </button>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="veli-live-preview-strip__panel"
          >
            <div className="veli-live-preview-strip__body">
              <div ref={stageRef} className="veli-live-preview-strip__stage">
                <VeliPreviewScaler observeRef={stageRef} deps={[form, sablon]}>
                  <VeliOnizlemeIcerik form={form} sablon={sablon} />
                </VeliPreviewScaler>
              </div>
              {onTasarimaGec ? (
                <button type="button" onClick={onTasarimaGec} className="veli-live-preview-strip__action">
                  Tam ekran
                </button>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
