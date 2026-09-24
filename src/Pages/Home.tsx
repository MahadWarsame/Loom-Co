import { Link } from "react-router-dom";
import { useProducts } from "../lib/queries";
import { ProductCard } from "../components/ProductCard";

export function Home() {
  const { data: products, isLoading } = useProducts({});
  const featured = (products ?? []).filter((p) => p.is_featured).slice(0, 8);
  const rest = (products ?? []).slice(0, 8);
  const shown = featured.length ? featured : rest;

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid gap-8 py-10 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-5xl">Rugs that make a room feel finished.</h1>
          <p className="mt-4 max-w-md text-mut">
            Handmade Persian, kelim, gabbeh and modern rugs, sourced piece by piece.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-block border border-fg px-6 py-3 font-medium hover:bg-fg hover:text-bg"
          >
            Shop now
          </Link>
        </div>
      </section>

      <section className="py-10">
        <h2 className="mb-5 text-2xl">New in</h2>
        {isLoading ? (
          <p className="text-mut">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
