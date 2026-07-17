const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const inventory = require("../controllers/inventoryController");
const {
  authenticate,
  requireStaff,
  requirePermission,
} = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, requireStaff, requirePermission("inventory"));

router.get("/", asyncHandler(inventory.listInventory));
router.get("/status-helpers", asyncHandler(inventory.statusHelpers));
router.post("/", asyncHandler(inventory.createInventory));
router.patch("/:id", asyncHandler(inventory.updateInventory));
router.post("/:id/restock", asyncHandler(inventory.restockInventory));
router.delete("/:id", asyncHandler(inventory.deleteInventory));

module.exports = router;
