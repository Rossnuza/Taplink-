import type { CSSProperties } from "react";

// Shared inline-style tokens for the Direction A "Classic Clean" dashboard.

export const pageWrap: CSSProperties = {
  padding: "60px 18px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

export const card: CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(20,23,26,.07)",
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(20,23,26,.04)",
};

export const sectionLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  color: "#9aa0a8",
};

export const pageTitle: CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: "-.02em",
  color: "#14171a",
};

export const fieldLabel: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: ".04em",
  textTransform: "uppercase",
  color: "#9aa0a8",
  marginBottom: 6,
};

export const input: CSSProperties = {
  width: "100%",
  background: "#fff",
  border: "1px solid rgba(20,23,26,.1)",
  borderRadius: 13,
  padding: "13px 15px",
  fontSize: 15,
  fontWeight: 600,
  color: "#14171a",
  outline: "none",
};
