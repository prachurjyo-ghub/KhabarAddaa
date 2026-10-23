"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiActivity, FiArrowRight, FiClock, FiShoppingBag, FiTrendingUp } from "react-icons/fi";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { formatBDT } from "@/lib/utils";

type Summary = {
  activeOrders: number; todaySales: number; todayOrderCount: number;
  recentOrders: Array<{ _id: string; orderNumber: string; customerName: string; total: number; status: string; orderType: string }>;
};

function statusVariant(status: string) {
  if (status === "CANCELLED") return "danger" as const;
  if (status === "DELIVERED" || status === "READY") return "success" as const;
  if (status === "IN_TRANSIT") return "secondary" as const;
  return "warning" as const;
}

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch<Summary>("/orders/dashboard-summary").then(setData).catch((err) => setError(err instanceof Error ? err.message : "Failed")); }, []);
  const date = new Intl.DateTimeFormat("en-BD", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return <AdminShell><div className="mx-auto max-w-[1500px] space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--secondary)] sm:mb-2 sm:text-[11px]">{date}</p><h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">Restaurant overview</h1><p className="mt-1 text-xs text-[var(--secondary)] sm:text-sm">A clear view of today’s service and sales.</p></div><Button asChild className="hidden sm:inline-flex"><Link href="/orders/manual"><FiShoppingBag />Create manual order</Link></Button></div>
    {error && <p className="rounded-xl border border-[var(--error)]/30 bg-[var(--surface)] px-4 py-3 text-sm text-[var(--error)]">{error}</p>}
    {!data && !error && <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div>}
    {data && <>
      <div className="grid gap-4 sm:grid-cols-3"><StatCard icon={FiTrendingUp} eyebrow="Revenue" label="Today’s sales" value={formatBDT(data.todaySales)} detail={`${data.todayOrderCount} completed or active orders`} /><StatCard icon={FiShoppingBag} eyebrow="Volume" label="Orders today" value={String(data.todayOrderCount)} detail="Across dine-in, takeaway & delivery" /><StatCard icon={FiActivity} eyebrow="Kitchen" label="Active orders" value={String(data.activeOrders)} detail={data.activeOrders ? "Orders currently in progress" : "Kitchen queue is clear"} emphasized /></div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <Card className="overflow-hidden"><CardHeader className="flex-row items-center justify-between border-b border-[var(--outline-variant)]"><div><CardTitle>Recent orders</CardTitle><p className="mt-1 hidden text-xs text-[var(--secondary)] sm:block">Latest activity from every order channel</p></div><Button asChild variant="ghost" size="sm"><Link href="/orders/history"><span className="hidden sm:inline">View history</span><span className="sm:hidden">History</span> <FiArrowRight /></Link></Button></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[var(--surface-container-low)] text-[11px] uppercase tracking-wide text-[var(--secondary)]"><tr><th className="px-3 py-3 font-bold sm:px-5">Order</th><th className="hidden px-5 py-3 font-bold sm:table-cell">Customer</th><th className="hidden px-5 py-3 font-bold md:table-cell">Channel</th><th className="px-3 py-3 font-bold sm:px-5">Status</th><th className="px-3 py-3 text-right font-bold sm:px-5">Total</th></tr></thead><tbody>
          {data.recentOrders.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-[var(--secondary)]">No orders yet.</td></tr>}
          {data.recentOrders.map((order) => <tr key={order._id} className="border-t border-[var(--outline-variant)] transition hover:bg-[var(--surface-container-low)]"><td className="max-w-28 truncate px-3 py-3 font-bold sm:max-w-none sm:px-5 sm:py-4">{order.orderNumber}</td><td className="hidden px-5 py-4 sm:table-cell">{order.customerName || "Guest"}</td><td className="hidden px-5 py-4 capitalize text-[var(--secondary)] md:table-cell">{order.orderType}</td><td className="px-3 py-3 sm:px-5 sm:py-4"><Badge variant={statusVariant(order.status)} className="max-w-24 truncate">{order.status.replace("_", " ")}</Badge></td><td className="px-3 py-3 text-right font-bold sm:px-5 sm:py-4">{formatBDT(order.total)}</td></tr>)}
        </tbody></table></div></CardContent></Card>
        <Card className="overflow-hidden"><CardHeader className="border-b border-[var(--outline-variant)]"><CardTitle>Service shortcuts</CardTitle><p className="text-xs text-[var(--secondary)]">Your most common workflows</p></CardHeader><CardContent className="space-y-2 p-3"><Shortcut href="/orders" icon={FiActivity} label="Manage live orders" detail={`${data.activeOrders} currently active`} /><Shortcut href="/orders/manual" icon={FiShoppingBag} label="Start manual order" detail="Dine-in, takeaway or delivery" /><Shortcut href="/tables" icon={FiClock} label="Tables & bookings" detail="Review today’s reservations" /></CardContent></Card>
      </div>
    </>}
  </div></AdminShell>;
}

function StatCard({ icon: Icon, eyebrow, label, value, detail, emphasized = false }: { icon: React.ElementType; eyebrow: string; label: string; value: string; detail: string; emphasized?: boolean }) {
  return <Card className={emphasized ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]" : ""}><CardContent className="p-4 sm:p-6"><div className="flex items-start justify-between"><p className={emphasized ? "text-[9px] font-extrabold uppercase tracking-[0.18em] opacity-65 sm:text-[10px]" : "text-[9px] font-extrabold uppercase tracking-[0.18em] text-[var(--secondary)] sm:text-[10px]"}>{eyebrow}</p><span className={emphasized ? "grid h-9 w-9 place-items-center rounded-xl bg-white/10 sm:h-10 sm:w-10" : "grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] sm:h-10 sm:w-10"}><Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" /></span></div><p className="mt-1 text-xs font-semibold opacity-80 sm:mt-2 sm:text-sm">{label}</p><p className="mt-0.5 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight sm:mt-1 sm:text-3xl">{value}</p><p className="mt-2 text-[10px] opacity-65 sm:mt-3 sm:text-[11px]">{detail}</p></CardContent></Card>;
}

function Shortcut({ href, icon: Icon, label, detail }: { href: string; icon: React.ElementType; label: string; detail: string }) {
  return <Link href={href} className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-[var(--surface-container-low)]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-container)] text-[var(--secondary)]"><Icon /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{label}</span><span className="block truncate text-[11px] text-[var(--secondary)]">{detail}</span></span><FiArrowRight className="text-[var(--secondary)] transition group-hover:translate-x-0.5" /></Link>;
}
