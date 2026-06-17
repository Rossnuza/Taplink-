// Centralised, lazy access to environment variables.
//
// We read these *inside functions* (never at module top-level) so that
// `next build` never fails just because a key is missing — the app builds
// fine with placeholders and only needs real values at runtime.

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

export function getSupabaseServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function getResendApiKey(): string {
  return process.env.RESEND_API_KEY ?? "";
}

export function getFromEmail(): string {
  return process.env.TAPLINK_FROM_EMAIL ?? "TapLink <onboarding@resend.dev>";
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// True only when the real backend keys are wired up. Used to show a friendly
// "finish setup" notice instead of crashing when the app is run unconfigured.
export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
