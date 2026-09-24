import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 className="text-2xl">We can't find that page</h1>
      <Link to="/shop" className="mt-4 inline-block underline">
        Browse rugs
      </Link>
    </div>
  );
}
