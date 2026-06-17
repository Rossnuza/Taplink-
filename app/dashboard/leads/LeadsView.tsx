"use client";

import { useMemo, useState } from "react";
import { card, pageTitle } from "@/components/ui";
import Toast from "@/components/Toast";
import { initials, relativeTime } from "@/lib/format";
import type { Lead } from "@/lib/types";

export interface LeadRow extends Lead {
  assetTitle: string;
}

export default function LeadsView({ leads }: { leads: LeadRow[] }) {
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const docTitles = useMemo(
    () => Array.from(new Set(leads.map((l) => l.assetTitle).filter((t) => t !== "—"))),
    [leads],
  );

  const shown = useMemo(() => {
    if (filter === "all") return leads;
    if (filter === "week") {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return leads.filter((l) => new Date(l.created_at).getTime() >= weekAgo);
    }
    return leads.filter((l) => l.assetTitle === filter);
  }, [leads, filter]);

  async function exportCsv() {
    if (leads.length === 0) return;
    const header = ["email", "document", "source", "country", "device", "captured_at"];
    const rows = leads.map((l) => [
      l.email,
      l.assetTitle,
      l.source ?? "",
      l.country ?? "",
      l.device ?? "",
      l.created_at,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const filename = `taplink-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    const file = new File([csv], filename, { type: "text/csv" });

    // On mobile, the native share sheet lets you Save to Files, email, or
    // AirDrop the CSV — a plain download link just opens it in Safari.
    const nav = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean;
    };
    if (typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "TapLink leads",
          text: `${leads.length} leads from TapLink`,
        });
        setToast(`Shared ${leads.length} leads`);
        return;
      } catch (err) {
        // User dismissed the share sheet — not an error, just stop.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Anything else: fall through to the download path below.
      }
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    setToast(`Exported ${leads.length} leads`);
  }

  return (
    <div style={{ padding: "60px 18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={pageTitle}>Leads</div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={leads.length === 0}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            borderRadius: 999,
            border: "1px solid rgba(20,23,26,.12)",
            background: "#fff",
            fontSize: 13,
            fontWeight: 700,
            color: "#14171a",
            cursor: leads.length ? "pointer" : "default",
            opacity: leads.length ? 1 : 0.5,
          }}
        >
          ↓ Export
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        <Chip label={`All · ${leads.length}`} active={filter === "all"} onClick={() => setFilter("all")} />
        <Chip label="This week" active={filter === "week"} onClick={() => setFilter("week")} />
        {docTitles.map((t) => (
          <Chip key={t} label={t} active={filter === t} onClick={() => setFilter(t)} />
        ))}
      </div>

      {shown.length === 0 ? (
        <div style={{ ...card, padding: 22, textAlign: "center", color: "#9aa0a8", fontSize: 13.5 }}>
          {leads.length === 0
            ? "No leads captured yet. Share your QR and start meeting people."
            : "No leads match this filter."}
        </div>
      ) : (
        <div style={{ ...card, overflow: "hidden", padding: 0 }}>
          {shown.map((l, i) => (
            <div
              key={l.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderBottom: i < shown.length - 1 ? "1px solid rgba(20,23,26,.06)" : "none",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: "#e2f1ee",
                  color: "#0c5c54",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {initials(l.email)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {l.email}
                </div>
                <div style={{ fontSize: 12, color: "#9aa0a8", marginTop: 2 }}>
                  {[l.country, l.device, relativeTime(l.created_at)].filter(Boolean).join(" · ")}
                </div>
              </div>
              {l.assetTitle !== "—" && (
                <span
                  style={{
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: "#fbf0dd",
                    color: "#b5832a",
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {l.assetTitle}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        background: active ? "#14171a" : "#fff",
        border: active ? "none" : "1px solid rgba(20,23,26,.1)",
        color: active ? "#fff" : "#6b7280",
        fontSize: 12.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}
