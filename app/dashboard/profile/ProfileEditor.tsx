"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { card, fieldLabel, input, pageTitle, sectionLabel } from "@/components/ui";
import Switch from "@/components/Switch";
import Toast from "@/components/Toast";
import { initials } from "@/lib/format";
import {
  saveProfile,
  saveImageUrl,
  toggleBlock,
  setLive,
  moveBlock,
  addLink,
  deleteBlock,
  type ActionResult,
} from "../actions";
import { DEFAULT_BRAND_COLOR, type LinkBlock, type Profile } from "@/lib/types";

const BRAND_SWATCHES = [
  "#0c5c54", // teal (default)
  "#1b66c9", // blue
  "#7b3fe4", // violet
  "#c0463b", // red
  "#b5832a", // gold
  "#1e9e63", // green
  "#14171a", // near-black
];

export default function ProfileEditor({
  profile,
  blocks,
}: {
  profile: Profile;
  blocks: LinkBlock[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    saveProfile,
    {},
  );
  const [toast, setToast] = useState<string | null>(null);
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [logo, setLogo] = useState(profile.logo_url);
  const [live, setLiveState] = useState(profile.is_live);
  const [brandColor, setBrandColor] = useState(
    profile.brand_color || DEFAULT_BRAND_COLOR,
  );
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
    const result = await saveImageUrl(kind, data.publicUrl);
    if (kind === "avatar") {
      setAvatar(data.publicUrl);
      setToast("Photo updated ✓");
    } else {
      setLogo(data.publicUrl);
      if (result?.brandColor) {
        setBrandColor(result.brandColor);
        setToast("Logo added ✓ — theme matched to it");
      } else {
        setToast("Logo updated ✓");
      }
    }
  }

  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [linkErr, setLinkErr] = useState("");

  async function onAddLink() {
    setLinkErr("");
    setAdding(true);
    const res = await addLink({ label: newLabel, url: newUrl });
    setAdding(false);
    if (res.error) {
      setLinkErr(res.error);
      return;
    }
    setNewLabel("");
    setNewUrl("");
    setToast("Link added ✓");
    router.refresh();
  }

  async function onDeleteBlock(blockId: string) {
    if (!confirm("Remove this link?")) return;
    await deleteBlock(blockId);
    router.refresh();
    setToast("Link removed");
  }

  async function onToggle(b: LinkBlock, next: boolean) {
    setBlockState((s) => ({ ...s, [b.id]: next }));
    await toggleBlock(b.id, next);
  }

  async function onLiveToggle(next: boolean) {
    setLiveState(next);
    await setLive(next);
    setToast(next ? "Page is live ✓" : "Page hidden");
  }

  async function onMove(blockId: string, direction: "up" | "down") {
    await moveBlock(blockId, direction);
    router.refresh();
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

      {/* page visibility */}
      <div
        style={{
          ...card,
          padding: "15px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>
            {live ? "Page is live" : "Page hidden"}
          </div>
          <div style={{ fontSize: 12.5, color: "#9aa0a8", marginTop: 2 }}>
            {live
              ? "Anyone who scans your QR can see it"
              : "Visitors see a “not live” message"}
          </div>
        </div>
        <Switch on={live} onChange={onLiveToggle} />
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
          Logo set — it now headers your visitor page, and the page theme is
          matched to its colours. Fine-tune the colour below if you like.
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

      {/* brand colour */}
      <input type="hidden" name="brand_color" value={brandColor} />
      <div style={{ ...card, padding: "16px 18px" }}>
        <div style={{ ...sectionLabel, marginBottom: 4 }}>Brand colour</div>
        <div style={{ fontSize: 12.5, color: "#9aa0a8", marginBottom: 13 }}>
          Tints your name, buttons and icons on your visitor page.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(BRAND_SWATCHES.some((c) => c.toLowerCase() === brandColor.toLowerCase())
            ? BRAND_SWATCHES
            : [brandColor, ...BRAND_SWATCHES]
          ).map((c) => {
            const selected = c.toLowerCase() === brandColor.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => setBrandColor(c)}
                aria-label={c}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: c,
                  cursor: "pointer",
                  border: selected ? "3px solid #14171a" : "3px solid #fff",
                  boxShadow: "0 0 0 1px rgba(20,23,26,.12)",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* link blocks */}
      <div style={{ ...card, padding: "16px 18px" }}>
        <div style={{ ...sectionLabel, marginBottom: 4 }}>Links</div>
        <div style={{ fontSize: 12.5, color: "#9aa0a8", marginBottom: 13 }}>
          Reorder with the arrows; toggle to show or hide on your page.
        </div>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <ReorderBtn
                  dir="up"
                  disabled={i === 0}
                  onClick={() => onMove(b.id, "up")}
                />
                <ReorderBtn
                  dir="down"
                  disabled={i === blocks.length - 1}
                  onClick={() => onMove(b.id, "down")}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {b.label}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#9aa0a8",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {b.type === "custom" && b.url ? b.url : b.type}
                </div>
              </div>
              {b.type === "custom" && (
                <button
                  type="button"
                  onClick={() => onDeleteBlock(b.id)}
                  aria-label="Remove link"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    border: "none",
                    background: "#f3f4f6",
                    color: "#9aa0a8",
                    fontSize: 15,
                    lineHeight: 1,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              )}
              <Switch on={!!blockState[b.id]} onChange={(next) => onToggle(b, next)} />
            </div>
          ))}
          {blocks.length === 0 && (
            <div style={{ fontSize: 13.5, color: "#9aa0a8" }}>
              No links yet. Add one below.
            </div>
          )}
        </div>

        {/* add a custom link */}
        <div style={{ height: 1, background: "rgba(20,23,26,.06)", margin: "14px 0" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <input
            value={newLabel}
            onChange={(e) => {
              setNewLabel(e.target.value);
              setLinkErr("");
            }}
            placeholder="Link label (e.g. Book a call)"
            style={{ ...input, fontSize: 14 }}
          />
          <input
            value={newUrl}
            onChange={(e) => {
              setNewUrl(e.target.value);
              setLinkErr("");
            }}
            placeholder="https://…"
            inputMode="url"
            autoCapitalize="none"
            style={{ ...input, fontSize: 14 }}
          />
          {linkErr && (
            <div style={{ fontSize: 12.5, color: "#e0584f", fontWeight: 600 }}>
              {linkErr}
            </div>
          )}
          <button
            type="button"
            onClick={onAddLink}
            disabled={adding || !newLabel.trim() || !newUrl.trim()}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "none",
              background:
                adding || !newLabel.trim() || !newUrl.trim() ? "#c8ccd2" : "#0c5c54",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor:
                adding || !newLabel.trim() || !newUrl.trim() ? "default" : "pointer",
            }}
          >
            {adding ? "Adding…" : "+ Add link"}
          </button>
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
      role="button"
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

function ReorderBtn({
  dir,
  disabled,
  onClick,
}: {
  dir: "up" | "down";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "up" ? "Move up" : "Move down"}
      style={{
        width: 22,
        height: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        background: "transparent",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.25 : 0.6,
        padding: 0,
      }}
    >
      <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
        <path
          d={dir === "up" ? "M1 6l4.5-4.5L10 6" : "M1 1l4.5 4.5L10 1"}
          stroke="#14171a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
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
