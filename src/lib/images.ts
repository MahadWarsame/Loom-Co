import { supabase } from "./supabase";

/** Public URL for a path in the product-images bucket, e.g. "750539/0-4dfb770b.jpg". */
export function productImageUrl(storagePath: string): string {
  return supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl;
}
