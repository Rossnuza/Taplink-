import { createClient } from "@/lib/supabase/server";
import type { LinkBlock, Profile } from "@/lib/types";
import ProfileEditor from "./ProfileEditor";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: blockRows } = await supabase
    .from("link_blocks")
    .select("*")
    .eq("profile_id", user!.id)
    .order("position", { ascending: true });

  return (
    <ProfileEditor
      profile={profileRow as Profile}
      blocks={(blockRows as LinkBlock[]) ?? []}
    />
  );
}
