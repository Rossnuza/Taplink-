import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsEvent, Lead, LinkBlock } from "@/lib/types";

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

export interface Breakdown {
  label: string;
  count: number;
}

export interface AnalyticsBreakdown {
  totalEvents: number;
  totalScans: number;
  rangeDays: number;
  byCountry: Breakdown[];
  byDevice: Breakdown[];
  byBrowser: Breakdown[];
  bySource: Breakdown[];
  byType: Breakdown[];
  daily: { date: string; count: number }[];
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  scan: "Page scans",
  link_click: "Link clicks",
  doc_open: "Document opens",
  doc_email: "Document emails",
  contact_save: "Contacts saved",
};

function tally(
  rows: { value: string | null }[],
  fallback: string,
): Breakdown[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.value || fallback;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

// Aggregates all events in a rolling window for the Analytics tab. Personal
// scale, so we pull the rows and bucket them in JS.
export async function getAnalyticsBreakdown(
  client: SupabaseClient,
  profileId: string,
  rangeDays = 30,
): Promise<AnalyticsBreakdown> {
  const now = Date.now();
  const since = new Date(now - rangeDays * DAY).toISOString();

  const { data } = await client
    .from("events")
    .select("type, country, device, browser, source, created_at")
    .eq("profile_id", profileId)
    .gte("created_at", since);

  const events =
    (data as Pick<
      AnalyticsEvent,
      "type" | "country" | "device" | "browser" | "source" | "created_at"
    >[]) ?? [];

  const daily = Array.from({ length: rangeDays }, (_, i) => {
    const dayEnd = now - (rangeDays - 1 - i) * DAY;
    const dayStart = dayEnd - DAY;
    const count = events.filter((e) => {
      const t = new Date(e.created_at).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
    return { date: new Date(dayEnd).toISOString().slice(0, 10), count };
  });

  return {
    totalEvents: events.length,
    totalScans: events.filter((e) => e.type === "scan").length,
    rangeDays,
    byCountry: tally(
      events.map((e) => ({ value: e.country })),
      "Unknown",
    ),
    byDevice: tally(
      events.map((e) => ({ value: e.device })),
      "Unknown",
    ),
    byBrowser: tally(
      events.map((e) => ({ value: e.browser })),
      "Unknown",
    ),
    bySource: tally(
      events.map((e) => ({ value: e.source })),
      "Direct",
    ),
    byType: tally(
      events.map((e) => ({ value: EVENT_TYPE_LABELS[e.type] ?? e.type })),
      "Other",
    ),
    daily,
  };
}

// Computes everything the dashboard Home screen shows from the raw event and
// lead tables. Personal-scale, so we aggregate in JS rather than in SQL.
export async function getDashboardMetrics(
  client: SupabaseClient,
  profileId: string,
): Promise<DashboardMetrics> {
  const now = Date.now();
  const since = new Date(now - 14 * DAY).toISOString();

  const [{ data: eventRows }, { data: leadRows }, { data: blockRows }] =
    await Promise.all([
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
      client
        .from("link_blocks")
        .select("id, label, type, asset_id")
        .eq("profile_id", profileId),
    ]);

  const events = (eventRows as AnalyticsEvent[]) ?? [];
  const leads = (leadRows as Lead[]) ?? [];
  const blocks =
    (blockRows as Pick<LinkBlock, "id" | "label" | "type" | "asset_id">[]) ?? [];

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

  // Top links over the full 14-day window. Non-document blocks count
  // link_click events (matched by block_id); document blocks count
  // doc_open + doc_email (matched by asset_id).
  const counts = new Map<string, { label: string; count: number }>();
  for (const b of blocks) counts.set(b.id, { label: b.label, count: 0 });
  const assetToBlock = new Map<string, string>();
  for (const b of blocks) if (b.asset_id) assetToBlock.set(b.asset_id, b.id);

  for (const e of events) {
    let blockId: string | undefined;
    if (e.type === "link_click" && e.block_id) {
      blockId = e.block_id;
    } else if (
      (e.type === "doc_open" || e.type === "doc_email") &&
      e.asset_id
    ) {
      blockId = assetToBlock.get(e.asset_id);
    }
    if (blockId) {
      const entry = counts.get(blockId);
      if (entry) entry.count += 1;
    }
  }

  const topLinks = [...counts.values()]
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    scansThisWeek,
    scansLastWeek,
    scanChangePct,
    linkClicks,
    docOpens,
    newLeads,
    weeklyScans,
    topLinks,
    recentLeads: leads.slice(0, 3),
  };
}
