export const HERO_IMAGE = "/Food_Items_Images/hero-main.jpg";

export type ShowcaseDish = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  href: string;
  rating?: number;
  spicy?: boolean;
  vegetarian?: boolean;
};

/** Featured Menu — 3 circular cards */
export const FEATURED_DISHES: ShowcaseDish[] = [
  {
    id: "f1",
    name: "Roasted Salmon",
    description:
      "Glazed fillet over ruby beets and pomegranate, finished with fresh herbs.",
    price: 680,
    image: "/Food_Items_Images/roasted-salmon.jpg",
    href: "/menu/roasted-salmon",
  },
  {
    id: "f2",
    name: "House Pasta",
    description:
      "Spiral pasta with meatballs in a rich tomato sauce, basil on top.",
    price: 320,
    image: "/Food_Items_Images/pasta.jpg",
    href: "/menu/house-pasta",
  },
  {
    id: "f3",
    name: "Tandoori Chicken",
    description:
      "Charred, glazed chicken with lemon and peppercorn on a dark plate.",
    price: 420,
    image: "/Food_Items_Images/tandoori-chicken.jpg",
    href: "/menu/tandoori-chicken",
  },
];

/** Premium Dishes — full-bleed close-up overlays */
export const PREMIUM_DISHES: ShowcaseDish[] = [
  {
    id: "p1",
    name: "Ultimate BBQ Platter",
    description:
      "Charred ribs, grilled sausages, and sea-salt fries — a close-up feast built for sharing.",
    price: 1290,
    image: "/Food_Items_Images/close-short-food/ultimate-bbq-platter.jpg",
    href: "/menu/ultimate-bbq-platter",
  },
  {
    id: "p2",
    name: "Gourmet Feast",
    description:
      "Seared steak with herb butter, jumbo prawns, and a full board of sides.",
    price: 1490,
    image: "/Food_Items_Images/close-short-food/gourmet-feast.jpg",
    href: "/menu/gourmet-feast",
  },
  {
    id: "p3",
    name: "Loaded Feast",
    description:
      "Stacked burger, glazed wings, tacos, and roasted potatoes in one indulgent spread.",
    price: 1190,
    image:
      "/Food_Items_Images/close-short-food/this-loaded-feast-looks-completely-unreal.jpg",
    href: "/menu/loaded-feast",
  },
];

/** Popular Dishes — 2×2 grid with ratings */
export const POPULAR_DISHES: ShowcaseDish[] = [
  {
    id: "pop1",
    name: "Steak with Fries",
    description: "Seared steak, sea-salt fries, mustard, and greens.",
    price: 750,
    image: "/Food_Items_Images/steak-with-fries.jpg",
    href: "/menu/steak-with-fries",
    rating: 5,
    spicy: true,
  },
  {
    id: "pop2",
    name: "Grilled Kebabs",
    description: "Charred beef skewers with peppers and onion.",
    price: 480,
    image: "/Food_Items_Images/kebabs.jpg",
    href: "/menu/grilled-kebabs",
    rating: 5,
    spicy: true,
  },
  {
    id: "pop3",
    name: "Garden Salad",
    description: "Parsley, tomato, cucumber, radish, and feta.",
    price: 260,
    image: "/Food_Items_Images/salad.jpg",
    href: "/menu/garden-salad",
    rating: 4,
    vegetarian: true,
  },
  {
    id: "pop4",
    name: "Chocolate Ganache Tart",
    description: "Dark chocolate, berry coulis, and fresh raspberries.",
    price: 320,
    image: "/Food_Items_Images/chocolate-ganache-tart.jpg",
    href: "/menu/chocolate-ganache-tart",
    rating: 5,
    vegetarian: true,
  },
];

/** Chef’s Specials — same overlay style as Premium */
export const CHEF_SPECIALS: ShowcaseDish[] = [
  {
    id: "c1",
    name: "Seafood Close-up",
    description:
      "A chef’s pick of ocean flavors — rich glaze, bright herbs, plated for impact.",
    price: 820,
    image: "/Food_Items_Images/close-short-food/seafood-closeup.jpg",
    href: "/menu/seafood-close-up",
  },
  {
    id: "c2",
    name: "Signature Cravings",
    description:
      "Bold, close-cropped comfort — the house special when you want something unforgettable.",
    price: 690,
    image: "/Food_Items_Images/close-short-food/you-make-me-so-hngry.jpg",
    href: "/menu/signature-cravings",
  },
  {
    id: "c3",
    name: "Chef’s Premium Plate",
    description:
      "Tonight’s featured close-up — deep flavors and a dark, dramatic finish.",
    price: 780,
    image: "/Food_Items_Images/close-short-food/premium-dish.jpg",
    href: "/menu/chef-s-premium-plate",
  },
];

export const GALLERY_IMAGES = [
  {
    id: "g1",
    src: "/Food_Items_Images/veggie-variety.jpg",
    alt: "Fresh garden bowl",
  },
  {
    id: "g2",
    src: "/Food_Items_Images/ice-cream-dessert.jpg",
    alt: "Artisan dessert plate",
  },
  {
    id: "g3",
    src: "/Food_Items_Images/kebabs.jpg",
    alt: "Grilled kebab platter",
  },
  {
    id: "g4",
    src: "/Food_Items_Images/steak-with-fries.jpg",
    alt: "Steak service",
  },
];

export const TESTIMONIALS = [
  {
    id: "t1",
    name: "Ayesha R.",
    quote:
      "The plating alone felt like a night out — rich flavors, calm lighting, unforgettable.",
    initial: "A",
  },
  {
    id: "t2",
    name: "Rahim K.",
    quote:
      "Reserved a table and everything arrived with care. The steak was perfect.",
    initial: "R",
  },
  {
    id: "t3",
    name: "Nusrat M.",
    quote:
      "Dark chocolate tart and the ambience — we came for dinner and stayed for dessert.",
    initial: "N",
  },
];
