import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCategories, useProducts } from "../lib/queries";
import { ProductCard } from "../components/ProductCard";

export function Shop() {
  const [params, setParams] = useSearchParams();
  const categorySlug = params.get("cat") ?? undefined;
  const [color, setColor] = useState<string | undefined>();
  const [material, setMaterial] = useState<string | undefined>();

  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({ categorySlug, color, material });

  const colors = useMemo(
    () => [...new Set((products ?? []).map((p) => p.attributes.Color).filter(Boolean))].sort(),
    [products],
  );
  const materials = useMemo(
    () => [...new Set((products ?? []).map((p) => p.attributes.Material).filter(Boolean))].sort(),
    [products],
  );

  const categoryName = categories?.find((c) => c.slug === categorySlug)?.name ?? "All rugs";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl">{categoryName}</h1>
      <p className="mt-1 text-mut">
        {isLoading ? "Loading…" : `${products?.length ?? 0} rugs`}
      </p>

      <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <fieldset>
            <legend className="mb-2 font-medium">Category</legend>
            <button
              className={`block py-1 ${!categorySlug ? "font-semibold" : ""}`}
              onClick={() => setParams({})}
            >
              All rugs
            </button>
            {(categories ?? [])
              .filter((c) => c.parent_id)
              .map((c) => (
                <button
                  key={c.id}
                  className={`block py-1 ${categorySlug === c.slug ? "font-semibold" : ""}`}
                  onClick={() => setParams({ cat: c.slug })}
                >
                  {c.name}
                </button>
              ))}
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-medium">Color</legend>
            {colors.map((c) => (
              <label key={c} className="flex items-center gap-2 py-1">
                <input
                  type="radio"
                  name="color"
                  checked={color === c}
                  onChange={() => setColor(color === c ? undefined : c)}
                />
                {c}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-medium">Material</legend>
            {materials.map((m) => (
              <label key={m} className="flex items-center gap-2 py-1">
                <input
                  type="radio"
                  name="material"
                  checked={material === m}
                  onChange={() => setMaterial(material === m ? undefined : m)}
                />
                {m}
              </label>
            ))}
          </fieldset>
        </aside>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          {(products ?? []).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
