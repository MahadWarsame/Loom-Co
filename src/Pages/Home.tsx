import { Link } from "react-router-dom";
import { useCategories, useProducts } from "../lib/queries";
import { productImageUrl } from "../lib/images";
import { ProductCard } from "../components/ProductCard";

export function Home() {
  const { data: products, isLoading } = useProducts({});
  const { data: categories } = useCategories();
  const featured = (products ?? []).filter((p) => p.is_featured);
  const shown = (featured.length ? featured : products ?? []).slice(0, 8);
  const heroProduct = shown[0];
  const heroImage = heroProduct?.images[0];
  const collections = (categories ?? []).filter((c) => c.parent_id === null).slice(0, 4);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-[#ebe5da]">
        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-16">
          <div className="relative z-10 max-w-xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Timeless pieces · thoughtfully sourced</p>
            <h1 className="max-w-2xl text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">Rugs with a story. Rooms with a soul.</h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-mut sm:text-lg">Discover handpicked Persian, kilim, gabbeh and modern rugs made to bring warmth, texture and character to your home.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex items-center justify-center bg-fg px-7 py-3.5 text-sm font-semibold text-bg transition hover:-translate-y-0.5 hover:bg-[#3a3731]">Shop the collection</Link>
              {heroProduct && <Link to={`/product/${heroProduct.slug}`} className="inline-flex items-center justify-center border border-fg/25 bg-bg/50 px-7 py-3.5 text-sm font-semibold backdrop-blur transition hover:bg-bg">Explore featured rug</Link>}
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-2 text-xs font-medium text-mut"><span>Unique pieces</span><span>Curated with care</span><span>Made to last</span></div>
          </div>
          <div className="relative lg:pl-8">
            <div className="absolute -inset-6 bg-gold/10 blur-3xl" />
            <div className="relative aspect-[4/5] overflow-hidden bg-soft shadow-2xl shadow-black/10 sm:aspect-[5/6]">
              {heroImage ? <img src={productImageUrl(heroImage.storage_path)} alt={heroImage.alt_text ?? heroProduct?.name ?? "Loom & Co rug"} className="h-full w-full object-cover transition duration-700 hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-mut">Discover the collection</div>}
              {heroProduct && <div className="absolute bottom-4 left-4 right-4 bg-bg/90 p-4 backdrop-blur-md"><p className="text-xs uppercase tracking-[0.18em] text-mut">Featured</p><p className="mt-1 font-display text-lg">{heroProduct.name}</p></div>}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-bg">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-line px-5 sm:grid-cols-4 sm:px-8 lg:px-10">
          {[["01","Curated collection","Distinctive rugs, selected one by one."],["02","Honest materials","Clear details on every piece."],["03","Made for living","Pieces chosen for real homes."],["04","Personal service","Here when you need help choosing."]].map(([n,title,text]) => <div key={n} className="border-b border-line px-4 py-7 first:pl-0 sm:border-b-0 sm:px-6 lg:px-8"><span className="text-[10px] font-semibold tracking-[0.2em] text-gold">{n}</span><h2 className="mt-2 text-base">{title}</h2><p className="mt-1 text-xs leading-5 text-mut">{text}</p></div>)}
        </div>
      </section>

      {collections.length > 0 && <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="mb-9 flex items-end justify-between gap-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Explore</p><h2 className="mt-2 text-4xl">Shop by collection</h2></div><Link to="/shop" className="hidden text-sm font-semibold underline underline-offset-4 sm:block">View all</Link></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {collections.map((c) => { const image = (products ?? []).find((p) => p.category_id === c.id)?.images[0]; return <Link key={c.id} to={`/shop?cat=${c.slug}`} className="group relative aspect-[3/4] overflow-hidden bg-soft">{image && <img src={productImageUrl(image.storage_path)} alt={image.alt_text ?? c.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />}<div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-5 text-white"><p className="text-lg font-medium">{c.name}</p><span className="mt-1 inline-block text-xs opacity-80">Shop collection →</span></div></Link> })}
        </div>
      </section>}

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mb-9 flex items-end justify-between gap-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">The edit</p><h2 className="mt-2 text-4xl">Selected for you</h2></div><Link to="/shop" className="text-sm font-semibold underline underline-offset-4">Shop all</Link></div>
        {isLoading ? <div className="grid grid-cols-2 gap-5 md:grid-cols-4">{Array.from({length:4}).map((_,i)=><div key={i} className="aspect-[4/5] animate-pulse bg-soft" />)}</div> : <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">{shown.map((p)=><ProductCard key={p.id} product={p}/>)}</div>}
      </section>

      <section className="bg-fg text-bg"><div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8"><p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c7a66d]">Loom &amp; Co</p><h2 className="mt-4 text-4xl leading-tight sm:text-5xl">The finishing layer your room has been waiting for.</h2><p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/60">Take your time. Find a piece that feels right, then make it part of your home.</p><Link to="/shop" className="mt-8 inline-flex border border-white/30 px-7 py-3.5 text-sm font-semibold transition hover:bg-bg hover:text-fg">Discover the rugs</Link></div></section>
    </div>
  );
}
