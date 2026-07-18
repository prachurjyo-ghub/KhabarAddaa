"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FiHome, FiCoffee, FiShoppingBag, FiUser } from "react-icons/fi";
import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: FiHome },
  { href: "/menu", label: "Menu", icon: FiCoffee },
  { href: "/menu?cart=1", label: "Cart", icon: FiShoppingBag },
  { href: "/account", label: "Account", icon: FiUser },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--outline-variant)] bg-[#0c0c0c]/95 backdrop-blur-md md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const Icon = item.icon;
          const pathOnly = item.href.split("?")[0];
          const isCart = item.href.includes("cart=1");
          const active = isCart
            ? false
            : pathname === pathOnly ||
              (pathOnly !== "/" && pathname.startsWith(pathOnly));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                  active ? "text-[var(--gold-bright)]" : "text-white/45"
                )}
              >
                <motion.span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    active && "bg-[var(--primary-soft)]"
                  )}
                  animate={active ? { scale: 1.06 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </motion.span>
                {item.label}
                <AnimatePresence>
                  {isCart && count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="absolute right-[18%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[9px] text-[#121212]"
                    >
                      {count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
