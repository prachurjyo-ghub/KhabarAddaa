"use client";

import { useReducedMotion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

export function ScrollCue({ href = "#featured" }: { href?: string }) {
  const reduce = useReducedMotion();

  return (
    <a
      href={href}
      className={
        reduce
          ? "absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-[var(--gold)]/70"
          : "absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-[var(--gold)]/70 animate-float"
      }
      aria-label="Scroll to featured"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
        Scroll
      </span>
      <FiChevronDown className="h-4 w-4" />
    </a>
  );
}
