import { withSupabase } from "npm:@supabase/server@^1";
import Stripe from "npm:stripe@^22";

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
    if (!stripeKey || !webhookSecret) return new Response("Webhook is not configured", { status: 503 });

    const signature = req.headers.get("Stripe-Signature");
    if (!signature) return new Response("Missing Stripe signature", { status: 400 });

    const body = await req.text();
    const stripe = new Stripe(stripeKey);
    const cryptoProvider = Stripe.createSubtleCryptoProvider();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider,
      );
    } catch (err) {
      console.error("Stripe signature verification failed:", err);
      return new Response("Bad signature", { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (!orderId) return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      if (session.payment_status === "paid" || event.type === "checkout.session.async_payment_succeeded") {
        const { error } = await ctx.supabaseAdmin.rpc("finalize_paid_order", { p_order_id: orderId });
        if (error) {
          console.error("Failed to finalize paid order:", error);
          return new Response("Order finalization failed", { status: 500 });
        }
      }
    }

    if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const { error } = await ctx.supabaseAdmin.rpc("release_order_reservation", {
        p_order_id: orderId,
        p_cancel: true,
      });
      if (error) {
        console.error("Failed to release reservation:", error);
        return new Response("Reservation release failed", { status: 500 });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }),
};
