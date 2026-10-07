import { Link } from "react-router-dom";
import { productImageUrl } from "../lib/images";
import { useCart } from "../context/CartContext";
import { useAvailability } from "../lib/queries";

function sek(n: number) {
  return `${Math.round(n).toLocaleString("sv-SE")} kr`;
}

export function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const productIds = [...new Set(items.map((item) => item.productId))];
  const { data: availability, isLoading: checkingStock } = useAvailability(productIds);
  const unavailableVariantIds = new Set(
    (availability ?? []).filter((entry) => !entry.in_stock).map((entry) => entry.variant_id),
  );
  const unavailableItems = items.filter((item) => unavailableVariantIds.has(item.variantId));

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Your selection</p>
        <h1 className="mt-3 text-5xl">Your cart is empty</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-mut">Explore our collection and add a rug to your selection when you find the right size.</p>
        <Link to="/shop" className="mt-8 inline-flex bg-fg px-7 py-4 text-sm font-semibold text-bg transition hover:bg-[#3a3731]">Shop rugs</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
      <div className="flex flex-col gap-3 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Your selection</p>
          <h1 className="mt-2 text-5xl">Shopping cart</h1>
        </div>
        <button type="button" onClick={clearCart} className="self-start text-xs text-mut underline underline-offset-4 hover:text-fg sm:self-auto">Clear cart</button>
      </div>

      {unavailableItems.length > 0 && (
        <div role="alert" className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">The following item{unavailableItems.length === 1 ? " is" : "s are"} no longer available:</p>
          <ul className="mt-2 space-y-2">
            {unavailableItems.map((item) => (
              <li key={item.variantId} className="flex items-center justify-between gap-4">
                <span>
                  <strong>{item.name}</strong>
                  {item.sizeLabel ? ` — ${item.sizeLabel} cm` : ""}
                  <span className="ml-2 font-medium">(Out of stock)</span>
                </span>
                <button type="button" onClick={() => removeItem(item.variantId)} className="shrink-0 font-semibold underline underline-offset-4 hover:no-underline">Remove</button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-red-700">Remove the unavailable item{unavailableItems.length === 1 ? "" : "s"} before continuing to checkout.</p>
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-line border-y border-line">
          {items.map((item) => {
            const unavailable = unavailableVariantIds.has(item.variantId);
            return (
              <div key={item.variantId} className={`flex gap-4 py-5 sm:gap-6 ${unavailable ? "bg-red-50/40" : ""}`}>
                <Link to={`/product/${item.slug}`} className="h-28 w-24 shrink-0 overflow-hidden bg-soft sm:h-36 sm:w-32">
                  {item.imagePath && <img src={productImageUrl(item.imagePath)} alt={item.name} className={`h-full w-full object-cover ${unavailable ? "opacity-60" : ""}`} />}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/product/${item.slug}`} className="font-display text-xl leading-tight hover:text-gold">{item.name}</Link>
                    {unavailable && <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-700">Out of stock</span>}
                  </div>
                  <p className="mt-2 text-xs text-mut">{item.sizeLabel ? `${item.sizeLabel} cm` : "Selected size"}</p>
                  <div className="mt-3 text-sm">
                    <b>{sek(item.price)}</b>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <label className="flex items-center border border-line">
                      <span className="sr-only">Quantity for {item.name}</span>
                      <button type="button" disabled={unavailable} onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="grid h-9 w-9 place-items-center hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Decrease quantity of ${item.name}`}>−</button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button type="button" disabled={unavailable} onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="grid h-9 w-9 place-items-center hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Increase quantity of ${item.name}`}>+</button>
                    </label>
                    <button type="button" onClick={() => removeItem(item.variantId)} className="text-xs text-mut underline underline-offset-4 hover:text-fg">Remove</button>
                  </div>
                </div>
                <div className="hidden text-right text-sm font-semibold sm:block">{sek(item.price * item.quantity)}</div>
              </div>
            );
          })}
        </div>

        <aside className="h-fit border border-line bg-soft/40 p-6">
          <h2 className="font-display text-2xl">Order summary</h2>
          <div className="mt-6 space-y-3 border-b border-line pb-5 text-sm">
            <div className="flex justify-between"><span className="text-mut">Items</span><span>{itemCount}</span></div>
            <div className="flex justify-between"><span className="text-mut">Subtotal</span><span>{sek(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-mut">Delivery</span><span>Calculated at checkout</span></div>
          </div>
          <div className="flex justify-between pt-5 text-base font-semibold"><span>Total</span><span>{sek(subtotal)}</span></div>
          {unavailableItems.length > 0 ? (
            <button type="button" disabled className="mt-6 flex w-full cursor-not-allowed justify-center bg-gray-200 py-4 text-sm font-semibold text-gray-500">Remove unavailable item{unavailableItems.length === 1 ? "" : "s"} to checkout</button>
          ) : (
            <Link to="/checkout" className="mt-6 flex w-full justify-center bg-fg py-4 text-sm font-semibold text-bg transition hover:bg-[#3a3731]">{checkingStock ? "Checking stock…" : "Continue to checkout"}</Link>
          )}
          <p className="mt-3 text-center text-[11px] leading-5 text-mut">Your cart is saved on this device. Secure payment is handled at checkout.</p>
        </aside>
      </div>
    </div>
  );
}
