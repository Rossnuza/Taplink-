import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import type { EventType } from "@/lib/types";

interface LogEventInput {
  profileId: string;
  type: EventType;
  blockId?: string | null;
  assetId?: string | null;
  source?: string | null;
  device?: string | null;
  browser?: string | null;
  country?: string | null;
}

// Records a single tracking event. Runs with the service-role key so anonymous
// visitors can be tracked without any client-side database access. Tracking is
// best-effort: a logging failure must never break the visitor experience.
export async function logEvent(input: LogEventInput): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const admin = createAdminClient();
    await admin.from("events").insert({
      profile_id: input.profileId,
      type: input.type,
      block_id: input.blockId ?? null,
      asset_id: input.assetId ?? null,
      source: input.source ?? null,
      device: input.device ?? null,
      browser: input.browser ?? null,
      country: input.country ?? null,
    });
  } catch (err) {
    console.error("logEvent failed", err);
  }
}
