import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-[var(--gold)] text-[#121212]",
        secondary: "bg-[var(--surface-container)] text-[var(--on-background)]",
        outline: "border border-[var(--outline-variant)] text-[var(--on-surface-variant)]",
        success: "bg-emerald-950 text-emerald-300",
        warning: "bg-amber-950 text-amber-300",
        danger: "bg-red-950 text-red-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
