"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  FiGrid,
  FiCoffee,
  FiImage,
  FiClipboard,
  FiClock,
  FiPackage,
  FiDollarSign,
  FiColumns,
  FiUsers,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { StaffUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV: {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: keyof StaffUser["permissions"];
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: FiGrid, permission: "dashboard" },
  { href: "/menu", label: "Menu", icon: FiCoffee, permission: "menu" },
  { href: "/our-place", label: "Our Place", icon: FiImage, permission: "menu" },
  { href: "/orders", label: "Live Orders", icon: FiClipboard, permission: "orders" },
  { href: "/orders/history", label: "Order History", icon: FiClock, permission: "orders" },
  { href: "/inventory", label: "Inventory", icon: FiPackage, permission: "inventory" },
  { href: "/delivery-fees", label: "Financials", icon: FiDollarSign, permission: "financials" },
  { href: "/tables", label: "Tables", icon: FiColumns, permission: "tables" },
  { href: "/employees", label: "Staff", icon: FiUsers, permission: "staff" },
  { href: "/settings", label: "Settings", icon: FiSettings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, hasPermission } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/adminlogin");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="w-full max-w-sm space-y-3 p-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const items = NAV.filter((item) => {
    if (!item.permission) return true;
    if (item.href === "/tables") {
      return hasPermission("tables") || hasPermission("bookings");
    }
    return hasPermission(item.permission);
  });
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--on-background)]">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[var(--outline-variant)] bg-white">
        <div className="border-b border-[var(--outline-variant)] px-5 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            KhabarAdda
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-extrabold">
            Staff Panel
          </h1>
          <div className="mt-3 flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs capitalize text-[var(--secondary)]">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--outline-variant)] p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={async () => {
              await logout();
              router.replace("/adminlogin");
            }}
          >
            <FiLogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-x-hidden p-6 md:p-8">{children}</main>
    </div>
  );
}
