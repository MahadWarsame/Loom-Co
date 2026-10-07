import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Availability, Category, ProductImage, ProductVariant, ProductWithDetails } from "../types";
import { getSupplierArticleNumbers, supplierArticleNumberFor } from "./supplierArticleNumbers";

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

const normalizeSearch = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");

const extractModelCodes = (value: unknown) =>
  String(value ?? "").match(/\b\d{4}[a-z]?\b/gi) ?? [];

function buildSearchIdentifiers(product: ProductWithDetails, supplierNumbers: Record<string, string>) {
  const identifiers = [
    product.sku,
    product.name,
    product.brand,
    product.short_description,
    product.description,
    ...product.variants.flatMap((variant) => [
      variant.sku,
      supplierArticleNumberFor(supplierNumbers, product.sku, variant.sku),
    ]),
    supplierArticleNumberFor(supplierNumbers, product.sku),
    ...extractModelCodes(product.name),
    ...Object.values(product.attributes),
    ...product.categorySlugs,
  ];

  return identifiers.filter(Boolean).map(normalizeSearch).filter(Boolean);
}

/**
 * Loads the active catalog.
 *
 * Availability and supplier-number indexing are deliberately non-fatal:
 * a failure in either optional service must never make the entire rug
 * catalogue disappear.
 */
export function useProducts(filters: ShopFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,sku,slug,name,short_description,description,brand,is_featured,product_categories(categories(id,slug,parent_id)),product_variants(id,product_id,sku,size_label,regular_price),product_images(product_id,position,storage_path,alt_text),product_attributes(key,value)",
        )
        .eq("status", "active")
        .limit(5000);

      if (error) throw error;

      const { data: allCategories, error: categoryError } = await supabase
        .from("categories")
        .select("id,slug,parent_id");
      if (categoryError) throw categoryError;

      const productIds = (data ?? []).map((row: any) => row.id);

      let availability: any[] | null = null;
      try {
        const result = await supabase.rpc("variant_availability", {
          p_product_ids: productIds,
        });
        if (result.error) {
          console.error("Catalog availability check failed; showing active products:", result.error);
        } else {
          availability = result.data ?? [];
        }
      } catch (error) {
        console.error("Catalog availability check failed; showing active products:", error);
      }

      const availabilitySucceeded = availability !== null;
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
        .filter((row: any) => !availabilitySucceeded || inStockProductIds.has(row.id))
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

      let supplierNumbers: Record<string, string> = {};
      try {
        supplierNumbers = await getSupplierArticleNumbers();
      } catch (error) {
        console.error("Supplier article-number index failed; continuing without it:", error);
      }

      const search = normalizeSearch(filters.q);
      return products.filter((p) => {
        if (search) {
          const identifiers = buildSearchIdentifiers(p, supplierNumbers);
          if (!identifiers.some((identifier) => identifier.includes(search))) return false;
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
          "id,sku,slug,name,short_description,description,brand,is_featured,product_variants(id,product_id,sku,size_label,regular_price,position),product_images(product_id,position,storage_path,alt_text),product_attributes(key,value)",
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
