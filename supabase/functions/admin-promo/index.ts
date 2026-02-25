import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error } = await supabaseUser.auth.getClaims(token);
  if (error || !claimsData?.claims) throw new Error("Unauthorized");

  const userId = claimsData.claims.sub;

  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) throw new Error("Forbidden");

  return { supabaseAdmin, userId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabaseAdmin, userId } = await verifyAdmin(req);
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // pathParts: ["admin-promo"] or ["admin-promo", "<id>"]
    const promoId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

    // GET: List all promo codes
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ promos: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: Create promo code
    if (req.method === "POST") {
      const body = await req.json();
      const {
        code,
        discount_type = "percentage",
        discount_value,
        max_uses,
        first_time_only = false,
        expires_at,
      } = body;

      if (!code || discount_value == null) {
        return new Response(
          JSON.stringify({ error: "code and discount_value are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!["percentage", "fixed"].includes(discount_type)) {
        return new Response(
          JSON.stringify({ error: "discount_type must be percentage or fixed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (discount_type === "percentage" && (discount_value < 0 || discount_value > 100)) {
        return new Response(
          JSON.stringify({ error: "Percentage must be 0-100" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabaseAdmin.from("promo_codes").insert({
        code: code.toUpperCase().trim(),
        discount_type,
        discount_value,
        max_uses: max_uses ?? null,
        first_time_only,
        expires_at: expires_at ?? null,
        created_by: userId,
      }).select().single();

      if (error) {
        if (error.code === "23505") {
          return new Response(
            JSON.stringify({ error: "Promo code already exists" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw error;
      }

      return new Response(JSON.stringify({ promo: data }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PATCH: Update promo code
    if (req.method === "PATCH") {
      const body = await req.json();
      const patchId = body.id || promoId;
      if (!patchId) {
        return new Response(
          JSON.stringify({ error: "Promo ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const allowedFields = [
        "is_active", "max_uses", "first_time_only", "expires_at",
        "discount_type", "discount_value",
      ];
      const updates: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (body[key] !== undefined) updates[key] = body[key];
      }

      const { data, error } = await supabaseAdmin
        .from("promo_codes")
        .update(updates)
        .eq("id", patchId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ promo: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    const status = msg === "Unauthorized" ? 401
      : msg === "Forbidden" ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
