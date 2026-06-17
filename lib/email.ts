import { Resend } from "resend";
import { getFromEmail, getResendApiKey } from "@/lib/env";

interface SendDocumentInput {
  to: string;
  ownerName: string;
  documentTitle: string;
  documentUrl: string; // signed, time-limited link to the PDF
}

// Sends the requested document to a lead via Resend. Returns false (without
// throwing) if email isn't configured, so callers can still record the lead.
export async function sendDocumentEmail(
  input: SendDocumentInput,
): Promise<boolean> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping document email");
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: getFromEmail(),
      to: input.to,
      subject: `${input.documentTitle} — from ${input.ownerName}`,
      html: renderEmail(input),
    });
    return true;
  } catch (err) {
    console.error("sendDocumentEmail failed", err);
    return false;
  }
}

interface LeadNotificationInput {
  to: string; // the owner
  leadEmail: string;
  documentTitle: string;
  country: string | null;
  device: string | null;
  source: string | null;
  leadsUrl: string; // deep link to the dashboard leads tab
}

// Notifies the owner the moment a new lead is captured. Best-effort: returns
// false (without throwing) so a notification failure never blocks the capture.
export async function sendLeadNotification(
  input: LeadNotificationInput,
): Promise<boolean> {
  const apiKey = getResendApiKey();
  if (!apiKey) return false;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: getFromEmail(),
      to: input.to,
      replyTo: input.leadEmail,
      subject: `New lead: ${input.leadEmail}`,
      html: renderLeadEmail(input),
    });
    return true;
  } catch (err) {
    console.error("sendLeadNotification failed", err);
    return false;
  }
}

function renderLeadEmail({
  leadEmail,
  documentTitle,
  country,
  device,
  source,
  leadsUrl,
}: LeadNotificationInput) {
  const detail = [country, device, source ? `via ${source}` : null]
    .filter(Boolean)
    .join(" · ");
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#14171a">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
      <span style="width:9px;height:9px;border-radius:50%;background:#0c5c54;display:inline-block"></span>
      <span style="font-size:15px;font-weight:800;letter-spacing:.02em">TapLink</span>
    </div>
    <h1 style="font-size:20px;font-weight:800;margin:0 0 6px">You captured a new lead 🎯</h1>
    <p style="font-size:15px;line-height:1.5;color:#46505c;margin:0 0 20px">
      <strong style="color:#14171a">${escapeHtml(leadEmail)}</strong> requested
      <strong style="color:#14171a">${escapeHtml(documentTitle)}</strong>.
    </p>
    <div style="background:#f4f5f7;border-radius:14px;padding:16px 18px;font-size:14px;color:#46505c;margin:0 0 24px">
      <div style="margin-bottom:6px"><strong style="color:#14171a">Email:</strong> ${escapeHtml(leadEmail)}</div>
      <div style="margin-bottom:6px"><strong style="color:#14171a">Document:</strong> ${escapeHtml(documentTitle)}</div>
      ${detail ? `<div><strong style="color:#14171a">Context:</strong> ${escapeHtml(detail)}</div>` : ""}
    </div>
    <a href="${leadsUrl}"
       style="display:inline-block;background:#14171a;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:12px">
      View in dashboard
    </a>
    <p style="font-size:12px;color:#9aa0a8;margin:24px 0 0">
      Reply to this email to reach ${escapeHtml(leadEmail)} directly.
    </p>
  </div>`;
}

function renderEmail({ ownerName, documentTitle, documentUrl }: SendDocumentInput) {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#14171a">
    <h1 style="font-size:20px;font-weight:800;margin:0 0 8px">Here's the document you asked for</h1>
    <p style="font-size:15px;line-height:1.5;color:#46505c;margin:0 0 24px">
      ${escapeHtml(ownerName)} shared <strong>${escapeHtml(documentTitle)}</strong> with you.
    </p>
    <a href="${documentUrl}"
       style="display:inline-block;background:#14171a;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:12px">
      Open ${escapeHtml(documentTitle)}
    </a>
    <p style="font-size:12px;color:#9aa0a8;margin:24px 0 0">
      This link expires for security. Sent via TapLink.
    </p>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
