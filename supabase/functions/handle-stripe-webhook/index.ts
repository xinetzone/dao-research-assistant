/**
 * Stripe Webhook Handler — processes subscription events and updates user tiers.
 * 
 * Events handled:
 * - checkout.session.completed: user completed payment → upgrade tier
 * - customer.subscription.updated: subscription changed → update tier
 * - customer.subscription.deleted: subscription cancelled → downgrade to free
 */

import Stripe from "https://esm.sh/stripe@17.7.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Map Stripe price IDs to subscription tiers
// These will be set after creating products in Stripe
const PRICE_TO_TIER: Record<string, string> = {
  // Will be populated after stripe_create_products_and_prices
  // "price_xxxx": "daoyou",
  // "price_yyyy": "wudao",
};

// Fallback: derive tier from product metadata
function getTierFromMetadata(metadata: Record<string, string>): string {
  return metadata?.tier || "free";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" });
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      console.error("[webhook] Missing signature or webhook secret");
      return new Response("Missing signature", { status: 400, headers: CORS_HEADERS });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("[webhook] Signature verification failed:", err);
      return new Response("Invalid signature", { status: 400, headers: CORS_HEADERS });
    }

    console.log(`[webhook] Received event: ${event.type} (${event.id})`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier || "daoyou";

        if (!userId) {
          console.error("[webhook] No user_id in checkout session metadata");
          break;
        }

        // Calculate expiration (30 days from now for monthly)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: tier,
            subscription_expires_at: expiresAt.toISOString(),
          })
          .eq("id", userId);

        if (error) {
          console.error("[webhook] Failed to update profile:", error);
        } else {
          console.log(`[webhook] Upgraded user=${userId} to tier=${tier} expires=${expiresAt.toISOString()}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        const priceId = subscription.items.data[0]?.price.id;
        let tier = PRICE_TO_TIER[priceId] || getTierFromMetadata(subscription.metadata as Record<string, string>);

        // If subscription is not active, downgrade
        if (subscription.status !== "active" && subscription.status !== "trialing") {
          tier = "free";
        }

        const expiresAt = new Date(subscription.current_period_end * 1000);

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: tier,
            subscription_expires_at: expiresAt.toISOString(),
          })
          .eq("id", userId);

        if (error) {
          console.error("[webhook] Failed to update subscription:", error);
        } else {
          console.log(`[webhook] Updated user=${userId} tier=${tier} expires=${expiresAt.toISOString()}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_expires_at: null,
          })
          .eq("id", userId);

        if (error) {
          console.error("[webhook] Failed to downgrade user:", error);
        } else {
          console.log(`[webhook] Downgraded user=${userId} to free (subscription deleted)`);
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[webhook] Unhandled error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
