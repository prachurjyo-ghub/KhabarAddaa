"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FiShoppingBag, FiUser, FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/book", label: "Reservations" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#testimonials", label: "Contact" },
];

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const solid = !transparent || scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid
          ? "border-b border-[var(--outline-variant)] bg-[#0c0c0c]/92 backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-[0.04em] text-[var(--gold-bright)] md:text-2xl">
            KhabarAdda
          </span>
          <span className="hidden h-5 w-px bg-[var(--gold)]/50 sm:block" aria-hidden />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => {
            const active =
              l.href === "/menu"
                ? pathname.startsWith("/menu")
                : l.href === "/book"
                  ? pathname.startsWith("/book")
                  : false;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative text-[13px] font-medium tracking-wide transition-colors",
                  active
                    ? "text-[var(--gold-bright)]"
                    : "text-white/70 hover:text-[var(--gold-bright)]"
                )}
              >
                {l.label}
                {active && (
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--gold)]" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="relative border-[var(--gold)]/50">
            <Link href="/checkout">
              <FiShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0, y: 4 }}
                    animate={{ scale: [1.2, 1], opacity: 1, y: 0 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 16 }}
                    className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-bold text-[#121212]"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </Button>
          {user ? (
            <Button asChild size="sm" variant="ghost" className="text-white/85 hover:bg-white/10">
              <Link href="/account">
                <FiUser className="h-4 w-4" />
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="ghost" className="text-white/85 hover:bg-white/10">
              <Link href="/login">Login</Link>
            </Button>
          )}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-[var(--outline-variant)] bg-[#0c0c0c] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-[var(--primary-soft)] hover:text-[var(--gold-bright)]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
