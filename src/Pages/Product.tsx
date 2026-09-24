import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAvailability, useProduct } from "../lib/queries";
import { productImageUrl } from "../lib/images";
import type { ProductVariant } from "../types";
import { useCart, cartItemFromProduct } from "../context/CartContext";

function sek(n: number) {
  return `${Math.round(n).toLocaleString("sv-SE")} kr`;
}

export function ProductPage() {
  const { slug } = useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: availability } = useAvailability(product ? [product.id] : []);
  const [variantIndex, setVariantIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  if (isLoading) return <p className="mx-auto max-w-7xl px-5 py-20 text-mut">Loading…</p>;
  if (!product) return <p className="mx-auto max-w-7xl px-5 py-20">We can't find that rug.</p>;

  const images = product.images;
  const activeImage = images[imageIndex] ?? images[0];

  // Only show variants that are currently available for purchase.
  const availableVariants = availability
    ? product.variants.filter((v) => availability.some((a) => a.variant_id === v.id && a.in_stock))
    : product.variants;

  const variant = availableVariants[variantIndex] ?? availableVariants[0];
  const avail = availability?.find((a) => a.variant_id === variant?.id);
  const stockLabel = !variant
    ? "Out of stock"
    : !avail || !avail.in_stock
      ? "Out of stock"
      : avail.low_stock
        ? "Low stock"
        : "In stock";

  const addToCart = () => {
    if (!variant || !avail?.in_stock) return;
    addItem(cartItemFromProduct(product, variant, activeImage?.storage_path ?? null));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  const showPreviousImage = () => {
    if (images.length < 2) return;
    setImageIndex((current) => (current - 1 + images.length) % images.length);
  };

  const showNextImage = () => {
    if (images.length < 2) return;
    setImageIndex((current) => (current + 1) % images.length);
  };

  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
    <div className="mb-7 text-xs text-mut"><Link to="/shop" className="hover:text-fg">Shop</Link><span className="mx-2">/</span>{product.name}</div>
    <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
      <div className="grid gap-3 sm:grid-cols-[90px_1fr]">
        <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
          {images.map((img, i) => (
            <button
              key={img.storage_path || `image-${i}`}
              type="button"
              onClick={() => setImageIndex(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-current={i === imageIndex ? "true" : undefined}
              className={`h-20 w-16 shrink-0 overflow-hidden bg-soft transition sm:h-24 sm:w-full ${i === imageIndex ? "ring-2 ring-fg" : "opacity-70 hover:opacity-100"}`}
            >
              <img src={productImageUrl(img.storage_path)} alt={img.alt_text ?? `${product.name} view ${i + 1}`} className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
            </button>
          ))}
        </div>

        <div className="relative order-1 aspect-[4/5] overflow-hidden bg-soft sm:order-2">
          {activeImage && (
            <img
              key={activeImage.storage_path}
              src={productImageUrl(activeImage.storage_path)}
              alt={activeImage.alt_text ?? product.name}
              className="h-full w-full object-cover"
            />
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPreviousImage}
                aria-label="Previous product image"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-bg/90 text-fg shadow-md transition hover:scale-105"
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                onClick={showNextImage}
                aria-label="Next product image"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-bg/90 text-fg shadow-md transition hover:scale-105"
              >
                <span aria-hidden="true">→</span>
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-fg/80 px-3 py-1 text-[11px] font-medium text-bg">
                {imageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="lg:pt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Loom &amp; Co · Curated piece</p>
        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{product.name}</h1>
        {variant && <div className="mt-5 text-xl">{variant.sale_price ? <><b className="text-sale">{sek(variant.sale_price)}</b><s className="ml-2 text-sm text-mut">{sek(variant.regular_price)}</s></> : <b>{sek(variant.regular_price)}</b>}</div>}
        <div className={`mt-2 text-xs font-semibold uppercase tracking-[0.12em] ${stockLabel === "In stock" ? "text-[#55735a]" : stockLabel === "Low stock" ? "text-sale" : "text-mut"}`}>{stockLabel}</div>
        <p className="mt-7 border-y border-line py-6 text-sm leading-7 text-mut">{product.short_description ?? product.description}</p>

        {product.variants.length > 1 && (
          <div className="mt-7">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em]">Available sizes</div>
            {availableVariants.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableVariants.map((v: ProductVariant, i: number) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantIndex(i)}
                    className={`border px-4 py-2.5 text-sm transition ${i === variantIndex ? "border-fg bg-fg text-bg" : "border-line hover:border-fg"}`}
                  >
                    {v.size_label} cm
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-mut">This rug is currently out of stock in all sizes.</p>
            )}
          </div>
        )}

        <button type="button" onClick={addToCart} disabled={!avail?.in_stock} className="mt-8 w-full bg-fg py-4 text-sm font-semibold text-bg transition hover:bg-[#3a3731] disabled:cursor-not-allowed disabled:opacity-40">{added ? "Added to cart ✓" : "Add to cart"}</button>
        <div className="mt-4 grid grid-cols-2 gap-2">{["Carefully selected", "Secure checkout", "Easy support", "Quality checked"].map((item) => <div key={item} className="border border-line px-3 py-3 text-center text-[11px] text-mut">{item}</div>)}</div>
        <dl className="mt-8 divide-y divide-line border-t border-line text-sm">{Object.entries(product.attributes).map(([k, v]) => <div key={k} className="flex justify-between gap-6 py-3"><dt className="text-mut">{k}</dt><dd className="text-right">{String(v)}</dd></div>)}</dl>
      </div>
    </div>
  </div>;
}
