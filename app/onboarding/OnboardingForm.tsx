"use client";

import { useActionState, useState } from "react";
import { claimHandle, type OnboardingResult } from "./actions";

export default function OnboardingForm({ email }: { email: string }) {
  const [handle, setHandle] = useState("");
  const [state, action, pending] = useActionState<OnboardingResult, FormData>(
    claimHandle,
    {},
  );

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        background: "#fff",
      }}
    >
      <form
        action={action}
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "72px 26px 40px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: "#0c5c54" }} />
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".02em" }}>
            TapLink
          </span>
        </div>

        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15 }}>
            Claim your TapLink
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.5, color: "#6b7280", marginTop: 10 }}>
            Pick the handle people see when they scan. You can change everything
            else later.
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <Label>Your name</Label>
          <input
            name="display_name"
            placeholder="Ross Calder"
            style={inputStyle}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Label>Your link</Label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#f4f5f7",
              border: "1.5px solid #0c5c54",
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: "#9aa0a8" }}>
              taplink.app/
            </span>
            <input
              name="handle"
              value={handle}
              onChange={(e) =>
                setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="ross"
              autoFocus
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 15,
                fontWeight: 800,
                color: "#14171a",
                flex: 1,
                marginLeft: 1,
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <Label>Email</Label>
          <div
            style={{
              background: "#f4f5f7",
              border: "1px solid rgba(20,23,26,.1)",
              borderRadius: 14,
              padding: "14px 16px",
              fontSize: 15,
              fontWeight: 600,
              color: "#14171a",
            }}
          >
            {email}
          </div>
        </div>

        {state.error && (
          <div style={{ fontSize: 13, color: "#e0584f", marginTop: 14, fontWeight: 600 }}>
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{
            marginTop: 32,
            padding: 17,
            borderRadius: 15,
            border: "none",
            background: "#14171a",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(20,23,26,.22)",
          }}
        >
          {pending ? "Creating…" : "Create my TapLink"}
        </button>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "#9aa0a8", marginTop: 14 }}>
          No card needed · free while in beta
        </div>
      </form>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: ".04em",
        textTransform: "uppercase",
        color: "#9aa0a8",
        marginBottom: 7,
      }}
    >
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#f4f5f7",
  border: "1px solid rgba(20,23,26,.1)",
  borderRadius: 14,
  padding: "14px 16px",
  fontSize: 15,
  fontWeight: 600,
  color: "#14171a",
  outline: "none",
};
