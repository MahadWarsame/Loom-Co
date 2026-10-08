import { Link } from "react-router-dom";
import type { ProductWithDetails } from "../types";
import { productImageUrl } from "../lib/images";

function sek(n: number) { return Math.round(Number.isFinite(n) ? n : 0).toLocaleString("sv-SE") + " kr"; }

export function ProductCard({ product }: { product: ProductWithDetails }) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const images = Array.isArray(product.images) ? product.images : [];
  const attributes = product.attributes ?? {};
  const cheapest = variants.reduce((best, v) => {
    const price = Number(v?.regular_price);
    if (!Number.isFinite(price)) return best;
    return price < (best?.regular_price ?? Infinity) ? v : best;
  }, variants[0] ?? null);
  const image = images[0];
  const imageUrl = image ? productImageUrl(image.storage_path) : "";

  return <article className="group min-w-0">
    <Link to={"/product/" + product.slug} className="relative block aspect-[4/5] overflow-hidden bg-soft">
      {imageUrl ? <img src={imageUrl} alt={image?.alt_text ?? product.name} loading="lazy" className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035]" /> : <div className="h-full w-full bg-soft" />}
      <span className="absolute bottom-3 right-3 translate-y-2 bg-bg/95 px-3 py-2 text-[11px] font-semibold opacity-0 shadow-sm transition duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">Choose size →</span>
    </Link>
    <div className="pt-3">
      <Link to={"/product/" + product.slug} className="block truncate text-sm font-medium transition hover:text-gold">{product.name}</Link>
      <div className="mt-0.5 flex items-center gap-2 text-xs text-mut">
        {attributes.Material && <span>{attributes.Material}</span>}
        {variants.length > 1 && <><span>·</span><span>{variants.length} sizes</span></>}
      </div>
      {cheapest && <div className="pt-1 text-sm">{variants.length > 1 && <span className="mr-1 text-xs text-mut">from</span>}<b>{sek(Number(cheapest.regular_price))}</b></div>}
    </div>
  </article>;
}
