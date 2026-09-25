import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
type OrderItem = { id: number; product_name: string; sku: string; size_label: string | null; unit_price: number; quantity: number; line_total: number };
type Order = { id: string; order_number: string; created_at: string; customer_email: string; customer_name: string; customer_phone: string | null; shipping_line1: string; shipping_line2: string | null; shipping_postal_code: string; shipping_city: string; shipping_country_code: string; subtotal: number; shipping_amount: number; total: number; status: OrderStatus; payment_status: PaymentStatus; order_items: OrderItem[] };

const statuses: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "Alla" }, { value: "pending", label: "Pending" }, { value: "paid", label: "Betald" },
  { value: "processing", label: "Behandlas" }, { value: "shipped", label: "Skickad" }, { value: "completed", label: "Slutförd" }, { value: "cancelled", label: "Avbruten" },
];

function sek(value: number) { return Math.round(Number(value)).toLocaleString("sv-SE") + " kr"; }
function statusLabel(status: string) { return statuses.find((item) => item.value === status)?.label ?? status; }
function statusClass(status: string) {
  if (status === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "shipped") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "processing" || status === "paid") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "cancelled") return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
}

export function AdminPage() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setIsAdmin(data.session?.user.app_metadata?.role === "admin");
        setSessionChecked(true);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAdmin(session?.user.app_metadata?.role === "admin");
        setSessionChecked(true);
      }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { if (isAdmin) void loadOrders(); }, [isAdmin]);

  async function loadOrders() {
    setLoading(true);
    setDataError("");
    const { data, error } = await supabase
      .from("orders")
      .select("id,order_number,created_at,customer_email,customer_name,customer_phone,shipping_line1,shipping_line2,shipping_postal_code,shipping_city,shipping_country_code,subtotal,shipping_amount,total,status,payment_status,order_items(id,product_name,sku,size_label,unit_price,quantity,line_total)")
      .order("created_at", { ascending: false });
    if (error) { setDataError(error.message); setOrders([]); }
    else setOrders((data ?? []) as Order[]);
    setLoading(false);
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthError(error.message); return; }
    if (data.user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setAuthError("Det här kontot har inte administratörsbehörighet.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSelected(null);
    setOrders([]);
  }

  async function updateStatus(order: Order, nextStatus: OrderStatus) {
    if (nextStatus === order.status) return;
    setSaving(true);
    setDataError("");
    const { error } = await supabase.from("orders").update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
    if (error) setDataError(error.message);
    else {
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: nextStatus } : item));
      setSelected((current) => current?.id === order.id ? { ...current, status: nextStatus } : current);
    }
    setSaving(false);
  }

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!term) return true;
      return [order.order_number, order.customer_name, order.customer_email, order.customer_phone]
        .filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [orders, search, statusFilter]);

  const totals = useMemo(() => ({
    orders: orders.length,
    paid: orders.filter((o) => o.payment_status === "paid").length,
    processing: orders.filter((o) => o.status === "processing").length,
    revenue: orders.filter((o) => o.payment_status === "paid").reduce((sum, o) => sum + Number(o.total), 0),
  }), [orders]);

  if (!sessionChecked) {
    return <div className="min-h-[70vh] bg-[#f7f5f0] grid place-items-center text-sm text-mut">Laddar admin…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-[#f7f5f0] px-5 py-16">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Loom &amp; Co</p>
            <h1 className="mt-3 font-display text-4xl">Admin</h1>
            <p className="mt-3 text-sm leading-6 text-mut">Logga in med ett administratörskonto för att hantera beställningar.</p>
          </div>
          <form onSubmit={signIn} className="rounded-2xl border border-line bg-bg p-6 shadow-sm">
            <label className="block text-sm font-medium">E-post
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full border border-line bg-white px-3 py-3 text-sm outline-none focus:border-fg" autoComplete="email" />
            </label>
            <label className="mt-4 block text-sm font-medium">Lösenord
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full border border-line bg-white px-3 py-3 text-sm outline-none focus:border-fg" autoComplete="current-password" />
            </label>
            {authError && <div role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{authError}</div>}
            <button type="submit" className="mt-5 w-full bg-fg py-3.5 text-sm font-semibold text-bg transition hover:opacity-90">Logga in</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#f5f4f0]">
      <div className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-10">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Loom &amp; Co</p><h1 className="mt-1 font-display text-3xl sm:text-4xl">Orders</h1></div>
          <button onClick={() => void signOut()} className="border border-line px-4 py-2 text-xs font-semibold transition hover:border-fg">Logga ut</button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-line bg-bg p-5"><p className="text-[10px] uppercase tracking-[0.18em] text-mut">Beställningar</p><p className="mt-2 font-display text-3xl">{totals.orders}</p></div>
          <div className="border border-line bg-bg p-5"><p className="text-[10px] uppercase tracking-[0.18em] text-mut">Betalda</p><p className="mt-2 font-display text-3xl">{totals.paid}</p></div>
          <div className="border border-line bg-bg p-5"><p className="text-[10px] uppercase tracking-[0.18em] text-mut">Behandlas</p><p className="mt-2 font-display text-3xl">{totals.processing}</p></div>
          <div className="border border-line bg-bg p-5"><p className="text-[10px] uppercase tracking-[0.18em] text-mut">Betald försäljning</p><p className="mt-2 font-display text-3xl">{sek(totals.revenue)}</p></div>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök ordernummer, kund eller e-post…" className="min-w-0 flex-1 border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-fg" />
          <div className="flex gap-2 overflow-x-auto">
            {statuses.map((item) => <button key={item.value} onClick={() => setStatusFilter(item.value)} className={"whitespace-nowrap border px-3 py-3 text-xs font-semibold " + (statusFilter === item.value ? "border-fg bg-fg text-bg" : "border-line bg-bg hover:border-fg")}>{item.label}</button>)}
          </div>
        </div>

        {dataError && <div role="alert" className="mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{dataError}</div>}

        <div className="mt-6 overflow-hidden border border-line bg-bg">
          <div className="hidden grid-cols-[1.25fr_1.4fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-line bg-soft px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-mut md:grid">
            <span>Order</span><span>Kund</span><span>Datum</span><span>Betalning</span><span>Status</span><span className="text-right">Totalt</span>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-mut">Laddar beställningar…</div> : filteredOrders.length === 0 ? <div className="p-10 text-center text-sm text-mut">Inga beställningar hittades.</div> : (
            <div className="divide-y divide-line">
              {filteredOrders.map((order) => <button key={order.id} type="button" onClick={() => setSelected(order)} className="grid w-full gap-2 px-5 py-4 text-left transition hover:bg-soft md:grid-cols-[1.25fr_1.4fr_1fr_0.8fr_0.8fr_0.8fr] md:items-center md:gap-4">
                <div><p className="text-sm font-semibold">{order.order_number}</p><p className="mt-1 text-xs text-mut">{order.order_items.length} {order.order_items.length === 1 ? "artikel" : "artiklar"}</p></div>
                <div><p className="text-sm">{order.customer_name}</p><p className="mt-1 truncate text-xs text-mut">{order.customer_email}</p></div>
                <p className="text-xs text-mut">{new Date(order.created_at).toLocaleDateString("sv-SE")}</p>
                <span className={"w-fit rounded-full border px-2 py-1 text-[10px] font-semibold " + (order.payment_status === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-600")}>{order.payment_status === "paid" ? "Betald" : order.payment_status}</span>
                <span className={"w-fit rounded-full border px-2 py-1 text-[10px] font-semibold " + statusClass(order.status)}>{statusLabel(order.status)}</span>
                <p className="text-right text-sm font-semibold">{sek(Number(order.total))}</p>
              </button>)}
            </div>
          )}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/30" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-bg shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-5 py-4">
              <div><p className="text-[10px] uppercase tracking-[0.18em] text-gold">Orderdetaljer</p><h2 className="mt-1 font-display text-2xl">{selected.order_number}</h2></div>
              <button onClick={() => setSelected(null)} aria-label="Stäng" className="grid h-9 w-9 place-items-center border border-line text-lg">×</button>
            </div>
            <div className="space-y-6 p-5">
              <section><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">Kund</p><div className="mt-3 space-y-1 text-sm"><p className="font-semibold">{selected.customer_name}</p><p>{selected.customer_email}</p>{selected.customer_phone && <p>{selected.customer_phone}</p>}</div></section>
              <section><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">Leveransadress</p><div className="mt-3 text-sm leading-6"><p>{selected.shipping_line1}</p>{selected.shipping_line2 && <p>{selected.shipping_line2}</p>}<p>{selected.shipping_postal_code} {selected.shipping_city}</p><p>{selected.shipping_country_code}</p></div></section>
              <section><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">Artiklar</p><div className="mt-3 divide-y divide-line border-y border-line">{selected.order_items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-sm"><div><p className="font-medium">{item.product_name}</p><p className="mt-1 text-xs text-mut">{item.sku}{item.size_label ? " · " + item.size_label : ""} · {item.quantity} st</p></div><p className="font-semibold">{sek(Number(item.line_total))}</p></div>)}</div></section>
              <section className="space-y-2 border-t border-line pt-4 text-sm"><div className="flex justify-between"><span className="text-mut">Delsumma</span><span>{sek(Number(selected.subtotal))}</span></div><div className="flex justify-between"><span className="text-mut">Leverans</span><span>{sek(Number(selected.shipping_amount))}</span></div><div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><span>Totalt</span><span>{sek(Number(selected.total))}</span></div></section>
              <section><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">Betalning</p><div className="mt-3 rounded-lg border border-line bg-soft p-4 text-sm"><p className="font-semibold">{selected.payment_status === "paid" ? "Betald" : selected.payment_status}</p><p className="mt-1 text-xs text-mut">Orderstatus: {statusLabel(selected.status)}</p></div></section>
              <section><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">Uppdatera orderstatus</p><div className="mt-3 grid grid-cols-2 gap-2">{statuses.filter((item) => item.value !== "all").map((item) => <button key={item.value} disabled={saving} onClick={() => void updateStatus(selected, item.value)} className={"border px-3 py-2.5 text-xs font-semibold transition " + (selected.status === item.value ? "border-fg bg-fg text-bg" : "border-line hover:border-fg")}>{item.label}</button>)}</div></section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
