"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

/** Soft cinematic ease — expressive without scroll-linked work */
const ease = [0.16, 1, 0.3, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
} & Omit<HTMLMotionProps<"div">, "children">;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  once = true,
  ...props
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.65, delay, ease }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Grid wrapper — no variant orchestration (avoids stuck invisible children) */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/** Each card animates itself on scroll — reliable & still cascading via delay */
export function StaggerItem({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -20px 0px" }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.08, 0.4), ease }}
    >
      {children}
    </motion.div>
  );
}

/** CSS hover lift — polish without Framer springs on every card */
export function MotionLinkHover({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        className,
        "transition-transform duration-300 ease-out will-change-transform hover:-translate-y-2",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export { motion, ease };
