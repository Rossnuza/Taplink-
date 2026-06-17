import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/events";
import { parseVisitorMeta } from "@/lib/request";
import { buildVCard } from "@/lib/vcard";
import { isSupabaseConfigured } from "@/lib/env";
import type { Profile } from "@/lib/types";

// Returns the owner's contact card as a downloadable .vcf and logs the save.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { handle } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .ilike("handle", handle)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const profile = data as Profile;

  const meta = parseVisitorMeta(request.headers);
  await logEvent({
    profileId: profile.id,
    type: "contact_save",
    device: meta.device,
    browser: meta.browser,
    country: meta.country,
  });

  const vcard = buildVCard(profile);
  const fileName = `${profile.handle}.vcf`;

  return new NextResponse(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
