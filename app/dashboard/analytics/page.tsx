import { createClient } from "@/lib/supabase/server";
import { getAnalyticsBreakdown } from "@/lib/analytics";
import AnalyticsView from "./AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const breakdown = await getAnalyticsBreakdown(supabase, user!.id, 30);

  return <AnalyticsView breakdown={breakdown} />;
}
