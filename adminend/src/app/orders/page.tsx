"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiPlus } from "react-icons/fi";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { formatBDT } from "@/lib/utils";

type OrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
};

type Order = {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: "delivery" | "takeaway" | "dine-in";
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  address: string;
  tableName: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
};

const NEXT: Record<string, string | null> = {
  PENDING: "PREPARING",
  PREPARING: "READY",
  READY: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};

function statusVariant(status: string) {
  if (status === "CANCELLED") return "danger" as const;
  if (status === "READY" || status === "DELIVERED") return "success" as const;
  if (status === "IN_TRANSIT") return "secondary" as const;
  return "warning" as const;
}

export default function LiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("orderType", typeFilter);
      if (sort === "oldest") params.set("sort", "oldest");
      const data = await apiFetch<{ orders: Order[] }>(
        `/orders/live?${params}`
      );
      setOrders(data.orders);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, sort]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(id: string, status: string) {
    try {
      await apiFetch(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`Marked ${status}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function markPaid(id: string) {
    try {
      await apiFetch(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus: "paid" }),
      });
      toast.success("Marked paid");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
              Live Orders
            </h1>
            <p className="text-sm text-[var(--secondary)]">
              Kitchen queue — refreshes every 15s.
            </p>
          </div>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/orders/manual"><FiPlus className="h-4 w-4" />New manual order</Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="takeaway">Takeaway</SelectItem>
              <SelectItem value="dine-in">Dine-in</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <Card>
            <CardContent className="flex min-h-20 items-center justify-center p-4 text-center text-sm text-[var(--secondary)] sm:p-8">
              No live orders right now.
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {orders.map((order) => {
            let next = NEXT[order.status] ?? null;
            if (order.status === "READY" && order.orderType !== "delivery") {
              next = "DELIVERED";
            }
            return (
              <Card key={order._id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{order.orderNumber}</h3>
                        <Badge variant={statusVariant(order.status)}>
                          {order.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {order.orderType}
                        </Badge>
                        <Badge
                          variant={
                            order.paymentStatus === "paid" ? "success" : "warning"
                          }
                        >
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--secondary)]">
                        {order.customerName || "Guest"}
                        {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                        {order.tableName ? ` · ${order.tableName}` : ""}
                        {order.address ? ` · ${order.address}` : ""}
                      </p>
                      <p className="text-xs text-[var(--secondary)]">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[var(--primary)]">
                      {formatBDT(order.total)}
                    </p>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between gap-4">
                        <span>
                          {item.quantity}× {item.name}
                          {item.notes ? (
                            <span className="text-[var(--secondary)]">
                              {" "}
                              ({item.notes})
                            </span>
                          ) : null}
                        </span>
                        <span>{formatBDT(item.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {next && (
                      <Button size="sm" onClick={() => setStatus(order._id, next)}>
                        → {next}
                      </Button>
                    )}
                    {order.paymentStatus !== "paid" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => markPaid(order._id)}
                      >
                        Mark paid
                      </Button>
                    )}
                    {order.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setStatus(order._id, "CANCELLED")}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}
