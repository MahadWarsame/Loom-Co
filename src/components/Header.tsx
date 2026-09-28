import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCategories } from "../lib/queries";
import { useCart } from "../context/CartContext";
import { CartDrawer } from "./CartDrawer";

function WarmRugsLogo() {
  return (
    <img
      src="/warmrugs-logo.svg"
      alt="WarmRugs"
      className="h-12 w-auto max-w-[205px] object-contain sm:h-14 sm:max-w-[225px]"
    />
  );
}

export function Header() {
  const { data: categories } = useCategories();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { itemCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const topLevel = (categories ?? []).filter((c) => c.parent_id === null).slice(0, 5);
  const childrenOf = (parentId: string) =>
    (categories ?? [])
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const value = query.trim();
    navigate(value ? "/shop?q=" + encodeURIComponent(value) : "/shop");
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-bg/95 backdrop-blur-xl">
      <div className="flex min-h-10 items-center justify-center gap-4 bg-warm px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white sm:gap-8 sm:text-[11px]">
        <span>Secure payments</span>
        <span className="hidden h-4 w-px bg-white/40 sm:block" />
        <span>Premium quality rugs</span>
        <span className="hidden h-4 w-px bg-white/40 sm:block" />
        <span className="hidden sm:inline">Clear pricing</span>
      </div>

      <div className="mx-auto flex min-h-[82px] max-w-7xl items-center gap-5 px-5 sm:px-8 lg:px-10">
        <Link to="/" className="group flex shrink-0 items-center" aria-label="WarmRugs home">
          <WarmRugsLogo />
        </Link>

        <nav className="ml-auto hidden items-center gap-8 text-[13px] font-medium md:flex" aria-label="Main">
          <Link to="/" className="transition hover:text-warm">Home</Link>
          <Link to="/shop" className="transition hover:text-warm">Shop</Link>
          <Link to="/shop" className="transition hover:text-warm">Collections</Link>
          {topLevel.slice(0, 2).map((c) => {
            const children = childrenOf(c.id);
            return (
              <div key={c.id} className="group relative flex h-[82px] items-center">
                <Link to={"/shop?cat=" + c.slug} className="transition hover:text-warm">
                  {c.name}
                </Link>
                {children.length > 0 && (
                  <div className="pointer-events-none absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 -translate-y-2 border border-line bg-bg p-3 opacity-0 shadow-xl transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-warm">{c.name}</div>
                    <div className="space-y-0.5">
                      {children.map((child) => (
                        <Link key={child.id} to={"/shop?cat=" + child.slug} className="block px-2 py-2 text-sm transition hover:bg-soft hover:text-warm">
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <Link to="/info/about" className="transition hover:text-warm">About Us</Link>
          <Link to="/info/contact" className="transition hover:text-warm">Contact</Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-5">
          <button type="button" aria-label="Search" aria-expanded={searchOpen} onClick={() => setSearchOpen((v) => !v)} className="grid h-11 w-11 place-items-center transition hover:bg-soft">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.2 4.2"/></svg>
          </button>
          <button type="button" onClick={() => setCartOpen(true)} aria-label={"Cart" + (itemCount ? ", " + itemCount + " items" : "")} className="relative grid h-11 w-11 place-items-center transition hover:bg-soft">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M4 5h2l1.6 10.2a2 2 0 0 0 2 1.8h7.7a2 2 0 0 0 2-1.6L21 8H7"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
            {itemCount > 0 && <span className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-warm px-1 text-[9px] font-semibold text-white">{itemCount > 99 ? "99+" : itemCount}</span>}
          </button>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {searchOpen && (
        <div className="border-t border-line/60 px-5 py-3 sm:px-8 lg:px-10">
          <form onSubmit={submitSearch} className="mx-auto flex max-w-3xl gap-2">
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rugs, brands, colours or materials…" className="h-11 min-w-0 flex-1 border border-line bg-bg px-3 text-sm outline-none focus:border-warm" />
            <button className="h-11 bg-warm px-5 text-sm font-semibold text-white">Search</button>
          </form>
        </div>
      )}
      <div className="flex gap-6 overflow-x-auto border-t border-line/60 px-5 py-2.5 text-[11px] font-medium md:hidden">
        <Link to="/" className="whitespace-nowrap">Home</Link>
        <Link to="/shop" className="whitespace-nowrap">Shop</Link>
        <Link to="/shop" className="whitespace-nowrap">Collections</Link>
        {topLevel.map((c) => <Link key={c.id} to={"/shop?cat=" + c.slug} className="whitespace-nowrap">{c.name}</Link>)}
      </div>
    </header>
  );
}
