import type { Profile } from "@/lib/types";

// Builds a vCard 3.0 string from a profile. Downloading this drops the owner's
// details straight into the visitor's phone contacts.
export function buildVCard(profile: Profile): string {
  const name = profile.display_name || profile.handle;
  const parts = name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : "";
  const first = parts.join(" ");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(last ?? "")};${esc(first)};;;`,
    `FN:${esc(name)}`,
  ];

  if (profile.company) lines.push(`ORG:${esc(profile.company)}`);
  if (profile.title) lines.push(`TITLE:${esc(profile.title)}`);
  if (profile.contact_email)
    lines.push(`EMAIL;TYPE=WORK:${esc(profile.contact_email)}`);
  if (profile.phone) lines.push(`TEL;TYPE=CELL:${esc(profile.phone)}`);
  if (profile.website_url) lines.push(`URL:${esc(profile.website_url)}`);
  if (profile.linkedin_url)
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${esc(profile.linkedin_url)}`);
  if (profile.bio) lines.push(`NOTE:${esc(profile.bio)}`);

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
