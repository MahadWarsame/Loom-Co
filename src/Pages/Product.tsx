import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAvailability, useProduct } from "../lib/queries";
import { productImageUrl } from "../lib/images";
import type { ProductVariant } from "../types";

function sek(n: number) {
  return `${Math.round(n).toLocaleString("sv-SE")} kr`;
}

export function ProductPage() {
  const { slug } = useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: availability } = useAvailability(product ? [product.id] : []);
  const [variantIndex, setVariantIndex] = useState(0);

  if (isLoading) return <p className="mx-auto max-w-6xl px-4 py-10 text-mut">Loading…</p>;
  if (!product) return <p className="mx-auto max-w-6xl px-4 py-10">We can't find that rug.</p>;

  const variant = product.variants[variantIndex];
  const avail = availability?.find((a) => a.variant_id === variant?.id);
  const stockLabel = !avail || !avail.in_stock ? "Out of stock" : avail.low_stock ? "Low stock" : "In stock";
  const image = product.images[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-[4/5] bg-soft">
          {image && (
            <img
              src={productImageUrl(image.storage_path)}
              alt={image.alt_text ?? product.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div>
          <h1 className="text-3xl">{product.name}</h1>

          {variant && (
            <div className="mt-3 text-xl">
              {variant.sale_price ? (
                <>
                  <b className="text-sale">{sek(variant.sale_price)}</b>{" "}
                  <s className="text-mut">{sek(variant.regular_price)}</s>
                </>
              ) : (
                <b>{sek(variant.regular_price)}</b>
              )}
            </div>
          )}
          <div className="mt-1 text-sm font-medium text-mut">{stockLabel}</div>

          <p className="mt-4 text-mut">{product.short_description ?? product.description}</p>

          {product.variants.length > 1 && (
            <div className="mt-4">
              <div className="mb-2 text-sm text-mut">Size</div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: ProductVariant, i: number) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantIndex(i)}
                    className={`border px-3 py-2 text-sm ${
                      i === variantIndex ? "border-fg" : "border-line"
                    }`}
                  >
                    {v.size_label} cm
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            disabled={!avail?.in_stock}
            className="mt-6 w-full border border-fg py-3 font-medium hover:bg-fg hover:text-bg disabled:opacity-40"
          >
            Add to cart
          </button>

          <dl className="mt-8 divide-y divide-line text-sm">
            {Object.entries(product.attributes).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2">
                <dt className="text-mut">{k}</dt>
                <dd>{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
