"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { card, fieldLabel, input, pageTitle, sectionLabel } from "@/components/ui";
import Switch from "@/components/Switch";
import Toast from "@/components/Toast";
import { initials } from "@/lib/format";
import {
  saveProfile,
  saveImageUrl,
  toggleBlock,
  type ActionResult,
} from "../actions";
import type { LinkBlock, Profile } from "@/lib/types";

export default function ProfileEditor({
  profile,
  blocks,
}: {
  profile: Profile;
  blocks: LinkBlock[];
}) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    saveProfile,
    {},
  );
  const [toast, setToast] = useState<string | null>(null);
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [logo, setLogo] = useState(profile.logo_url);
  const [blockState, setBlockState] = useState(
    Object.fromEntries(blocks.map((b) => [b.id, b.enabled])),
  );

  const avatarInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  async function upload(kind: "avatar" | "logo", file: File) {
    const supabase = createClient();
    const bucket = kind === "avatar" ? "avatars" : "logos";
    const ext = file.name.split(".").pop() || "png";
    const path = `${profile.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) {
      setToast(error.message);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    await saveImageUrl(kind, data.publicUrl);
    if (kind === "avatar") setAvatar(data.publicUrl);
    else setLogo(data.publicUrl);
    setToast(kind === "avatar" ? "Photo updated ✓" : "Logo updated ✓");
  }

  async function onToggle(b: LinkBlock, next: boolean) {
    setBlockState((s) => ({ ...s, [b.id]: next }));
    await toggleBlock(b.id, next);
  }

  useEffect(() => {
    if (state.ok) setToast("Saved ✓");
  }, [state]);

  return (
    <form action={action} style={{ padding: "60px 18px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={pageTitle}>Profile</div>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "9px 16px",
            borderRadius: 999,
            background: "#14171a",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      {/* photo + logo */}
      <div style={{ ...card, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ImagePicker
            current={avatar}
            fallback={initials(profile.display_name || profile.handle)}
            round
            onPick={() => avatarInput.current?.click()}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Profile photo</div>
            <div style={{ fontSize: 12.5, color: "#9aa0a8", marginTop: 2 }}>
              JPG or PNG · square works best
            </div>
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              style={pillBtn}
            >
              Change
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(20,23,26,.06)", margin: "16px 0" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ImagePicker
            current={logo}
            fallback="LOGO"
            onPick={() => logoInput.current?.click()}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Company logo</div>
            <div style={{ fontSize: 12.5, color: "#9aa0a8", marginTop: 2 }}>
              Shown on your visitor page header
            </div>
            <button
              type="button"
              onClick={() => logoInput.current?.click()}
              style={pillBtn}
            >
              {logo ? "Change" : "Upload"}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={avatarInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && upload("avatar", e.target.files[0])}
      />
      <input
        ref={logoInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && upload("logo", e.target.files[0])}
      />

      {logo && (
        <div
          style={{
            background: "#eaf4f1",
            border: "1px solid rgba(12,92,84,.18)",
            borderRadius: 14,
            padding: "13px 15px",
            fontSize: 12.5,
            lineHeight: 1.45,
            color: "#0c5c54",
            fontWeight: 600,
          }}
        >
          Logo detected — your visitor page header shows it automatically.
        </div>
      )}

      {/* fields */}
      <Field label="Name" name="display_name" defaultValue={profile.display_name} placeholder="Ross Calder" />
      <Field label="Title" name="title" defaultValue={profile.title ?? ""} placeholder="Managing Director · EIC Industries" />
      <Field label="Bio" name="bio" defaultValue={profile.bio ?? ""} placeholder="One line about you" textarea />
      <Field label="Company" name="company" defaultValue={profile.company ?? ""} placeholder="EIC Industries" />
      <Field label="Website URL" name="website_url" defaultValue={profile.website_url ?? ""} placeholder="https://eicindustries.com" />
      <Field label="LinkedIn URL" name="linkedin_url" defaultValue={profile.linkedin_url ?? ""} placeholder="https://linkedin.com/in/…" />
      <Field label="Contact email (vCard)" name="contact_email" defaultValue={profile.contact_email ?? ""} placeholder="ross@eicindustries.com" />
      <Field label="Phone (vCard)" name="phone" defaultValue={profile.phone ?? ""} placeholder="+44 …" />

      {/* link blocks */}
      <div style={{ ...card, padding: "16px 18px" }}>
        <div style={{ ...sectionLabel, marginBottom: 13 }}>Link blocks</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {blocks.map((b, i) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 0",
                borderBottom: i < blocks.length - 1 ? "1px solid rgba(20,23,26,.06)" : "none",
              }}
            >
              <div style={{ flex: 1, fontSize: 14.5, fontWeight: 700 }}>
                {b.label}
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#9aa0a8", marginLeft: 8 }}>
                  {b.type}
                </span>
              </div>
              <Switch on={!!blockState[b.id]} onChange={(next) => onToggle(b, next)} />
            </div>
          ))}
          {blocks.length === 0 && (
            <div style={{ fontSize: 13.5, color: "#9aa0a8" }}>
              No blocks yet. Upload a document in Assets to add one.
            </div>
          )}
        </div>
      </div>

      {state.error && (
        <div style={{ fontSize: 13, color: "#e0584f", fontWeight: 600 }}>{state.error}</div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  textarea,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <div style={fieldLabel}>{label}</div>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          style={{ ...input, resize: "vertical", lineHeight: 1.5 }}
        />
      ) : (
        <input name={name} defaultValue={defaultValue} placeholder={placeholder} style={input} />
      )}
    </div>
  );
}

function ImagePicker({
  current,
  fallback,
  round,
  onPick,
}: {
  current: string | null;
  fallback: string;
  round?: boolean;
  onPick: () => void;
}) {
  const radius = round ? 999 : 16;
  return (
    <div
      onClick={onPick}
      style={{
        width: 72,
        height: 72,
        borderRadius: radius,
        cursor: "pointer",
        overflow: "hidden",
        flexShrink: 0,
        background: current ? "#fff" : "linear-gradient(145deg,#243245,#4a5e7a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: round ? 24 : 12,
        fontWeight: 700,
        border: "1px solid rgba(20,23,26,.08)",
      }}
    >
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        fallback
      )}
    </div>
  );
}

const pillBtn: React.CSSProperties = {
  display: "inline-block",
  marginTop: 8,
  padding: "6px 13px",
  borderRadius: 999,
  border: "1px solid rgba(20,23,26,.12)",
  background: "#fff",
  fontSize: 12.5,
  fontWeight: 700,
  color: "#14171a",
  cursor: "pointer",
};
