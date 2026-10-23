"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiActivity, FiBookOpen, FiChevronRight, FiClock, FiCoffee, FiColumns,
  FiDollarSign, FiGrid, FiImage, FiLogOut, FiMoreHorizontal, FiMoon, FiPackage,
  FiSettings, FiShoppingBag, FiSun, FiUsers, FiX,
} from "react-icons/fi";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { StaffUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV: {
  href: string; label: string; icon: React.ElementType;
  permission?: keyof StaffUser["permissions"];
  section: "Workspace" | "Management" | "System"; exact?: boolean;
}[] = [
  { href: "/dashboard", label: "Overview", icon: FiGrid, permission: "dashboard", section: "Workspace" },
  { href: "/orders", label: "Live orders", icon: FiActivity, permission: "orders", section: "Workspace", exact: true },
  { href: "/orders/manual", label: "Manual order", icon: FiShoppingBag, permission: "orders", section: "Workspace" },
  { href: "/orders/history", label: "Order history", icon: FiClock, permission: "orders", section: "Workspace" },
  { href: "/menu", label: "Menu", icon: FiCoffee, permission: "menu", section: "Management" },
  { href: "/inventory", label: "Inventory", icon: FiPackage, permission: "inventory", section: "Management" },
  { href: "/tables", label: "Tables & bookings", icon: FiColumns, permission: "tables", section: "Management" },
  { href: "/delivery-fees", label: "Financials", icon: FiDollarSign, permission: "financials", section: "Management" },
  { href: "/our-place", label: "Our place", icon: FiImage, permission: "menu", section: "Management" },
  { href: "/employees", label: "Staff", icon: FiUsers, permission: "staff", section: "System" },
  { href: "/settings", label: "Settings", icon: FiSettings, section: "System" },
];

const TITLES: Record<string, string> = {
  dashboard: "Overview", orders: "Orders", menu: "Menu management",
  inventory: "Inventory", tables: "Tables & bookings", "delivery-fees": "Financials",
  "our-place": "Our place", employees: "Staff", settings: "Settings",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, hasPermission } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/adminlogin"); }, [loading, user, router]);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);
  useEffect(() => setMobileOpen(false), [pathname]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--background)]"><div className="w-full max-w-sm space-y-3 p-6"><Skeleton className="h-8 w-40" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div></div>;
  }

  const items = NAV.filter((item) => {
    if (!item.permission) return true;
    if (item.href === "/tables") return hasPermission("tables") || hasPermission("bookings");
    return hasPermission(item.permission);
  });
  const initials = user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const pageTitle = pathname === "/orders/manual" ? "Manual order" : pathname === "/orders/history" ? "Order history" : TITLES[pathname.split("/")[1]] || "Workspace";
  const mobileNav = ["/dashboard", "/orders", "/orders/manual", "/menu"]
    .map((href) => items.find((item) => item.href === href))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("khabaradda-admin-theme", next ? "dark" : "light");
  }

  const sidebar = (
    <aside className="flex h-full w-[276px] shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-text)]">
      <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] shadow-lg shadow-black/10"><FiBookOpen className="h-5 w-5" /></span>
          <span><span className="block font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight">KhabarAdda</span><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--sidebar-muted)]">Admin workspace</span></span>
        </Link>
        <button className="rounded-lg p-2 text-[var(--sidebar-muted)] hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><FiX /></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {(["Workspace", "Management", "System"] as const).map((section) => {
          const sectionItems = items.filter((item) => item.section === section);
          if (!sectionItems.length) return null;
          return <div key={section} className="mb-6"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">{section}</p><div className="space-y-1">
            {sectionItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
              const Icon = item.icon;
              return <Link key={item.href} href={item.href} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all", active ? "bg-[var(--sidebar-active)] text-white shadow-sm" : "text-[var(--sidebar-text)] hover:bg-white/[0.07]")}><Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-[var(--accent)]" : "text-[var(--sidebar-muted)] group-hover:text-white")} /><span className="flex-1">{item.label}</span>{active && <FiChevronRight className="h-3.5 w-3.5 text-[var(--sidebar-muted)]" />}</Link>;
            })}
          </div></div>;
        })}
      </nav>
      <div className="border-t border-white/10 p-3"><div className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5">
        <Avatar className="h-9 w-9"><AvatarFallback>{initials}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{user.name}</p><p className="truncate text-[11px] capitalize text-[var(--sidebar-muted)]">{user.role.replace("_", " ")}</p></div>
        <button className="rounded-lg p-2 text-[var(--sidebar-muted)] transition hover:bg-white/10 hover:text-white" aria-label="Log out" onClick={async () => { await logout(); router.replace("/adminlogin"); }}><FiLogOut className="h-4 w-4" /></button>
      </div></div>
    </aside>
  );

  return <div className="min-h-screen bg-[var(--background)] text-[var(--on-background)]">
    <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
    {mobileOpen && <><button className="fixed inset-0 z-40 bg-[#06141B]/70 backdrop-blur-sm lg:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /><div className="fixed inset-y-0 left-0 z-50 lg:hidden">{sidebar}</div></>}
    <div className="lg:pl-[276px]">
      <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-[var(--outline-variant)] bg-[var(--header)]/95 px-4 backdrop-blur-xl sm:h-[76px] sm:px-6 lg:px-8">
        <div className="min-w-0"><p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--secondary)] sm:block">Admin / Workspace</p><h2 className="truncate font-[family-name:var(--font-display)] text-base font-bold sm:text-lg">{pageTitle}</h2></div>
        <div className="flex items-center gap-2"><button onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--outline-variant)] bg-[var(--surface)] transition hover:bg-[var(--surface-container)] sm:h-10 sm:w-10" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <FiSun className="h-4 w-4 sm:h-[18px] sm:w-[18px]" /> : <FiMoon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />}</button><div className="hidden items-center gap-2 border-l border-[var(--outline-variant)] pl-3 sm:flex"><Avatar className="h-9 w-9"><AvatarFallback>{initials}</AvatarFallback></Avatar><div className="max-w-32"><p className="truncate text-xs font-bold">{user.name}</p><p className="truncate text-[10px] capitalize text-[var(--secondary)]">{user.role.replace("_", " ")}</p></div></div></div>
      </header>
      <main className="admin-content min-w-0 px-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-3 sm:p-6 lg:p-8 xl:p-10">{children}</main>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--outline-variant)] bg-[var(--surface)]/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(6,20,27,0.08)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
      <div className="mx-auto grid h-[68px] max-w-lg grid-cols-5 items-end">
        {mobileNav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          const primary = item.href === "/orders/manual";
          return <Link key={item.href} href={item.href} className={cn("relative flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold transition", active ? "text-[var(--primary)]" : "text-[var(--secondary)]", primary && "-translate-y-2")}>
            <span className={cn("grid place-items-center", primary ? "h-12 w-12 rounded-2xl bg-[var(--primary)] text-[var(--on-primary)] shadow-lg" : "h-7 w-9 rounded-lg", active && !primary && "bg-[var(--primary-soft)]")}><Icon className={primary ? "h-5 w-5" : "h-[18px] w-[18px]"} /></span>
            <span className={cn("max-w-full truncate", primary && "leading-none")}>{primary ? "New order" : item.label.replace("Live ", "")}</span>
          </Link>;
        })}
        <button type="button" onClick={() => setMobileOpen(true)} className="flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold text-[var(--secondary)]" aria-label="Open all navigation"><span className="grid h-7 w-9 place-items-center rounded-lg"><FiMoreHorizontal className="h-5 w-5" /></span><span>More</span></button>
      </div>
    </nav>
  </div>;
}
