import Link from "next/link";

export default function HandleNotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#fff",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 360 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.01em" }}>
          This TapLink isn&apos;t live
        </h1>
        <p style={{ fontSize: 14.5, color: "#6b7280", marginTop: 8, lineHeight: 1.5 }}>
          The page you scanned doesn&apos;t exist or has been turned off.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: 20,
            padding: "12px 22px",
            borderRadius: 12,
            background: "#14171a",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          About TapLink
        </Link>
      </div>
    </div>
  );
}
