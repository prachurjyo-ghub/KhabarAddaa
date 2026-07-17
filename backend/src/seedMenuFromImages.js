/**
 * Replaces old sample menu items with Food_Items_Images dishes.
 * Keeps manually uploaded steak items.
 */
require("dotenv").config();

const { connectDb } = require("./db/connect");
const MenuCategory = require("./models/MenuCategory");
const MenuItem = require("./models/MenuItem");

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const KEEP_STEAK_SLUGS = new Set([
  "stake-with-fries",
  "steak-with-fries",
  "steak-plate-with-veggies-cheese",
]);

const MENU = [
  {
    name: "House Pasta",
    category: "Mains",
    price: 320,
    description:
      "Spiral pasta with meatballs in a rich tomato sauce.\nFinished with fresh basil and cracked pepper.",
    image: "/Food_Items_Images/pasta.jpg",
    isFeatured: true,
  },
  {
    name: "Grilled Kebabs",
    category: "Grill",
    price: 480,
    description:
      "Charred beef skewers with peppers and onion.\nServed hot with lemon and house seasoning.",
    image: "/Food_Items_Images/kebabs.jpg",
    isFeatured: true,
    homepageBadge: "popular",
  },
  {
    name: "Tandoori Chicken",
    category: "Grill",
    price: 420,
    description:
      "Glazed, flame-kissed chicken with lemon and herbs.\nA smoky classic plated for sharing.",
    image: "/Food_Items_Images/tandoori-chicken.jpg",
    isFeatured: true,
  },
  {
    name: "Roasted Salmon",
    category: "Seafood",
    price: 680,
    description:
      "Seared salmon over ruby beets and pomegranate.\nBright, rich, and finished with fresh herbs.",
    image: "/Food_Items_Images/roasted-salmon.jpg",
    homepageBadge: "premium",
  },
  {
    name: "Flame-Grilled Prawns",
    category: "Seafood",
    price: 720,
    description:
      "Whole prawns with charred lemon and herbs.\nBold, smoky, and made for the table.",
    image: "/Food_Items_Images/prawns.jpg",
    homepageBadge: "chef-special",
  },
  {
    name: "Garden Salad",
    category: "Salads",
    price: 260,
    description:
      "Parsley, tomato, cucumber, radish, and feta.\nA crisp, cool plate for lighter cravings.",
    image: "/Food_Items_Images/salad.jpg",
    homepageBadge: "popular",
  },
  {
    name: "Veggie Variety Bowl",
    category: "Salads",
    price: 280,
    description:
      "A colorful mix of fresh garden vegetables.\nLight, vibrant, and full of crunch.",
    image: "/Food_Items_Images/veggie-variety.jpg",
  },
  {
    name: "Chicken Khichdi",
    category: "Rice & Curry",
    price: 350,
    description:
      "Golden rice with roasted chicken and warm spice.\nComfort food plated with care.",
    image: "/Food_Items_Images/chicken-khichdi.jpg",
    homepageBadge: "chef-special",
  },
  {
    name: "Chocolate Ganache Tart",
    category: "Desserts",
    price: 320,
    description:
      "Dark chocolate tart with berry coulis and raspberries.\nA rich finish for any evening.",
    image: "/Food_Items_Images/chocolate-ganache-tart.jpg",
    homepageBadge: "popular",
  },
  {
    name: "Ice Cream Dessert",
    category: "Desserts",
    price: 280,
    description:
      "Artisan scoops with berry sauce and mint.\nCool, creamy, and beautifully plated.",
    image: "/Food_Items_Images/ice-cream-dessert.jpg",
  },
  {
    name: "Essence Dessert",
    category: "Desserts",
    price: 380,
    description:
      "Glossy spheres, dark crumble, and jewel-toned coulis.\nA modern dessert for fine evenings.",
    image: "/Food_Items_Images/essence.jpg",
    homepageBadge: "premium",
  },
  {
    name: "The Maestro Plate",
    category: "Chef Specials",
    price: 890,
    description:
      "An artistic tasting plate of bright purees and seared accents.\nCrafted for guests who want something special.",
    image: "/Food_Items_Images/maestro.jpg",
    homepageBadge: "chef-special",
  },
  {
    name: "Mystery Plate",
    category: "Chef Specials",
    price: 650,
    description:
      "A dark-plated chef composition with layered textures.\nAsk your server for tonight’s tasting notes.",
    image: "/Food_Items_Images/mystery-plate.jpg",
  },
  {
    name: "Ultimate BBQ Platter",
    category: "Platters",
    price: 1290,
    description:
      "Charred ribs, grilled sausages, and sea-salt fries.\nA close-up feast built for sharing.",
    image: "/Food_Items_Images/close-short-food/ultimate-bbq-platter.jpg",
    homepageBadge: "premium",
  },
  {
    name: "Gourmet Feast",
    category: "Platters",
    price: 1490,
    description:
      "Seared steak with herb butter, jumbo prawns, and sides.\nSurf and turf on one dramatic board.",
    image: "/Food_Items_Images/close-short-food/gourmet-feast.jpg",
    homepageBadge: "premium",
  },
  {
    name: "Loaded Feast",
    category: "Platters",
    price: 1190,
    description:
      "Stacked burger, glazed wings, tacos, and roasted potatoes.\nAn indulgent spread for big appetites.",
    image:
      "/Food_Items_Images/close-short-food/this-loaded-feast-looks-completely-unreal.jpg",
    homepageBadge: "popular",
  },
  {
    name: "Signature Cravings",
    category: "Grill",
    price: 690,
    description:
      "A bold close-cropped comfort plate from the grill.\nUnforgettable flavor in every bite.",
    image: "/Food_Items_Images/close-short-food/you-make-me-so-hngry.jpg",
  },
  {
    name: "Seafood Close-up",
    category: "Seafood",
    price: 820,
    description:
      "Ocean flavors with rich glaze and bright herbs.\nA chef’s pick plated for impact.",
    image: "/Food_Items_Images/close-short-food/seafood-closeup.jpg",
  },
  {
    name: "Chef’s Premium Plate",
    category: "Chef Specials",
    price: 780,
    description:
      "Tonight’s featured close-up with deep flavor.\nDark, dramatic, and ready to impress.",
    image: "/Food_Items_Images/close-short-food/premium-dish.jpg",
  },
  {
    name: "Luxury Steak",
    category: "Grill",
    price: 950,
    description:
      "Dark moody steak photography on the plate — seared to perfection.\nA premium cut for steak lovers.",
    image: "/Food_Items_Images/close-short-food/luxury-steak.jpg",
    isFeatured: true,
  },
];

