import { createClient } from "@/lib/supabase/server";
import type { Asset, AnalyticsEvent } from "@/lib/types";
import AssetsManager, { type AssetWithStats } from "./AssetsManager";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: assetRows }, { data: eventRows }] = await Promise.all([
    supabase
      .from("assets")
      .select("*")
      .eq("profile_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("type, asset_id")
      .eq("profile_id", user!.id)
      .in("type", ["doc_open", "doc_email"]),
  ]);

  const events = (eventRows as Pick<AnalyticsEvent, "type" | "asset_id">[]) ?? [];
  const assets: AssetWithStats[] = ((assetRows as Asset[]) ?? []).map((a) => ({
    ...a,
    opens: events.filter((e) => e.asset_id === a.id && e.type === "doc_open").length,
    emailed: events.filter((e) => e.asset_id === a.id && e.type === "doc_email").length,
  }));

  return <AssetsManager profileId={user!.id} assets={assets} />;
}
