import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Verify NOWPayments IPN signature using HMAC-SHA512 */
async function verifySignature(
  body: Record<string, unknown>,
  signature: string,
  ipnSecret: string
): Promise<boolean> {
  // Sort keys and build canonical JSON (NOWPayments spec)
  const sorted = Object.keys(body)
    .sort()
    .reduce((acc: Record<string, unknown>, key) => {
      acc[key] = body[key];
      return acc;
    }, {});

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ipnSecret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );

  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(JSON.stringify(sorted)));
  const computed = encodeHex(new Uint8Array(mac));

  return computed === signature.toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const IPN_SECRET = Deno.env.get("NOWPAYMENTS_IPN_SECRET");
    if (!IPN_SECRET) {
      console.error("NOWPAYMENTS_IPN_SECRET not configured");
      return new Response("Server misconfigured", { status: 500, headers: corsHeaders });
    }

    const signature = req.headers.get("x-nowpayments-sig");
    if (!signature) {
      console.error("Missing signature header");
      return new Response("Missing signature", { status: 400, headers: corsHeaders });
    }

    const body = await req.json();

    const valid = await verifySignature(body, signature, IPN_SECRET);
    if (!valid) {
      console.error("Invalid IPN signature");
      return new Response("Invalid signature", { status: 403, headers: corsHeaders });
    }

    const {
      payment_id,
      payment_status,
      order_id,
      pay_amount,
      pay_currency,
      actually_paid,
    } = body;

    console.log(`IPN received: payment_id=${payment_id}, status=${payment_status}, order_id=${order_id}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update payment record status regardless
    await supabaseAdmin
      .from("payments")
      .update({
        status: payment_status,
        metadata: {
          nowpayments_id: payment_id,
          pay_amount,
          pay_currency,
          actually_paid,
          payment_status,
          updated_at: new Date().toISOString(),
        },
      })
      .eq("subscription_id", String(payment_id));

    // Only activate Pro on "finished"
    if (payment_status === "finished") {
      const userId = order_id;

      if (!userId) {
        console.error("No order_id (user_id) in webhook payload");
        return new Response("Missing order_id", { status: 400, headers: corsHeaders });
      }

      // Prevent duplicate activation — check if already pro
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .single();

      if (profile?.plan !== "pro") {
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ plan: "pro" })
          .eq("id", userId);

        if (updateError) {
          console.error("Failed to update plan:", updateError);
          return new Response("Update failed", { status: 500, headers: corsHeaders });
        }

        console.log(`User ${userId} upgraded to Pro via payment ${payment_id}`);
      } else {
        console.log(`User ${userId} already Pro, skipping`);
      }

      // Mark payment completed
      await supabaseAdmin
        .from("payments")
        .update({
          status: "completed",
          subscription_status: "active",
        })
        .eq("subscription_id", String(payment_id));
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
