import { supplierArticleNumbersGzipBase64 } from "../data/supplierArticleNumbers.gz.b64";

let supplierArticleNumbersPromise: Promise<Record<string, string>> | null = null;

// Verified corrections from the uploaded supplier Excel. The workbook maps
// Artikelnummer -> Leverantörens artikelnummer; never infer these from names.
const supplierArticleNumberCorrections: Record<string, string> = {
  "720015": "5051A",
  "720016": "5052A",
  "720080": "5052A",
  "720144": "5052A",
  "720208": "5052A",
  "720030": "6654A",
  "720031": "6654A",
  "720094": "6654A",
  "720095": "6654A",
  "720158": "6654A",
  "720159": "6654A",
  "720222": "6654A",
  "720223": "6654A",
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

let normalizedMappingSource: Record<string, string> | null = null;
let normalizedMapping: Record<string, string> = {};

export function supplierArticleNumberFor(
  mapping: Record<string, string>,
  productSku: string | null | undefined,
  variantSku?: string | null,
) {
  if (normalizedMappingSource !== mapping) {
    normalizedMapping = {};
    for (const [key, value] of Object.entries(mapping)) {
      const normalizedKey = normalizeIdentifier(key);
      if (normalizedKey) normalizedMapping[normalizedKey] = value;
    }
    normalizedMappingSource = mapping;
  }

  const variantKey = String(variantSku ?? "").trim();
  const productKey = String(productSku ?? "").trim();
  return (
    mapping[variantKey] ??
    mapping[productKey] ??
    normalizedMapping[normalizeIdentifier(variantKey)] ??
    normalizedMapping[normalizeIdentifier(productKey)] ??
    null
  );
}

function normalizeIdentifier(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");
}
