import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProductVariant } from "../types";

export type CartItem = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  sizeLabel: string | null;
  price: number;
  regularPrice: number;
  quantity: number;
  imagePath: string | null;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "loom-co-cart";

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem: (item) => setItems((current) => {
      const existing = current.find((entry) => entry.variantId === item.variantId);
      if (existing) {
        return current.map((entry) =>
          entry.variantId === item.variantId
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry,
        );
      }
      return [...current, { ...item, quantity: 1 }];
    }),
    updateQuantity: (variantId, quantity) => setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.variantId !== variantId)
        : current.map((item) => item.variantId === variantId ? { ...item, quantity } : item),
    ),
    removeItem: (variantId) => setItems((current) => current.filter((item) => item.variantId !== variantId)),
    clearCart: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

export function cartItemFromProduct(
  product: { id: string; slug: string; name: string },
  variant: ProductVariant,
  imagePath: string | null,
): Omit<CartItem, "quantity"> {
  return {
    productId: product.id,
    variantId: variant.id,
    slug: product.slug,
    name: product.name,
    sizeLabel: variant.size_label,
    price: variant.sale_price ?? variant.regular_price,
    regularPrice: variant.regular_price,
    imagePath,
  };
}
