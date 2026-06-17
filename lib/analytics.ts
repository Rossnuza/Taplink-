import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsEvent, Lead } from "@/lib/types";

export interface DashboardMetrics {
  scansThisWeek: number;
  scansLastWeek: number;
  scanChangePct: number | null;
  linkClicks: number;
  docOpens: number;
  newLeads: number;
  weeklyScans: number[]; // 7 buckets, oldest → newest
  topLinks: { label: string; count: number }[];
  recentLeads: Lead[];
}

const DAY = 24 * 60 * 60 * 1000;

// Computes everything the dashboard Home screen shows from the raw event and
// lead tables. Personal-scale, so we aggregate in JS rather than in SQL.
export async function getDashboardMetrics(
  client: SupabaseClient,
  profileId: string,
): Promise<DashboardMetrics> {
  const now = Date.now();
  const since = new Date(now - 14 * DAY).toISOString();

  const [{ data: eventRows }, { data: leadRows }] = await Promise.all([
    client
      .from("events")
      .select("*")
      .eq("profile_id", profileId)
      .gte("created_at", since),
    client
      .from("leads")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const events = (eventRows as AnalyticsEvent[]) ?? [];
  const leads = (leadRows as Lead[]) ?? [];

  const inWindow = (iso: string, startAgo: number, endAgo: number) => {
    const t = new Date(iso).getTime();
    return t >= now - startAgo * DAY && t < now - endAgo * DAY;
  };

  const scans = events.filter((e) => e.type === "scan");
  const scansThisWeek = scans.filter((e) => inWindow(e.created_at, 7, 0)).length;
  const scansLastWeek = scans.filter((e) => inWindow(e.created_at, 14, 7)).length;
  const scanChangePct =
    scansLastWeek === 0
      ? scansThisWeek > 0
        ? 100
        : null
      : Math.round(((scansThisWeek - scansLastWeek) / scansLastWeek) * 100);

  // 7-day bar chart, oldest → newest
  const weeklyScans = Array.from({ length: 7 }, (_, i) => {
    const dayEnd = now - (6 - i) * DAY;
    const dayStart = dayEnd - DAY;
    return scans.filter((e) => {
      const t = new Date(e.created_at).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
  });

  const weekEvents = events.filter((e) => inWindow(e.created_at, 7, 0));
  const linkClicks = weekEvents.filter((e) => e.type === "link_click").length;
  const docOpens = weekEvents.filter(
    (e) => e.type === "doc_open" || e.type === "doc_email",
  ).length;
  const newLeads = leads.filter((l) => inWindow(l.created_at, 7, 0)).length;

  return {
    scansThisWeek,
    scansLastWeek,
    scanChangePct,
    linkClicks,
    docOpens,
    newLeads,
    weeklyScans,
    topLinks: [],
    recentLeads: leads.slice(0, 3),
  };
}
