import sharp from "sharp";

// --- helpers shared by server (extraction) and client (theming) -------------

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbFromHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Relative luminance (0–1). Used to pick readable text on a brand background.
export function luminance(hex: string): number {
  const rgb = rgbFromHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Returns black or white — whichever reads better on the given background.
export function readableOn(hex: string): string {
  return luminance(hex) > 0.55 ? "#14171a" : "#ffffff";
}

function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

// --- server-only: pull the dominant *vibrant* colour out of a logo ----------

// Picks the colour a person would call the logo's "brand colour": the most
// common strongly-saturated tone, ignoring near-white/near-black/transparent
// pixels (so a white background never wins). Returns null for greyscale logos
// or on any failure, so callers can keep their existing colour.
export async function extractBrandColor(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());

    const { data, info } = await sharp(buf)
      .resize(72, 72, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels; // 4 (RGBA)
    // Bucket vibrant pixels by quantised hue-ish colour and accumulate.
    const buckets = new Map<
      string,
      { r: number; g: number; b: number; count: number; sat: number }
    >();

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels === 4 ? data[i + 3] : 255;
      if (a < 128) continue;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      // Skip near-white, near-black and washed-out greys.
      if (min > 225) continue;
      if (max < 32) continue;
      const sat = saturation(r, g, b);
      if (sat < 0.25) continue;

      // Quantise to ~32-value steps so similar tones group together.
      const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
      const entry = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0, sat: 0 };
      entry.r += r;
      entry.g += g;
      entry.b += b;
      entry.count += 1;
      entry.sat += sat;
      buckets.set(key, entry);
    }

    if (buckets.size === 0) return null;

    // Score by how much of the logo the colour covers, weighted by vividness.
    let best: { r: number; g: number; b: number } | null = null;
    let bestScore = -1;
    for (const e of buckets.values()) {
      const avgSat = e.sat / e.count;
      const score = e.count * (0.5 + avgSat);
      if (score > bestScore) {
        bestScore = score;
        best = { r: e.r / e.count, g: e.g / e.count, b: e.b / e.count };
      }
    }

    return best ? toHex(best.r, best.g, best.b) : null;
  } catch (err) {
    console.error("extractBrandColor failed", err);
    return null;
  }
}
