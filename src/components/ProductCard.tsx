import { Link } from "react-router-dom";
import type { ProductWithDetails } from "../lib/types";
import { productImageUrl } from "../lib/images";

function sek(n: number) {
  return `${Math.round(n).toLocaleString("sv-SE")} kr`;
}

export function ProductCard({ product }: { product: ProductWithDetails }) {
  const cheapest = product.variants.reduce<typeof product.variants[number] | null>((best, v) => {
    const price = v.sale_price ?? v.regular_price;
    const bestPrice = best ? best.sale_price ?? best.regular_price : Infinity;
    return price < bestPrice ? v : best;
  }, null);
  const image = product.images[0];

  return (
    <article>
      <Link to={`/product/${product.slug}`} className="block aspect-[4/5] overflow-hidden bg-soft">
        {image && (
          <img
            src={productImageUrl(image.storage_path)}
            alt={image.alt_text ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </Link>
      <div className="pt-2.5">
        <Link to={`/product/${product.slug}`} className="font-medium">
          {product.name}
        </Link>
        {product.attributes.Material && (
          <div className="text-sm text-mut">{product.attributes.Material}</div>
        )}
        {cheapest && (
          <div className="pt-0.5">
            {product.variants.length > 1 && <span className="text-mut">from </span>}
            {cheapest.sale_price ? (
              <>
                <b className="text-sale">{sek(cheapest.sale_price)}</b>{" "}
                <s className="text-mut">{sek(cheapest.regular_price)}</s>
              </>
            ) : (
              <b>{sek(cheapest.regular_price)}</b>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
