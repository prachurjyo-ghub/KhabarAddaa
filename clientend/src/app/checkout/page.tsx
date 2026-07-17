"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { MobileBottomNav } from "@/components/mobile-nav";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { formatBDT } from "@/lib/utils";

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
  const [orderType, setOrderType] = useState<"delivery" | "takeaway">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bkash" | "card">("cash");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [instructions, setInstructions] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
    const def = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
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
      const data = await apiFetch<{ order: { orderNumber: string } }>("/orders", {
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
      });
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
        <SiteHeader />
        <div className="mx-auto grid max-w-5xl gap-8 px-4 pt-24 pb-12 md:grid-cols-[1.1fr_0.9fr] md:pt-28">
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-pad min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <form
        onSubmit={onSubmit}
        className="mx-auto grid max-w-5xl gap-8 px-4 pt-24 pb-12 md:grid-cols-[1.1fr_0.9fr] md:pt-28"
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
              Checkout
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight">
              Almost there
            </h1>
          </div>

          <div className="rounded-2xl border border-[var(--outline-variant)] bg-white p-5">
            <p className="mb-3 text-sm font-bold">Order type</p>
            <div className="grid grid-cols-2 gap-2">
              {(["delivery", "takeaway"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrderType(t)}
                  className={`rounded-xl py-3 text-sm font-bold capitalize transition-colors ${
                    orderType === t
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-container-low)] text-[var(--ink)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[var(--outline-variant)] bg-white p-5">
            {orderType === "delivery" && (
              <div className="space-y-1.5">
                <Label>Delivery address</Label>
                <Input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, road, area"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Instructions</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Extra spicy, leave at door…"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--outline-variant)] bg-white p-5">
            <p className="mb-3 text-sm font-bold">Payment</p>
            <div className="flex flex-wrap gap-2">
              {(["cash", "bkash", "card"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize ${
                    paymentMethod === m
                      ? "bg-[var(--primary)] text-white"
                      : "border border-[var(--outline-variant)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-[var(--outline-variant)] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(26,18,16,0.4)] md:sticky md:top-28">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Order summary
          </h2>
          <div className="mt-4 space-y-3 border-b border-[var(--outline-variant)] pb-4 text-sm">
            {items.length === 0 && (
              <p className="text-[var(--secondary)]">
                Cart empty.{" "}
                <Link href="/menu" className="font-semibold text-[var(--primary)]">
                  Browse menu
                </Link>
              </p>
            )}
            {items.map((i) => (
              <div key={i.key} className="flex justify-between gap-3">
                <span className="text-[var(--secondary)]">
                  {i.name} × {i.quantity}
                </span>
                <span className="font-semibold">
                  {formatBDT(i.unitPrice * i.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={quote?.subtotal ?? subtotal} />
            <Row label="Discount" value={quote?.discount ?? 0} />
            <Row label="VAT" value={quote?.tax ?? 0} />
            <Row label="Delivery" value={quote?.deliveryFee ?? 0} />
            <p className="flex justify-between border-t border-[var(--outline-variant)] pt-3 text-base font-extrabold">
              <span>Total</span>
              <span className="text-[var(--primary)]">
                {formatBDT(quote?.total ?? subtotal)}
              </span>
            </p>
          </div>
          <Button
            type="submit"
            className="mt-5 w-full"
            size="lg"
            disabled={busy || items.length === 0}
          >
            {busy ? "Placing order…" : "Place order"}
          </Button>
        </aside>
      </form>
      <MobileBottomNav />
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <p className="flex justify-between text-[var(--secondary)]">
      <span>{label}</span>
      <span>{formatBDT(value)}</span>
    </p>
  );
}
