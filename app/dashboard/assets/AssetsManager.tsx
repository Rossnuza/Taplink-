"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { card, pageTitle, sectionLabel } from "@/components/ui";
import Switch from "@/components/Switch";
import Toast from "@/components/Toast";
import { formatBytes } from "@/lib/format";
import { registerAsset, toggleGate, deleteAsset } from "../actions";
import type { Asset } from "@/lib/types";

export interface AssetWithStats extends Asset {
  opens: number;
  emailed: number;
}

export default function AssetsManager({
  profileId,
  assets,
}: {
  profileId: string;
  assets: AssetWithStats[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gate, setGate] = useState(
    Object.fromEntries(assets.map((a) => [a.id, a.require_email])),
  );
  const [, startTransition] = useTransition();

  async function onUpload(file: File) {
    if (file.type !== "application/pdf") {
      setToast("Please choose a PDF.");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const path = `${profileId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage
      .from("documents")
      .upload(path, file, { upsert: false });
    if (error) {
      setToast(error.message);
      setUploading(false);
      return;
    }
    const title = file.name.replace(/\.pdf$/i, "");
    const res = await registerAsset({ title, storagePath: path, fileSize: file.size });
    setUploading(false);
    if (res.error) {
      setToast(res.error);
      return;
    }
    setToast("Uploaded ✓");
    router.refresh();
  }

  function onGate(assetId: string, next: boolean) {
    setGate((s) => ({ ...s, [assetId]: next }));
    startTransition(() => {
      toggleGate(assetId, next);
    });
  }

  function onDelete(assetId: string) {
    if (!confirm("Delete this document? Its link block will be removed too.")) return;
    startTransition(async () => {
      await deleteAsset(assetId);
      router.refresh();
      setToast("Document deleted");
    });
  }

  return (
    <div style={{ padding: "60px 18px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={pageTitle}>Assets</div>

      <div
        onClick={() => fileInput.current?.click()}
        style={{
          border: "1.5px dashed rgba(12,92,84,.35)",
          background: "#f2f8f6",
          borderRadius: 16,
          padding: 22,
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "#0c5c54",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 10px",
            color: "#fff",
            fontSize: 22,
          }}
        >
          ↑
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0c5c54" }}>
          {uploading ? "Uploading…" : "Upload a PDF"}
        </div>
        <div style={{ fontSize: 12.5, color: "#6b8480", marginTop: 3 }}>
          Teaser, one-pager, IM — up to 25 MB
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />

      {assets.length === 0 && (
        <div style={{ ...card, padding: 18, fontSize: 13.5, color: "#9aa0a8" }}>
          No documents yet. Upload your teaser to add it to your page.
        </div>
      )}

      {assets.map((a) => (
        <div key={a.id} style={{ ...card, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: a.require_email ? "#fce9e7" : "#fbf0dd",
                color: a.require_email ? "#c0463b" : "#b5832a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 20,
              }}
            >
              {a.require_email ? "🔒" : "📄"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{a.title}</div>
              <div style={{ fontSize: 12.5, color: "#9aa0a8", marginTop: 2 }}>
                PDF · {formatBytes(a.file_size)} · v{a.version}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                <span>{a.opens} opens</span>
                <span>{a.emailed} emailed</span>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(20,23,26,.06)", margin: "14px 0" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Require email to open</div>
              <div
                style={{
                  fontSize: 12,
                  marginTop: 1,
                  color: gate[a.id] ? "#c0463b" : "#9aa0a8",
                  fontWeight: gate[a.id] ? 600 : 400,
                }}
              >
                {gate[a.id]
                  ? "On — gated, every view is a lead"
                  : "Off — view or email, visitor's choice"}
              </div>
            </div>
            <Switch on={!!gate[a.id]} onChange={(next) => onGate(a.id, next)} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button type="button" onClick={() => onDelete(a.id)} style={ghostBtn}>
              Delete
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: "#9aa0a8", marginTop: 10, textAlign: "center" }}>
            Your QR never changes when you swap documents.
          </div>
        </div>
      ))}

      <div style={{ ...sectionLabel, textAlign: "center", marginTop: 4 }}>
        {assets.length} document{assets.length === 1 ? "" : "s"}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  flex: 1,
  textAlign: "center",
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(20,23,26,.12)",
  background: "#fff",
  fontSize: 13,
  fontWeight: 700,
  color: "#14171a",
  cursor: "pointer",
};
