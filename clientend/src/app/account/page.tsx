"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCalendar, FiClock, FiShoppingBag, FiUser } from "react-icons/fi";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-nav";
import { ScrollProgress } from "@/components/scroll-progress";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { cn, formatBDT } from "@/lib/utils";

type Order = {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  orderType: string;
  createdAt: string;
};

type Booking = {
  _id: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  guests: number;
  status: string;
  tableName?: string;
  note?: string;
};

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("cancel") || s.includes("no show"))
    return "text-red-300 border-red-400/30 bg-red-950/40";
  if (
    s.includes("deliver") ||
    s.includes("complete") ||
    s.includes("checked") ||
    s.includes("seated")
  )
    return "text-emerald-300 border-emerald-400/30 bg-emerald-950/40";
  if (
    s.includes("prep") ||
    s.includes("cook") ||
    s.includes("progress") ||
    s.includes("pending")
  )
    return "text-amber-200 border-amber-400/30 bg-amber-950/40";
  return "text-[var(--gold-bright)] border-[var(--gold)]/35 bg-[var(--primary-soft)]";
}

function minutesLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    setBookingsLoading(true);
    apiFetch<{ orders: Order[] }>("/orders/mine")
      .then((d) => setOrders(d.orders))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
    apiFetch<{ bookings: Booking[] }>("/reservations/mine")
      .then((d) => setBookings(d.bookings))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [user]);

  if (loading || !user) {
    return (
      <div className="page-pad min-h-screen bg-[var(--background)]">
        <SiteHeader transparent />
        <div className="mx-auto max-w-4xl space-y-6 px-4 pb-10 pt-28 md:pt-32">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="gold-frame space-y-3 p-5 md:p-6">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const initial = (user.name?.trim()?.[0] || "G").toUpperCase();

  return (
    <div className="page-pad min-h-screen bg-[var(--background)]">
      <ScrollProgress />
      <SiteHeader transparent />

      <section className="relative overflow-hidden border-b border-[var(--outline-variant)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(197,160,89,0.14),transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-28 md:pt-32">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
            Account
          </p>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gold)]/45 bg-[var(--surface)] font-[family-name:var(--font-display)] text-2xl text-gold-glow shadow-[0_0_24px_rgba(197,160,89,0.2)]">
                {initial}
              </div>
              <div>
                <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-wide text-gold-glow md:text-4xl">
                  Hello, {user.name.split(" ")[0]}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-sm font-light text-white/55">
                  <FiUser className="h-3.5 w-3.5 text-[var(--gold)]/70" />
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/book">
                  <FiCalendar className="h-4 w-4" />
                  Reserve a table
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/menu">
                  <FiShoppingBag className="h-4 w-4" />
                  Order again
                </Link>
              </Button>
              <Button
                variant="soft"
                size="sm"
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
              >
                Log out
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 md:space-y-8 md:py-12">
        <section className="gold-frame p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-gold-glow">
                Reservations
              </h2>
              <p className="mt-1 text-sm font-light text-white/45">
                Your table bookings and status updates
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--gold)]/30 px-3 py-1 text-xs font-semibold text-[var(--gold-bright)]">
                {bookings.length} total
              </span>
              <Button asChild variant="outline" size="sm">
                <Link href="/book">Book again</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {bookingsLoading && (
              <>
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </>
            )}
            {!bookingsLoading && bookings.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--gold)]/25 bg-[var(--surface-container-low)] px-5 py-14 text-center">
                <FiCalendar className="mx-auto h-6 w-6 text-[var(--gold)]/50" />
                <p className="mt-3 text-sm text-white/55">
                  No reservations yet. Book a table after logging in.
                </p>
                <Button asChild className="mt-5" size="sm">
                  <Link href="/book">Reserve a table</Link>
                </Button>
              </div>
            )}
            {!bookingsLoading &&
              bookings.map((b) => (
                <div
                  key={b._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--gold)]/20 bg-[var(--surface-container-low)] px-4 py-4 transition-colors hover:border-[var(--gold)]/45"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {b.date} · {minutesLabel(b.startMinutes)}
                      {b.endMinutes
                        ? ` – ${minutesLabel(b.endMinutes)}`
                        : ""}
                    </p>
                    <p className="mt-1 text-sm text-white/45">
                      {b.guests} guest{b.guests > 1 ? "s" : ""}
                      {b.tableName ? ` · ${b.tableName}` : ""}
                      {b.note ? ` · ${b.note}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
                      statusTone(b.status)
                    )}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
          </div>
        </section>

        <section className="gold-frame p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-gold-glow">
                Order history
              </h2>
              <p className="mt-1 text-sm font-light text-white/45">
                Your recent KhabarAdda orders
              </p>
            </div>
            <span className="rounded-full border border-[var(--gold)]/30 px-3 py-1 text-xs font-semibold text-[var(--gold-bright)]">
              {orders.length} total
            </span>
          </div>

          <div className="space-y-3">
            {ordersLoading && (
              <>
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </>
            )}
            {!ordersLoading && orders.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--gold)]/25 bg-[var(--surface-container-low)] px-5 py-14 text-center">
                <FiClock className="mx-auto h-6 w-6 text-[var(--gold)]/50" />
                <p className="mt-3 text-sm text-white/55">
                  No orders yet. Your next craving starts on the menu.
                </p>
                <Button asChild className="mt-5" size="sm">
                  <Link href="/menu">Browse menu</Link>
                </Button>
              </div>
            )}
            {!ordersLoading &&
              orders.map((o) => (
                <div
                  key={o._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--gold)]/20 bg-[var(--surface-container-low)] px-4 py-4 transition-colors hover:border-[var(--gold)]/45"
                >
                  <div>
                    <p className="font-semibold text-white">{o.orderNumber}</p>
                    <p className="mt-1 text-sm capitalize text-white/45">
                      {o.orderType}
                      {o.createdAt
                        ? ` · ${new Date(o.createdAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize",
                        statusTone(o.status)
                      )}
                    >
                      {o.status}
                    </span>
                    <p className="min-w-[4.5rem] text-right font-semibold text-[var(--gold-bright)]">
                      {formatBDT(o.total)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