async function ensureCategory(name, cache) {
  if (cache[name]) return cache[name];
  let cat = await MenuCategory.findOne({ name });
  if (!cat) {
    cat = await MenuCategory.create({ name, isActive: true });
    console.log(`Created category: ${name}`);
  }
  cache[name] = cat;
  return cat;
}

async function run() {
  await connectDb();

  const all = await MenuItem.find({});
  let deleted = 0;
  for (const item of all) {
    const isSteak =
      KEEP_STEAK_SLUGS.has(item.slug) ||
      /steak/i.test(item.name) ||
      /steak/i.test(item.slug);
    if (!isSteak) {
      await item.deleteOne();
      deleted += 1;
      console.log(`Deleted: ${item.name}`);
    } else {
      console.log(`Kept steak item: ${item.name}`);
    }
  }

  const categories = {};
  for (const row of MENU) {
    const cat = await ensureCategory(row.category, categories);
    const slug = slugify(row.name);
    const exists = await MenuItem.findOne({ slug });
    if (exists) {
      exists.description = row.description;
      exists.price = row.price;
      exists.image = row.image;
      exists.category = cat._id;
      exists.isFeatured = Boolean(row.isFeatured);
      exists.homepageBadge = row.homepageBadge || "none";
      exists.status = "In Stock";
      exists.isActive = true;
      await exists.save();
      console.log(`Updated: ${row.name}`);
      continue;
    }
    await MenuItem.create({
      slug,
      name: row.name,
      description: row.description,
      category: cat._id,
      price: row.price,
      image: row.image,
      tags: [],
      isFeatured: Boolean(row.isFeatured),
      homepageBadge: row.homepageBadge || "none",
      customizable: false,
      sizes: [],
      toppings: [],
      status: "In Stock",
      isActive: true,
    });
    console.log(`Created: ${row.name}`);
  }

  // Ensure local steak-with-fries image path is available as fallback on kept item if empty
  const steak = await MenuItem.findOne({
    slug: { $in: ["stake-with-fries", "steak-with-fries"] },
  });
  if (steak && !steak.image) {
    steak.image = "/Food_Items_Images/steak-with-fries.jpg";
    await steak.save();
  }

  const remaining = await MenuItem.countDocuments();
  console.log(`\nDone. Deleted ${deleted} old items. Menu now has ${remaining} items.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
