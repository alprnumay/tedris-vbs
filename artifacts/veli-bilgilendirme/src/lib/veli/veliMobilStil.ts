import type React from "react";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: "10px 12px",
  fontSize: 14,
  background: "#ffffff",
  color: "#1e293b",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

export const labelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 11,
  fontWeight: 700,
  color: "#475569",
  marginBottom: 5,
  letterSpacing: "0.03em",
};

export const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 20,
  padding: "14px 14px",
  border: "1px solid #e8edf2",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.06)",
};

export const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 16,
  fontSize: 15,
  fontWeight: 700,
  border: "none",
  background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  boxShadow: "0 8px 24px rgba(37, 99, 235, 0.35)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

export const secondaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 14,
  fontSize: 13,
  fontWeight: 700,
  border: "1.5px solid #e2e8f0",
  background: "#fff",
  color: "#475569",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  transition: "transform 0.12s ease",
};
