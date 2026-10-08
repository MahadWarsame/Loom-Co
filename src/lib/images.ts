import { supabase } from "./supabase";

/** Public URL for a path in the product-images bucket. */
export function productImageUrl(storagePath: unknown): string {
  if (typeof storagePath !== "string" || !storagePath.trim()) return "";
  try {
    return supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl ?? "";
  } catch {
    return "";
  }
}
