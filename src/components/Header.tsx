import { Link } from "react-router-dom";
import { useCategories } from "../lib/queries";

export function Header() {
  const { data: categories } = useCategories();
  const topLevel = (categories ?? []).filter((c) => c.parent_id === null);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="font-display text-xl">
          Loom &amp; Co
        </Link>
        <nav className="ml-auto hidden gap-6 md:flex" aria-label="Main">
          <Link to="/shop">Shop all</Link>
          {topLevel.map((c) => (
            <Link key={c.id} to={`/shop?cat=${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
