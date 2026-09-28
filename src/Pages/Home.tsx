import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCategories, useProducts } from "../lib/queries";
import { productImageUrl } from "../lib/images";
import { ProductCard } from "../components/ProductCard";

const collections = [
  { slug: "rugs-modern", name: "Modern Rugs", copy: "Clean shapes and contemporary warmth." },
  { slug: "rugs-persian", name: "Traditional Rugs", copy: "Rich patterns inspired by timeless craft." },
  { slug: "rugs-vintage", name: "Vintage Rugs", copy: "Character, texture and a lived-in feel." },
  { slug: "rugs-gabbeh", name: "Bohemian Rugs", copy: "Soft texture for relaxed spaces." },
];

export function Home() {
  const { data: products, isLoading } = useProducts({});
  const { data: categories } = useCategories();
  const [visibleCount, setVisibleCount] = useState(8);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const productPool = useMemo(() => {
    const all = products ?? [];
    const featured = all.filter((p) => p.is_featured);
    return featured.length >= 4 ? featured : all;
  }, [products]);

  const shown = productPool.slice(0, visibleCount);
  const hasMore = visibleCount < productPool.length;
  const heroProduct = productPool[0];
  const heroImage = heroProduct?.images[0];

  const collectionSlugs = (rootSlug: string) => {
    const result = new Set<string>([rootSlug]);
    const children = new Map<string, string[]>();
    for (const category of categories ?? []) {
      if (!category.parent_id) continue;
      const parent = (categories ?? []).find((c) => c.id === category.parent_id);
      if (!parent) continue;
      children.set(parent.slug, [...(children.get(parent.slug) ?? []), category.slug]);
    }
    const walk = (slug: string) => {
      for (const child of children.get(slug) ?? []) {
        if (result.has(child)) continue;
        result.add(child);
        walk(child);
      }
    };
    walk(rootSlug);
    return result;
  };

  useEffect(() => setVisibleCount(8), [products]);
  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisibleCount((count) => Math.min(count + 8, productPool.length));
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, productPool.length]);

  return (
    <div className="bg-bg">
      <section className="overflow-hidden bg-cream">
        <div className="mx-auto grid min-h-[610px] max-w-7xl lg:grid-cols-[0.86fr_1.14fr]">
          <div className="relative z-10 flex items-center px-6 py-14 sm:px-10 lg:px-12 lg:py-20">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-warm">Timeless rugs, warmer spaces</p>
              <h1 className="mt-5 text-5xl leading-[0.98] text-fg sm:text-6xl lg:text-[4.65rem]">Beautiful Rugs<br />for Every Home</h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-mut sm:text-lg">Discover high-quality rugs at exceptional prices. Bring warmth, style and comfort to your space with WarmRugs.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/shop" className="inline-flex min-h-14 items-center rounded-full bg-warm px-8 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#b95f49]">Shop Now <span className="ml-3 text-lg">→</span></Link>
                {heroProduct && <Link to={"/product/" + heroProduct.slug} className="inline-flex min-h-14 items-center rounded-full border border-fg/15 bg-white/50 px-7 text-sm font-semibold text-fg transition hover:bg-white">View featured rug</Link>}
              </div>
              <div className="mt-9 flex gap-2" aria-label="Hero slides">
                <span className="h-2 w-7 rounded-full bg-warm" /><span className="h-2 w-2 rounded-full bg-fg/20" /><span className="h-2 w-2 rounded-full bg-fg/20" />
              </div>
            </div>
          </div>
          <div className="relative min-h-[390px] overflow-hidden bg-sand lg:min-h-0">
            {heroImage ? <img src={productImageUrl(heroImage.storage_path)} alt={heroImage.alt_text ?? heroProduct?.name ?? "WarmRugs rug"} className="h-full w-full object-cover object-center transition duration-700 hover:scale-[1.015]" /> : <div className="h-full w-full bg-gradient-to-br from-[#d6b18c] via-[#ead8c4] to-[#b96850]" />}
            <div className="absolute inset-0 bg-gradient-to-r from-cream/30 via-transparent to-black/10" />
            {heroProduct && <div className="absolute bottom-5 right-5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-fg shadow-lg">Featured rug · {heroProduct.name}</div>}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-4">
          {[
            ["Clear Pricing", "Straightforward prices", "price"],
            ["Secure Payment", "Safe & encrypted", "shield"],
            ["Easy Returns", "30-day policy", "return"],
            ["Premium Quality", "Carefully selected", "leaf"],
          ].map(([title, copy, icon], i) => (
            <div key={title} className={"flex items-center gap-3 px-5 py-6 lg:px-8 " + (i > 0 ? "border-l border-line" : "")}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream text-warm">
                {icon === "price" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z"/><path d="M8 9.5h8M8 13h5"/></svg>}
                {icon === "shield" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><path d="M12 3 20 6v6c0 5-3.3 8-8 9-4.7-1-8-4-8-9V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>}
                {icon === "return" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><path d="M4 7h9a6 6 0 1 1-5.3 8.8"/><path d="M4 7V3m0 4 4-2"/></svg>}
                {icon === "leaf" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5"><path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 10-6 10-15Z"/><path d="M4 20c3-5 7-8 12-10"/></svg>}
              </span>
              <div><p className="text-sm font-semibold text-fg">{title}</p><p className="mt-0.5 text-xs text-mut">{copy}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto mb-9 max-w-2xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-warm">Shop by collection</p>
          <h2 className="mt-2 text-4xl text-fg sm:text-5xl">Find Your Perfect Rug</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {collections.map((collection) => {
            const slugs = collectionSlugs(collection.slug);
            const collectionProduct = (products ?? []).find((p) => p.images.length > 0 && p.categorySlugs.some((slug) => slugs.has(slug)));
            const image = collectionProduct?.images[0];
            return (
              <Link key={collection.slug} to={"/shop?cat=" + collection.slug} className="group relative aspect-[1.08] overflow-hidden rounded-xl bg-soft sm:aspect-[1.18]">
                {image ? <img src={productImageUrl(image.storage_path)} alt={image.alt_text ?? collection.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" /> : <div className="h-full w-full bg-gradient-to-br from-cream to-sand" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                  <div><p className="text-lg font-medium text-white sm:text-xl">{collection.name}</p><p className="mt-1 text-[11px] text-white/75">{collection.copy}</p></div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-fg transition group-hover:translate-x-1">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-soft">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-warm">WarmRugs collection</p><h2 className="mt-2 text-4xl text-fg sm:text-5xl">Popular Rugs</h2><p className="mt-3 max-w-xl text-sm leading-6 text-mut">Beautiful pieces, clear sizes and prices — so you can choose with confidence.</p></div>
            <Link to="/shop" className="hidden rounded-full border border-fg/15 bg-white px-5 py-2.5 text-sm font-semibold sm:block">View all</Link>
          </div>
          {isLoading ? <div className="grid grid-cols-2 gap-5 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-white" />)}</div> : <><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">{shown.map((p) => <ProductCard key={p.id} product={p} />)}</div>{hasMore && <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center pt-8"><span className="text-xs text-mut">Loading more rugs…</span></div>}</>}
        </div>
      </section>

      <section className="bg-warm text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70">Make your space warmer</p><h2 className="mt-3 max-w-2xl text-4xl leading-tight sm:text-5xl">The right rug changes the room.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/80">Explore the collection and find a piece that fits your home, your style and your budget.</p></div>
          <Link to="/shop" className="inline-flex w-fit items-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-warm transition hover:-translate-y-0.5">Explore rugs <span className="ml-3">→</span></Link>
        </div>
      </section>
    </div>
  );
}
