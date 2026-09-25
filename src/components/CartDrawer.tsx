import { Link } from "react-router-dom";
import { productImageUrl } from "../lib/images";
import { useCart } from "../context/CartContext";

function sek(n: number) {
  return `${Math.round(n).toLocaleString("sv-SE")} kr`;
}

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();

  // Do not mount the drawer at all while closed. This prevents the cart panel
  // from affecting or appearing on the underlying page; it only exists after
  // the customer explicitly clicks the cart icon.
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close cart"
        onClick={onClose}
        className="fixed inset-0 z-[60] cursor-default bg-fg/30 backdrop-blur-[2px]"
      />

      <aside
        aria-label="Shopping cart"
        aria-hidden={false}
        className="fixed right-0 top-0 z-[70] flex h-dvh w-full max-w-md flex-col border-l border-line bg-bg shadow-2xl animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Your selection</p>
            <h2 className="mt-1 font-display text-2xl">Shopping cart{itemCount > 0 ? ` · ${itemCount}` : ""}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close cart" className="grid h-10 w-10 place-items-center transition hover:bg-soft">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-soft">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7"><path d="M4 5h2l1.6 10.2a2 2 0 0 0 2 1.8h7.7a2 2 0 0 0 2-1.6L21 8H7" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
            </div>
            <h3 className="mt-5 font-display text-2xl">Your cart is empty</h3>
            <p className="mt-3 max-w-xs text-sm leading-6 text-mut">Add a rug to your selection and it will appear here.</p>
            <Link to="/shop" onClick={onClose} className="mt-6 bg-fg px-6 py-3 text-sm font-semibold text-bg transition hover:bg-[#3a3731]">Shop rugs</Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-line">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3 px-5 py-5 sm:px-6">
                    <Link to={`/product/${item.slug}`} onClick={onClose} className="h-24 w-20 shrink-0 overflow-hidden bg-soft">
                      {item.imagePath && <img src={productImageUrl(item.imagePath)} alt={item.name} className="h-full w-full object-cover" />}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/product/${item.slug}`} onClick={onClose} className="block font-display text-lg leading-tight hover:text-gold">{item.name}</Link>
                      <p className="mt-1 text-xs text-mut">{item.sizeLabel ? `${item.sizeLabel} cm` : "Selected size"}</p>
                      <div className="mt-2 flex items-baseline gap-2 text-sm"><b>{sek(item.price)}</b>{item.price < item.regularPrice && <s className="text-[11px] text-mut">{sek(item.regularPrice)}</s>}</div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <label className="flex items-center border border-line">
                          <span className="sr-only">Quantity for {item.name}</span>
                          <button type="button" onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="grid h-8 w-8 place-items-center hover:bg-soft" aria-label={`Decrease quantity of ${item.name}`}>−</button>
                          <span className="w-7 text-center text-xs">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="grid h-8 w-8 place-items-center hover:bg-soft" aria-label={`Increase quantity of ${item.name}`}>+</button>
                        </label>
                        <button type="button" onClick={() => removeItem(item.variantId)} className="text-[11px] text-mut underline underline-offset-4 hover:text-fg">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-line bg-soft/40 px-5 py-5 sm:px-6">
              <div className="flex justify-between text-sm"><span className="text-mut">Subtotal</span><span className="font-semibold">{sek(subtotal)}</span></div>
              <p className="mt-2 text-[11px] leading-5 text-mut">Delivery is calculated at checkout.</p>
              <Link to="/checkout" onClick={onClose} className="mt-4 flex w-full justify-center bg-fg py-4 text-sm font-semibold text-bg transition hover:bg-[#3a3731]">Continue to checkout</Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
