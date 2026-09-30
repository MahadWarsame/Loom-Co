import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import supplierArticleNumbers from "../data/supplierArticleNumbers.json";
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
 * Products are returned only when at least one variant is in stock.
 */
export function useProducts(filters: ShopFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      const query = supabase
        .from("products")
        .select(
          "id,sku,slug,name,short_description,description,brand,is_featured,product_categories(categories(id,slug,parent_id)),product_variants(id,product_id,sku,size_label,regular_price,sale_price),product_images(product_id,position,storage_path,alt_text),product_attributes(key,value)",
        )
        .eq("status", "active");

      const { data, error } = await query.limit(5000);
      if (error) throw error;

      const { data: allCategories, error: categoryError } = await supabase
        .from("categories")
        .select("id,slug,parent_id");
      if (categoryError) throw categoryError;

      const productIds = (data ?? []).map((row: any) => row.id);
      const { data: availability, error: availabilityError } = await supabase.rpc("variant_availability", {
        p_product_ids: productIds,
      });
      if (availabilityError) throw availabilityError;

      const inStockProductIds = new Set(
        (availability ?? [])
          .filter((a: any) => a.in_stock === true)
          .map((a: any) => a.product_id),
      );

      const descendantSlugs = new Set<string>();
      if (filters.categorySlug) {
        const selected = (allCategories ?? []).find((c: any) => c.slug === filters.categorySlug);
        if (selected) {
          const collect = (parentId: string) => {
            for (const category of allCategories ?? []) {
              if (category.parent_id === parentId) {
                descendantSlugs.add(category.slug);
                collect(category.id);
              }
            }
          };
          descendantSlugs.add(selected.slug);
          collect(selected.id);
        }
      }

      const products: ProductWithDetails[] = (data ?? [])
        .filter((row: any) => inStockProductIds.has(row.id))
        .map((row: any) => {
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

      const search = filters.q?.trim().toLowerCase();
      return products.filter((p) => {
        if (search) {
          const supplierNumbers = p.variants
            .map((variant) => supplierArticleNumbers[String(variant.sku) as keyof typeof supplierArticleNumbers])
            .filter(Boolean);

          const haystack = [
            p.name,
            p.sku,
            p.brand,
            p.short_description,
            p.description,
            ...p.variants.map((variant) => variant.sku),
            ...supplierNumbers,
            ...Object.values(p.attributes),
            ...p.categorySlugs,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        if (filters.categorySlug && !p.categorySlugs.some((slug) => descendantSlugs.has(slug))) return false;
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
