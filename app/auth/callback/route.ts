import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges the magic-link code for a session, then sends the user on.
// New users (no profile yet) land on onboarding to claim their handle.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        const dest = profile ? next : "/onboarding";
        return NextResponse.redirect(new URL(dest, url.origin));
      }
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
