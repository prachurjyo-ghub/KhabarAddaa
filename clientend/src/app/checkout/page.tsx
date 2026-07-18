"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiArrowLeft, FiMapPin, FiPhone, FiShoppingBag } from "react-icons/fi";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-nav";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { cn, formatBDT } from "@/lib/utils";

type Quote = {
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
};

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { items, clear, subtotal } = useCart();
  const router = useRouter();
  const [orderType, setOrderType] = useState<"delivery" | "takeaway">(
    "delivery"
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bkash" | "card">(
    "cash"
  );
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [instructions, setInstructions] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      toast.message("Please log in to checkout");
      router.replace("/login?next=/checkout");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
    const def =
      user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
    if (def?.line) setAddress(def.line);
  }, [user]);

  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    apiFetch<{ quote: Quote }>("/public/order-quote", {
      method: "POST",
      body: JSON.stringify({
        orderType,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          sizeId: i.sizeId,
          toppingIds: i.toppingIds,
        })),
      }),
    })
      .then((d) => setQuote(d.quote))
      .catch(() =>
        setQuote({
          subtotal,
          discount: 0,
          tax: 0,
          deliveryFee: orderType === "delivery" ? 60 : 0,
          total: subtotal + (orderType === "delivery" ? 60 : 0),
        })
      );
  }, [items, orderType, subtotal]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (orderType === "delivery" && !address.trim()) {
      toast.error("Address required for delivery");
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch<{ order: { orderNumber: string } }>(
        "/orders",
        {
          method: "POST",
          body: JSON.stringify({
            orderType,
            paymentMethod,
            address,
            instructions,
            customerPhone: phone || user.phone,
            customerName: user.name,
            items: items.map((i) => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              sizeId: i.sizeId,
              toppingIds: i.toppingIds,
            })),
          }),
        }
      );
      clear();
      toast.success(`Order ${data.order.orderNumber} placed`);
      router.push("/account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="page-pad min-h-screen bg-[var(--background)]">
        <SiteHeader transparent />
        <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-12 pt-24 md:grid-cols-[1.1fr_0.9fr] md:pt-28">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const total = quote?.total ?? subtotal;

  return (
    <div className="page-pad min-h-screen bg-[var(--background)]">
      <SiteHeader transparent />

      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-5xl px-4 pb-28 pt-20 md:pb-16 md:pt-28"
      >
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4 text-white/70"
        >
          <Link href="/menu?cart=1">
            <FiArrowLeft className="h-4 w-4" />
            Back to cart
          </Link>
        </Button>

        <div className="mb-6 md:mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--gold)]">
            Checkout
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-wide text-gold-glow md:text-4xl">
            Almost there
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Confirm delivery details and place your order.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr] md:gap-8">
          {/* Summary first on mobile so totals are visible before form fields */}
          <aside className="order-1 gold-frame h-fit overflow-hidden md:order-2 md:sticky md:top-28">
            <div className="border-b border-[var(--outline-variant)] bg-[var(--surface-warm)] px-4 py-4 md:px-5">
              <div className="flex items-center gap-2">
                <FiShoppingBag className="h-4 w-4 text-[var(--gold)]" />
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-gold-glow">
                  Order summary
                </h2>
              </div>
            </div>
            <div className="space-y-3 px-4 py-4 md:px-5">
              {items.length === 0 ? (
                <p className="text-sm text-white/50">
                  Cart empty.{" "}
                  <Link
                    href="/menu"
                    className="font-semibold text-[var(--gold-bright)] hover:underline"
                  >
                    Browse menu
                  </Link>
                </p>
              ) : (
                <div className="max-h-[180px] space-y-3 overflow-y-auto pr-1 md:max-h-[240px]">
                  {items.map((i) => (
                    <div key={i.key} className="flex gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[var(--gold)]/25">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={i.image || "/Food_Items_Images/pasta.jpg"}
                          alt={i.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {i.name}
                          {i.sizeLabel ? ` · ${i.sizeLabel}` : ""}
                        </p>
                        <p className="text-xs text-white/45">× {i.quantity}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[var(--gold)]">
                        {formatBDT(i.unitPrice * i.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 border-t border-[var(--outline-variant)] pt-3 text-sm">
                <Row label="Subtotal" value={quote?.subtotal ?? subtotal} />
                {(quote?.discount ?? 0) > 0 && (
                  <Row label="Discount" value={-(quote?.discount ?? 0)} accent />
                )}
                <Row label="VAT" value={quote?.tax ?? 0} />
                <Row label="Delivery" value={quote?.deliveryFee ?? 0} />
                <p className="flex justify-between border-t border-[var(--outline-variant)] pt-3 text-base font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-[var(--gold-bright)]">
                    {formatBDT(total)}
                  </span>
                </p>
              </div>

              <Button
                type="submit"
                className="mt-1 hidden w-full md:flex"
                size="lg"
                disabled={busy || items.length === 0}
              >
                {busy ? "Placing order…" : `Place order · ${formatBDT(total)}`}
              </Button>
            </div>
          </aside>

          <div className="order-2 space-y-4 md:order-1 md:space-y-5">
            <section className="gold-frame p-4 md:p-5">
              <p className="mb-3 text-sm font-semibold text-[var(--gold)]/90">
                Order type
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["delivery", "takeaway"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrderType(t)}
                    className={cn(
                      "rounded-xl border py-3 text-sm font-bold capitalize transition-colors",
                      orderType === t
                        ? "border-[var(--gold)] bg-gradient-to-b from-[#e0c078] to-[#c5a059] text-[#121212]"
                        : "border-[var(--gold)]/30 bg-[var(--surface)] text-white/70 hover:border-[var(--gold)]/55 hover:text-[var(--gold-bright)]"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>

            <section className="gold-frame space-y-3.5 p-4 md:p-5">
              <p className="text-sm font-semibold text-[var(--gold)]/90">
                Contact & delivery
              </p>
              {orderType === "delivery" && (
                <div className="space-y-1.5">
                  <Label className="text-white/70">Delivery address</Label>
                  <div className="relative">
                    <FiMapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gold)]/60" />
                    <Input
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House, road, area"
                      className="border-[var(--gold)]/25 bg-[var(--surface)] pl-9 text-white"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-white/70">Phone</Label>
                <div className="relative">
                  <FiPhone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gold)]/60" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="border-[var(--gold)]/25 bg-[var(--surface)] pl-9 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Instructions</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Extra spicy, leave at door…"
                  className="min-h-[88px] border-[var(--gold)]/25 bg-[var(--surface)] text-white placeholder:text-white/40"
                />
              </div>
            </section>

            <section className="gold-frame p-4 md:p-5">
              <p className="mb-3 text-sm font-semibold text-[var(--gold)]/90">
                Payment
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["cash", "bkash", "card"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={cn(
                      "rounded-xl border py-2.5 text-sm font-semibold capitalize transition-colors",
                      paymentMethod === m
                        ? "border-[var(--gold)] bg-gradient-to-b from-[#e0c078] to-[#c5a059] text-[#121212]"
                        : "border-[var(--gold)]/30 bg-[var(--surface)] text-white/70 hover:border-[var(--gold)]/55"
                    )}
                  >
                    {m === "bkash" ? "bKash" : m}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Mobile sticky place order */}
        <div className="fixed inset-x-0 bottom-[56px] z-40 border-t border-[var(--outline-variant)] bg-[#0c0c0c]/95 px-3 py-2.5 backdrop-blur-md md:hidden">
          <Button
            type="submit"
            className="h-11 w-full text-sm"
            disabled={busy || items.length === 0}
          >
            {busy ? "Placing order…" : `Place order · ${formatBDT(total)}`}
          </Button>
        </div>
      </form>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <p className="flex justify-between text-white/55">
      <span>{label}</span>
      <span
        className={cn(
          "font-medium",
          accent ? "text-emerald-400" : "text-white/80"
        )}
      >
        {accent && value < 0
          ? `−${formatBDT(Math.abs(value))}`
          : formatBDT(value)}
      </span>
    </p>
  );
}
