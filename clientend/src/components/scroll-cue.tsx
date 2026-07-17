"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

export function ScrollCue({ href = "#featured" }: { href?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.a
      href={href}
      className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-[var(--gold)]/70"
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={reduce ? undefined : { opacity: 1, y: [0, 8, 0] }}
      transition={
        reduce
          ? undefined
          : { opacity: { delay: 1.1, duration: 0.5 }, y: { delay: 1.2, duration: 1.6, repeat: Infinity } }
      }
      aria-label="Scroll to featured"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Scroll</span>
      <FiChevronDown className="h-4 w-4" />
    </motion.a>
  );
}
