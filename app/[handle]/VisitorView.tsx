"use client";

import { useState } from "react";
import type { BlockType } from "@/lib/types";

export interface VisitorButton {
  id: string;
  type: BlockType;
  label: string;
  url?: string;
  asset?: {
    id: string;
    title: string;
    fileSizeMb: number;
    requireEmail: boolean;
  };
}

interface Props {
  handle: string;
  displayName: string;
  title: string | null;
  bio: string | null;
  company: string | null;
  avatarUrl: string | null;
  brandColor: string;
  buttons: VisitorButton[];
  source: string | null;
}

type SheetState = null | "options" | "email" | "sent";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "·";
}

export default function VisitorView(props: Props) {
  const {
    handle,
    displayName,
    title,
    bio,
    company,
    avatarUrl,
    brandColor,
    buttons,
    source,
  } = props;

  const [sheet, setSheet] = useState<SheetState>(null);
  const [activeAsset, setActiveAsset] = useState<VisitorButton["asset"] | null>(
    null,
  );
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    window.clearTimeout((flash as { _t?: number })._t);
    (flash as { _t?: number })._t = window.setTimeout(
      () => setToast(null),
      2600,
    );
  }

  function track(type: string, blockId?: string, assetId?: string) {
    const body = JSON.stringify({ handle, type, blockId, assetId, source });
    // sendBeacon survives the page being backgrounded when a link opens.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      fetch("/api/track", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  }

  function handleClick(b: VisitorButton) {
    if (b.type === "document" && b.asset) {
      setActiveAsset(b.asset);
      setEmail("");
      setEmailErr("");
      setSheet(b.asset.requireEmail ? "email" : "options");
      return;
    }
    if (b.type === "contact") {
      flash("Saving contact…");
      window.location.href = `/api/vcard/${handle}`;
      return;
    }
    if (b.url) {
      track("link_click", b.id);
      flash("Opening…");
      window.open(b.url, "_blank", "noopener,noreferrer");
    }
  }

  function chooseView() {
    if (!activeAsset) return;
    setSheet(null);
    flash("Opening document…");
    window.open(`/api/doc/${activeAsset.id}`, "_blank", "noopener,noreferrer");
  }

  async function submitEmail() {
    if (!activeAsset) return;
    const value = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setEmailErr("Enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      await fetch("/api/doc/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          assetId: activeAsset.id,
          email: value,
          source,
        }),
      });
      setSheet("sent");
    } catch {
      setEmailErr("Something went wrong. Try again.");
    } finally {
      setSending(false);
    }
  }

  function closeSheet() {
    setSheet(null);
    setActiveAsset(null);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#fff",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          position: "relative",
          padding: "56px 22px 40px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* brand pill */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 13px",
              borderRadius: 999,
              border: "1px solid rgba(20,23,26,.1)",
            }}
          >
            {company && (
              <>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: ".04em",
                    color: brandColor,
                  }}
                >
                  {company}
                </span>
                <span
                  style={{
                    width: 1,
                    height: 12,
                    background: "rgba(20,23,26,.14)",
                  }}
                />
              </>
            )}
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "#9aa0a8" }}>
              taplink.app/{handle}
            </span>
          </div>
        </div>

        {/* identity */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Avatar name={displayName} url={avatarUrl} brandColor={brandColor} />
          <div
            style={{
              fontSize: 23,
              fontWeight: 800,
              letterSpacing: "-.02em",
              color: "#14171a",
              marginTop: 16,
            }}
          >
            {displayName}
          </div>
          {title && (
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 600,
                color: brandColor,
                marginTop: 4,
              }}
            >
              {title}
            </div>
          )}
          {bio && (
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: "#6b7280",
                marginTop: 12,
                maxWidth: 320,
              }}
            >
              {bio}
            </div>
          )}
        </div>

        {/* buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 30,
          }}
        >
          {buttons.map((b) => (
            <Button key={b.id} b={b} brandColor={brandColor} onClick={handleClick} />
          ))}
          {buttons.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#9aa0a8",
                fontSize: 14,
                padding: "24px 0",
              }}
            >
              No links yet.
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 26,
            textAlign: "center",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: ".04em",
            color: "#c2c7ce",
          }}
        >
          Powered by TapLink
        </div>

        {sheet && activeAsset && (
          <DocumentSheet
            asset={activeAsset}
            state={sheet}
            email={email}
            emailErr={emailErr}
            sending={sending}
            ownerName={displayName}
            onClose={closeSheet}
            onView={chooseView}
            onToEmail={() => setSheet("email")}
            onBackToOptions={() => setSheet("options")}
            onEmailChange={(v) => {
              setEmail(v);
              setEmailErr("");
            }}
            onSubmit={submitEmail}
            onDone={closeSheet}
          />
        )}

        {toast && <Toast msg={toast} />}
      </div>
    </div>
  );
}

function Avatar({
  name,
  url,
  brandColor,
}: {
  name: string;
  url: string | null;
  brandColor: string;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        style={{
          width: 98,
          height: 98,
          borderRadius: 999,
          objectFit: "cover",
          border: "3px solid #fff",
          boxShadow: "0 8px 22px rgba(36,50,69,.28)",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 98,
        height: 98,
        borderRadius: 999,
        background: `linear-gradient(145deg, ${brandColor}, #4a5e7a)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 32,
        fontWeight: 700,
        boxShadow: "0 8px 22px rgba(36,50,69,.28)",
        border: "3px solid #fff",
      }}
    >
      {initials(name)}
    </div>
  );
}

function Button({
  b,
  brandColor,
  onClick,
}: {
  b: VisitorButton;
  brandColor: string;
  onClick: (b: VisitorButton) => void;
}) {
  const isDoc = b.type === "document";
  if (isDoc) {
    return (
      <div
        role="button"
        onClick={() => onClick(b)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "17px 18px",
          borderRadius: 16,
          background: "#14171a",
          cursor: "pointer",
          boxShadow: "0 10px 24px rgba(20,23,26,.22)",
        }}
      >
        <Icon type={b.type} color="#c8a86a" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: "#fff" }}>
            {b.label}
          </div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: "rgba(255,255,255,.6)",
              marginTop: 1,
            }}
          >
            {b.asset?.requireEmail
              ? "PDF · email required"
              : "PDF · view now, or email it to you"}
          </div>
        </div>
        <Chevron color="rgba(255,255,255,.4)" />
      </div>
    );
  }
  return (
    <div
      role="button"
      onClick={() => onClick(b)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        border: "1px solid rgba(20,23,26,.1)",
        borderRadius: 16,
        background: "#fff",
        cursor: "pointer",
      }}
    >
      <Icon type={b.type} color={iconColor(b.type, brandColor)} />
      <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: "#14171a" }}>
        {b.label}
      </div>
      <Chevron color="#c2c7ce" />
    </div>
  );
}

function iconColor(type: BlockType, brandColor: string): string {
  if (type === "linkedin") return "#1b66c9";
  if (type === "contact") return "#14171a";
  return brandColor;
}

function DocumentSheet(props: {
  asset: NonNullable<VisitorButton["asset"]>;
  state: Exclude<SheetState, null>;
  email: string;
  emailErr: string;
  sending: boolean;
  ownerName: string;
  onClose: () => void;
  onView: () => void;
  onToEmail: () => void;
  onBackToOptions: () => void;
  onEmailChange: (v: string) => void;
  onSubmit: () => void;
  onDone: () => void;
}) {
  const { asset, state } = props;
  return (
    <div
      onClick={props.onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(8,9,11,.45)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "fadeIn .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "14px 22px 30px",
          animation: "sheetUp .3s cubic-bezier(.2,.85,.25,1)",
          boxShadow: "0 -8px 40px rgba(0,0,0,.2)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 5,
            borderRadius: 999,
            background: "rgba(20,23,26,.16)",
            margin: "0 auto 18px",
          }}
        />

        {state === "options" && (
          <>
            <DocHead asset={asset} />
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: ".04em",
                textTransform: "uppercase",
                color: "rgba(20,23,26,.55)",
                marginBottom: 11,
              }}
            >
              How would you like it?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <BigBtn
                label="View in browser"
                sub="Opens the PDF right now"
                primary
                onClick={props.onView}
              />
              <BigBtn
                label="Email it to me instead"
                sub="We'll send it to your inbox"
                onClick={props.onToEmail}
              />
            </div>
            <p style={center}>No app or sign-up needed.</p>
          </>
        )}

        {state === "email" && (
          <>
            <div
              onClick={props.onBackToOptions}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                color: "rgba(20,23,26,.55)",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              ‹ Back
            </div>
            <div
              style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.01em" }}
            >
              Where should we send it?
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(20,23,26,.55)",
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              Enter your email and {asset.title} lands in your inbox in seconds.
            </div>
            <input
              type="email"
              value={props.email}
              placeholder="you@company.com"
              autoFocus
              onChange={(e) => props.onEmailChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") props.onSubmit();
              }}
              style={{
                width: "100%",
                height: 54,
                borderRadius: 14,
                border: `1px solid ${props.emailErr ? "#e0584f" : "rgba(20,23,26,.1)"}`,
                background: "#f3f4f6",
                padding: "0 16px",
                fontSize: 16,
                color: "#14171a",
                outline: "none",
                marginTop: 18,
              }}
            />
            {props.emailErr && (
              <div
                style={{
                  fontSize: 13,
                  color: "#e0584f",
                  marginTop: 8,
                  fontWeight: 600,
                }}
              >
                {props.emailErr}
              </div>
            )}
            <BigBtn
              label={props.sending ? "Sending…" : "Send it to me"}
              primary
              onClick={props.onSubmit}
              style={{ marginTop: 12 }}
            />
            <p style={center}>🔒 Used only to send this document.</p>
          </>
        )}

        {state === "sent" && (
          <div style={{ textAlign: "center", paddingTop: 6 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                background: "#e4f6ec",
                color: "#1e9e63",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                fontSize: 30,
              }}
            >
              ✓
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.01em" }}>
              On its way ✉️
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(20,23,26,.55)",
                marginTop: 8,
                lineHeight: 1.55,
                padding: "0 8px",
              }}
            >
              We&apos;ve emailed {asset.title} to{" "}
              <span style={{ color: "#14171a", fontWeight: 700 }}>
                {props.email}
              </span>
              .
            </div>
            <BigBtn
              label="Done"
              primary
              onClick={props.onDone}
              style={{ marginTop: 22 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const center: React.CSSProperties = {
  fontSize: 12.5,
  color: "rgba(20,23,26,.55)",
  textAlign: "center",
  marginTop: 16,
};

function DocHead({ asset }: { asset: NonNullable<VisitorButton["asset"]> }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 20 }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 13,
          background: "#fbf0dd",
          color: "#b5832a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon type="document" color="#b5832a" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 700 }}>{asset.title}</div>
        <div
          style={{ fontSize: 13, color: "rgba(20,23,26,.55)", marginTop: 2 }}
        >
          PDF · {asset.fileSizeMb.toFixed(1)} MB
        </div>
      </div>
    </div>
  );
}

function BigBtn({
  label,
  sub,
  primary,
  onClick,
  style,
}: {
  label: string;
  sub?: string;
  primary?: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      role="button"
      onClick={onClick}
      style={{
        height: sub ? 62 : 54,
        borderRadius: 15,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        cursor: "pointer",
        background: primary ? "#14171a" : "transparent",
        color: primary ? "#fff" : "#14171a",
        border: primary ? "none" : "1px solid rgba(20,23,26,.1)",
        ...style,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700 }}>{label}</div>
      {sub && (
        <div style={{ fontSize: 12.5, fontWeight: 500, opacity: 0.72 }}>{sub}</div>
      )}
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 46,
        zIndex: 120,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 300,
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
        {msg}
      </div>
    </div>
  );
}

function Chevron({ color }: { color: string }) {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
      <path
        d="M1 1l6 6-6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Icon({ type, color }: { type: BlockType; color: string }) {
  const common = { width: 22, height: 22 };
  if (type === "linkedin") {
    return (
      <svg {...common} viewBox="0 0 24 24" fill={color}>
        <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.3c0-1.26-.02-2.9-1.77-2.9-1.78 0-2.05 1.38-2.05 2.8V21h-4z" />
      </svg>
    );
  }
  if (type === "contact") {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5.5 20c0-3.4 2.9-5.6 6.5-5.6s6.5 2.2 6.5 5.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "document") {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
        <path d="M14 3v5h5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "calendar") {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    );
  }
  // website / custom
  return (
    <svg {...common} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18" />
    </svg>
  );
}
