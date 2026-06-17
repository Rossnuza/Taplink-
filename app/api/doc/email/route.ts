import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/events";
import { sendDocumentEmail } from "@/lib/email";
import { parseVisitorMeta, isValidEmail } from "@/lib/request";
import { isSupabaseConfigured } from "@/lib/env";
import type { Asset, Profile } from "@/lib/types";

// "Email it to me" — captures the lead, logs the event, and emails a signed
// link to the document. The lead is recorded even if the email send fails.
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { handle, assetId, email, source } = await request.json();
  if (!handle || !assetId || !email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profileRow } = await admin
    .from("profiles")
    .select("*")
    .ilike("handle", handle)
    .maybeSingle();
  if (!profileRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const profile = profileRow as Profile;

  const { data: assetRow } = await admin
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!assetRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const asset = assetRow as Asset;

  const meta = parseVisitorMeta(request.headers);

  // Record the lead (the whole point of the product).
  await admin.from("leads").insert({
    profile_id: profile.id,
    email: email.trim(),
    asset_id: asset.id,
    source: source ?? null,
    country: meta.country,
    device: meta.device,
  });

  await logEvent({
    profileId: profile.id,
    type: "doc_email",
    assetId: asset.id,
    source: source ?? null,
    device: meta.device,
    browser: meta.browser,
    country: meta.country,
  });

  // Sign a link valid long enough for the recipient to open from their inbox.
  const { data: signed } = await admin.storage
    .from("documents")
    .createSignedUrl(asset.storage_path, 60 * 60 * 24 * 7); // 7 days

  if (signed) {
    await sendDocumentEmail({
      to: email.trim(),
      ownerName: profile.display_name || profile.handle,
      documentTitle: asset.title,
      documentUrl: signed.signedUrl,
    });
  }

  return NextResponse.json({ ok: true });
}
