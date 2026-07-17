const ApiError = require("../utils/ApiError");
const sendSuccess = require("../utils/sendSuccess");
const MenuCategory = require("../models/MenuCategory");
const MenuItem = require("../models/MenuItem");

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function listPublicMenu(_req, res) {
  const categories = await MenuCategory.find({ isActive: true }).sort({ name: 1 });
  const items = await MenuItem.find({ isActive: true })
    .populate("category", "name")
    .sort({ name: 1 });
  return sendSuccess(res, { categories, items });
}

async function getPublicMenuItem(req, res) {
  const item = await MenuItem.findOne({
    slug: req.params.slug,
    isActive: true,
  }).populate("category", "name");
  if (!item) throw new ApiError(404, "Menu item not found");

  const categoryId = item.category?._id || item.category;
  let related = await MenuItem.find({
    isActive: true,
    category: categoryId,
    _id: { $ne: item._id },
  })
    .limit(6)
    .populate("category", "name");

  // If same category is empty/short, fill with items from other categories
  if (related.length < 6) {
    const excludeIds = [item._id, ...related.map((r) => r._id)];
    const fillers = await MenuItem.find({
      isActive: true,
      _id: { $nin: excludeIds },
    })
      .limit(6 - related.length)
      .populate("category", "name");
    related = [...related, ...fillers];
  }

  return sendSuccess(res, { item, related });
}

async function listCategories(_req, res) {
  const categories = await MenuCategory.find().sort({ name: 1 });
  return sendSuccess(res, { categories });
}

async function createCategory(req, res) {
  const { name, image, isActive } = req.body || {};
  if (!name) throw new ApiError(400, "Name is required");
  const exists = await MenuCategory.findOne({ name: String(name).trim() });
  if (exists) throw new ApiError(409, "Category already exists");
  const category = await MenuCategory.create({
    name: String(name).trim(),
    image: image || "",
    isActive: isActive !== false,
  });
  return sendSuccess(res, { category }, "Category created", 201);
}

async function updateCategory(req, res) {
  const category = await MenuCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");
  const { name, image, isActive } = req.body || {};
  if (name !== undefined) category.name = String(name).trim();
  if (image !== undefined) category.image = image;
  if (isActive !== undefined) category.isActive = Boolean(isActive);
  await category.save();
  return sendSuccess(res, { category }, "Category updated");
}

async function deleteCategory(req, res) {
  const category = await MenuCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");
  const inUse = await MenuItem.countDocuments({ category: category._id });
  if (inUse > 0) {
    throw new ApiError(400, "Category has menu items; reassign or delete them first");
  }
  await category.deleteOne();
  return sendSuccess(res, null, "Category deleted");
}

async function listStaffMenuItems(req, res) {
  const q = {};
  if (req.query.category) q.category = req.query.category;
  if (req.query.status) q.status = req.query.status;
  if (req.query.active === "true") q.isActive = true;
  if (req.query.active === "false") q.isActive = false;
  if (req.query.search) {
    q.name = { $regex: String(req.query.search), $options: "i" };
  }
  let sort = { createdAt: -1 };
  if (req.query.sort === "name") sort = { name: 1 };
  if (req.query.sort === "price_asc") sort = { price: 1 };
  if (req.query.sort === "price_desc") sort = { price: -1 };

  const items = await MenuItem.find(q).populate("category", "name").sort(sort);
  return sendSuccess(res, { items });
}

const MAX_POPULAR_DISHES = 6;

async function assertPopularSlotAvailable(excludeId) {
  const q = { homepageBadge: "popular" };
  if (excludeId) q._id = { $ne: excludeId };
  const count = await MenuItem.countDocuments(q);
  if (count >= MAX_POPULAR_DISHES) {
    throw new ApiError(
      400,
      `Six popular dishes are already added. Remove one before adding another.`
    );
  }
}

async function createMenuItem(req, res) {
  const body = req.body || {};
  if (!body.name || body.price === undefined || !body.category) {
    throw new ApiError(400, "Name, price, and category are required");
  }
  const slug = body.slug ? slugify(body.slug) : slugify(body.name);
  const exists = await MenuItem.findOne({ slug });
  if (exists) throw new ApiError(409, "Slug already exists");
  const homepageBadge = body.homepageBadge || "none";
  if (homepageBadge === "popular") {
    await assertPopularSlotAvailable();
  }
  const item = await MenuItem.create({
    slug,
    name: String(body.name).trim(),
    description: body.description || "",
    category: body.category,
    price: Number(body.price),
    image: body.image || "",
    tags: Array.isArray(body.tags) ? body.tags : [],
    isFeatured: Boolean(body.isFeatured),
    homepageBadge,
    customizable: Boolean(body.customizable),
    sizes: Array.isArray(body.sizes) ? body.sizes : [],
    toppings: Array.isArray(body.toppings) ? body.toppings : [],
    status: body.status || "In Stock",
    isActive: body.isActive !== false,
  });
  await item.populate("category", "name");
  return sendSuccess(res, { item }, "Menu item created", 201);
}

async function updateMenuItem(req, res) {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new ApiError(404, "Menu item not found");
  const body = req.body || {};
  if (
    body.homepageBadge === "popular" &&
    item.homepageBadge !== "popular"
  ) {
    await assertPopularSlotAvailable(item._id);
  }
  const fields = [
    "name",
    "description",
    "category",
    "price",
    "image",
    "tags",
    "isFeatured",
    "homepageBadge",
    "customizable",
    "sizes",
    "toppings",
    "status",
    "isActive",
  ];
  for (const key of fields) {
    if (body[key] !== undefined) item[key] = body[key];
  }
  if (body.slug) item.slug = slugify(body.slug);
  await item.save();
  await item.populate("category", "name");
  return sendSuccess(res, { item }, "Menu item updated");
}

async function deleteMenuItem(req, res) {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new ApiError(404, "Menu item not found");
  await item.deleteOne();
  return sendSuccess(res, null, "Menu item deleted");
}

module.exports = {
  listPublicMenu,
  getPublicMenuItem,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listStaffMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
