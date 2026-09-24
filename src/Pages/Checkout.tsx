import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";

function sek(n: number) {
  return Math.round(n).toLocaleString("sv-SE") + " kr";
}

type CustomerType = "private" | "business";
type Carrier = "schenker" | "citymail" | "instabox" | "budbee";

type FormState = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  company: string;
};

type PendingPayment = {
  orderId: string;
  orderNumber: string;
  checkoutToken: string;
};

const carriers: Array<{ id: Carrier; name: string; price: number; note: string }> = [
  { id: "schenker", name: "Schenker", price: 49, note: "Leverans till ombud" },
  { id: "citymail", name: "Citymail", price: 59, note: "Hemleverans" },
  { id: "instabox", name: "Instabox", price: 69, note: "Leverans till paketbox" },
  { id: "budbee", name: "Budbee", price: 79, note: "Snabb hemleverans" },
];

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customerType, setCustomerType] = useState<CustomerType>("private");
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [priorityPacking, setPriorityPacking] = useState(false);
  const [pickupLocation, setPickupLocation] = useState("");
  const [form, setForm] = useState<FormState>({
    name: "", email: "", phone: "", line1: "", line2: "", postalCode: "", city: "", company: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

  if (items.length === 0 && !pendingPayment) {
    return (
      <div className="min-h-[70vh] bg-[#faf9f6] px-5 py-20 text-center">
        <h1 className="font-display text-4xl">Din varukorg är tom</h1>
        <Link to="/shop" className="mt-7 inline-flex rounded-lg bg-fg px-7 py-4 text-sm font-semibold text-bg">Handla mattor</Link>
      </div>
    );
  }

  const update = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validPostalCode = /^\d{3}\s?\d{2}$/.test(form.postalCode.trim());
  const selectedShipping = carriers.find((carrier) => carrier.id === selectedCarrier);
  const shippingPrice = selectedShipping?.price ?? 0;

  function openShipping() {
    if (!validPostalCode) return;
    setStep(2);
  }

  function openPayment() {
    if (!selectedCarrier) return;
    if ((selectedCarrier === "instabox" || selectedCarrier === "budbee") && !pickupLocation) {
      setError("Välj leveransalternativ innan du fortsätter.");
      return;
    }
    setError("");
    setStep(3);
  }

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
          <p className="mt-4 text-sm leading-6 text-mut">Order <strong className="text-fg">{pendingPayment.orderNumber}</strong> är reserverad för dig under en begränsad tid.</p>
          {error && <div role="alert" className="mt-5 rounded-lg border border-sale/30 bg-sale/5 p-4 text-left text-sm text-sale">{error}</div>}
          <button type="button" onClick={() => void startPayment(pendingPayment)} disabled={submitting} className="mt-6 w-full rounded-lg bg-[#14b8a6] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0d9488] disabled:cursor-wait disabled:opacity-50">
            {submitting ? "Öppnar säker betalning…" : "Fortsätt till betalning"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#f7f7f7]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-5 sm:px-6">
          <Link to="/" className="font-display text-[24px] tracking-[-0.03em]">Loom <span className="text-gold">&amp;</span> Co</Link>
          <span className="text-xs text-gray-500">Säker checkout</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
        <Link to="/cart" className="mb-4 inline-block text-xs text-gray-500 hover:text-gray-900">← Tillbaka till varukorgen</Link>

        <form onSubmit={submitOrder} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <section className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Steg 1 av 3</p>
                <h1 className="mt-1 text-lg font-bold text-gray-900">Din beställning</h1>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{items.length} {items.length === 1 ? "vara" : "varor"}</span>
            </div>

            <div className="mt-4 divide-y divide-gray-200 rounded-lg border border-gray-200">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 p-3">
                  {item.imagePath ? (
                    <img src={item.imagePath} alt="" className="h-16 w-16 rounded-md object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-md bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.sizeLabel ? item.sizeLabel + " · " : ""}Antal: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium">{sek(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="space-y-2 bg-gray-50 p-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Delsumma</span><span>{sek(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Leverans</span><span>{selectedShipping ? sek(shippingPrice) : "Välj senare"}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold"><span>Totalt</span><span>{sek(subtotal + shippingPrice)}</span></div>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-bold text-gray-900">Kundtyp</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setCustomerType("private")} className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${customerType === "private" ? "border-[#14b8a6] bg-[#ecfdf5] text-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>Privatperson</button>
                <button type="button" onClick={() => setCustomerType("business")} className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${customerType === "business" ? "border-[#14b8a6] bg-[#ecfdf5] text-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>Företag</button>
              </div>
              {customerType === "business" && (
                <input value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Företagsnamn" className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#14b8a6]" />
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-900">
                <span>Ange postnummer</span>
                <input required value={form.postalCode} onChange={(e) => update("postalCode", e.target.value.replace(/[^0-9 ]/g, "").slice(0, 6))} placeholder="123 45" inputMode="numeric" autoComplete="postal-code" className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#14b8a6]" />
              </label>
              {validPostalCode && (
                <button type="button" onClick={openShipping} className="mt-3 w-full rounded-lg bg-[#14b8a6] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488]">
                  Välj fraktsätt
                </button>
              )}
            </div>
          </section>

          <div className="border-t border-gray-200">
            <button type="button" onClick={() => step >= 2 && setStep(step === 2 ? 1 : 2)} disabled={step < 2} className="flex w-full items-center justify-between px-4 py-4 text-left sm:px-6 disabled:cursor-default">
              <span className={step >= 2 ? "font-bold text-gray-900" : "font-medium text-gray-400"}>Steg 2 · Välj fraktsätt</span>
              <span className="text-lg text-gray-400">{step >= 2 ? "⌃" : "🔒"}</span>
            </button>

            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${step >= 2 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="min-h-0 overflow-hidden">
                <section className="px-4 pb-5 sm:px-6">
                  <div className="space-y-2">
                    {carriers.map((carrier) => {
                      const selected = selectedCarrier === carrier.id;
                      return (
                        <div key={carrier.id} className={`rounded-lg border transition ${selected ? "border-[#14b8a6] bg-[#ecfdf5]" : "border-gray-200"}`}>
                          <button type="button" onClick={() => { setSelectedCarrier(carrier.id); setPickupLocation(""); setError(""); }} className="flex w-full items-center justify-between gap-3 p-3 text-left">
                            <span>
                              <span className="block text-sm font-semibold text-gray-900">{carrier.name}</span>
                              <span className="mt-0.5 block text-xs text-gray-500">{carrier.note}</span>
                            </span>
                            <span className="text-sm font-bold text-gray-900">{sek(carrier.price)}</span>
                          </button>
                          {selected && (carrier.id === "instabox" || carrier.id === "budbee") && (
                            <div className="border-t border-gray-200 p-3">
                              {carrier.id === "instabox" ? (
                                <label className="block text-xs text-gray-600">
                                  Välj paketbox
                                  <select required value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none focus:border-[#14b8a6]">
                                    <option value="">Välj pickup-plats</option>
                                    <option value="central">Loom &amp; Co Box · Centrum</option>
                                    <option value="station">Loom &amp; Co Box · Centralstationen</option>
                                    <option value="mall">Loom &amp; Co Box · Shoppingcenter</option>
                                  </select>
                                </label>
                              ) : (
                                <label className="flex items-center gap-3 text-sm text-gray-700">
                                  <input type="checkbox" checked={priorityPacking} onChange={(e) => setPriorityPacking(e.target.checked)} className="h-4 w-4 accent-[#14b8a6]" />
                                  Prioriterad packning
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-lg border border-gray-200 p-4">
                    <p className="mb-3 text-sm font-bold text-gray-900">Leveransadress</p>
                    <div className="space-y-2">
                      <input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="För- och efternamn" autoComplete="name" className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#14b8a6]" />
                      <input required value={form.line1} onChange={(e) => update("line1", e.target.value)} placeholder="Gatuadress och nummer" autoComplete="street-address" className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#14b8a6]" />
                      <div className="grid grid-cols-2 gap-2">
                        <input required value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} placeholder="123 45" autoComplete="postal-code" className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#14b8a6]" />
                        <input required value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Ort" autoComplete="address-level2" className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#14b8a6]" />
                      </div>
                      <input value={form.line2} onChange={(e) => update("line2", e.target.value)} placeholder="Lägenhet, våning etc. (valfritt)" autoComplete="address-line2" className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#14b8a6]" />
                    </div>
                  </div>

                  {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

                  <button type="button" onClick={openPayment} disabled={!selectedCarrier} className="mt-4 w-full rounded-lg bg-gray-900 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400">
                    Visa betalningssätt
                  </button>
                </section>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200">
            <button type="button" onClick={() => step === 3 && setStep(2)} disabled={step < 3} className="flex w-full items-center justify-between px-4 py-4 text-left sm:px-6 disabled:cursor-default">
              <span className={step >= 3 ? "font-bold text-gray-900" : "font-medium text-gray-400"}>Steg 3 · Kontaktuppgifter</span>
              <span className="text-lg text-gray-400">{step >= 3 ? "⌃" : "🔒"}</span>
            </button>

            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${step >= 3 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="min-h-0 overflow-hidden">
                <section className="px-4 pb-6 sm:px-6">
                  <div className="overflow-hidden rounded-lg border border-gray-200 divide-y divide-gray-200">
                    <label className="block p-3">
                      <span className="mb-1 block text-xs text-gray-500">E-postadress</span>
                      <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="namn@exempel.se" autoComplete="email" className="w-full text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                    </label>
                    <label className="block p-3">
                      <span className="mb-1 block text-xs text-gray-500">Mobiltelefonnummer</span>
                      <input required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="070-123 45 67" autoComplete="tel" className="w-full text-sm text-gray-800 outline-none placeholder:text-gray-400" />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold">
                    <span className="rounded bg-pink-600 px-2 py-1 text-white">walley</span>
                    <span className="rounded border border-blue-200 bg-white px-2 py-1 text-blue-600">swish</span>
                    <span className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-900"> Pay</span>
                    <span className="rounded border border-gray-200 bg-white px-2 py-1 text-blue-900">Trustly</span>
                    <span className="rounded border border-gray-200 bg-white px-2 py-1 text-red-600">mastercard</span>
                    <span className="rounded border border-gray-200 bg-white px-2 py-1 text-blue-700">VISA</span>
                  </div>

                  <button type="submit" disabled={submitting || !form.email || !form.phone} className="mt-5 w-full rounded-lg bg-[#14b8a6] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d9488] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400">
                    {submitting ? "Förbereder betalning…" : "Fortsätt till betalning"}
                  </button>

                  <Link to="/info/contact" className="mt-4 block text-center text-xs text-gray-500 underline hover:text-gray-700">Dataskyddspolicy</Link>
                </section>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
