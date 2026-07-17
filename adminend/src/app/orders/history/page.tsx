"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatBDT } from "@/lib/utils";

type Order = {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  address: string;
  tableName: string;
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
  total: number;
  createdAt: string;
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("orderType", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const data = await apiFetch<{ orders: Order[] }>(
        `/orders/history?${params}`
      );
      setOrders(data.orders);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
            Order History
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            Completed and cancelled orders.
          </p>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Apply
          </Button>
        </div>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-[var(--secondary)]">
              No matching orders.
            </CardContent>
          </Card>
        )}

        <div className="overflow-x-auto rounded-xl border border-[var(--outline-variant)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="text-[var(--secondary)]">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Fragment key={o._id}>
                  <tr className="border-b last:border-0">
                    <td className="px-4 py-3 font-semibold">{o.orderNumber}</td>
                    <td className="px-4 py-3">{o.customerName || "—"}</td>
                    <td className="px-4 py-3 capitalize">{o.orderType}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={o.status === "CANCELLED" ? "danger" : "success"}
                      >
                        {o.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatBDT(o.total)}</td>
                    <td className="px-4 py-3 text-[var(--secondary)]">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setExpanded(expanded === o._id ? null : o._id)
                        }
                      >
                        {expanded === o._id ? "Hide" : "Details"}
                      </Button>
                    </td>
                  </tr>
                  {expanded === o._id && (
                    <tr className="border-b bg-[var(--surface-container-low)]">
                      <td colSpan={7} className="px-4 py-3">
                        <ul className="space-y-1 text-sm">
                          {o.items.map((item, i) => (
                            <li key={i} className="flex justify-between max-w-md">
                              <span>
                                {item.quantity}× {item.name}
                              </span>
                              <span>{formatBDT(item.lineTotal)}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-[var(--secondary)]">
                          Payment: {o.paymentStatus}
                          {o.tableName ? ` · Table ${o.tableName}` : ""}
                          {o.address ? ` · ${o.address}` : ""}
                          {o.customerPhone ? ` · ${o.customerPhone}` : ""}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
