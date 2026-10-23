// Supabase Edge Function: send-report
// Receives an Excel workbook (base64) from the app and emails it via SendGrid.
//
// SendGrid needs only a single verified sender email (Settings > Sender
// Authentication > Verify a Single Sender) — no domain/DNS access required,
// unlike Resend which requires a fully verified domain before it will send
// to arbitrary recipients.
//
// Deploy:
//   supabase functions deploy send-report --no-verify-jwt
//   supabase secrets set SENDGRID_API_KEY=SG.xxxxxxxxxx
//   supabase secrets set FROM_EMAIL="Cafe Milano <you@yourdomain.com>"

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Accepts either "you@domain.com" or "Display Name <you@domain.com>".
function parseFromEmail(raw: string): { email: string; name?: string } {
  const match = raw.match(/^(.*)<(.+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, "");
    return { email: match[2].trim(), name: name || undefined };
  }
  return { email: raw.trim() };
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const {
      to,
      subject,
      deviceUser,
      deviceRole,
      deviceNick,
      dateStr,
      filename,
      fileBase64,
      heading,
      description,
    } = await req.json();

    if (!to || !fileBase64) {
      return new Response(
        JSON.stringify({ error: "Missing 'to' or 'fileBase64'" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const FROM_EMAIL_RAW = Deno.env.get("FROM_EMAIL") ?? "";

    if (!SENDGRID_API_KEY) {
      return new Response(
        JSON.stringify({ error: "SENDGRID_API_KEY not configured" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }
    if (!FROM_EMAIL_RAW) {
      return new Response(
        JSON.stringify({ error: "FROM_EMAIL not configured" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const from = parseFromEmail(FROM_EMAIL_RAW);

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;">
        <div style="background:#0A0A0A;padding:20px;text-align:center;">
          <span style="color:#E8141A;font-size:24px;font-weight:bold;letter-spacing:4px;">
            CAF&Eacute; MILANO
          </span><br>
          <span style="color:#fff;font-size:12px;letter-spacing:3px;">WEST-ISLAND</span>
        </div>
        <div style="padding:24px;background:#fff;">
          <h2 style="margin:0 0 6px;font-size:18px;color:#0A0A0A;">
            ${esc(String(heading ?? "Nightly Checklist Report"))}
          </h2>
          <p style="margin:0 0 18px;color:#555;font-size:14px;">${dateStr ?? ""}</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:8px 0;color:#555;border-bottom:1px solid #DBEAFE;">Submitted by</td>
              <td style="padding:8px 0;font-weight:bold;border-bottom:1px solid #DBEAFE;">
                ${deviceUser ?? "Unknown"}${deviceRole ? ` (${deviceRole})` : ""}
              </td>
            </tr>
            ${
      deviceNick
        ? `<tr>
                    <td style="padding:8px 0;color:#555;border-bottom:1px solid #DBEAFE;">Device</td>
                    <td style="padding:8px 0;border-bottom:1px solid #DBEAFE;">${deviceNick}</td>
                  </tr>`
        : ""
    }
          </table>
          <p style="margin:20px 0 0;font-size:14px;color:#333;">
            ${
      esc(String(
        description ??
          "The attached Excel workbook contains one sheet per section: Pre-Service, Post-Service, Manager Closing, General Cleaning, Kitchen Weekly, and Weekly Inventory.",
      ))
    }
          </p>
        </div>
        <div style="background:#EFF6FF;padding:14px;text-align:center;font-size:12px;color:#555;">
          Automated report &middot; Caf&eacute; Milano West-Island
        </div>
      </div>`;

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from,
        subject: subject ?? `Cafe Milano Report ${dateStr ?? ""}`,
        content: [{ type: "text/html", value: html }],
        attachments: [
          {
            content: fileBase64,
            filename: filename ?? "report.xlsx",
            type:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            disposition: "attachment",
          },
        ],
      }),
    });

    // SendGrid returns 202 with an empty body on success.
    if (!res.ok) {
      const body = await res.text();
      return new Response(
        JSON.stringify({ error: "SendGrid failed", detail: body }),
        { status: 502, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
