/** Fallback map when DB image is empty */
const FOOD_IMAGES: Record<string, string> = {
  "house pasta": "/Food_Items_Images/pasta.jpg",
  pasta: "/Food_Items_Images/pasta.jpg",
  "grilled kebabs": "/Food_Items_Images/kebabs.jpg",
  kebabs: "/Food_Items_Images/kebabs.jpg",
  "tandoori chicken": "/Food_Items_Images/tandoori-chicken.jpg",
  "roasted salmon": "/Food_Items_Images/roasted-salmon.jpg",
  "flame grilled prawns": "/Food_Items_Images/prawns.jpg",
  prawns: "/Food_Items_Images/prawns.jpg",
  "garden salad": "/Food_Items_Images/salad.jpg",
  salad: "/Food_Items_Images/salad.jpg",
  "veggie variety bowl": "/Food_Items_Images/veggie-variety.jpg",
  "chicken khichdi": "/Food_Items_Images/chicken-khichdi.jpg",
  "chocolate ganache tart": "/Food_Items_Images/chocolate-ganache-tart.jpg",
  "ice cream dessert": "/Food_Items_Images/ice-cream-dessert.jpg",
  "essence dessert": "/Food_Items_Images/essence.jpg",
  "the maestro plate": "/Food_Items_Images/maestro.jpg",
  "mystery plate": "/Food_Items_Images/mystery-plate.jpg",
  "ultimate bbq platter":
    "/Food_Items_Images/close-short-food/ultimate-bbq-platter.jpg",
  "gourmet feast": "/Food_Items_Images/close-short-food/gourmet-feast.jpg",
  "loaded feast":
    "/Food_Items_Images/close-short-food/this-loaded-feast-looks-completely-unreal.jpg",
  "signature cravings":
    "/Food_Items_Images/close-short-food/you-make-me-so-hngry.jpg",
  "seafood close up": "/Food_Items_Images/close-short-food/seafood-closeup.jpg",
  "chefs premium plate":
    "/Food_Items_Images/close-short-food/premium-dish.jpg",
  "luxury steak": "/Food_Items_Images/close-short-food/luxury-steak.jpg",
  "steak with fries": "/Food_Items_Images/steak-with-fries.jpg",
  "stake with fries": "/Food_Items_Images/steak-with-fries.jpg",
};

const FALLBACKS = [
  "/Food_Items_Images/pasta.jpg",
  "/Food_Items_Images/kebabs.jpg",
  "/Food_Items_Images/tandoori-chicken.jpg",
  "/Food_Items_Images/salad.jpg",
  "/Food_Items_Images/steak-with-fries.jpg",
];

export function resolveFoodImage(
  name?: string,
  slug?: string,
  image?: string,
  index = 0
): string {
  const src = String(image || "").trim();
  // Prefer explicit DB / uploaded paths first
  if (
    src &&
    (src.startsWith("http") || src.startsWith("/") || src.startsWith("data:"))
  ) {
    return src;
  }

  const keyName = String(name || "").toLowerCase().trim();
  const keySlug = String(slug || "")
    .toLowerCase()
    .trim()
    .replace(/-/g, " ");

  if (FOOD_IMAGES[keyName]) return FOOD_IMAGES[keyName];
  if (FOOD_IMAGES[keySlug]) return FOOD_IMAGES[keySlug];

  for (const [key, path] of Object.entries(FOOD_IMAGES)) {
    if (keyName.includes(key) || keySlug.includes(key)) return path;
  }

  return FALLBACKS[index % FALLBACKS.length];
}
