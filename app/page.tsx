import Link from "next/link";

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#fff",
      }}
    >
      <div style={{ width: "100%", maxWidth: 540, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: "#0c5c54" }} />
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: ".02em" }}>TapLink</span>
        </div>

        <h1
          style={{
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: "-.03em",
            lineHeight: 1.1,
            marginTop: 28,
          }}
        >
          Your scannable card, with a pixel built in.
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            color: "#6b7280",
            marginTop: 16,
            maxWidth: 460,
            marginInline: "auto",
          }}
        >
          One QR. A clean profile, your documents, instant lead capture — and a
          dashboard that tracks every scan, tap and email like a Facebook pixel
          for real-world networking.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
          <Link
            href="/login"
            style={{
              padding: "15px 26px",
              borderRadius: 14,
              background: "#14171a",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 10px 24px rgba(20,23,26,.22)",
            }}
          >
            Get started
          </Link>
          <Link
            href="/dashboard"
            style={{
              padding: "15px 26px",
              borderRadius: 14,
              border: "1px solid rgba(20,23,26,.12)",
              color: "#14171a",
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
