require("dotenv").config();

const bcrypt = require("bcryptjs");
const { connectDb } = require("./db/connect");
const env = require("./config/env");
const Staff = require("./models/Staff");
const MenuCategory = require("./models/MenuCategory");
const MenuItem = require("./models/MenuItem");
const InventoryItem = require("./models/InventoryItem");
const DeliveryFee = require("./models/DeliveryFee");
const VatRule = require("./models/VatRule");
const DiningTable = require("./models/DiningTable");
const WeeklySchedule = require("./models/WeeklySchedule");
const { mergePermissions } = require("./utils/permissions");

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seed() {
  await connectDb();

  const email = env.seedSuperAdmin.email.toLowerCase();
  let admin = await Staff.findOne({ email });
  if (!admin) {
    admin = await Staff.create({
      name: env.seedSuperAdmin.name,
      email,
      passwordHash: await bcrypt.hash(env.seedSuperAdmin.password, 10),
      role: "super_admin",
      permissions: mergePermissions("super_admin"),
      isActive: true,
      shift: "ON SHIFT",
    });
    console.log(`Created super admin: ${email}`);
  } else {
    console.log(`Super admin already exists: ${email}`);
  }

  const categoryNames = ["Mains", "Rice & Curry", "Snacks", "Drinks", "Desserts"];
  const categories = {};
  for (const name of categoryNames) {
    let cat = await MenuCategory.findOne({ name });
    if (!cat) {
      cat = await MenuCategory.create({ name, isActive: true });
      console.log(`Created category: ${name}`);
    }
    categories[name] = cat;
  }

  const sampleMenu = [
    {
      name: "Chicken Biryani",
      category: "Rice & Curry",
      price: 280,
      description: "Fragrant basmati rice with spiced chicken.",
      image: "/Food_Items_Images/chicken-khichdi.jpg",
      isFeatured: true,
      homepageBadge: "weekly-best-seller",
      customizable: false,
    },
    {
      name: "Beef Burger",
      category: "Mains",
      price: 320,
      description: "Smash patty with house sauce.",
      image: "/Food_Items_Images/kebabs.jpg",
      isFeatured: true,
      customizable: true,
      sizes: [
        { id: "reg", label: "Regular", extra: 0 },
        { id: "lg", label: "Large", extra: 50 },
      ],
      toppings: [
        { id: "cheese", label: "Extra Cheese", price: 40 },
        { id: "egg", label: "Fried Egg", price: 30 },
      ],
    },
    {
      name: "Pasta Alfredo",
      category: "Mains",
      price: 260,
      description: "Creamy alfredo pasta.",
      image: "/Food_Items_Images/pasta.jpg",
      isFeatured: true,
    },
    {
      name: "Mutton Curry Rice",
      category: "Rice & Curry",
      price: 350,
      description: "Slow-cooked mutton with steamed rice.",
      image: "/Food_Items_Images/tandoori-chicken.jpg",
    },
    {
      name: "Lemonade",
      category: "Drinks",
      price: 80,
      description: "Fresh lemonade.",
      image: "/Food_Items_Images/salad.jpg",
    },
    {
      name: "Donuts",
      category: "Desserts",
      price: 90,
      description: "Glazed donuts.",
      image: "/Food_Items_Images/chocolate-ganache-tart.jpg",
    },
  ];

  for (const item of sampleMenu) {
    const slug = slugify(item.name);
    const exists = await MenuItem.findOne({ slug });
    if (exists) {
      let dirty = false;
      if (item.image && exists.image !== item.image) {
        exists.image = item.image;
        dirty = true;
      }
      if (item.isFeatured && !exists.isFeatured) {
        exists.isFeatured = true;
        dirty = true;
      }
      if (item.homepageBadge && exists.homepageBadge !== item.homepageBadge) {
        exists.homepageBadge = item.homepageBadge;
        dirty = true;
      }
      if (dirty) {
        await exists.save();
        console.log(`Updated menu item: ${item.name}`);
      }
      continue;
    }
    await MenuItem.create({
      slug,
      name: item.name,
      description: item.description || "",
      category: categories[item.category]._id,
      price: item.price,
      image: item.image || "",
      tags: [],
      isFeatured: Boolean(item.isFeatured),
      homepageBadge: item.homepageBadge || "none",
      customizable: Boolean(item.customizable),
      sizes: item.sizes || [],
      toppings: item.toppings || [],
      status: "In Stock",
      isActive: true,
    });
    console.log(`Created menu item: ${item.name}`);
  }

  const inventorySeed = [
    { name: "Basmati Rice", category: "Dry Goods", quantity: 50, unit: "kg" },
    { name: "Chicken", category: "Meat", quantity: 20, unit: "kg" },
    { name: "Burger Buns", category: "Bakery", quantity: 8, unit: "packs" },
    { name: "Cooking Oil", category: "Dry Goods", quantity: 0, unit: "L" },
  ];
  for (const row of inventorySeed) {
    const exists = await InventoryItem.findOne({ name: row.name });
    if (!exists) {
      await InventoryItem.create(row);
      console.log(`Created inventory: ${row.name}`);
    }
  }

  if ((await DeliveryFee.countDocuments()) === 0) {
    await DeliveryFee.create({
      name: "Standard Delivery",
      fee: 60,
      minOrder: 0,
      isActive: true,
    });
    console.log("Created default delivery fee");
  }

  if ((await VatRule.countDocuments()) === 0) {
    await VatRule.create({
      name: "Standard VAT",
      rate: 5,
      appliesTo: "all",
      isActive: true,
    });
    console.log("Created default VAT rule");
  }

  if ((await DiningTable.countDocuments()) === 0) {
    const tables = [
      { name: "T1", seats: 2 },
      { name: "T2", seats: 4 },
      { name: "T3", seats: 4 },
      { name: "T4", seats: 6 },
      { name: "T5", seats: 8 },
    ];
    await DiningTable.insertMany(
      tables.map((t) => ({ ...t, status: "Available", isActive: true }))
    );
    console.log("Created dining tables");
  }

  if ((await WeeklySchedule.countDocuments()) === 0) {
    await WeeklySchedule.create({});
    console.log("Created weekly schedule");
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
