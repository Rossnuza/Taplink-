"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

export async function saveProfile(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const str = (k: string) => {
    const v = formData.get(k);
    return v == null ? null : String(v).trim() || null;
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: str("display_name") ?? "",
      title: str("title"),
      bio: str("bio"),
      company: str("company"),
      website_url: str("website_url"),
      linkedin_url: str("linkedin_url"),
      contact_email: str("contact_email"),
      phone: str("phone"),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Keep link block URLs in step with the profile fields they mirror.
  const website = str("website_url");
  const linkedin = str("linkedin_url");
  if (website !== null)
    await supabase
      .from("link_blocks")
      .update({ url: website })
      .eq("profile_id", user.id)
      .eq("type", "website");
  if (linkedin !== null)
    await supabase
      .from("link_blocks")
      .update({ url: linkedin })
      .eq("profile_id", user.id)
      .eq("type", "linkedin");

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function toggleBlock(blockId: string, enabled: boolean) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("link_blocks")
    .update({ enabled })
    .eq("id", blockId)
    .eq("profile_id", user.id);
  revalidatePath("/dashboard/profile");
}

export async function toggleGate(assetId: string, requireEmail: boolean) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("assets")
    .update({ require_email: requireEmail })
    .eq("id", assetId)
    .eq("profile_id", user.id);
  revalidatePath("/dashboard/assets");
}

export async function saveImageUrl(kind: "avatar" | "logo", url: string) {
  const { supabase, user } = await requireUser();
  const column = kind === "avatar" ? "avatar_url" : "logo_url";
  await supabase
    .from("profiles")
    .update({ [column]: url })
    .eq("id", user.id);
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
}

// Registers a freshly-uploaded PDF: creates the asset row and a matching
// (enabled) document link block so it appears on the visitor page.
export async function registerAsset(input: {
  title: string;
  storagePath: string;
  fileSize: number;
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const { data: asset, error } = await supabase
    .from("assets")
    .insert({
      profile_id: user.id,
      title: input.title,
      storage_path: input.storagePath,
      file_size: input.fileSize,
    })
    .select("id")
    .single();

  if (error || !asset) return { error: error?.message ?? "Upload failed" };

  const { count } = await supabase
    .from("link_blocks")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id);

  await supabase.from("link_blocks").insert({
    profile_id: user.id,
    type: "document",
    label: input.title,
    asset_id: asset.id,
    position: count ?? 99,
    enabled: true,
  });

  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard/profile");
  return { ok: true };
}

export async function deleteAsset(assetId: string) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("assets")
    .delete()
    .eq("id", assetId)
    .eq("profile_id", user.id);
  revalidatePath("/dashboard/assets");
  revalidatePath("/dashboard/profile");
}
