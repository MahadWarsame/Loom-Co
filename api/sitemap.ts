export default async function handler(_req: any, res: any) {
  const origin = "https://loom-co.vercel.app";
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const urls = new Set<string>([origin + "/", origin + "/shop"]);

  if (supabaseUrl && anonKey) {
    try {
      for (let offset = 0; ; offset += 1000) {
        const endpoint = supabaseUrl + "/rest/v1/products?select=slug&status=eq.active&limit=1000&offset=" + offset;
        const response = await fetch(endpoint, {
          headers: { apikey: anonKey, Authorization: "Bearer " + anonKey },
        });
        if (!response.ok) break;
        const rows = (await response.json()) as Array<{ slug?: string | null }>;
        for (const row of rows) {
          if (row.slug) urls.add(origin + "/product/" + encodeURIComponent(row.slug));
        }
        if (rows.length < 1000) break;
      }
    } catch {}
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from(urls).map((url) => "<url><loc>" + url + "</loc></url>"),
    "</urlset>",
  ].join("");

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.end(xml);
}
