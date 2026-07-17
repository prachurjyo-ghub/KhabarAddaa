"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type MenuItemOpt = { _id: string; name: string; price: number; status: string };
type TableOpt = { _id: string; name: string; seats: number };

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
  const [menuItems, setMenuItems] = useState<MenuItemOpt[]>([]);
  const [tables, setTables] = useState<TableOpt[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({
    customerName: "Walk-in",
    customerPhone: "",
    orderType: "dine-in" as Order["orderType"],
    tableId: "",
    menuItemId: "",
    quantity: "1",
  });
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    apiFetch<{ items: MenuItemOpt[] }>("/menu/public")
      .then((d) =>
        setMenuItems(d.items.filter((i) => i.status !== "Out of Stock"))
      )
      .catch(() => {});
    apiFetch<{ tables: TableOpt[] }>("/orders/available-tables")
      .then((d) => setTables(d.tables))
      .catch(() => {});
  }, []);

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

  async function createManual(e: FormEvent) {
    e.preventDefault();
    if (!manual.menuItemId) {
      toast.error("Pick a menu item");
      return;
    }
    setSaving(true);
    try {
      const table = tables.find((t) => t._id === manual.tableId);
      await apiFetch("/orders/manual", {
        method: "POST",
        body: JSON.stringify({
          customerName: manual.customerName,
          customerPhone: manual.customerPhone,
          orderType: manual.orderType,
          tableId: manual.tableId || undefined,
          tableName: table?.name || "",
          items: [
            {
              menuItemId: manual.menuItemId,
              quantity: Number(manual.quantity) || 1,
            },
          ],
        }),
      });
      toast.success("Manual order created");
      setShowManual(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
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
          <Button variant="secondary" onClick={() => setShowManual((v) => !v)}>
            {showManual ? "Hide form" : "Manual order"}
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

        {showManual && (
          <Card>
            <CardHeader>
              <CardTitle>Create manual / waiter order</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createManual} className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Customer name</Label>
                  <Input
                    value={manual.customerName}
                    onChange={(e) =>
                      setManual({ ...manual, customerName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input
                    value={manual.customerPhone}
                    onChange={(e) =>
                      setManual({ ...manual, customerPhone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select
                    value={manual.orderType}
                    onValueChange={(v) =>
                      setManual({
                        ...manual,
                        orderType: v as Order["orderType"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine-in">Dine-in</SelectItem>
                      <SelectItem value="takeaway">Takeaway</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Table (optional)</Label>
                  <Select
                    value={manual.tableId || "none"}
                    onValueChange={(v) =>
                      setManual({ ...manual, tableId: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Table" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No table</SelectItem>
                      {tables.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.name} ({t.seats})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Menu item</Label>
                  <Select
                    value={manual.menuItemId || undefined}
                    onValueChange={(v) =>
                      setManual({ ...manual, menuItemId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.name} · {formatBDT(m.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={manual.quantity}
                    onChange={(e) =>
                      setManual({ ...manual, quantity: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Creating…" : "Create order"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-[var(--secondary)]">
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
