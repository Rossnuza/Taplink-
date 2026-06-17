import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/events";
import { parseVisitorMeta } from "@/lib/request";
import { isSupabaseConfigured } from "@/lib/env";
import type { EventType } from "@/lib/types";

const ALLOWED: EventType[] = ["link_click", "doc_open", "contact_save", "scan"];

// Records a tracking event fired from the visitor page (typically via
// navigator.sendBeacon). Always returns 204 so the client never blocks.
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return new NextResponse(null, { status: 204 });

  try {
    const { handle, type, blockId, assetId, source } = await request.json();
    if (!handle || !ALLOWED.includes(type)) {
      return new NextResponse(null, { status: 204 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("handle", handle)
      .maybeSingle();

    if (profile) {
      const meta = parseVisitorMeta(request.headers);
      await logEvent({
        profileId: profile.id,
        type,
        blockId: blockId ?? null,
        assetId: assetId ?? null,
        source: source ?? null,
        device: meta.device,
        browser: meta.browser,
        country: meta.country,
      });
    }
  } catch {
    // swallow — tracking must never surface an error to the visitor
  }

  return new NextResponse(null, { status: 204 });
}
