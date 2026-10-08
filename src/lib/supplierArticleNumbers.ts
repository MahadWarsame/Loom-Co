import { supplierArticleNumbersGzipBase64 } from "../data/supplierArticleNumbers.gz.b64";

let supplierArticleNumbersPromise: Promise<Record<string, string>> | null = null;

// Corrections from the supplier-number Excel source where a row was not
// captured correctly in the generated compressed index.
const supplierArticleNumberCorrections: Record<string, string> = {
  "720015": "5052A",
};

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function getSupplierArticleNumbers() {
  if (!supplierArticleNumbersPromise) {
    supplierArticleNumbersPromise = (async () => {
      const compressed = decodeBase64(supplierArticleNumbersGzipBase64);
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
      const mapping = (await new Response(stream).json()) as Record<string, string>;
      return { ...mapping, ...supplierArticleNumberCorrections };
    })();
  }
  return supplierArticleNumbersPromise;
}

export function supplierArticleNumberFor(
  mapping: Record<string, string>,
  productSku: string | null | undefined,
  variantSku?: string | null,
) {
  const variantKey = String(variantSku ?? "").trim();
  const productKey = String(productSku ?? "").trim();

  // First use the exact SKU keys (fast path).
  const exact = mapping[variantKey] ?? mapping[productKey];
  if (exact) return exact;

  // Supplier files can contain formatting differences such as spaces,
  // hyphens or underscores. Match those representations as well.
  const normalizedVariant = normalizeIdentifier(variantKey);
  const normalizedProduct = normalizeIdentifier(productKey);

  for (const [key, value] of Object.entries(mapping)) {
    const normalizedKey = normalizeIdentifier(key);
    if (normalizedKey && (normalizedKey === normalizedVariant || normalizedKey === normalizedProduct)) {
      return value;
    }
  }

  return null;
}

function normalizeIdentifier(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");
}
