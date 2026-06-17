"use client";

import { useState } from "react";
import { card, pageTitle, sectionLabel } from "@/components/ui";
import Toast from "@/components/Toast";

export default function SharePanel({
  handle,
  company,
  url,
  qrDataUrl,
}: {
  handle: string;
  company: string | null;
  url: string;
  qrDataUrl: string;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [campaign, setCampaign] = useState("");

  const shareUrl = campaign.trim()
    ? `${url}?source=${encodeURIComponent(campaign.trim())}`
    : url;

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} copied ✓`);
    } catch {
      setToast("Couldn't copy");
    }
  }

  function download() {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `taplink-${handle}.png`;
    a.click();
    setToast("QR downloaded ✓");
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My TapLink", url: shareUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      copy(shareUrl, "Link");
    }
  }

  return (
    <div style={{ padding: "60px 18px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={pageTitle}>Share</div>

      {/* QR card */}
      <div style={{ ...card, padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            padding: 16,
            borderRadius: 18,
            background: "#fff",
            border: "1px solid rgba(20,23,26,.08)",
            boxShadow: "0 6px 20px rgba(20,23,26,.06)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Your QR code" width={188} height={188} style={{ display: "block" }} />
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            marginTop: 16,
            padding: "7px 14px",
            borderRadius: 999,
            background: "#f4f5f7",
          }}
        >
          {company && (
            <>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#0c5c54" }}>{company}</span>
              <span style={{ width: 1, height: 12, background: "rgba(20,23,26,.14)" }} />
            </>
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: "#46505c" }}>
            taplink.app/{handle}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 18 }}>
          <button type="button" onClick={download} style={primaryBtn}>
            Download QR
          </button>
          <button type="button" onClick={nativeShare} style={outlineBtn}>
            Share
          </button>
        </div>
      </div>

      {/* NFC URL */}
      <div style={{ ...card, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "#eaf4f1",
              color: "#0c5c54",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ((•))
          </div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>NFC badge URL</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f4f5f7", borderRadius: 12, padding: "11px 14px" }}>
          <div
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: 600,
              color: "#46505c",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {url}
          </div>
          <button type="button" onClick={() => copy(url, "NFC URL")} style={copyBtn}>
            Copy
          </button>
        </div>
        <div style={{ fontSize: 12, color: "#9aa0a8", marginTop: 9, lineHeight: 1.45 }}>
          Program this into your NFC badge. The URL never changes — swap docs anytime.
        </div>
      </div>

      {/* campaign tag */}
      <div style={{ ...card, padding: "16px 18px" }}>
        <div style={{ ...sectionLabel, marginBottom: 11 }}>
          Campaign tag{" "}
          <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 600, color: "#c2c7ce" }}>
            · optional
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f4f5f7", borderRadius: 12, padding: "11px 14px" }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "#9aa0a8" }}>?source=</span>
          <input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value.replace(/\s+/g, "-").toLowerCase())}
            placeholder="eu-business-week"
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13.5, fontWeight: 700, color: "#14171a" }}
          />
        </div>
        <div style={{ fontSize: 12, color: "#9aa0a8", marginTop: 9, lineHeight: 1.45 }}>
          Add a tag to compare events, conferences and meetings in your analytics.
        </div>
        {campaign.trim() && (
          <button
            type="button"
            onClick={() => copy(shareUrl, "Tagged link")}
            style={{ ...outlineBtn, marginTop: 12, flex: "none", width: "100%" }}
          >
            Copy tagged link
          </button>
        )}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  flex: 1,
  padding: 13,
  borderRadius: 13,
  background: "#14171a",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
};
const outlineBtn: React.CSSProperties = {
  flex: 1,
  padding: 13,
  borderRadius: 13,
  border: "1px solid rgba(20,23,26,.12)",
  background: "#fff",
  color: "#14171a",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};
const copyBtn: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "#0c5c54",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
  flexShrink: 0,
};
