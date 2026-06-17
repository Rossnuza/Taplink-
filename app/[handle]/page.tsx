import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getPublicProfile } from "@/lib/data";
import { logEvent } from "@/lib/events";
import { parseVisitorMeta } from "@/lib/request";
import { DEFAULT_BRAND_COLOR } from "@/lib/types";
import VisitorView, { type VisitorButton } from "./VisitorView";

export const dynamic = "force-dynamic";

type Params = Promise<{ handle: string }>;
type Search = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { handle } = await params;
  const data = await getPublicProfile(handle);
  if (!data) return { title: "TapLink" };
  const { profile } = data;
  return {
    title: `${profile.display_name || profile.handle} · TapLink`,
    description: profile.bio ?? undefined,
  };
}

export default async function VisitorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { handle } = await params;
  const search = await searchParams;
  const data = await getPublicProfile(handle);
  if (!data) notFound();

  const { profile, blocks, assets } = data;
  const source = typeof search.source === "string" ? search.source : null;

  // Log the scan / page view. Best-effort; never blocks rendering.
  const meta = parseVisitorMeta(await headers());
  await logEvent({
    profileId: profile.id,
    type: "scan",
    source,
    device: meta.device,
    browser: meta.browser,
    country: meta.country,
  });

  const buttons: VisitorButton[] = blocks.map((b) => {
    const asset = b.asset_id ? assets[b.asset_id] : undefined;
    return {
      id: b.id,
      type: b.type,
      label: b.label,
      url: b.url ?? undefined,
      asset: asset
        ? {
            id: asset.id,
            title: asset.title,
            fileSizeMb: Math.max(0.1, asset.file_size / (1024 * 1024)),
            requireEmail: asset.require_email,
          }
        : undefined,
    };
  });

  return (
    <VisitorView
      handle={profile.handle}
      displayName={profile.display_name || profile.handle}
      title={profile.title}
      bio={profile.bio}
      company={profile.company}
      avatarUrl={profile.avatar_url}
      brandColor={profile.brand_color || DEFAULT_BRAND_COLOR}
      buttons={buttons}
      source={source}
    />
  );
}
