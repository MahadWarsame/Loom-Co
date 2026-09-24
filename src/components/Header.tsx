import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCategories } from "../lib/queries";

export function Header() {
  const { data: categories } = useCategories();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const topLevel = (categories ?? []).filter((c) => c.parent_id === null).slice(0, 5);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const value = query.trim();
    navigate(value ? `/shop?q=${encodeURIComponent(value)}` : "/shop");
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-bg/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-5 px-5 sm:px-8 lg:px-10">
        <Link to="/" className="font-display text-[25px] tracking-[-0.03em]">Loom <span className="text-gold">&amp;</span> Co</Link>
        <nav className="ml-auto hidden items-center gap-7 text-[13px] font-medium md:flex" aria-label="Main">
          <Link to="/shop" className="transition hover:text-gold">Shop all</Link>
          {topLevel.map((c) => <Link key={c.id} to={`/shop?cat=${c.slug}`} className="transition hover:text-gold">{c.name}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-5">
          <button type="button" aria-label="Search" aria-expanded={searchOpen} onClick={() => setSearchOpen((v) => !v)} className="grid h-10 w-10 place-items-center transition hover:bg-soft">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.2 4.2"/></svg>
          </button>
          <button aria-label="Wishlist" className="hidden h-10 w-10 place-items-center transition hover:bg-soft sm:grid"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M20.8 8.7c0 5.1-8.8 10-8.8 10s-8.8-4.9-8.8-10A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.3Z"/></svg></button>
          <button aria-label="Cart" className="relative grid h-10 w-10 place-items-center transition hover:bg-soft"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M4 5h2l1.6 10.2a2 2 0 0 0 2 1.8h7.7a2 2 0 0 0 2-1.6L21 8H7"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg></button>
        </div>
      </div>
      {searchOpen && (
        <div className="border-t border-line/60 px-5 py-3 sm:px-8 lg:px-10">
          <form onSubmit={submitSearch} className="mx-auto flex max-w-3xl gap-2">
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rugs, brands, colours or materials…" className="h-11 min-w-0 flex-1 border border-line bg-bg px-3 text-sm outline-none focus:border-fg" />
            <button className="h-11 bg-fg px-5 text-sm text-bg">Search</button>
          </form>
        </div>
      )}
      <div className="flex gap-5 overflow-x-auto border-t border-line/60 px-5 py-2.5 text-[11px] font-medium md:hidden">
        <Link to="/shop" className="whitespace-nowrap">Shop all</Link>
        {topLevel.map((c) => <Link key={c.id} to={`/shop?cat=${c.slug}`} className="whitespace-nowrap">{c.name}</Link>)}
      </div>
    </header>
  );
}