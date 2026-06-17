import { card, pageTitle, sectionLabel } from "@/components/ui";
import type { AnalyticsBreakdown, Breakdown } from "@/lib/analytics";

export default function AnalyticsView({
  breakdown,
}: {
  breakdown: AnalyticsBreakdown;
}) {
  const { daily } = breakdown;
  const maxDay = Math.max(1, ...daily.map((d) => d.count));
  const empty = breakdown.totalEvents === 0;

  return (
    <div style={{ padding: "60px 18px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={pageTitle}>Analytics</div>
      <div style={{ fontSize: 12.5, color: "#9aa0a8", marginTop: -8 }}>
        Last {breakdown.rangeDays} days
      </div>

      {empty ? (
        <div style={{ ...card, padding: 22, textAlign: "center", color: "#9aa0a8", fontSize: 13.5 }}>
          No activity yet. Once people scan your QR, you&apos;ll see where they
          are, what they use, and what they tap here.
        </div>
      ) : (
        <>
          {/* totals */}
          <div style={{ display: "flex", gap: 12 }}>
            <Stat value={breakdown.totalEvents} label="Total events" accent />
            <Stat value={breakdown.totalScans} label="Page scans" />
          </div>

          {/* activity over time */}
          <div style={{ ...card, padding: "16px 18px" }}>
            <div style={{ ...sectionLabel, marginBottom: 13 }}>
              Activity over time
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
                height: 64,
              }}
            >
              {daily.map((d, i) => (
                <div
                  key={i}
                  title={`${d.date}: ${d.count}`}
                  style={{
                    flex: 1,
                    height: `${Math.max(3, (d.count / maxDay) * 100)}%`,
                    background: d.count > 0 ? "#0c5c54" : "#e7e9ed",
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10.5,
                fontWeight: 600,
                color: "#c2c7ce",
                marginTop: 6,
              }}
            >
              <span>{breakdown.rangeDays} days ago</span>
              <span>Today</span>
            </div>
          </div>

          <BreakdownCard title="By event" rows={breakdown.byType} />
          <BreakdownCard title="By country" rows={breakdown.byCountry} />
          <BreakdownCard title="By device" rows={breakdown.byDevice} />
          <BreakdownCard title="By browser" rows={breakdown.byBrowser} />
          <BreakdownCard title="By campaign source" rows={breakdown.bySource} />
        </>
      )}
    </div>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div style={{ ...card, flex: 1, padding: 15 }}>
      <div
        style={{
          fontSize: 27,
          fontWeight: 800,
          letterSpacing: "-.02em",
          color: accent ? "#0c5c54" : "#14171a",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#9aa0a8", marginTop: 1 }}>
        {label}
      </div>
    </div>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: Breakdown[] }) {
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return (
    <div style={{ ...card, padding: "16px 18px" }}>
      <div style={{ ...sectionLabel, marginBottom: 13 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {rows.slice(0, 8).map((r) => (
          <div key={r.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13.5,
                fontWeight: 700,
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 220,
                }}
              >
                {r.label}
              </span>
              <span style={{ color: "#9aa0a8" }}>{r.count}</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "#eef0f3" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(6, (r.count / total) * 100)}%`,
                  borderRadius: 999,
                  background: "#0c5c54",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
