// Best-effort extraction of visitor metadata from request headers.
// Used to enrich tracking events and leads (device, browser, rough location).

export interface VisitorMeta {
  device: string;
  browser: string;
  country: string | null;
}

export function parseVisitorMeta(headers: Headers): VisitorMeta {
  const ua = headers.get("user-agent") ?? "";

  let device = "Desktop";
  if (/iPad|Tablet/i.test(ua)) device = "Tablet";
  else if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) device = "Mobile";
  if (/iPhone/i.test(ua)) device = "iPhone";
  else if (/iPad/i.test(ua)) device = "iPad";
  else if (/Android/i.test(ua)) device = "Android";

  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  // Vercel / common CDNs expose the visitor's country here.
  const country =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country") ??
    null;

  return { device, browser, country };
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}
