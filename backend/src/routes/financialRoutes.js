const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const fin = require("../controllers/financialController");
const {
  authenticate,
  requireStaff,
  requirePermission,
} = require("../middleware/auth");

const router = express.Router();

router.get("/public/snapshot", asyncHandler(fin.publicFinancialsSnapshot));
router.get("/public/delivery-fees", asyncHandler(fin.listDeliveryFees));

router.use(authenticate, requireStaff, requirePermission("financials"));

router.get("/delivery-fees", asyncHandler(fin.listDeliveryFees));
router.post("/delivery-fees", asyncHandler(fin.createDeliveryFee));
router.patch("/delivery-fees/:id", asyncHandler(fin.updateDeliveryFee));
router.delete("/delivery-fees/:id", asyncHandler(fin.deleteDeliveryFee));

router.get("/vat-rules", asyncHandler(fin.listVatRules));
router.post("/vat-rules", asyncHandler(fin.createVatRule));
router.patch("/vat-rules/:id", asyncHandler(fin.updateVatRule));
router.delete("/vat-rules/:id", asyncHandler(fin.deleteVatRule));

router.get("/offers", asyncHandler(fin.listOffers));
router.post("/offers", asyncHandler(fin.createOffer));
router.patch("/offers/:id", asyncHandler(fin.updateOffer));
router.delete("/offers/:id", asyncHandler(fin.deleteOffer));

module.exports = router;
