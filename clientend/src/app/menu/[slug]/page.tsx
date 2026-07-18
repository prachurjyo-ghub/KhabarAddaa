"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { FiArrowLeft, FiMinus, FiPlus } from "react-icons/fi";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-nav";
import { FoodImage } from "@/components/food-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/components/cart-provider";
import { apiFetch } from "@/lib/api";
import { resolveFoodImage } from "@/lib/food-images";
import { cn, formatBDT } from "@/lib/utils";

type SizeOpt = { id: string; label: string; extra: number };
type ToppingOpt = { id: string; label: string; price: number };

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
  sizes: SizeOpt[];
  toppings: ToppingOpt[];
};

function categoryName(item: MenuItem) {
  return typeof item.category === "object" ? item.category.name : "Menu";
}

function categoryId(item: MenuItem) {
  return typeof item.category === "object"
    ? item.category._id
    : String(item.category);
}

export default function MenuItemPage() {
  const params = useParams<{ slug: string | string[] }>();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const { addItem } = useCart();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [related, setRelated] = useState<MenuItem[]>([]);
  const [relatedFromOther, setRelatedFromOther] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [qty, setQty] = useState(1);
  const [sizeId, setSizeId] = useState<string>("");
  const [toppingIds, setToppingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Invalid menu item link");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setItem(null);
    setQty(1);
    setToppingIds([]);

    apiFetch<{ item: MenuItem; related: MenuItem[] }>(
      `/menu/public/${encodeURIComponent(slug)}`
    )
      .then((data) => {
        if (cancelled) return;
        const resolved: MenuItem = {
          ...data.item,
          image: resolveFoodImage(
            data.item.name,
            data.item.slug,
            data.item.image
          ),
        };
        setItem(resolved);
        const sizes = resolved.sizes || [];
        setSizeId(sizes[0]?.id || "");

        const sameCatId = categoryId(resolved);
        const relatedItems = (data.related || []).map((r, i) => ({
          ...r,
          image: resolveFoodImage(r.name, r.slug, r.image, i),
        }));
        setRelated(relatedItems);
        setRelatedFromOther(
          !relatedItems.some((r) => categoryId(r) === sameCatId)
        );
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Item not found";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, retryToken]);

  const selectedSize = useMemo(
    () => (item?.sizes || []).find((s) => s.id === sizeId),
    [item, sizeId]
  );

  const selectedToppings = useMemo(
    () => (item?.toppings || []).filter((t) => toppingIds.includes(t.id)),
    [item, toppingIds]
  );

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    const extra = selectedSize?.extra || 0;
    const toppingsTotal = selectedToppings.reduce((s, t) => s + t.price, 0);
    return item.price + extra + toppingsTotal;
  }, [item, selectedSize, selectedToppings]);

  function toggleTopping(id: string) {
    setToppingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function onAdd() {
    if (!item) return;
    if (item.status === "Out of Stock") {
      toast.error("Out of stock");
      return;
    }
    addItem({
      menuItemId: item._id,
      name: item.name,
      unitPrice,
      quantity: qty,
      image: item.image,
      sizeId: selectedSize?.id,
      sizeLabel: selectedSize?.label,
      toppingIds: selectedToppings.map((t) => t.id),
      toppingLabels: selectedToppings.map((t) => t.label),
    });
    toast.success(`Added ${item.name}`);
  }

  if (loading) {
    return (
      <div className="page-pad min-h-screen bg-[var(--background)]">
        <SiteHeader transparent />
        <div className="mx-auto max-w-6xl space-y-4 px-4 pb-16 pt-24 md:grid md:grid-cols-2 md:gap-8 md:space-y-0 md:pt-28">
          <Skeleton className="h-[220px] w-full rounded-2xl md:aspect-[4/5] md:h-auto" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-12 w-40 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="page-pad min-h-screen bg-[var(--background)]">
        <SiteHeader transparent />
        <div className="mx-auto max-w-lg px-4 pb-20 pt-32 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-gold-glow">
            Dish unavailable
          </h1>
          <p className="mt-3 text-sm text-white/55">
            {error || "We couldn’t open this menu item."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/menu">Back to menu</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setRetryToken((n) => n + 1)}
            >
              Try again
            </Button>
          </div>
        </div>
        <SiteFooter />
        <MobileBottomNav />
      </div>
    );
  }

  const suggestionTitle = relatedFromOther
    ? "You may also like"
    : `More from ${categoryName(item)}`;
  const outOfStock = item.status === "Out of Stock";

  return (
    <div className="page-pad min-h-screen bg-[var(--background)]">
      <SiteHeader transparent />

      <div className="mx-auto max-w-6xl px-4 pb-3 pt-20 md:pb-6 md:pt-28">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-white/70">
          <Link href="/menu">
            <FiArrowLeft className="h-4 w-4" />
            Back to menu
          </Link>
        </Button>
      </div>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-28 md:grid-cols-2 md:gap-12 md:pb-16">
        {/* Image — shorter on phone, tall on desktop */}
        <div className="gold-frame relative h-[220px] overflow-hidden sm:h-[260px] md:h-auto md:min-h-[520px] md:aspect-auto">
          <FoodImage
            name={item.name}
            slug={item.slug}
            image={item.image}
            alt={item.name}
            priority
            className="absolute inset-0 h-full w-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />
          <Badge className="absolute left-3 top-3 border border-[var(--gold)]/40 bg-black/55 text-[var(--gold-bright)] backdrop-blur-sm md:left-4 md:top-4">
            {categoryName(item)}
          </Badge>
          <p className="absolute right-3 top-3 rounded-md bg-[var(--gold)] px-2 py-1 text-xs font-bold text-[#121212] md:hidden">
            {formatBDT(unitPrice)}
          </p>
        </div>

        <div className="flex flex-col">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)] md:text-xs">
            {categoryName(item)}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight tracking-wide text-gold-glow sm:text-3xl md:mt-2 md:text-5xl">
            {item.name}
          </h1>
          <p className="mt-3 whitespace-pre-line text-sm font-light leading-relaxed text-white/70 md:mt-4 md:text-base md:text-white/65">
            {item.description || "Fresh from the KhabarAdda kitchen."}
          </p>

          <p className="mt-4 hidden font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--gold-bright)] md:mt-6 md:block">
            {formatBDT(unitPrice)}
          </p>
          {item.status !== "In Stock" && (
            <p className="mt-2 text-sm text-amber-300/90">{item.status}</p>
          )}

          {item.customizable && (item.sizes?.length || 0) > 0 && (
            <div className="mt-5 md:mt-8">
              <p className="mb-2 text-sm font-semibold text-[var(--gold)]/80">
                Size
              </p>
              <div className="flex flex-wrap gap-2">
                {item.sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSizeId(s.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all md:px-4 md:py-2 md:text-sm",
                      sizeId === s.id
                        ? "border-[var(--gold)] bg-gradient-to-b from-[#e0c078] to-[#c5a059] text-[#121212]"
                        : "border-[var(--gold)]/30 text-white/70 hover:border-[var(--gold)]/55 hover:text-[var(--gold-bright)]"
                    )}
                  >
                    {s.label}
                    {s.extra > 0 ? ` (+${formatBDT(s.extra)})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.customizable && (item.toppings?.length || 0) > 0 && (
            <div className="mt-4 md:mt-6">
              <p className="mb-2 text-sm font-semibold text-[var(--gold)]/80">
                Toppings
              </p>
              <div className="flex flex-wrap gap-2">
                {item.toppings.map((t) => {
                  const active = toppingIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTopping(t.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all md:px-4 md:py-2 md:text-sm",
                        active
                          ? "border-[var(--gold)] bg-[var(--primary-soft)] text-[var(--gold-bright)]"
                          : "border-[var(--gold)]/30 text-white/70 hover:border-[var(--gold)]/55"
                      )}
                    >
                      {t.label} (+{formatBDT(t.price)})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Desktop qty + add */}
          <div className="mt-8 hidden flex-wrap items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-[var(--gold)]/35 bg-[var(--surface)] px-2 py-1">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--gold-bright)] hover:bg-[var(--primary-soft)]"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <FiMinus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-white">
                {qty}
              </span>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--gold-bright)] hover:bg-[var(--primary-soft)]"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
              >
                <FiPlus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg"
              className="min-w-[180px]"
              onClick={onAdd}
              disabled={outOfStock}
            >
              {outOfStock
                ? "Unavailable"
                : `Add · ${formatBDT(unitPrice * qty)}`}
            </Button>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-28 md:pb-24">
          <div className="mb-5 md:mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold)] md:text-xs">
              Suggestions
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-gold-glow md:mt-2 md:text-4xl">
              {suggestionTitle}
            </h2>
            {relatedFromOther ? (
              <p className="mt-1 text-xs font-light text-white/45 md:mt-2 md:text-sm">
                More dishes from across the kitchen.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r._id}
                href={`/menu/${r.slug}`}
                className="gold-frame group relative block h-[180px] overflow-hidden transition-transform duration-200 hover:-translate-y-1 md:h-[280px]"
              >
                <FoodImage
                  name={r.name}
                  slug={r.slug}
                  image={r.image}
                  alt={r.name}
                  className="absolute inset-0 h-full w-full"
                  imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                <p className="absolute right-2 top-2 rounded bg-[var(--gold)] px-1.5 py-0.5 text-[10px] font-bold text-[#121212] md:right-3 md:top-3 md:text-xs">
                  {formatBDT(r.price)}
                </p>
                <div className="absolute inset-x-0 bottom-0 p-2.5 md:p-4">
                  <h3
                    className="truncate font-[family-name:var(--font-display)] text-sm font-semibold text-gold-glow md:text-xl"
                    style={{
                      WebkitTextStroke: "0.5px rgba(0,0,0,0.9)",
                      paintOrder: "stroke fill",
                      textShadow: "0 1px 2px rgba(0,0,0,0.85)",
                    }}
                  >
                    {r.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky add bar — above bottom nav */}
      <div className="fixed inset-x-0 bottom-[56px] z-40 border-t border-[var(--outline-variant)] bg-[#0c0c0c]/95 px-3 py-2.5 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--gold)]/35 bg-[var(--surface)] px-1.5 py-0.5">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--gold-bright)]"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              <FiMinus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-white">
              {qty}
            </span>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--gold-bright)]"
              onClick={() => setQty((q) => q + 1)}
              aria-label="Increase quantity"
            >
              <FiPlus className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button
            className="h-10 min-w-0 flex-1 text-sm"
            onClick={onAdd}
            disabled={outOfStock}
          >
            {outOfStock
              ? "Unavailable"
              : `Add · ${formatBDT(unitPrice * qty)}`}
          </Button>
        </div>
      </div>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
