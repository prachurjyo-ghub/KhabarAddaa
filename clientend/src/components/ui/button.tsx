import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-gradient-to-b from-[#e0c078] to-[#c5a059] text-[#121212] shadow-[0_10px_28px_-12px_rgba(197,160,89,0.75)] hover:from-[#edd29a] hover:to-[#d4b06a]",
        secondary:
          "rounded-full bg-[var(--surface-warm)] text-[var(--ink)] hover:bg-[var(--surface-container-high)]",
        outline:
          "rounded-full border border-[var(--gold)]/70 bg-transparent text-[var(--gold-bright)] hover:bg-[var(--primary-soft)]",
        ghost: "rounded-full hover:bg-white/5 text-[var(--ink)]",
        danger: "rounded-full bg-[var(--error)] text-white hover:opacity-90",
        soft: "rounded-full bg-[var(--primary-soft)] text-[var(--gold-bright)] hover:bg-[rgba(197,160,89,0.22)]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 rounded-full px-3.5 text-xs",
        lg: "h-12 rounded-full px-8 text-[15px]",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
