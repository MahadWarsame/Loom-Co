import { Link } from "react-router-dom";
import { productImageUrl } from "../lib/images";
import { useCart } from "../context/CartContext";

function sek(n: number) {
  return `${Math.round(n).toLocaleString("sv-SE")} kr`;
}

export function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();

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

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 py-5 sm:gap-6">
              <Link to={`/product/${item.slug}`} className="h-28 w-24 shrink-0 overflow-hidden bg-soft sm:h-36 sm:w-32">
                {item.imagePath && <img src={productImageUrl(item.imagePath)} alt={item.name} className="h-full w-full object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/product/${item.slug}`} className="font-display text-xl leading-tight hover:text-gold">{item.name}</Link>
                <p className="mt-2 text-xs text-mut">{item.sizeLabel ? `${item.sizeLabel} cm` : "Selected size"}</p>
                <div className="mt-3 text-sm">
                  <b>{sek(item.price)}</b>
                  {item.price < item.regularPrice && <s className="ml-2 text-xs text-mut">{sek(item.regularPrice)}</s>}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <label className="flex items-center border border-line">
                    <span className="sr-only">Quantity for {item.name}</span>
                    <button type="button" onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="grid h-9 w-9 place-items-center hover:bg-soft" aria-label={`Decrease quantity of ${item.name}`}>−</button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="grid h-9 w-9 place-items-center hover:bg-soft" aria-label={`Increase quantity of ${item.name}`}>+</button>
                  </label>
                  <button type="button" onClick={() => removeItem(item.variantId)} className="text-xs text-mut underline underline-offset-4 hover:text-fg">Remove</button>
                </div>
              </div>
              <div className="hidden text-right text-sm font-semibold sm:block">{sek(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>

        <aside className="h-fit border border-line bg-soft/40 p-6">
          <h2 className="font-display text-2xl">Order summary</h2>
          <div className="mt-6 space-y-3 border-b border-line pb-5 text-sm">
            <div className="flex justify-between"><span className="text-mut">Items</span><span>{itemCount}</span></div>
            <div className="flex justify-between"><span className="text-mut">Subtotal</span><span>{sek(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-mut">Delivery</span><span>Calculated at checkout</span></div>
          </div>
          <div className="flex justify-between pt-5 text-base font-semibold"><span>Total</span><span>{sek(subtotal)}</span></div>
          <Link to="/checkout" className="mt-6 flex w-full justify-center bg-fg py-4 text-sm font-semibold text-bg transition hover:bg-[#3a3731]">Continue to checkout</Link>
          <p className="mt-3 text-center text-[11px] leading-5 text-mut">Your cart is saved on this device. Checkout and secure payment will be connected next.</p>
        </aside>
      </div>
    </div>
  );
}
