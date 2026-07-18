"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Reveal, ease } from "@/components/motion";
import { FoodImage } from "@/components/food-image";
import { useAuth } from "@/components/auth-provider";
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
  homepageBadge?: string;
  customizable: boolean;
  status: string;
  sizes: Array<{ id: string; label: string; extra: number }>;
  toppings: Array<{ id: string; label: string; price: number }>;
};

type MenuPayload = { items: MenuItem[]; categories: Category[] };

function categoryId(item: MenuItem) {
  return typeof item.category === "object" ? item.category._id : String(item.category);
}

function categoryLabel(item: MenuItem, categories: Category[]) {
  if (typeof item.category === "object") return item.category.name;
  return categories.find((c) => c._id === item.category)?.name || "Menu";
}

function MenuPageContent() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addItem, items: cartItems, updateQty, subtotal, count } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const lastScrollY = useRef(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("cart") === "1") setDrawerOpen(true);
  }, [searchParams]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      // Desktop: always show filters
      if (window.matchMedia("(min-width: 768px)").matches) {
        setFiltersVisible(true);
        lastScrollY.current = window.scrollY;
        return;
      }

      const y = window.scrollY;
      const delta = y - lastScrollY.current;

      if (y < 80) {
        setFiltersVisible(true);
      } else if (delta > 6) {
        setFiltersVisible(false);
      } else if (delta < -6) {
        setFiltersVisible(true);
      }

      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setLoading(true);
    apiFetch<MenuPayload>("/menu/public")
      .then((data) => {
        setItems(
          (data.items || []).map((item) => ({
            ...item,
            image: resolveFoodImage(item.name, item.slug, item.image),
          }))
        );
        setCategories(data.categories || []);
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Failed to load menu")
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...items];
    if (category === "chef-special") {
      list = list.filter((i) => i.homepageBadge === "chef-special");
    } else if (category !== "all") {
      list = list.filter((i) => categoryId(i) === category);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((i) => {
        const cat = categoryLabel(i, categories).toLowerCase();
        return (
          i.name.toLowerCase().includes(q) ||
          i.slug?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          cat.includes(q)
        );
      });
    }
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [items, category, search, sort, categories]);

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
  }

  return (
    <div className="page-pad min-h-screen bg-[var(--background)]">
      <SiteHeader transparent />

      <section className="relative min-h-[220px] overflow-hidden md:min-h-[240px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Food_Items_Images/pasta.jpg"
          alt="KhabarAdda menu"
          className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/40" />
        <div className="relative mx-auto flex min-h-[220px] max-w-6xl flex-col justify-end px-4 pb-5 pt-24 md:min-h-[240px] md:pb-6 md:pt-28">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-snug tracking-wide text-gold-glow sm:text-2xl md:text-3xl">
            Discover Your Next Favorite Dish
          </h1>
          <p className="mt-1.5 max-w-lg text-xs font-light leading-relaxed text-white/65 md:text-sm">
            Explore chef-crafted recipes made with fresh ingredients, bold
            flavors, and unforgettable taste.
          </p>
        </div>
      </section>

      <div
        className={cn(
          "sticky top-[64px] z-30 border-b border-[var(--outline-variant)] bg-[#0c0c0c]/92 backdrop-blur-md transition-transform duration-300 ease-out md:translate-y-0",
          filtersVisible ? "translate-y-0" : "-translate-y-[120%] md:translate-y-0"
        )}
      >
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
            <button
              type="button"
              onClick={() => setCategory("chef-special")}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                category === "chef-special"
                  ? "bg-gradient-to-b from-[#e0c078] to-[#c5a059] text-[#121212]"
                  : "border border-[var(--gold)]/30 bg-[var(--surface-warm)] text-white/70 hover:border-[var(--gold)]/55 hover:text-[var(--gold-bright)]"
              )}
            >
              Chef&apos;s Special
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
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-[var(--gold)]/60" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes…"
                autoComplete="off"
                className="h-10 border-[var(--gold)]/25 bg-[var(--surface)] pl-9 text-white placeholder:text-white/45"
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
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton
                key={i}
                className="h-[210px] rounded-[1.2rem] md:h-[360px]"
              />
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
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-3">
            {filtered.map((item, index) => (
              <article
                key={item._id}
                className="gold-frame group relative h-[210px] overflow-hidden transition-transform duration-200 hover:-translate-y-1 md:h-[360px]"
              >
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
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black/35 to-transparent" />

                {item.customizable && (
                  <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-[var(--gold)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#121212] md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-[10px]">
                    Custom
                  </span>
                )}
                <p className="pointer-events-none absolute right-2 top-2 z-10 rounded-md bg-[var(--gold)] px-1.5 py-0.5 text-[11px] font-bold text-[#121212] shadow-sm md:right-3 md:top-3 md:px-2.5 md:py-1 md:text-sm">
                  {formatBDT(item.price)}
                </p>

                {item.status === "Out of Stock" && (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/60 text-xs font-bold text-white md:text-sm">
                    Out of stock
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 z-[2] flex flex-col gap-2 p-2.5 md:gap-3 md:p-4">
                  <h2
                    className="truncate font-[family-name:var(--font-display)] text-sm font-semibold leading-tight text-gold-glow md:text-xl"
                    title={item.name}
                    style={{
                      WebkitTextStroke: "0.6px rgba(0,0,0,0.95)",
                      paintOrder: "stroke fill",
                      textShadow:
                        "0 1px 2px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.65)",
                    }}
                  >
                    {item.name}
                  </h2>
                  <div className="relative z-[3] flex gap-1.5 md:gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="btn-glass h-8 flex-1 px-2 text-xs md:h-9 md:text-sm"
                    >
                      <Link href={`/menu/${item.slug}`}>Details</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 flex-1 px-2 text-xs md:h-9 md:text-sm"
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
          <div className="fixed inset-0 z-50 flex items-end justify-end md:items-stretch">
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
              className="relative flex max-h-[58vh] w-full flex-col rounded-t-2xl bg-[var(--background)] shadow-2xl md:max-h-none md:h-full md:max-w-md md:rounded-none"
              initial={isDesktop ? { x: "100%" } : { y: "100%" }}
              animate={isDesktop ? { x: 0 } : { y: 0 }}
              exit={isDesktop ? { x: "100%" } : { y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20 md:hidden" />
              <div className="flex items-center justify-between border-b border-[var(--outline-variant)] px-5 py-3 md:py-4">
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
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-3 md:py-4">
                {cartItems.length === 0 && (
                  <p className="py-10 text-center text-sm text-white/50 md:py-16">
                    Your cart is empty. Add something delicious.
                  </p>
                )}
                <AnimatePresence initial={false}>
                  {cartItems.map((line) => (
                    <motion.div
                      key={line.key}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.25, ease }}
                      className="gold-frame flex items-center gap-3 p-3"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--gold)]/25 md:h-16 md:w-16">
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
              <div className="shrink-0 border-t border-[var(--outline-variant)] bg-[var(--surface)] px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:py-4">
                <p className="mb-3 flex justify-between text-base font-bold">
                  <span className="text-white/80">Subtotal</span>
                  <span className="text-[var(--gold-bright)]">
                    {formatBDT(subtotal)}
                  </span>
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    if (!user) {
                      toast.message("Please log in to checkout");
                      router.push("/login?next=/checkout");
                      return;
                    }
                    router.push("/checkout");
                  }}
                >
                  Checkout
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

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="page-pad flex min-h-screen items-center justify-center bg-[var(--background)] text-white/60">
          Loading menu…
        </div>
      }
    >
      <MenuPageContent />
    </Suspense>
  );
}
