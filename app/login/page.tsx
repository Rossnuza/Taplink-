"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const configured = isSupabaseConfigured();

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    const supabase = createClient();
    const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirect },
    });
    if (error) {
      console.error("signInWithOtp failed:", error);
      const raw = error.message?.trim();
      const friendly =
        !raw || raw === "{}" || raw.startsWith("{")
          ? "Couldn't send the link right now. Please try again in a moment."
          : raw;
      setStatus("error");
      setMessage(friendly);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f4f5f7",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#fff",
          border: "1px solid rgba(20,23,26,.07)",
          borderRadius: 22,
          padding: 32,
          boxShadow: "0 1px 2px rgba(20,23,26,.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: "#0c5c54",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: ".02em" }}>
            TapLink
          </span>
        </div>

        {!configured ? (
          <p style={{ marginTop: 24, fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
            Backend not configured yet. Add your Supabase keys to{" "}
            <code>.env.local</code> and restart to enable sign-in.
          </p>
        ) : status === "sent" ? (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.01em" }}>
              Check your inbox ✉️
            </div>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8, lineHeight: 1.6 }}>
              We sent a sign-in link to{" "}
              <strong style={{ color: "#14171a" }}>{email}</strong>. Open it on
              this device to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={send} style={{ marginTop: 24 }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>
              Sign in
            </div>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>
              We&apos;ll email you a magic link — no password needed.
            </p>
            <input
              type="email"
              value={email}
              placeholder="you@company.com"
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus("idle");
              }}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 14,
                border: `1px solid ${status === "error" ? "#e0584f" : "rgba(20,23,26,.12)"}`,
                background: "#f4f5f7",
                padding: "0 16px",
                fontSize: 16,
                marginTop: 20,
                outline: "none",
              }}
            />
            {status === "error" && (
              <div style={{ fontSize: 13, color: "#e0584f", marginTop: 8, fontWeight: 600 }}>
                {message}
              </div>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                width: "100%",
                height: 52,
                marginTop: 14,
                borderRadius: 14,
                border: "none",
                background: "#14171a",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {status === "sending" ? "Sending…" : "Email me a link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
