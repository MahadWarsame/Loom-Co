import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";

function sek(n: number) {
  return Math.round(n).toLocaleString("sv-SE") + " kr";
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
      <div className="min-h-[70vh] bg-[#faf9f6] px-5 py-20 text-center">
        <h1 className="font-display text-4xl">Din varukorg är tom</h1>
        <Link to="/shop" className="mt-7 inline-flex rounded-lg bg-fg px-7 py-4 text-sm font-semibold text-bg">
          Handla mattor
        </Link>
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
        "Vi kunde inte starta den säkra betalningen. Försök igen.",
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
      setError(rpcError?.message || "Vi kunde inte skapa din beställning. Kontrollera dina uppgifter och försök igen.");
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
      <div className="min-h-[70vh] bg-[#faf9f6] px-5 py-20 text-center">
        <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Beställning reserverad</p>
          <h1 className="mt-3 font-display text-4xl">Slutför din betalning</h1>
          <p className="mt-4 text-sm leading-6 text-mut">
            Order <strong className="text-fg">{pendingPayment.orderNumber}</strong> är reserverad för dig under en begränsad tid.
          </p>
          {error && <div role="alert" className="mt-5 rounded-lg border border-sale/30 bg-sale/5 p-4 text-left text-sm text-sale">{error}</div>}
          <button
            type="button"
            onClick={() => void startPayment(pendingPayment)}
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-[#14b8a6] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0d9488] disabled:cursor-wait disabled:opacity-50"
          >
            {submitting ? "Öppnar säker betalning…" : "Fortsätt till betalning"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#f7f7f7]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <Link to="/" className="font-display text-[24px] tracking-[-0.03em]">
            Loom <span className="text-gold">&amp;</span> Co
          </Link>
          <span className="text-xs text-gray-500">Säker checkout</span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">
        <Link to="/cart" className="mb-5 inline-block text-xs text-gray-500 hover:text-gray-900">
          ← Tillbaka till varukorgen
        </Link>

        <form onSubmit={submitOrder} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <section>
            <h1 className="mb-3 text-lg font-bold text-gray-900">Dina uppgifter</h1>
            <div className="overflow-hidden rounded-lg border border-gray-200 divide-y divide-gray-200">
              <label className="block p-3">
                <span className="mb-1 block text-xs text-gray-500">E-postadress</span>
                <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="namn@exempel.se" autoComplete="email" className="w-full text-sm text-gray-800 outline-none placeholder:text-gray-400" />
              </label>
              <label className="block p-3">
                <span className="mb-1 block text-xs text-gray-500">Mobiltelefonnummer</span>
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="070-123 45 67" autoComplete="tel" className="w-full text-sm text-gray-800 outline-none placeholder:text-gray-400" />
              </label>
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 text-lg font-bold text-gray-900">Leveransuppgifter</h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 divide-y divide-gray-200">
              <label className="block p-3">
                <span className="mb-1 block text-xs text-gray-500">Namn</span>
                <input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="För- och efternamn" autoComplete="name" className="w-full text-sm text-gray-800 outline-none placeholder:text-gray-400" />
              </label>
              <label className="block p-3">
                <span className="mb-1 block text-xs text-gray-500">Adress</span>
                <input required value={form.line1} onChange={(e) => update("line1", e.target.value)} placeholder="Gatuadress och nummer" autoComplete="street-address" className="w-full text-sm text-gray-800 outline-none placeholder:text-gray-400" />
              </label>
              <label className="block p-3">
                <span className="mb-1 block text-xs text-gray-500">Lägenhet, våning etc. <span className="text-gray-400">(valfritt)</span></span>
                <input value={form.line2} onChange={(e) => update("line2", e.target.value)} placeholder="T.ex. lgh 1202" autoComplete="address-line2" className="w-full text-sm text-gray-800 outline-none placeholder:text-gray-400" />
              </label>
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                <label className="block p-3">
                  <span className="mb-1 block text-xs text-gray-500">Postnummer</span>
                  <input required value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} placeholder="123 45" autoComplete="postal-code" className="w-full text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                </label>
                <label className="block p-3">
                  <span className="mb-1 block text-xs text-gray-500">Ort</span>
                  <input required value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Stockholm" autoComplete="address-level2" className="w-full text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                </label>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h2 className="text-sm font-bold text-gray-900">Din beställning</h2>
            <div className="mt-3 space-y-3">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-gray-800">{item.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{item.sizeLabel ? item.sizeLabel + " · " : ""}Antal: {item.quantity}</p>
                  </div>
                  <span className="shrink-0 text-gray-800">{sek(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Delsumma</span><span>{sek(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Leverans</span><span>Beräknas i nästa steg</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold"><span>Totalt</span><span>{sek(subtotal)}</span></div>
            </div>
          </section>

          {error && <div role="alert" className="mt-5 rounded-lg border border-sale/30 bg-sale/5 p-4 text-sm text-sale">{error}</div>}

          <button type="submit" disabled={submitting} className="mt-6 w-full rounded-lg bg-[#14b8a6] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488] disabled:cursor-wait disabled:opacity-50">
            {submitting ? "Förbereder betalning…" : "Fortsätt till betalning"}
          </button>

          <div className="space-y-3 pt-5 text-center">
            <Link to="/info/contact" className="block text-xs text-gray-500 underline hover:text-gray-700">Dataskyddspolicy</Link>
            <p className="text-[11px] text-gray-400">Säker betalning via Stripe</p>
            <div className="flex flex-wrap items-center justify-center gap-2 opacity-80">
              <span className="rounded border border-gray-300 bg-white px-2 py-1 text-[10px] font-bold text-red-600">mastercard</span>
              <span className="rounded border border-gray-300 bg-white px-2 py-1 text-[10px] font-bold text-blue-700">VISA</span>
              <span className="rounded border border-gray-300 bg-white px-2 py-1 text-[10px] font-bold text-gray-800"> Pay</span>
              <span className="rounded border border-gray-300 bg-white px-2 py-1 text-[10px] font-bold text-blue-900">STRIPE</span>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
