"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Signing you in…");

  useEffect(() => {
    async function handle() {
      const supabase = createClient();
      const next = searchParams.get("next") ?? "/dashboard";

      try {
        // Magic links from admin.generateLink use implicit flow:
        // tokens arrive in the URL hash (never sent to the server).
        const hash = window.location.hash.slice(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        // PKCE flow: code arrives as a query param (future use).
        const code = searchParams.get("code");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          throw new Error("No auth token found in URL.");
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Session not established.");

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        router.replace(profile ? next : "/onboarding");
      } catch (err) {
        console.error("Auth callback error:", err);
        setStatus("Sign-in failed — redirecting back to login…");
        setTimeout(() => router.replace("/login?error=auth"), 1500);
      }
    }

    handle();
  }, [router, searchParams]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f5f7",
        fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: "3px solid #0c5c54",
            borderTopColor: "transparent",
            margin: "0 auto 16px",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <div style={{ fontSize: 15, fontWeight: 600, color: "#46505c" }}>
          {status}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
