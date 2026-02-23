import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  template?: string;
  data?: Record<string, unknown>;
}

/* ─── Email Templates ─── */

function proActivatedEmail(data: { displayName?: string; expiresAt: string }): { subject: string; html: string } {
  const name = data.displayName || "Trader";
  const expiry = new Date(data.expiresAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  return {
    subject: "🎉 Welcome to Dasho Pro!",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="color:#fff;font-size:28px;margin:0">⚡ Dasho Pro Activated</h1>
    </div>
    <div style="background:#13131a;border:1px solid #1e1e2e;border-radius:16px;padding:32px;margin-bottom:24px">
      <p style="color:#e0e0e0;font-size:16px;line-height:1.6;margin:0 0 16px">
        Hey <strong style="color:#fff">${name}</strong>,
      </p>
      <p style="color:#a0a0b0;font-size:15px;line-height:1.6;margin:0 0 24px">
        Your Pro plan is now active! You have access to all premium features including unlimited widgets, AI recaps, smart alerts, and more.
      </p>
      <div style="background:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;padding:20px;margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="color:#888;font-size:13px">Plan</span>
          <span style="color:#fff;font-size:13px;font-weight:600">Dasho Pro</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="color:#888;font-size:13px">Duration</span>
          <span style="color:#fff;font-size:13px;font-weight:600">60 days</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#888;font-size:13px">Expires</span>
          <span style="color:#a78bfa;font-size:13px;font-weight:600">${expiry}</span>
        </div>
      </div>
      <a href="https://dasho.app/dashboard" style="display:block;text-align:center;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600">
        Open Dashboard →
      </a>
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin:0">
      Dasho — Your edge in the market.
    </p>
  </div>
</body>
</html>`,
  };
}

function alertTriggeredEmail(data: {
  displayName?: string;
  symbol: string;
  price: number;
  conditionType: string;
  targetPrice: number;
  alertType?: string;
}): { subject: string; html: string } {
  const name = data.displayName || "Trader";
  const isSmartAlert = data.alertType === "smart";
  const emoji = data.conditionType === "above" || data.conditionType?.includes("bullish") ? "🟢" : "🔴";

  return {
    subject: `${emoji} ${data.symbol} Alert Triggered — $${data.price.toLocaleString()}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <h1 style="color:#fff;font-size:24px;margin:0">${emoji} Alert Triggered</h1>
    </div>
    <div style="background:#13131a;border:1px solid #1e1e2e;border-radius:16px;padding:32px">
      <p style="color:#e0e0e0;font-size:16px;line-height:1.6;margin:0 0 20px">
        Hey <strong style="color:#fff">${name}</strong>, your ${isSmartAlert ? "smart " : ""}alert for <strong style="color:#a78bfa">${data.symbol}</strong> just triggered!
      </p>
      <div style="background:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;padding:20px;margin-bottom:24px">
        <div style="text-align:center;margin-bottom:16px">
          <span style="color:#fff;font-size:32px;font-weight:700">$${data.price.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#888;font-size:13px">Condition</span>
          <span style="color:#fff;font-size:13px">${data.conditionType}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#888;font-size:13px">Target</span>
          <span style="color:#fff;font-size:13px">$${data.targetPrice.toLocaleString()}</span>
        </div>
      </div>
      <a href="https://dasho.app/dashboard" style="display:block;text-align:center;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600">
        View Dashboard →
      </a>
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin-top:24px">
      Dasho — Your edge in the market.
    </p>
  </div>
</body>
</html>`,
  };
}

/* ─── Main Handler ─── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const payload: EmailPayload = await req.json();

    // If a template is specified, generate the email content
    let subject = payload.subject;
    let html = payload.html;

    if (payload.template === "pro_activated" && payload.data) {
      const result = proActivatedEmail(payload.data as any);
      subject = result.subject;
      html = result.html;
    } else if (payload.template === "alert_triggered" && payload.data) {
      const result = alertTriggeredEmail(payload.data as any);
      subject = result.subject;
      html = result.html;
    }

    if (!payload.to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Dasho <notifications@dasho.app>",
        to: [payload.to],
        subject,
        html,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      console.error("Resend error:", resData);
      return new Response(
        JSON.stringify({ error: "Email send failed", details: resData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, id: resData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
