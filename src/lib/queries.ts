import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Availability, Category, ProductImage, ProductVariant, ProductWithDetails } from "../types";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,slug,name,parent_id,sort_order")
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 5 * 60_000,
  });
}

export type ShopFilters = {
  categorySlug?: string;
  q?: string;
  color?: string;
  material?: string;
  inStockOnly?: boolean;
};

/**
 * Loads active products plus their variants, images and attributes.
 * Category/color/material filters are applied after the nested data is assembled
 * so category navigation cannot accidentally return the same unfiltered products.
 */
export function useProducts(filters: ShopFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(
          "id,sku,slug,name,short_description,description,brand,is_featured,product_categories(categories(slug)),product_variants(id,product_id,sku,size_label,regular_price,sale_price),product_images(product_id,position,storage_path,alt_text),product_attributes(key,value)",
        )
        .eq("status", "active");

      if (filters.q) {
        query = query.textSearch("search", filters.q, { type: "websearch" });
      }

      const { data, error } = await query.limit(1000);
      if (error) throw error;

      const products: ProductWithDetails[] = (data ?? []).map((row: any) => {
        const attributes: Record<string, string> = {};
        for (const a of row.product_attributes ?? []) attributes[a.key] = a.value;

        return {
          id: row.id,
          sku: row.sku,
          slug: row.slug,
          name: row.name,
          short_description: row.short_description,
          description: row.description,
          brand: row.brand,
          is_featured: row.is_featured,
          variants: (row.product_variants ?? []) as ProductVariant[],
          images: ((row.product_images ?? []) as ProductImage[]).sort((a, b) => a.position - b.position),
          attributes,
          categorySlugs: (row.product_categories ?? [])
            .map((pc: any) => pc.categories?.slug)
            .filter(Boolean),
        };
      });

      return products.filter((p) => {
        if (filters.categorySlug && !p.categorySlugs.includes(filters.categorySlug)) return false;
        if (filters.color && p.attributes.Color !== filters.color) return false;
        if (filters.material && p.attributes.Material !== filters.material) return false;
        return true;
      });
    },
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    enabled: !!slug,
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,sku,slug,name,short_description,description,brand,is_featured,product_variants(id,product_id,sku,size_label,regular_price,sale_price,position),product_images(product_id,position,storage_path,alt_text),product_attributes(key,value)",
        )
        .eq("slug", slug)
        .eq("status", "active")
        .single();
      if (error) throw error;

      const attributes: Record<string, string> = {};
      for (const a of data.product_attributes ?? []) attributes[a.key] = a.value;

      return {
        id: data.id,
        sku: data.sku,
        slug: data.slug,
        name: data.name,
        short_description: data.short_description,
        description: data.description,
        brand: data.brand,
        is_featured: data.is_featured,
        variants: ((data.product_variants ?? []) as ProductVariant[]).sort((a: any, b: any) => a.position - b.position),
        images: ((data.product_images ?? []) as ProductImage[]).sort((a, b) => a.position - b.position),
        attributes,
        categorySlugs: [],
      } satisfies ProductWithDetails;
    },
  });
}

/** In-stock / low-stock flags for a set of products. Exact quantities are staff-only (see RLS). */
export function useAvailability(productIds: string[]) {
  return useQuery({
    enabled: productIds.length > 0,
    queryKey: ["availability", productIds],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("variant_availability", {
        p_product_ids: productIds,
      });
      if (error) throw error;
      return data as Availability[];
    },
  });
}
