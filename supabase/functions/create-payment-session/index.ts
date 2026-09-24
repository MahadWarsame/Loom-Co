import { withSupabase } from "npm:@supabase/server@^1";
import Stripe from "npm:stripe@^22";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const siteUrl = Deno.env.get("SITE_URL");
    if (!stripeKey || !siteUrl) {
      return new Response(JSON.stringify({ error: "Payment provider is not configured." }), {
        status: 503, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const orderId = body?.orderId as string | undefined;
    const checkoutToken = body?.checkoutToken as string | undefined;
    if (!orderId || !checkoutToken) {
      return new Response(JSON.stringify({ error: "Missing checkout credentials." }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderError } = await ctx.supabaseAdmin
      .from("orders")
      .select("id, order_number, checkout_token, customer_email, total, status, payment_status, reservation_expires_at, stripe_checkout_session_id")
      .eq("id", orderId)
      .eq("checkout_token", checkoutToken)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found." }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (order.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "Order is already paid." }), {
        status: 409, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (order.status === "cancelled" || !order.reservation_expires_at || new Date(order.reservation_expires_at).getTime() <= Date.now()) {
      return new Response(JSON.stringify({ error: "This checkout reservation has expired. Please start checkout again." }), {
        status: 409, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey);

    if (order.stripe_checkout_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
        if (existing.status === "open" && existing.url) {
          return new Response(JSON.stringify({ url: existing.url, sessionId: existing.id }), {
            headers: { ...cors, "Content-Type": "application/json" },
          });
        }
      } catch (err) {
        console.warn("Could not reuse existing Stripe session:", err);
      }
    }

    const { data: items, error: itemsError } = await ctx.supabaseAdmin
      .from("order_items")
      .select("product_name, size_label, unit_price, quantity")
      .eq("order_id", order.id)
      .order("id");

    if (itemsError || !items?.length) {
      return new Response(JSON.stringify({ error: "Order items could not be loaded." }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "sek",
        product_data: {
          name: item.size_label ? `${item.product_name} — ${item.size_label}` : item.product_name,
        },
        unit_amount: Math.round(Number(item.unit_price) * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: order.customer_email,
      client_reference_id: order.id,
      metadata: { order_id: order.id, order_number: order.order_number },
      success_url: `${siteUrl}/checkout/success?order=${encodeURIComponent(order.order_number)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancelled?order=${encodeURIComponent(order.order_number)}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      locale: "sv",
      payment_method_collection: "always",
    });

    const { error: updateError } = await ctx.supabaseAdmin
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        payment_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("checkout_token", checkoutToken);

    if (updateError) {
      try { await stripe.checkout.sessions.expire(session.id); } catch {}
      return new Response(JSON.stringify({ error: "Could not save payment session." }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }),
};
