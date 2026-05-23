import { useState, useRef, useEffect } from "react";

export function InfoTip({ metin }: { metin: string }) {
  const [acik, setAcik] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    const kapat = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("mousedown", kapat);
    document.addEventListener("touchstart", kapat);
    return () => {
      document.removeEventListener("mousedown", kapat);
      document.removeEventListener("touchstart", kapat);
    };
  }, [acik]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}>
      <button
        type="button"
        aria-label="Bilgi"
        onClick={() => setAcik((v) => !v)}
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "1px solid #cbd5e1",
          background: acik ? "#eff6ff" : "#f8fafc",
          color: "#64748b",
          fontSize: 10,
          fontWeight: 800,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          flexShrink: 0,
        }}
      >
        i
      </button>
      {acik && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "calc(100% + 6px)",
            zIndex: 50,
            minWidth: 200,
            maxWidth: 260,
            padding: "8px 10px",
            borderRadius: 10,
            background: "#1e293b",
            color: "#f8fafc",
            fontSize: 11,
            lineHeight: 1.45,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {metin}
        </div>
      )}
    </span>
  );
}
