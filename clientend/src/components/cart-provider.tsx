"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartLine = {
  key: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  image?: string;
  sizeId?: string;
  sizeLabel?: string;
  toppingIds?: string[];
  toppingLabels?: string[];
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  addItem: (line: Omit<CartLine, "key">) => void;
  updateQty: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CART_KEY = "khabaradda_cart";
const CartContext = createContext<CartContextValue | null>(null);

function makeKey(line: Omit<CartLine, "key">) {
  return [
    line.menuItemId,
    line.sizeId || "",
    (line.toppingIds || []).slice().sort().join(","),
  ].join(":");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((line: Omit<CartLine, "key">) => {
    const key = makeKey(line);
    setItems((prev) => {
      const existing = prev.find((p) => p.key === key);
      if (existing) {
        return prev.map((p) =>
          p.key === key
            ? { ...p, quantity: p.quantity + line.quantity }
            : p
        );
      }
      return [...prev, { ...line, key }];
    });
  }, []);

  const updateQty = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.key === key ? { ...p, quantity } : p))
        .filter((p) => p.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((p) => p.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);

  const value = useMemo(
    () => ({ items, count, subtotal, addItem, updateQty, removeItem, clear }),
    [items, count, subtotal, addItem, updateQty, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
