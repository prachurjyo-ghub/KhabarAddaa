"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { FiArrowLeft, FiMinus, FiPlus } from "react-icons/fi";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-nav";
import { ScrollProgress } from "@/components/scroll-progress";
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
        <ScrollProgress />
        <SiteHeader transparent />
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-28 md:grid-cols-2">
          <Skeleton className="aspect-[4/5] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="page-pad min-h-screen bg-[var(--background)]">
        <ScrollProgress />
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

  return (
    <div className="page-pad min-h-screen bg-[var(--background)]">
      <ScrollProgress />
      <SiteHeader transparent />

      <div className="mx-auto max-w-6xl px-4 pb-8 pt-24 md:pt-28">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-white/70">
          <Link href="/menu">
            <FiArrowLeft className="h-4 w-4" />
            Back to menu
          </Link>
        </Button>
      </div>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 md:grid-cols-2 md:gap-12">
        <div className="gold-frame relative aspect-[4/5] overflow-hidden md:aspect-auto md:min-h-[520px]">
          <FoodImage
            name={item.name}
            slug={item.slug}
            image={item.image}
            alt={item.name}
            priority
            className="absolute inset-0 h-full w-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
          <Badge className="absolute left-4 top-4 border border-[var(--gold)]/40 bg-black/55 text-[var(--gold-bright)] backdrop-blur-sm">
            {categoryName(item)}
          </Badge>
        </div>

        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
            {categoryName(item)}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-wide text-gold-glow md:text-5xl">
            {item.name}
          </h1>
          <p className="mt-4 whitespace-pre-line text-sm font-light leading-relaxed text-white/65 md:text-base">
            {item.description || "Fresh from the KhabarAdda kitchen."}
          </p>

          <p className="mt-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--gold-bright)]">
            {formatBDT(unitPrice)}
          </p>
          {item.status !== "In Stock" && (
            <p className="mt-2 text-sm text-amber-300/90">{item.status}</p>
          )}

          {item.customizable && (item.sizes?.length || 0) > 0 && (
            <div className="mt-8">
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
                      "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
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
            <div className="mt-6">
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
                        "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
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

          <div className="mt-8 flex flex-wrap items-center gap-3">
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
              disabled={item.status === "Out of Stock"}
            >
              {item.status === "Out of Stock"
                ? "Unavailable"
                : `Add · ${formatBDT(unitPrice * qty)}`}
            </Button>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
              Suggestions
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-gold-glow md:text-4xl">
              {suggestionTitle}
            </h2>
            {relatedFromOther ? (
              <p className="mt-2 text-sm font-light text-white/45">
                More dishes from across the kitchen.
              </p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r._id}
                href={`/menu/${r.slug}`}
                className="gold-frame group relative block h-[280px] overflow-hidden transition-transform duration-200 hover:-translate-y-1"
              >
                <FoodImage
                  name={r.name}
                  slug={r.slug}
                  image={r.image}
                  alt={r.name}
                  className="absolute inset-0 h-full w-full"
                  imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]/80">
                    {categoryName(r)}
                  </p>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-gold-glow">
                    {r.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-white/80">
                    {formatBDT(r.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
