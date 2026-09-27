import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAvailability, useProduct } from "../lib/queries";
import { productImageUrl } from "../lib/images";
import type { ProductVariant } from "../types";
import { useCart, cartItemFromProduct } from "../context/CartContext";

function sek(n: number) {
  return Math.round(n).toLocaleString("sv-SE") + " kr";
}

export function ProductPage() {
  const { slug } = useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: availability } = useAvailability(product ? [product.id] : []);
  const [variantIndex, setVariantIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    setVariantIndex(0);
    setImageIndex(0);
    setAdded(false);
  }, [slug]);

  const variants = product?.variants ?? [];
  const variant = variants[variantIndex] ?? variants[0];
  const avail = availability?.find((a) => a.variant_id === variant?.id);
  const images = product?.images ?? [];
  const activeImage = images[imageIndex] ?? images[0];

  const discount = useMemo(() => {
    if (!variant?.sale_price || variant.sale_price >= variant.regular_price) return 0;
    return Math.round((1 - variant.sale_price / variant.regular_price) * 100);
  }, [variant]);

  const stockLabel = !variant ? "Out of stock" : !avail || !avail.in_stock ? "Out of stock" : avail.low_stock ? "Low stock" : "In stock";

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-5 py-20"><div className="grid gap-10 lg:grid-cols-2"><div className="aspect-[4/5] animate-pulse bg-soft" /><div className="space-y-4"><div className="h-8 w-3/4 animate-pulse bg-soft" /><div className="h-5 w-1/3 animate-pulse bg-soft" /><div className="h-28 animate-pulse bg-soft" /></div></div></div>;
  }

  if (!product) {
    return <div className="mx-auto max-w-7xl px-5 py-20"><h1 className="text-3xl">We can't find that rug.</h1><Link to="/shop" className="mt-5 inline-block underline">Back to rugs</Link></div>;
  }

  const addToCart = () => {
    if (!variant || !avail?.in_stock) return;
    addItem(cartItemFromProduct(product, variant, activeImage?.storage_path ?? null));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 pb-28 sm:px-8 lg:px-10 lg:pb-12">
      <div className="mb-6 text-xs text-mut"><Link to="/shop" className="hover:text-fg">Shop</Link><span className="mx-2">/</span>{product.name}</div>

      <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <div className="grid gap-3 sm:grid-cols-[90px_1fr]">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
            {images.map((img, i) => (
              <button key={img.storage_path || "image-" + i} type="button" onClick={() => setImageIndex(i)} aria-label={"View image " + (i + 1) + " of " + images.length} aria-current={i === imageIndex ? "true" : undefined} className={"h-20 w-16 shrink-0 overflow-hidden bg-soft transition sm:h-24 sm:w-full " + (i === imageIndex ? "ring-2 ring-fg" : "opacity-70 hover:opacity-100")}>
                <img src={productImageUrl(img.storage_path)} alt={img.alt_text ?? (product.name + " view " + (i + 1))} className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
              </button>
            ))}
          </div>

          <div className="relative order-1 aspect-[4/5] overflow-hidden bg-soft sm:order-2">
            {activeImage && <img src={productImageUrl(activeImage.storage_path)} alt={activeImage.alt_text ?? product.name} className="h-full w-full object-cover" />}
            {images.length > 1 && <>
              <button type="button" onClick={() => setImageIndex((current) => (current - 1 + images.length) % images.length)} aria-label="Previous product image" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-bg/90 shadow-md transition hover:scale-105">←</button>
              <button type="button" onClick={() => setImageIndex((current) => (current + 1) % images.length)} aria-label="Next product image" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-bg/90 shadow-md transition hover:scale-105">→</button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-fg/80 px-3 py-1 text-[11px] font-medium text-bg">{imageIndex + 1} / {images.length}</div>
            </>}
          </div>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start lg:pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Loom &amp; Co · Curated piece</p>
          <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{product.name}</h1>

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2">
            {variant && (variant.sale_price ? <><b className="text-2xl text-sale">{sek(variant.sale_price)}</b><s className="text-sm text-mut">{sek(variant.regular_price)}</s></> : <b className="text-2xl">{sek(variant.regular_price)}</b>)}
            {discount > 0 && <span className="border border-sale/20 bg-sale/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sale">-{discount}%</span>}
          </div>

          <div className={"mt-2 text-xs font-semibold uppercase tracking-[0.12em] " + (stockLabel === "In stock" ? "text-[#55735a]" : stockLabel === "Low stock" ? "text-sale" : "text-mut")}>
            {stockLabel === "Low stock" ? "Low stock — order while available" : stockLabel}
          </div>

          <div className="mt-6 border-y border-line py-5">
            <p className="text-sm leading-7 text-mut">{product.short_description ?? product.description ?? "A distinctive rug selected for texture, character and everyday living."}</p>
          </div>

          {variants.length > 1 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.16em]">Choose your size</div>
                <span className="text-[11px] text-mut">{variants.filter((v) => availability?.some((a) => a.variant_id === v.id && a.in_stock)).length} available</span>
              </div>
              <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                {variants.map((v: ProductVariant, i: number) => {
                  const vAvail = availability?.find((a) => a.variant_id === v.id);
                  const inStock = vAvail?.in_stock === true;
                  const vDiscount = v.sale_price && v.sale_price < v.regular_price ? Math.round((1 - v.sale_price / v.regular_price) * 100) : 0;
                  return <button key={v.id} type="button" onClick={() => inStock && setVariantIndex(i)} disabled={!inStock} title={!inStock ? "Out of stock" : undefined} className={"relative min-h-14 border px-3 py-2 text-left text-sm transition " + (i === variantIndex ? "border-fg bg-fg text-bg" : inStock ? "border-line hover:border-fg" : "cursor-not-allowed border-line text-mut line-through opacity-45")}>
                    <span className="block font-medium">{v.size_label}</span>
                    <span className={"mt-0.5 block text-[11px] " + (i === variantIndex ? "text-white/70" : "text-mut")}>{v.sale_price ? sek(v.sale_price) : sek(v.regular_price)}{vDiscount > 0 ? " · -" + vDiscount + "%" : ""}</span>
                  </button>;
                })}
              </div>
              <p className="mt-2 text-xs text-mut">Only available sizes can be selected.</p>
            </div>
          )}

          <div className="mt-7 grid grid-cols-2 gap-2">
            <div className="border border-line px-3 py-3"><b className="block text-xs">Clear sizing</b><span className="mt-1 block text-[11px] text-mut">Choose the exact size before buying.</span></div>
            <div className="border border-line px-3 py-3"><b className="block text-xs">Secure checkout</b><span className="mt-1 block text-[11px] text-mut">A simple path from cart to payment.</span></div>
          </div>

          <button type="button" onClick={addToCart} disabled={!avail?.in_stock} className="mt-6 hidden min-h-14 w-full bg-fg px-5 text-sm font-semibold text-bg transition hover:bg-[#3a3731] disabled:cursor-not-allowed disabled:opacity-40 sm:block">
            {added ? "Added to cart ✓" : variant && avail?.in_stock ? "Add to cart" : "Out of stock"}
          </button>

          <dl className="mt-7 divide-y divide-line border-t border-line text-sm">
            {Object.entries(product.attributes).map(([k, v]) => <div key={k} className="flex justify-between gap-6 py-3"><dt className="text-mut">{k}</dt><dd className="max-w-[60%] text-right">{String(v)}</dd></div>)}
          </dl>
        </div>
      </div>

      <section className="mt-16 border-t border-line pt-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Need help choosing?", "Not sure about the size or style? Our contact page is available if you want a second opinion.", "/info/contact"],
            ["Delivery & returns", "See the delivery and returns information before you order, with the key details kept easy to find.", "/info/returns"],
            ["Care for your rug", "Use the care guide to understand regular cleaning, spills and placement after your purchase.", "/info/care"],
          ].map(([title, copy, href]) => (
            <div key={title} className="border border-line bg-[#f8f5ef] p-6"><h2 className="text-xl">{title}</h2><p className="mt-2 text-sm leading-6 text-mut">{copy}</p><Link to={href} className="mt-4 inline-block text-xs font-semibold underline underline-offset-4">Learn more →</Link></div>
          ))}
        </div>
      </section>

      {variant && avail?.in_stock && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{product.name}</p><p className="text-sm font-semibold">{variant.sale_price ? sek(variant.sale_price) : sek(variant.regular_price)}{variant.size_label ? " · " + variant.size_label : ""}</p></div>
            <button type="button" onClick={addToCart} className="min-h-12 shrink-0 bg-fg px-6 text-sm font-semibold text-bg">{added ? "Added ✓" : "Add to cart"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
