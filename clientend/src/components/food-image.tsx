"use client";

import { cn } from "@/lib/utils";
import { resolveFoodImage } from "@/lib/food-images";

type FoodImageProps = {
  name?: string;
  slug?: string;
  image?: string;
  index?: number;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Load immediately (first visible cards) */
  priority?: boolean;
};

/** Plain <img> — avoids Next optimizer failing on large local food JPGs */
export function FoodImage({
  name,
  slug,
  image,
  index = 0,
  alt,
  className,
  imgClassName,
  priority = false,
}: FoodImageProps) {
  const src = resolveFoodImage(name, slug, image, index);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-[var(--surface-warm)]",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "absolute inset-0 block h-full w-full object-cover",
          imgClassName
        )}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onError={(e) => {
          const el = e.currentTarget;
          if (el.dataset.fallback === "1") return;
          el.dataset.fallback = "1";
          el.src = "/Food_Items_Images/pasta.jpg";
        }}
      />
    </div>
  );
}
