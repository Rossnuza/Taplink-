import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceKey, getSupabaseUrl } from "@/lib/env";

// Service-role client that bypasses Row Level Security. Use ONLY on the server
// for trusted operations the public can't perform directly:
//   - reading public visitor-page data
//   - writing tracking events and captured leads from anonymous visitors
//   - generating signed URLs for private documents
//
// Never import this into a Client Component.
export function createAdminClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
