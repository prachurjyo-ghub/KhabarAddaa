"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { FiStar } from "react-icons/fi";
import { FaLeaf, FaPepperHot } from "react-icons/fa";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-nav";
import { ScrollProgress } from "@/components/scroll-progress";
import { ScrollCue } from "@/components/scroll-cue";
import {
  Reveal,
  Stagger,
  StaggerItem,
  MotionLinkHover,
  ease,
} from "@/components/motion";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { resolveFoodImage } from "@/lib/food-images";
import { formatBDT } from "@/lib/utils";
import {
  HERO_IMAGE,
  FEATURED_DISHES,
  PREMIUM_DISHES,
  POPULAR_DISHES,
  CHEF_SPECIALS,
  GALLERY_IMAGES,
  TESTIMONIALS,
  type ShowcaseDish,
} from "@/lib/homepage-media";

type ApiMenuItem = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  description: string;
  isFeatured: boolean;
  homepageBadge: string;
  updatedAt?: string;
};

type GalleryImage = { _id: string; image: string; alt: string; caption: string };

function toShowcase(item: ApiMenuItem, index = 0): ShowcaseDish {
  return {
    id: item._id,
    name: item.name,
    description: item.description || "Fresh from the KhabarAdda kitchen.",
    price: item.price,
    image: resolveFoodImage(item.name, item.slug, item.image, index),
    href: `/menu/${item.slug}`,
    rating: 5,
  };
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-semibold tracking-wide text-gold-glow md:text-4xl lg:text-[2.75rem]">
      {children}
    </h2>
  );
}

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <FiStar
          key={i}
          className={`h-3 w-3 ${
            i < count
              ? "fill-[var(--gold)] text-[var(--gold)]"
              : "text-white/20"
          }`}
        />
      ))}
    </div>
  );
}

function DietIcons({ dish }: { dish: ShowcaseDish }) {
  return (
    <div className="flex items-center gap-1.5">
      {dish.spicy && (
        <FaPepperHot className="h-3.5 w-3.5 text-red-500" title="Spicy" />
      )}
      {dish.vegetarian && (
        <FaLeaf className="h-3.5 w-3.5 text-emerald-500" title="Vegetarian" />
      )}
    </div>
  );
}

