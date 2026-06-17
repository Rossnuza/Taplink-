"use client";

import { useEffect } from "react";

export default function Toast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [message, onDone]);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 100,
        zIndex: 200,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 320,
          fontSize: 14,
          fontWeight: 600,
          color: "#fff",
          background: "rgba(20,22,26,.94)",
          padding: "12px 18px",
          borderRadius: 999,
          boxShadow: "0 8px 24px rgba(0,0,0,.28)",
          animation: "toastIn .25s ease",
        }}
      >
        {message}
      </div>
    </div>
  );
}
