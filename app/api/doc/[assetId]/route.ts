import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/events";
import { parseVisitorMeta } from "@/lib/request";
import { isSupabaseConfigured } from "@/lib/env";
import type { Asset } from "@/lib/types";

// "View in browser" — logs the open and redirects the visitor to a short-lived
// signed URL for the PDF. Gated (email-required) documents can't be opened here.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { assetId } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const asset = data as Asset;

  if (asset.require_email) {
    return NextResponse.json(
      { error: "This document requires email to access." },
      { status: 403 },
    );
  }

  const { data: signed, error } = await admin.storage
    .from("documents")
    .createSignedUrl(asset.storage_path, 60 * 10); // 10 minutes

  if (error || !signed) {
    return NextResponse.json({ error: "Unavailable" }, { status: 502 });
  }

  const meta = parseVisitorMeta(request.headers);
  await logEvent({
    profileId: asset.profile_id,
    type: "doc_open",
    assetId: asset.id,
    device: meta.device,
    browser: meta.browser,
    country: meta.country,
  });

  return NextResponse.redirect(signed.signedUrl);
}
