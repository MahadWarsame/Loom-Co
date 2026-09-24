export type Category = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  size_label: string | null;
  regular_price: number;
  sale_price: number | null;
};

export type Availability = {
  variant_id: string;
  product_id: string;
  in_stock: boolean;
  low_stock: boolean;
};

export type ProductImage = {
  product_id: string;
  position: number;
  storage_path: string;
  alt_text: string | null;
};

export type Product = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  brand: string | null;
  is_featured: boolean;
};

/** A product with everything the UI needs, assembled client-side from the queries above. */
export type ProductWithDetails = Product & {
  variants: ProductVariant[];
  images: ProductImage[];
  attributes: Record<string, string>;
  categorySlugs: string[];
};
