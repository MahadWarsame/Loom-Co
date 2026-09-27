import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCategories, useProducts } from "../lib/queries";
import { productImageUrl } from "../lib/images";
import { ProductCard } from "../components/ProductCard";

const collections = [
  { slug: "rugs-persian", name: "Persian", eyebrow: "Heritage & craft", copy: "Traditional patterns with depth and character." },
  { slug: "rugs-vintage", name: "Vintage", eyebrow: "Character & patina", copy: "Aged character for rooms that feel lived in." },
  { slug: "rugs-modern", name: "Modern", eyebrow: "Clean & contemporary", copy: "Confident shapes for modern interiors." },
  { slug: "rugs-gabbeh", name: "Gabbeh", eyebrow: "Texture & warmth", copy: "Rich texture and understated warmth." },
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
    <div>
      <section className="relative overflow-hidden border-b border-line bg-[#ebe5da]">
        <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14 lg:px-10 lg:py-14">
          <div className="relative z-10 max-w-xl py-6 lg:py-10">
            <div className="inline-flex items-center gap-2 border border-fg/10 bg-bg/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Curated rugs · Sale pieces available
            </div>
            <h1 className="mt-6 max-w-2xl text-[3.25rem] leading-[0.94] sm:text-6xl lg:text-[5.2rem]">The rug that makes the room.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-mut sm:text-lg">Discover Persian, vintage, gabbeh and modern rugs selected to add warmth, texture and character to your home.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/shop" className="inline-flex min-h-14 items-center justify-center bg-fg px-7 text-sm font-semibold text-bg transition hover:-translate-y-0.5 hover:bg-[#3a3731]">Shop rugs <span className="ml-3">→</span></Link>
              {heroProduct && <Link to={"/product/" + heroProduct.slug} className="inline-flex min-h-14 items-center justify-center border border-fg/20 bg-bg/60 px-7 text-sm font-semibold backdrop-blur transition hover:bg-bg">View featured rug</Link>}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-fg/10 pt-5 text-[11px]">
              <div><b className="block text-sm">Curated</b><span className="mt-1 block text-mut">Selected with care</span></div>
              <div><b className="block text-sm">Clear sizes</b><span className="mt-1 block text-mut">Choose your fit</span></div>
              <div><b className="block text-sm">Secure</b><span className="mt-1 block text-mut">Simple checkout</span></div>
            </div>
          </div>

          <div className="relative lg:pl-4">
            <div className="absolute -inset-8 bg-gold/10 blur-3xl" />
            <Link to={heroProduct ? "/product/" + heroProduct.slug : "/shop"} className="group relative block aspect-[4/4.7] overflow-hidden bg-soft shadow-2xl shadow-black/10 sm:aspect-[5/5.5]">
              {heroImage ? <img src={productImageUrl(heroImage.storage_path)} alt={heroImage.alt_text ?? (heroProduct?.name ?? "Loom & Co rug")} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" /> : <div className="flex h-full items-center justify-center text-mut">Discover the collection</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              {heroProduct && <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-7"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">Featured now</p><div className="mt-1 flex items-end justify-between gap-4"><div><p className="font-display text-xl sm:text-2xl">{heroProduct.name}</p><p className="mt-1 text-xs text-white/70">Tap to view sizes & price</p></div><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-fg transition group-hover:translate-x-1">→</span></div></div>}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-bg">
        <div className="mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-4">
          {[
            ["01", "Curated collection", "Distinctive rugs, selected one by one."],
            ["02", "Clear product details", "Sizes, materials and prices in one place."],
            ["03", "Simple shopping", "Pick your size and add it to your cart."],
            ["04", "Helpful support", "We're here when you need a second opinion."],
          ].map(([n, title, copy], i) => (
            <div key={n} className={"border-b border-line px-4 py-6 sm:border-b-0 sm:px-6 lg:px-8 " + (i > 0 ? "sm:border-l" : "")}>
              <span className="text-[10px] font-semibold tracking-[0.2em] text-gold">{n}</span><h2 className="mt-2 text-sm font-semibold">{title}</h2><p className="mt-1 text-xs leading-5 text-mut">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mb-8 flex items-end justify-between gap-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Find your style</p><h2 className="mt-2 text-4xl sm:text-5xl">Shop by collection</h2><p className="mt-3 max-w-xl text-sm leading-6 text-mut">Start with the look you love. We keep the choice focused so you can get to the right rug faster.</p></div><Link to="/shop" className="hidden text-sm font-semibold underline underline-offset-4 sm:block">View all</Link></div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
          {collections.map((collection) => {
            const slugs = collectionSlugs(collection.slug);
            const collectionProduct = (products ?? []).find((p) => p.images.length > 0 && p.categorySlugs.some((slug) => slugs.has(slug)));
            const image = collectionProduct?.images[0];
            return <Link key={collection.slug} to={"/shop?cat=" + collection.slug} className="group relative aspect-[3/4.25] overflow-hidden bg-soft">
              {image ? <img src={productImageUrl(image.storage_path)} alt={image.alt_text ?? (collection.name + " rug collection")} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center px-5 text-center text-sm text-mut">Explore {collection.name}</div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-5"><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/65">{collection.eyebrow}</p><p className="mt-1 text-xl">{collection.name}</p><p className="mt-1 max-w-[15rem] text-[11px] leading-4 text-white/75">{collection.copy}</p><span className="mt-3 inline-block text-xs font-semibold transition group-hover:translate-x-1">Shop {collection.name} →</span></div>
            </Link>;
          })}
        </div>
      </section>

      <section className="bg-[#f0ece3]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="mb-8 flex items-end justify-between gap-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">The edit</p><h2 className="mt-2 text-4xl sm:text-5xl">Ready to find yours?</h2><p className="mt-3 max-w-xl text-sm leading-6 text-mut">Browse the pieces customers can actually buy today, then choose the size that works for your room.</p></div><Link to="/shop" className="text-sm font-semibold underline underline-offset-4">Shop all</Link></div>
          {isLoading ? <div className="grid grid-cols-2 gap-5 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-soft" />)}</div> : <><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">{shown.map((p) => <ProductCard key={p.id} product={p} />)}</div>{hasMore && <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center pt-8"><span className="text-xs text-mut">Loading more rugs…</span></div>}</>}
        </div>
      </section>

      <section className="border-y border-line bg-fg text-bg">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.8fr] lg:px-10">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c7a66d]">Make the room yours</p><h2 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">A considered rug can change the whole room.</h2></div>
          <div className="flex flex-col justify-end"><p className="text-sm leading-7 text-white/60">Take your time, compare sizes and choose a piece that feels right. Our product pages keep the buying information close to the decision.</p><Link to="/shop" className="mt-6 inline-flex w-fit border border-white/25 px-7 py-3.5 text-sm font-semibold transition hover:bg-bg hover:text-fg">Explore the collection →</Link></div>
        </div>
      </section>
    </div>
  );
}
