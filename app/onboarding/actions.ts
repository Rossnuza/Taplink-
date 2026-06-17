"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface OnboardingResult {
  error?: string;
}

const RESERVED = new Set([
  "api",
  "dashboard",
  "login",
  "onboarding",
  "auth",
  "admin",
  "settings",
  "about",
  "_next",
]);

export async function claimHandle(
  _prev: OnboardingResult,
  formData: FormData,
): Promise<OnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const raw = String(formData.get("handle") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(raw)) {
    return {
      error:
        "Handles are 3–30 characters: letters, numbers and hyphens only.",
    };
  }
  if (RESERVED.has(raw)) {
    return { error: "That handle is reserved. Try another." };
  }

  // Ensure the handle is free.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("handle", raw)
    .maybeSingle();
  if (existing) {
    return { error: "That handle is taken. Try another." };
  }

  const { error: insertErr } = await supabase.from("profiles").insert({
    id: user.id,
    handle: raw,
    display_name: displayName || raw,
    contact_email: user.email,
    brand_color: "#0c5c54",
  });
  if (insertErr) {
    return { error: insertErr.message };
  }

  // Seed sensible default link blocks.
  await supabase.from("link_blocks").insert([
    { profile_id: user.id, type: "linkedin", label: "Connect on LinkedIn", position: 0, enabled: false },
    { profile_id: user.id, type: "contact", label: "Save my contact", position: 1, enabled: true },
    { profile_id: user.id, type: "website", label: "Visit my website", position: 2, enabled: false },
  ]);

  redirect("/dashboard");
}
