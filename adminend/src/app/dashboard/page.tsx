"use client";

import { useEffect, useState } from "react";
import { FiShoppingBag, FiTrendingUp, FiActivity } from "react-icons/fi";
import { AdminShell } from "@/components/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { formatBDT } from "@/lib/utils";

type Summary = {
  activeOrders: number;
  todaySales: number;
  todayOrderCount: number;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    orderType: string;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Summary>("/orders/dashboard-summary")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            Today&apos;s sales and live kitchen pulse.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {!data && !error && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={FiTrendingUp}
                label="Today sales"
                value={formatBDT(data.todaySales)}
              />
              <StatCard
                icon={FiShoppingBag}
                label="Orders today"
                value={String(data.todayOrderCount)}
              />
              <StatCard
                icon={FiActivity}
                label="Active orders"
                value={String(data.activeOrders)}
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Recent orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[var(--secondary)]">
                      <tr className="border-b">
                        <th className="pb-3 font-semibold">Order</th>
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">Type</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-[var(--secondary)]"
                          >
                            No orders yet.
                          </td>
                        </tr>
                      )}
                      {data.recentOrders.map((o) => (
                        <tr key={o._id} className="border-b last:border-0">
                          <td className="py-3 font-semibold">{o.orderNumber}</td>
                          <td className="py-3">{o.customerName}</td>
                          <td className="py-3 capitalize">{o.orderType}</td>
                          <td className="py-3">
                            <Badge
                              variant={
                                o.status === "CANCELLED"
                                  ? "danger"
                                  : o.status === "DELIVERED"
                                    ? "success"
                                    : "warning"
                              }
                            >
                              {o.status}
                            </Badge>
                          </td>
                          <td className="py-3">{formatBDT(o.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-5">
        <div className="rounded-lg bg-[var(--primary-fixed)] p-2.5 text-[var(--primary)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--secondary)]">
            {label}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-extrabold text-[var(--primary)]">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
