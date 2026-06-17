import { createClient } from "@/lib/supabase/server";
import { getDashboardMetrics } from "@/lib/analytics";
import type { Lead, Profile } from "@/lib/types";
import { card, pageWrap, sectionLabel } from "@/components/ui";
import { initials, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();
  const profile = profileRow as Profile;

  const m = await getDashboardMetrics(supabase, profile.id);
  const maxBar = Math.max(1, ...m.weeklyScans);

  return (
    <div style={pageWrap}>
      {/* greeting */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={profile.display_name} url={profile.avatar_url} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.01em" }}>
            Hi, {profile.display_name?.split(" ")[0] || profile.handle}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#9aa0a8" }}>
            taplink.app/{profile.handle}
          </div>
        </div>
        {profile.is_live && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 999,
              background: "#e4f6ec",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#1e9e63",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "#1e9e63" }} />
            Live
          </span>
        )}
      </div>

      {/* hero stat */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={sectionLabel}>Scans this week</div>
          {m.scanChangePct !== null && (
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: m.scanChangePct >= 0 ? "#1e9e63" : "#c0463b",
              }}
            >
              {m.scanChangePct >= 0 ? "▲" : "▼"} {Math.abs(m.scanChangePct)}%
            </div>
          )}
        </div>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-.03em", marginTop: 4 }}>
          {m.scansThisWeek}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 40, marginTop: 10 }}>
          {m.weeklyScans.map((v, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(6, (v / maxBar) * 100)}%`,
                background: i >= 5 ? "#0c5c54" : "#dce0e5",
                borderRadius: 3,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, fontWeight: 600, color: "#c2c7ce", marginTop: 6 }}>
          <span>7 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* counters */}
      <div style={{ display: "flex", gap: 12 }}>
        <Stat value={m.linkClicks} label="Link clicks" />
        <Stat value={m.docOpens} label="Doc opens" />
        <Stat value={m.newLeads} label="New leads" accent />
      </div>

      {/* top links */}
      {m.topLinks.length > 0 && (
        <div style={{ ...card, padding: "16px 18px" }}>
          <div style={{ ...sectionLabel, marginBottom: 13 }}>Top links</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {m.topLinks.map((link) => {
              const max = Math.max(...m.topLinks.map((l) => l.count));
              return (
                <div key={link.label}>
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
                      {link.label}
                    </span>
                    <span style={{ color: "#9aa0a8" }}>{link.count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: "#eef0f3" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(8, (link.count / max) * 100)}%`,
                        borderRadius: 999,
                        background: "#0c5c54",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* recent leads */}
      <div style={{ ...card, padding: "16px 18px" }}>
        <div style={{ ...sectionLabel, marginBottom: 13 }}>Recent leads</div>
        {m.recentLeads.length === 0 ? (
          <div style={{ fontSize: 13.5, color: "#9aa0a8" }}>
            No leads yet. Share your QR to start capturing.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {m.recentLeads.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>

      <form action="/auth/signout" method="post" style={{ marginTop: 4 }}>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(20,23,26,.1)",
            background: "#fff",
            color: "#6b7280",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
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

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          background: "#e2f1ee",
          color: "#0c5c54",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12.5,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {initials(lead.email)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {lead.email}
        </div>
        <div style={{ fontSize: 12, color: "#9aa0a8", marginTop: 1 }}>
          {[lead.country, relativeTime(lead.created_at)].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        style={{ width: 44, height: 44, borderRadius: 999, objectFit: "cover" }}
      />
    );
  }
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        background: "linear-gradient(145deg,#243245,#4a5e7a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 15,
        fontWeight: 700,
      }}
    >
      {initials(name)}
    </div>
  );
}
