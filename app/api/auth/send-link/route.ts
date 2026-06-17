import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendApiKey, getFromEmail, getSiteUrl } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const { email, next } = await req.json();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next ?? "/dashboard")}`;

    // Generate the real magic link using the admin client — no email sent by Supabase
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.action_link) {
      console.error("generateLink failed:", error);
      return NextResponse.json(
        { error: "Could not generate sign-in link. Please try again." },
        { status: 500 },
      );
    }

    const magicLink = data.properties.action_link;

    // Send via Resend REST API (bypasses SMTP entirely)
    const resend = new Resend(getResendApiKey());
    const { error: sendError } = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: "Your TapLink sign-in link",
      html: renderMagicLinkEmail(magicLink),
    });

    if (sendError) {
      console.error("Resend send failed:", sendError);
      return NextResponse.json(
        { error: "Email delivery failed. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-link route error:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}

function renderMagicLinkEmail(link: string) {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#14171a">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:28px">
      <span style="width:9px;height:9px;border-radius:50%;background:#0c5c54;display:inline-block"></span>
      <span style="font-size:15px;font-weight:800;letter-spacing:.02em">TapLink</span>
    </div>
    <h1 style="font-size:22px;font-weight:800;margin:0 0 10px;letter-spacing:-.01em">Sign in to TapLink</h1>
    <p style="font-size:15px;line-height:1.6;color:#46505c;margin:0 0 28px">
      Click the button below to sign in. This link expires in 1 hour and can only be used once.
    </p>
    <a href="${link}"
       style="display:inline-block;background:#14171a;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:15px 26px;border-radius:14px">
      Sign in to TapLink
    </a>
    <p style="font-size:12px;color:#9aa0a8;margin:28px 0 0;line-height:1.6">
      If you didn't request this, you can safely ignore this email.
      Someone entered your email address at TapLink — no account changes were made.
    </p>
  </div>`;
}
