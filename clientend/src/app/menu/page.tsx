"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  FiMinus,
  FiPlus,
  FiSearch,
  FiShoppingBag,
  FiSliders,
  FiX,
} from "react-icons/fi";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-nav";
import { ScrollProgress } from "@/components/scroll-progress";
import { Reveal, ease } from "@/components/motion";
import { FoodImage } from "@/components/food-image";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { resolveFoodImage } from "@/lib/food-images";
import { cn, formatBDT } from "@/lib/utils";

type Category = { _id: string; name: string };
type MenuItem = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  description: string;
  category: { _id: string; name: string } | string;
  customizable: boolean;
  status: string;
  sizes: Array<{ id: string; label: string; extra: number }>;
  toppings: Array<{ id: string; label: string; price: number }>;
};

type MenuPayload = { items: MenuItem[]; categories: Category[] };
let menuCache: MenuPayload | null = null;

function categoryId(item: MenuItem) {
  return typeof item.category === "object" ? item.category._id : String(item.category);
}

function categoryLabel(item: MenuItem, categories: Category[]) {
  if (typeof item.category === "object") return item.category.name;
  return categories.find((c) => c._id === item.category)?.name || "Menu";
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const { addItem, items: cartItems, updateQty, subtotal, count } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (menuCache) {
      setItems(menuCache.items);
      setCategories(menuCache.categories);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiFetch<MenuPayload>("/menu/public")
      .then((data) => {
        const payload: MenuPayload = {
          categories: data.categories,
          items: data.items.map((item) => ({
            ...item,
            image: resolveFoodImage(item.name, item.slug, item.image),
          })),
        };
        menuCache = payload;
        setItems(payload.items);
        setCategories(payload.categories);
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to load menu")
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...items];
    if (category !== "all") {
      list = list.filter((i) => categoryId(i) === category);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [items, category, search, sort]);

  function quickAdd(item: MenuItem) {
    if (item.status === "Out of Stock") {
      toast.error("Out of stock");
      return;
    }
    if (item.customizable) {
      window.location.href = `/menu/${item.slug}`;
      return;
    }
    addItem({
      menuItemId: item._id,
      name: item.name,
      unitPrice: item.price,
      quantity: 1,
      image: resolveFoodImage(item.name, item.slug, item.image),
    });
    toast.success(`Added ${item.name}`);
    setDrawerOpen(true);
  }

  return (
    <div className="page-pad min-h-screen bg-[var(--background)]">
      <ScrollProgress />
      <SiteHeader transparent />

      <section className="relative h-[18vh] min-h-[140px] max-h-[190px] overflow-hidden md:h-[20vh] md:max-h-[210px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Food_Items_Images/pasta.jpg"
          alt="KhabarAdda menu"
          className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-4 pt-16 md:pb-5">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-wide text-gold-glow md:text-3xl">
            Discover Your Next Favorite Dish
          </h1>
          <p className="mt-1 max-w-lg text-xs font-light text-white/65 md:text-sm">
            Explore chef-crafted recipes made with fresh ingredients, bold
            flavors, and unforgettable taste.
          </p>
        </div>
      </section>

      <div className="sticky top-[64px] z-30 border-b border-[var(--outline-variant)] bg-[#0c0c0c]/92 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                category === "all"
                  ? "bg-gradient-to-b from-[#e0c078] to-[#c5a059] text-[#121212]"
                  : "border border-[var(--gold)]/30 bg-[var(--surface-warm)] text-white/70 hover:border-[var(--gold)]/55 hover:text-[var(--gold-bright)]"
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => setCategory(c._id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  category === c._id
                    ? "bg-gradient-to-b from-[#e0c078] to-[#c5a059] text-[#121212]"
                    : "border border-[var(--gold)]/30 bg-[var(--surface-warm)] text-white/70 hover:border-[var(--gold)]/55 hover:text-[var(--gold-bright)]"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gold)]/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes…"
                className="h-10 border-[var(--gold)]/25 bg-[var(--surface)] pl-9"
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-10 w-[150px] border-[var(--gold)]/25 bg-[var(--surface)]">
                <FiSliders className="mr-1 h-3.5 w-3.5 opacity-60" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price_asc">Price ↑</SelectItem>
                <SelectItem value="price_desc">Price ↓</SelectItem>
              </SelectContent>
            </Select>
            <p className="hidden text-xs font-semibold text-[var(--gold)]/70 sm:block">
              {filtered.length} dishes
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[360px] rounded-[1.4rem]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Reveal className="gold-frame px-6 py-20 text-center">
            <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-gold-glow">
              Nothing matches
            </p>
            <p className="mt-2 text-sm text-white/55">
              Try another category or clear your search.
            </p>
            <Button
              className="mt-5"
              variant="soft"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
            >
              Reset filters
            </Button>
          </Reveal>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, index) => (
              <article
                key={item._id}
                className="gold-frame group relative h-[360px] overflow-hidden transition-transform duration-200 hover:-translate-y-1"
              >
                <Link
                  href={`/menu/${item.slug}`}
                  className="absolute inset-0 z-[1]"
                  aria-label={`View ${item.name}`}
                />
                <FoodImage
                  name={item.name}
                  slug={item.slug}
                  image={item.image}
                  index={index}
                  alt={item.name}
                  priority={index < 6}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {/* Soft bottom scrim only — keeps food bright while text stays readable */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

                {item.customizable && (
                  <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-[var(--gold)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#121212]">
                    Custom
                  </span>
                )}
                <Badge
                  variant="secondary"
                  className="pointer-events-none absolute right-3 top-3 z-10 border border-[var(--gold)]/35 bg-black/55 text-[var(--gold-bright)] backdrop-blur-sm"
                >
                  {categoryLabel(item, categories)}
                </Badge>

                {item.status === "Out of Stock" && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/60 text-sm font-bold text-white">
                    Out of stock
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 z-[2] flex flex-col gap-3 p-4">
                  <Link href={`/menu/${item.slug}`} className="block">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight text-gold-glow">
                          {item.name}
                        </h2>
                        <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm font-light text-white/75">
                          {item.description ||
                            "Fresh from the KhabarAdda kitchen."}
                        </p>
                      </div>
                      <p className="shrink-0 rounded-md bg-[var(--gold)] px-2.5 py-1 text-sm font-bold text-[#121212]">
                        {formatBDT(item.price)}
                      </p>
                    </div>
                  </Link>
                  <div className="relative z-[3] flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/menu/${item.slug}`}>Details</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-[1.2]"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        quickAdd(item);
                      }}
                      disabled={item.status === "Out of Stock"}
                    >
                      {item.status === "Out of Stock"
                        ? "Unavailable"
                        : item.customizable
                          ? "Customize"
                          : "Add"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {count > 0 && !drawerOpen && (
          <motion.div
            className="fixed inset-x-0 bottom-[68px] z-40 px-4 md:bottom-6"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="gold-frame mx-auto flex w-full max-w-md items-center justify-between px-5 py-3.5 text-white"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <FiShoppingBag className="h-4 w-4 text-[var(--gold)]" />
                {count} item{count > 1 ? "s" : ""}
              </span>
              <span className="text-sm font-bold text-[var(--gold-bright)]">
                {formatBDT(subtotal)} · View cart
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/45"
              aria-label="Close cart"
              onClick={() => setDrawerOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="relative flex h-full w-full max-w-md flex-col bg-[var(--background)] shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
            >
              <div className="flex items-center justify-between border-b border-[var(--outline-variant)] px-5 py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
                    Your order
                  </p>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-gold-glow">
                    Cart
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-full p-2 text-white/70 hover:bg-[var(--primary-soft)] hover:text-[var(--gold-bright)]"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {cartItems.length === 0 && (
                  <p className="py-16 text-center text-sm text-white/50">
                    Your cart is empty. Add something delicious.
                  </p>
                )}
                <AnimatePresence initial={false}>
                  {cartItems.map((line) => (
                    <motion.div
                      key={line.key}
                      layout
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease }}
                      className="gold-frame flex items-center gap-3 p-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--gold)]/25">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={line.image || "/Food_Items_Images/pasta.jpg"}
                          alt={line.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">{line.name}</p>
                        <p className="text-sm text-[var(--gold)]">
                          {formatBDT(line.unitPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--gold)]/35 text-[var(--gold-bright)]"
                          onClick={() => updateQty(line.key, line.quantity - 1)}
                        >
                          <FiMinus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-white">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--gold)]/35 text-[var(--gold-bright)]"
                          onClick={() => updateQty(line.key, line.quantity + 1)}
                        >
                          <FiPlus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="border-t border-[var(--outline-variant)] bg-[var(--surface)] px-5 py-4">
                <p className="mb-3 flex justify-between text-base font-bold">
                  <span className="text-white/80">Subtotal</span>
                  <span className="text-[var(--gold-bright)]">
                    {formatBDT(subtotal)}
                  </span>
                </p>
                <Button asChild className="w-full" size="lg">
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
