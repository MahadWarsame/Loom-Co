import { supplierArticleNumbersGzipBase64 } from "../data/supplierArticleNumbers.gz.b64";

let supplierArticleNumbersPromise: Promise<Record<string, string>> | null = null;

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
      return (await new Response(stream).json()) as Record<string, string>;
    })();
  }
  return supplierArticleNumbersPromise;
}

export function supplierArticleNumberFor(
  mapping: Record<string, string>,
  productSku: string | null | undefined,
  variantSku?: string | null,
) {
  return mapping[String(variantSku ?? "").trim()] ?? mapping[String(productSku ?? "").trim()] ?? null;
}
