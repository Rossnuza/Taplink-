import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import type { Asset, LinkBlock, Profile } from "@/lib/types";

export interface PublicProfile {
  profile: Profile;
  blocks: LinkBlock[];
  assets: Record<string, Asset>; // keyed by asset id
}

// Loads everything the public visitor page needs in one place, using the
// service-role client (read-only here). Returns null if the handle is unknown
// or the page isn't live.
export async function getPublicProfile(
  handle: string,
): Promise<PublicProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .ilike("handle", handle)
    .maybeSingle();

  if (!profile || !profile.is_live) return null;

  const { data: blocks } = await admin
    .from("link_blocks")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("enabled", true)
    .order("position", { ascending: true });

  const { data: assetRows } = await admin
    .from("assets")
    .select("*")
    .eq("profile_id", profile.id);

  const assets: Record<string, Asset> = {};
  for (const a of (assetRows as Asset[]) ?? []) assets[a.id] = a;

  return {
    profile: profile as Profile,
    blocks: (blocks as LinkBlock[]) ?? [],
    assets,
  };
}

// Fetches the full profile by user id (owner-side; pass an authed client).
export async function getProfileById(
  client: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<Profile | null> {
  const { data } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}
