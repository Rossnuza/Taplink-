import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import type { Profile } from "@/lib/types";
import SharePanel from "./SharePanel";

export const dynamic = "force-dynamic";

export default async function SharePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("handle, company")
    .eq("id", user!.id)
    .single();
  const profile = profileRow as Pick<Profile, "handle" | "company">;

  const url = `${getSiteUrl()}/${profile.handle}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 480,
    margin: 2,
    color: { dark: "#14171a", light: "#ffffff" },
  });

  return (
    <SharePanel
      handle={profile.handle}
      company={profile.company}
      url={url}
      qrDataUrl={qrDataUrl}
    />
  );
}
