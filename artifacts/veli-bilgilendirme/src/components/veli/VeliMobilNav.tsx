import type React from "react";
import { motion } from "framer-motion";

type Sekme = "form" | "onizleme" | "yonetim";

const SEKMELER: { id: Sekme; label: string; icon: (aktif: boolean) => React.ReactNode }[] = [
  {
    id: "form",
    label: "Form",
    icon: (aktif) => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={aktif ? 2.5 : 1.5}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  {
    id: "onizleme",
    label: "Afiş",
    icon: (aktif) => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={aktif ? 2.5 : 1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

export function VeliMobilNav({
  aktifSekme,
  onSekme,
  adminGoster,
  onDestek,
}: {
  aktifSekme: Sekme;
  onSekme: (s: Sekme) => void;
  adminGoster?: boolean;
  onDestek: () => void;
}) {
  return (
    <nav
      className="lg:hidden flex-shrink-0 px-3 pt-2"
      style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 4,
          padding: "6px 8px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(226,232,240,0.9)",
          boxShadow: "0 -2px 24px rgba(15,23,42,0.1), 0 4px 16px rgba(15,23,42,0.06)",
        }}
      >
        {SEKMELER.map(({ id, label, icon }) => {
          const aktif = aktifSekme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSekme(id)}
              style={{
                flex: 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "10px 4px",
                borderRadius: 14,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: aktif ? "#1d4ed8" : "#94a3b8",
                transition: "color 0.2s",
              }}
            >
              {aktif && (
                <motion.div
                  layoutId="veli-nav-pill"
                  style={{
                    position: "absolute",
                    inset: 2,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(30,58,95,0.08))",
                    boxShadow: "0 0 20px rgba(37,99,235,0.15)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.span
                style={{ position: "relative", zIndex: 1, display: "flex" }}
                animate={{ scale: aktif ? 1.08 : 1 }}
                transition={{ duration: 0.15 }}
              >
                {icon(aktif)}
              </motion.span>
              <span
                style={{
                  position: "relative",
                  zIndex: 1,
                  fontSize: 11,
                  fontWeight: aktif ? 800 : 600,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}

        {adminGoster && (
          <button
            type="button"
            onClick={() => onSekme("yonetim")}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "10px 4px",
              borderRadius: 14,
              border: "none",
              background: aktifSekme === "yonetim" ? "rgba(124,58,237,0.12)" : "transparent",
              cursor: "pointer",
              color: aktifSekme === "yonetim" ? "#7c3aed" : "#94a3b8",
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={aktifSekme === "yonetim" ? 2.5 : 1.5}
                d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"
              />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600 }}>Yönetim</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDestek}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "10px 4px",
            borderRadius: 14,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#94a3b8",
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600 }}>Destek</span>
        </button>
      </div>
    </nav>
  );
}
