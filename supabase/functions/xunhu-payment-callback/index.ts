/**
 * Xunhupay payment callback handler.
 * 
 * Receives POST from xunhupay when payment completes.
 * Verifies hash signature, updates order status, upgrades user tier.
 * Must return plain text "success" to acknowledge.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// MD5 hash using Deno std
async function md5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const { crypto: denoCrypto } = await import("https://deno.land/std@0.224.0/crypto/mod.ts");
  const hashBuffer = await denoCrypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Verify xunhupay hash signature
async function verifyHash(params: Record<string, string>, appSecret: string): Promise<boolean> {
  const receivedHash = params.hash;
  if (!receivedHash) return false;

  const sortedKeys = Object.keys(params).sort();
  const parts: string[] = [];
  
  for (const key of sortedKeys) {
    if (key === "hash" || params[key] === "" || params[key] === undefined || params[key] === null) {
      continue;
    }
    parts.push(`${key}=${params[key]}`);
  }
  
  const stringA = parts.join("&");
  const expectedHash = await md5(stringA + appSecret);
  return expectedHash === receivedHash;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse form data from xunhupay callback
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    console.log("[xunhu-callback] Received params:", JSON.stringify(params));

    const tradeOrderId = params.trade_order_id;
    if (!tradeOrderId) {
      console.error("[xunhu-callback] Missing trade_order_id");
      return new Response("fail", { status: 400 });
    }

    // Look up order to determine channel (for selecting the right secret)
    const { data: order, error: orderErr } = await supabase
      .from("payment_orders")
      .select("id, user_id, tier, channel, status")
      .eq("trade_order_id", tradeOrderId)
      .maybeSingle();

    if (orderErr || !order) {
      console.error("[xunhu-callback] Order not found:", tradeOrderId, orderErr);
      return new Response("fail", { status: 400 });
    }

    // Skip if already processed
    if (order.status === "paid") {
      console.log("[xunhu-callback] Order already paid:", tradeOrderId);
      return new Response("success", { status: 200 });
    }

    // Get the right secret for verification
    let appSecret: string;
    if (order.channel === "wechat") {
      appSecret = Deno.env.get("XUNHU_WECHAT_APPSECRET") || "";
    } else {
      appSecret = Deno.env.get("XUNHU_ALIPAY_APPSECRET") || "";
    }

    if (!appSecret) {
      console.error("[xunhu-callback] Missing app secret for channel:", order.channel);
      return new Response("fail", { status: 500 });
    }

    // Verify hash signature
    const isValid = await verifyHash(params, appSecret);
    if (!isValid) {
      console.error("[xunhu-callback] Hash verification failed for:", tradeOrderId);
      return new Response("fail", { status: 400 });
    }

    // Check payment status from callback
    if (params.status !== "OD") {
      console.log(`[xunhu-callback] Order ${tradeOrderId} status=${params.status} (not paid)`);
      // Update order status if refund etc.
      if (params.status === "CD") {
        await supabase
          .from("payment_orders")
          .update({ status: "failed" })
          .eq("id", order.id);
      }
      return new Response("success", { status: 200 });
    }

    // Payment successful — update order
    const { error: updateErr } = await supabase
      .from("payment_orders")
      .update({
        status: "paid",
        transaction_id: params.transaction_id || params.open_order_id || null,
        paid_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) {
      console.error("[xunhu-callback] Failed to update order:", updateErr);
      return new Response("fail", { status: 500 });
    }

    // Upgrade user tier — set 30 days expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        subscription_tier: order.tier,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("id", order.user_id);

    if (profileErr) {
      console.error("[xunhu-callback] Failed to upgrade user:", profileErr);
      return new Response("fail", { status: 500 });
    }

    console.log(`[xunhu-callback] SUCCESS: order=${tradeOrderId} user=${order.user_id} tier=${order.tier} expires=${expiresAt.toISOString()}`);

    // Must return "success" for xunhupay to stop retrying
    return new Response("success", { status: 200 });

  } catch (error) {
    console.error("[xunhu-callback] Unhandled error:", error);
    return new Response("fail", { status: 500 });
  }
});
