import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-9 w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--on-background)] placeholder:text-[var(--secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:text-sm",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
