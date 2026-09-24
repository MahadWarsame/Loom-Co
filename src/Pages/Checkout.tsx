import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: "", email: "", phone: "", line1: "", line2: "", postalCode: "", city: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  if (orderNumber) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Order received</p>
        <h1 className="mt-3 text-5xl">Thank you</h1>
        <p className="mt-5 text-sm leading-7 text-mut">Your order has been created successfully. Your order number is <strong className="text-fg">{orderNumber}</strong>.</p>
        <p className="mt-3 text-sm leading-7 text-mut">We will use the email address you provided for order communication. Payment will be connected in the next step.</p>
        <Link to="/shop" className="mt-8 inline-flex bg-fg px-7 py-4 text-sm font-semibold text-bg transition hover:bg-[#3a3731]">Continue shopping</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-4xl">Your cart is empty</h1>
        <Link to="/shop" className="mt-7 inline-flex bg-fg px-7 py-4 text-sm font-semibold text-bg">Shop rugs</Link>
      </div>
    );
  }

  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

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

    if (rpcError) {
      setError(rpcError.message || "We couldn't create your order. Please check your details and try again.");
      setSubmitting(false);
      return;
    }

    setOrderNumber(data?.order_number ?? "");
    clearCart();
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
      <div className="mb-8">
        <Link to="/cart" className="text-xs text-mut hover:text-fg">← Back to cart</Link>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Checkout</p>
        <h1 className="mt-2 text-5xl">Delivery details</h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submitOrder} className="space-y-8">
          <section>
            <h2 className="font-display text-2xl">Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium sm:col-span-2">Full name<input required value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
              <label className="text-xs font-medium">Email<input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
              <label className="text-xs font-medium">Phone<input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
            </div>
          </section>

          <section className="border-t border-line pt-8">
            <h2 className="font-display text-2xl">Shipping address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium sm:col-span-2">Address<input required value={form.line1} onChange={(e) => update("line1", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
              <label className="text-xs font-medium sm:col-span-2">Apartment, floor, etc. <span className="font-normal text-mut">(optional)</span><input value={form.line2} onChange={(e) => update("line2", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
              <label className="text-xs font-medium">Postcode<input required value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
              <label className="text-xs font-medium">City<input required value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-2 h-12 w-full border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /></label>
            </div>
          </section>

          {error && <div role="alert" className="border border-sale/30 bg-sale/5 p-4 text-sm text-sale">{error}</div>}

          <button type="submit" disabled={submitting} className="w-full bg-fg py-4 text-sm font-semibold text-bg transition hover:bg-[#3a3731] disabled:cursor-wait disabled:opacity-50">
            {submitting ? "Creating order…" : "Place order"}
          </button>
          <p className="text-center text-xs leading-5 text-mut">No payment is taken yet. Payment processing will be connected after the order flow is verified.</p>
        </form>

        <aside className="h-fit border border-line bg-soft/40 p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl">Order summary</h2>
          <div className="mt-5 divide-y divide-line border-y border-line">
            {items.map((item) => (
              <div key={item.variantId} className="flex justify-between gap-4 py-4 text-sm">
                <div><div>{item.name}</div><div className="mt-1 text-xs text-mut">{item.sizeLabel ? `${item.sizeLabel} cm · ` : ""}Qty {item.quantity}</div></div>
                <span className="shrink-0">{sek(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between font-semibold"><span>Total</span><span>{sek(subtotal)}</span></div>
        </aside>
      </div>
    </div>
  );
}
