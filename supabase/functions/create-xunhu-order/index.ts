/**
 * Create a xunhupay payment order for WeChat or Alipay.
 * 
 * Input: { tier: "daoyou" | "wudao", channel: "wechat" | "alipay" }
 * Output: { orderId, url_qrcode, url }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Xunhupay API gateway
const XUNHU_API_URL = "https://api.xunhupay.com/payment/do.html";

// Pricing in CNY
const TIER_PRICES: Record<string, number> = {
  daoyou: 29,
  wudao: 99,
};

const TIER_TITLES: Record<string, string> = {
  daoyou: "道衍-道友会员月卡",
  wudao: "道衍-悟道会员月卡",
};

// MD5 hash function using Web Crypto API
async function md5(text: string): Promise<string> {
  // Deno built-in crypto doesn't support MD5 directly, use a manual approach
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Use a simple MD5 implementation for Deno
  const { createHash } = await import("https://deno.land/std@0.224.0/crypto/crypto.ts")
    .catch(() => ({ createHash: null }));
  
  if (createHash) {
    const hash = createHash("md5");
    hash.update(data);
    return hash.toString("hex");
  }
  
  // Fallback: use SubtleCrypto with SHA-256 wrapped in a compatibility layer
  // Actually, let's use the std library directly
  const { crypto: denoCrypto } = await import("https://deno.land/std@0.224.0/crypto/mod.ts");
  const hashBuffer = await denoCrypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Generate xunhupay hash signature
async function generateHash(params: Record<string, string>, appSecret: string): Promise<string> {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort();
  const parts: string[] = [];
  
  for (const key of sortedKeys) {
    if (key === "hash" || params[key] === "" || params[key] === undefined || params[key] === null) {
      continue;
    }
    parts.push(`${key}=${params[key]}`);
  }
  
  const stringA = parts.join("&");
  const stringSignTemp = stringA + appSecret;
  return await md5(stringSignTemp);
}

// Generate random string
function generateNonceStr(length = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    // Auth: extract user from JWT
    const authHeader = req.headers.get("authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const { tier, channel } = await req.json();

    if (!tier || !channel) {
      return new Response(JSON.stringify({ error: "Missing tier or channel" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!["daoyou", "wudao"].includes(tier)) {
      return new Response(JSON.stringify({ error: "Invalid tier" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!["wechat", "alipay"].includes(channel)) {
      return new Response(JSON.stringify({ error: "Invalid channel" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Get xunhupay credentials based on channel
    let appId: string;
    let appSecret: string;

    if (channel === "wechat") {
      appId = Deno.env.get("XUNHU_WECHAT_APPID") || "";
      appSecret = Deno.env.get("XUNHU_WECHAT_APPSECRET") || "";
    } else {
      appId = Deno.env.get("XUNHU_ALIPAY_APPID") || "";
      appSecret = Deno.env.get("XUNHU_ALIPAY_APPSECRET") || "";
    }

    if (!appId || !appSecret) {
      console.error(`[xunhu] Missing credentials for channel=${channel}`);
      return new Response(JSON.stringify({ error: "Payment channel not configured" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Generate unique order ID
    const tradeOrderId = `DY${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
    const amount = TIER_PRICES[tier];
    const title = TIER_TITLES[tier];
    const nonceStr = generateNonceStr();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Callback URL — the edge function that handles payment notifications
    const notifyUrl = `${supabaseUrl}/functions/v1/xunhu-payment-callback`;
    const returnUrl = `${req.headers.get("origin") || "https://dao-yan.com"}?payment=success&tier=${tier}`;

    // Build request params
    const params: Record<string, string> = {
      version: "1.1",
      appid: appId,
      trade_order_id: tradeOrderId,
      total_fee: amount.toFixed(2),
      title: title,
      time: timestamp,
      notify_url: notifyUrl,
      return_url: returnUrl,
      nonce_str: nonceStr,
      attach: JSON.stringify({ user_id: user.id, tier }),
    };

    // Generate hash signature
    params.hash = await generateHash(params, appSecret);

    console.log(`[xunhu] Creating order: ${tradeOrderId} tier=${tier} channel=${channel} amount=${amount}`);

    // Call xunhupay API
    const formBody = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const xunhuRes = await fetch(XUNHU_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });

    const xunhuData = await xunhuRes.json();
    console.log(`[xunhu] API response:`, JSON.stringify(xunhuData));

    if (xunhuData.errcode !== 0) {
      console.error(`[xunhu] API error: ${xunhuData.errmsg}`);
      return new Response(JSON.stringify({ error: xunhuData.errmsg || "Payment API error" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Save order to database
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: order, error: dbError } = await supabaseAdmin
      .from("payment_orders")
      .insert({
        user_id: user.id,
        trade_order_id: tradeOrderId,
        tier,
        amount,
        channel,
        status: "pending",
      })
      .select("id")
      .single();

    if (dbError) {
      console.error(`[xunhu] DB insert error:`, dbError);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      orderId: order.id,
      url_qrcode: xunhuData.url_qrcode || "",
      url: xunhuData.url || "",
      tradeOrderId,
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[xunhu] Unhandled error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
