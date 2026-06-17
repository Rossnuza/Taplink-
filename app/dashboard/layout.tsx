import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import TabBar from "./TabBar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");

  return (
    <div style={{ display: "flex", justifyContent: "center", background: "#e9eaee" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          minHeight: "100dvh",
          background: "#f4f5f7",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1 }}>{children}</div>
        <TabBar />
      </div>
    </div>
  );
}

function SetupNotice() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 420, fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#14171a" }}>
          Finish setup
        </h1>
        <p>
          TapLink isn&apos;t connected to its backend yet. Add your Supabase and
          Resend keys to <code>.env.local</code> (see <code>.env.example</code>)
          and restart the server.
        </p>
      </div>
    </div>
  );
}
