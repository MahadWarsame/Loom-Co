import { Link } from "react-router-dom";
import type { ProductWithDetails } from "../types";
import { productImageUrl } from "../lib/images";

function sek(n: number) { return Math.round(n).toLocaleString("sv-SE") + " kr"; }

export function ProductCard({ product }: { product: ProductWithDetails }) {
  const cheapest = product.variants.reduce((best, v) =>
    v.regular_price < (best?.regular_price ?? Infinity) ? v : best,
    product.variants[0] ?? null,
  );
  const image = product.images[0];

  return <article className="group min-w-0">
    <Link to={"/product/" + product.slug} className="relative block aspect-[4/5] overflow-hidden bg-soft">
      {image ? <img src={productImageUrl(image.storage_path)} alt={image.alt_text ?? product.name} loading="lazy" className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035]" /> : <div className="h-full w-full bg-soft" />}
      <span className="absolute bottom-3 right-3 translate-y-2 bg-bg/95 px-3 py-2 text-[11px] font-semibold opacity-0 shadow-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">Choose size →</span>
    </Link>
    <div className="pt-3">
      <Link to={"/product/" + product.slug} className="block truncate text-sm font-medium transition hover:text-gold">{product.name}</Link>
      <div className="mt-0.5 flex items-center gap-2 text-xs text-mut">
        {product.attributes.Material && <span>{product.attributes.Material}</span>}
        {product.variants.length > 1 && <><span>·</span><span>{product.variants.length} sizes</span></>}
      </div>
      {cheapest && <div className="pt-1 text-sm">{product.variants.length > 1 && <span className="mr-1 text-xs text-mut">from</span>}<b>{sek(cheapest.regular_price)}</b></div>}
    </div>
  </article>;
}
