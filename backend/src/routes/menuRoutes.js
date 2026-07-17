const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const menu = require("../controllers/menuController");
const {
  authenticate,
  requireStaff,
  requirePermission,
} = require("../middleware/auth");

const router = express.Router();

router.get("/public", asyncHandler(menu.listPublicMenu));
router.get("/public/:slug", asyncHandler(menu.getPublicMenuItem));

router.get(
  "/categories",
  authenticate,
  requireStaff,
  requirePermission("menu"),
  asyncHandler(menu.listCategories)
);
router.post(
  "/categories",
  authenticate,
  requireStaff,
  requirePermission("menu"),
  asyncHandler(menu.createCategory)
);
router.patch(
  "/categories/:id",
  authenticate,
  requireStaff,
  requirePermission("menu"),
  asyncHandler(menu.updateCategory)
);
router.delete(
  "/categories/:id",
  authenticate,
  requireStaff,
  requirePermission("menu"),
  asyncHandler(menu.deleteCategory)
);

router.get(
  "/items",
  authenticate,
  requireStaff,
  requirePermission("menu"),
  asyncHandler(menu.listStaffMenuItems)
);
router.post(
  "/items",
  authenticate,
  requireStaff,
  requirePermission("menu"),
  asyncHandler(menu.createMenuItem)
);
router.patch(
  "/items/:id",
  authenticate,
  requireStaff,
  requirePermission("menu"),
  asyncHandler(menu.updateMenuItem)
);
router.delete(
  "/items/:id",
  authenticate,
  requireStaff,
  requirePermission("menu"),
  asyncHandler(menu.deleteMenuItem)
);

module.exports = router;