function OverlayDishCard({
  dish,
  reduce,
}: {
  dish: ShowcaseDish;
  reduce: boolean | null;
}) {
  return (
    <Link
      href={dish.href}
      className="gold-frame group relative block min-h-[185px] overflow-hidden md:min-h-[240px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dish.image}
        alt={dish.name}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black from-0% via-black/80 via-[28%] to-transparent to-[65%]" />

      <div className="relative flex h-full min-h-[185px] items-center px-6 py-7 md:min-h-[240px] md:px-10 md:py-9">
        <div className="max-w-[min(100%,22rem)] md:max-w-md">
          <motion.h3
            className="font-[family-name:var(--font-display)] text-xl font-semibold text-gold-glow md:text-3xl"
            initial={reduce ? false : { opacity: 0, x: -56 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.7, ease }}
          >
            {dish.name}
          </motion.h3>
          <motion.p
            className="mt-3 text-sm font-light leading-relaxed text-white/80 md:text-base"
            initial={reduce ? false : { opacity: 0, x: -48 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.7, delay: 0.12, ease }}
          >
            {dish.description}
          </motion.p>
          <motion.p
            className="mt-5 text-sm font-semibold tracking-wide text-[var(--gold-bright)] md:text-base"
            initial={reduce ? false : { opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.65, delay: 0.22, ease }}
          >
            {formatBDT(dish.price)}
          </motion.p>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, reduce ? 0 : 90]);
  const heroScale = useTransform(scrollY, [0, 500], [1, reduce ? 1 : 1.06]);

  const [featured, setFeatured] = useState<ShowcaseDish[]>(FEATURED_DISHES);
  const [premium, setPremium] = useState<ShowcaseDish[]>(PREMIUM_DISHES);
  const [popular, setPopular] = useState<ShowcaseDish[]>(POPULAR_DISHES);
  const [chefSpecials, setChefSpecials] =
    useState<ShowcaseDish[]>(CHEF_SPECIALS);
  const [gallery, setGallery] = useState(GALLERY_IMAGES);

  useEffect(() => {
    apiFetch<{ items: ApiMenuItem[] }>("/menu/public")
      .then((data) => {
        const items = data.items || [];
        const byNewest = (a: ApiMenuItem, b: ApiMenuItem) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime();

        const featuredItems = items
          .filter((i) => i.isFeatured)
          .sort(byNewest)
          .slice(0, 3)
          .map(toShowcase);
        const premiumItems = items
          .filter((i) => i.homepageBadge === "premium")
          .sort(byNewest)
          .slice(0, 3)
          .map(toShowcase);
        const popularItems = items
          .filter((i) => i.homepageBadge === "popular")
          .sort(byNewest)
          .slice(0, 6)
          .map(toShowcase);
        const chefItems = items
          .filter((i) => i.homepageBadge === "chef-special")
          .sort(byNewest)
          .slice(0, 3)
          .map(toShowcase);

        // Always sync from API when the request succeeds (no stale static leftovers)
        if (featuredItems.length) setFeatured(featuredItems);
        else setFeatured([]);
        if (premiumItems.length) setPremium(premiumItems);
        if (popularItems.length) setPopular(popularItems);
        if (chefItems.length) setChefSpecials(chefItems);
      })
      .catch(() => {});

    apiFetch<{ images: GalleryImage[] }>("/uploads/gallery/public")
      .then((d) => {
        if (d.images?.length) {
          setGallery(
            d.images.slice(0, 4).map((g) => ({
              id: g._id,
              src: g.image,
              alt: g.alt || g.caption || "Our place",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="page-pad min-h-screen overflow-x-hidden bg-[var(--background)]">
      <ScrollProgress />
      <SiteHeader transparent />

      {/* ——— HERO ——— */}
      <section className="relative min-h-[100svh] w-full overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ y: heroY, scale: heroScale }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt="Signature seared steak"
            className="h-full w-full object-cover object-[center_70%]"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-black/80" />
        <div className="hero-gold-lines pointer-events-none absolute inset-0" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-4xl flex-col items-center justify-center px-4 pb-24 pt-28 text-center">
          <motion.p
            className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[0.06em] text-gold-glow sm:text-5xl md:text-6xl lg:text-7xl"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease }}
          >
            KhabarAdda
          </motion.p>
          <motion.h1
            className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-2xl font-medium leading-snug text-gold-glow sm:text-3xl md:text-4xl"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease }}
          >
            Experience Culinary Excellence.
          </motion.h1>
          <motion.p
            className="mt-5 max-w-xl text-sm font-light leading-relaxed text-white/70 md:text-base"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease }}
          >
            A journey of flavor, artistry, and refined ambiance, crafted for the
            discerning palate.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.36, ease }}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button asChild size="lg">
                <Link href="/book">Reserve a Table</Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button asChild size="lg" variant="outline">
                <Link href="/menu">Explore Menu</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
        <ScrollCue href="#featured" />
      </section>

      {/* ——— FEATURED MENU ——— */}
      {featured.length > 0 && (
      <section id="featured" className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <Reveal>
          <SectionTitle>Featured Menu</SectionTitle>
        </Reveal>

        <Stagger className="mt-8 grid grid-cols-2 gap-3 md:mt-12 md:gap-6 lg:grid-cols-3">
          {featured.map((dish) => (
            <StaggerItem key={dish.id}>
              <MotionLinkHover>
                <Link
                  href={dish.href}
                  className="gold-frame group relative block overflow-hidden p-3 md:p-6"
                >
                  <div className="relative mx-auto aspect-square max-w-[120px] md:max-w-[240px]">
                    <div className="absolute inset-0 overflow-hidden rounded-full border border-[var(--gold)]/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <motion.span
                      className="absolute bottom-1.5 right-1.5 rounded bg-[var(--gold)] px-1.5 py-0.5 text-[10px] font-bold text-[#121212] md:bottom-3 md:right-3 md:px-2.5 md:py-1 md:text-xs"
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2, duration: 0.45 }}
                    >
                      {formatBDT(dish.price)}
                    </motion.span>
                  </div>
                  <motion.h3
                    className="mt-3 text-center font-[family-name:var(--font-display)] text-sm font-semibold leading-tight text-white md:mt-5 md:text-[1.35rem]"
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                  >
                    {dish.name}
                  </motion.h3>
                  <motion.p
                    className="mt-2 hidden text-center text-sm font-light leading-relaxed text-white/50 md:block"
                    initial={reduce ? false : { opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                  >
                    {dish.description}
                  </motion.p>
                </Link>
              </MotionLinkHover>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
      )}

      {/* ——— PREMIUM DISHES ——— */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
        <Reveal>
          <SectionTitle>Premium Dishes</SectionTitle>
        </Reveal>

        <div className="mt-12 space-y-6">
          {premium.map((dish, i) => (
            <Reveal key={dish.id} delay={i * 0.08}>
              <OverlayDishCard dish={dish} reduce={reduce} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ——— POPULAR DISHES ——— */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <Reveal>
          <SectionTitle>Popular Dishes</SectionTitle>
        </Reveal>

        <Stagger className="mt-8 grid grid-cols-2 gap-3 md:mt-12 md:gap-6 lg:grid-cols-3">
          {popular.map((dish) => (
            <StaggerItem key={dish.id}>
              <MotionLinkHover>
                <Link
                  href={dish.href}
                  className="gold-frame group relative flex h-[210px] flex-col overflow-hidden md:h-auto md:min-h-[380px]"
                >
                  <div className="relative h-[130px] w-full shrink-0 overflow-hidden md:h-[240px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <p className="absolute inset-x-0 bottom-0 hidden translate-y-2 p-4 text-sm font-light text-white/90 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:block">
                      {dish.description}
                    </p>
                  </div>
                  <div className="flex flex-1 items-end justify-between gap-2 px-2.5 py-2.5 md:gap-3 md:px-6 md:py-6">
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-medium text-white md:text-base">
                        {dish.name}
                      </h3>
                      <div className="mt-1 hidden md:mt-1.5 md:block">
                        <StarRow count={dish.rating ?? 5} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="rounded bg-[var(--gold)] px-1.5 py-0.5 text-[11px] font-bold text-[#121212] md:rounded-none md:bg-transparent md:px-0 md:py-0 md:text-base md:font-semibold md:text-[var(--gold)]">
                        {formatBDT(dish.price)}
                      </p>
                      <div className="mt-1.5 hidden justify-end md:flex">
                        <DietIcons dish={dish} />
                      </div>
                    </div>
                  </div>
                </Link>
              </MotionLinkHover>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ——— CHEF’S SPECIALS ——— */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <Reveal>
          <SectionTitle>Chef&apos;s Specials</SectionTitle>
        </Reveal>

        <div className="mt-12 space-y-6">
          {chefSpecials.map((dish, i) => (
            <Reveal key={dish.id} delay={i * 0.08}>
              <OverlayDishCard dish={dish} reduce={reduce} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ——— GALLERY ——— */}
      <section id="gallery" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <Reveal>
          <SectionTitle>Dining Ambience Gallery</SectionTitle>
        </Reveal>

        <Stagger className="mt-12 grid grid-cols-2 gap-3 md:gap-5">
          {gallery.map((img) => (
            <StaggerItem key={img.id}>
              <motion.div
                className="gold-frame overflow-hidden"
                whileHover={reduce ? undefined : { scale: 1.015 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt}
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ——— TESTIMONIALS ——— */}
      <section
        id="testimonials"
        className="mx-auto max-w-6xl px-4 py-16 md:py-24"
      >
        <Reveal>
          <SectionTitle>Customer Testimonials</SectionTitle>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 flex justify-center gap-3 md:gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--gold)]/50 bg-[var(--surface)] font-[family-name:var(--font-display)] text-xl text-[var(--gold-bright)] md:h-16 md:w-16"
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * i, duration: 0.45, ease }}
              >
                {t.initial}
              </motion.div>
            ))}
          </div>
        </Reveal>

        <Stagger className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.id}>
              <div className="gold-frame h-full px-5 py-6 text-center">
                <p className="text-sm font-light leading-relaxed text-white/65">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-4 font-[family-name:var(--font-display)] text-lg text-[var(--gold-bright)]">
                  {t.name}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ——— CTA ——— */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <Reveal>
          <div className="gold-frame relative overflow-hidden px-6 py-14 text-center md:px-12 md:py-16">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(197,160,89,0.12)] via-transparent to-transparent" />
            <h2 className="relative font-[family-name:var(--font-display)] text-3xl font-semibold text-gold-glow md:text-4xl">
              Reserve your evening
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-sm font-light text-white/60">
              Pick a time that fits — we&apos;ll have the table waiting.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/book">Reserve a Table</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/menu">Explore Menu</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
