import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";

function sek(n: number) {
  return `${Math.round(n).toLocaleString("sv-SE")} kr`;
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
};

type PendingPayment = {
  orderId: string;
  orderNumber: string;
  checkoutToken: string;
};

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState<FormState>({
    name: "", email: "", phone: "", line1: "", line2: "", postalCode: "", city: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

  if (items.length === 0 && !pendingPayment) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-4xl">Your cart is empty</h1>
        <Link to="/shop" className="mt-7 inline-flex bg-fg px-7 py-4 text-sm font-semibold text-bg">Shop rugs</Link>
      </div>
    );
  }

  const update = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function startPayment(payment: PendingPayment) {
    setError("");
    setSubmitting(true);

    const { data, error: paymentError } = await supabase.functions.invoke("create-payment-session", {
      body: { orderId: payment.orderId, checkoutToken: payment.checkoutToken },
    });

    if (paymentError || !data?.url) {
      let serverMessage = data?.error as string | undefined;
      let serverDetails = data?.details as string | undefined;

      if (paymentError && "context" in paymentError) {
        try {
          const response = (paymentError as { context?: Response }).context;
          if (response) {
            const body = await response.clone().json().catch(() => null);
            serverMessage = body?.error || serverMessage;
            serverDetails = body?.details || serverDetails;
          }
        } catch {
          // Keep the generic error if the response body cannot be read.
        }
      }

      setError(
        [serverMessage, serverDetails].filter(Boolean).join(" ") ||
        paymentError?.message ||
        "We couldn't start secure payment. Please try again.",
      );
      setSubmitting(false);
      return;
    }

    clearCart();
    window.location.assign(data.url);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const { data, error: rpcError } = await supabase.rpc("create_guest_order", {
      p_customer_email: form.email,
      p_customer_name: form.name,
      p_phone: form.phone || null,
      p_shipping_line1: form.line1,
      p_shipping_line2: form.line2 || null,
      p_shipping_postal_code: form.postalCode,
      p_shipping_city: form.city,
      p_shipping_country_code: "SE",
      p_items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
    });

    if (rpcError || !data?.order_id || !data?.checkout_token) {
      setError(rpcError?.message || "We couldn't create your checkout. Please check your details and try again.");
      setSubmitting(false);
      return;
    }

    const payment: PendingPayment = {
      orderId: data.order_id,
      orderNumber: data.order_number,
      checkoutToken: data.checkout_token,
    };

    setPendingPayment(payment);
    await startPayment(payment);
  }

  if (pendingPayment) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Order reserved</p>
        <h1 className="mt-3 text-5xl">Complete your payment</h1>
        <p className="mt-5 text-sm leading-7 text-mut">
          Order <strong className="text-fg">{pendingPayment.orderNumber}</strong> is reserved for you for a limited time.
        </p>
        {error && <div role="alert" className="mt-6 border border-sale/30 bg-sale/5 p-4 text-left text-sm text-sale">{error}</div>}
        <button
          type="button"
          onClick={() => void startPayment(pendingPayment)}
          disabled={submitting}
          className="mt-8 w-full bg-fg py-4 text-sm font-semibold text-bg disabled:cursor-wait disabled:opacity-50"
        >
          {submitting ? "Opening secure payment…" : "Continue to secure payment"}
        </button>
        <Link to="/shop" className="mt-4 inline-block text-xs text-mut hover:text-fg">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#faf9f6]">
      <div className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Link to="/" className="font-display text-[25px] tracking-[-0.03em]">Loom <span className="text-gold">&amp;</span> Co</Link>
          <div className="text-[11px] text-mut"><span className="font-medium text-fg">Checkout</span> <span className="mx-2">•</span> Secure payment</div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <Link to="/cart" className="text-xs text-mut hover:text-fg">← Back to cart</Link>
        <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
          <form onSubmit={submitOrder} className="space-y-8">
          <section className="border border-line bg-bg p-5 sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">01 · Contact</p>
            <h2 className="mt-1 font-display text-2xl">Your information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium sm:col-span-2">Full name<input required value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
              <label className="text-xs font-medium">Email<input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
              <label className="text-xs font-medium">Phone<input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
            </div>
          </section>

          <section className="border border-line bg-bg p-5 sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">02 · Delivery</p>
            <h2 className="mt-1 font-display text-2xl">Shipping address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium sm:col-span-2">Address<input required value={form.line1} onChange={(e) => update("line1", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
              <label className="text-xs font-medium sm:col-span-2">Apartment, floor, etc. <span className="font-normal text-mut">(optional)</span><input value={form.line2} onChange={(e) => update("line2", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
              <label className="text-xs font-medium">Postcode<input required value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
              <label className="text-xs font-medium">City<input required value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
            </div>
          </section>

          {error && <div role="alert" className="border border-sale/30 bg-sale/5 p-4 text-sm text-sale">{error}</div>}

          <div className="border border-line bg-bg p-5 sm:p-7">
            <div className="flex items-center gap-3 text-xs text-mut"><span className="grid h-7 w-7 place-items-center rounded-full bg-soft text-fg">✓</span><span>Secure payment powered by Stripe</span></div>
            <button type="submit" disabled={submitting} className="mt-5 w-full bg-fg py-4 text-sm font-semibold text-bg transition hover:bg-[#3a3731] disabled:cursor-wait disabled:opacity-50">
              {submitting ? "Preparing secure payment…" : "Continue to secure payment"}
            </button>
            <p className="mt-3 text-center text-[11px] leading-5 text-mut">Your payment is processed securely. You will be redirected to Stripe after your order is reserved.</p>
          </div>
        </form>

        <aside className="order-first h-fit border border-line bg-bg p-5 shadow-sm lg:sticky lg:top-28 lg:order-none sm:p-7">
          <div className="flex items-baseline justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Your selection</p><h2 className="mt-1 font-display text-2xl">Order summary</h2></div><span className="text-xs text-mut">{items.length} {items.length === 1 ? "item" : "items"}</span></div>
          <div className="mt-5 divide-y divide-line border-y border-line">
            {items.map((item) => (
              <div key={item.variantId} className="flex justify-between gap-4 py-4 text-sm">
                <div><div>{item.name}</div><div className="mt-1 text-xs text-mut">{item.sizeLabel ? `${item.sizeLabel} cm · ` : ""}Qty {item.quantity}</div></div>
                <span className="shrink-0">{sek(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><span className="text-mut">Subtotal</span><span>{sek(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-mut">Delivery</span><span className="text-xs">Calculated at checkout</span></div>
          </div>
          <div className="mt-5 flex justify-between border-t border-line pt-5 text-lg font-semibold"><span>Total</span><span>{sek(subtotal)}</span></div>
          <div className="mt-6 border-t border-line pt-5 text-[11px] leading-5 text-mut">
            <p>✓ Secure checkout</p><p className="mt-1">✓ Payment handled by Stripe</p>
          </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
