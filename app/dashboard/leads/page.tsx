import { createClient } from "@/lib/supabase/server";
import type { Asset, Lead } from "@/lib/types";
import LeadsView, { type LeadRow } from "./LeadsView";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: leadRows }, { data: assetRows }] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("profile_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("assets").select("id, title").eq("profile_id", user!.id),
  ]);

  const assetTitles = new Map(
    ((assetRows as Pick<Asset, "id" | "title">[]) ?? []).map((a) => [a.id, a.title]),
  );

  const leads: LeadRow[] = ((leadRows as Lead[]) ?? []).map((l) => ({
    ...l,
    assetTitle: l.asset_id ? assetTitles.get(l.asset_id) ?? "Document" : "—",
  }));

  return <LeadsView leads={leads} />;
}
