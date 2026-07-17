const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../controllers/authController");
const {
  authenticate,
  requireCustomer,
  requireStaff,
  requireSuperAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Customer auth
router.post("/customer/register", asyncHandler(auth.registerCustomer));
router.post("/customer/login", asyncHandler(auth.loginCustomer));
router.get(
  "/customer/me",
  authenticate,
  requireCustomer,
  asyncHandler(auth.getCustomerMe)
);
router.patch(
  "/customer/me",
  authenticate,
  requireCustomer,
  asyncHandler(auth.updateCustomerMe)
);
router.post(
  "/customer/logout",
  authenticate,
  requireCustomer,
  asyncHandler(auth.logoutCustomer)
);

// Customer OTP — password reset (public, returns devOtp in development responses)
router.post(
  "/customer/otp/password/request",
  asyncHandler(auth.requestCustomerPasswordResetOtp)
);
router.post(
  "/customer/otp/password/verify",
  asyncHandler(auth.verifyCustomerPasswordResetOtp)
);
router.post(
  "/customer/otp/password/confirm",
  asyncHandler(auth.confirmCustomerPasswordReset)
);

// Staff auth
router.post("/staff/login", asyncHandler(auth.loginStaff));
router.get("/staff/me", authenticate, requireStaff, asyncHandler(auth.getStaffMe));
router.patch(
  "/staff/me",
  authenticate,
  requireStaff,
  asyncHandler(auth.updateStaffMe)
);
router.post(
  "/staff/change-password",
  authenticate,
  requireStaff,
  asyncHandler(auth.changeStaffPassword)
);
router.post(
  "/staff/logout",
  authenticate,
  requireStaff,
  asyncHandler(auth.logoutStaff)
);

// Staff OTP — email change (super admin)
router.post(
  "/staff/otp/email/request",
  authenticate,
  requireStaff,
  requireSuperAdmin,
  asyncHandler(auth.requestEmailChangeOtp)
);
router.post(
  "/staff/otp/email/verify",
  authenticate,
  requireStaff,
  requireSuperAdmin,
  asyncHandler(auth.verifyEmailChangeOtp)
);
router.post(
  "/staff/otp/email/confirm",
  authenticate,
  requireStaff,
  requireSuperAdmin,
  asyncHandler(auth.confirmEmailChange)
);

// Staff OTP — password reset (public)
router.post("/staff/otp/password/request", asyncHandler(auth.requestPasswordResetOtp));
router.post("/staff/otp/password/verify", asyncHandler(auth.verifyPasswordResetOtp));
router.post("/staff/otp/password/confirm", asyncHandler(auth.confirmPasswordReset));

// Staff CRUD (super admin)
router.get(
  "/staff",
  authenticate,
  requireStaff,
  requireSuperAdmin,
  asyncHandler(auth.listStaff)
);
router.post(
  "/staff",
  authenticate,
  requireStaff,
  requireSuperAdmin,
  asyncHandler(auth.createStaff)
);
router.patch(
  "/staff/:id",
  authenticate,
  requireStaff,
  requireSuperAdmin,
  asyncHandler(auth.updateStaff)
);
router.delete(
  "/staff/:id",
  authenticate,
  requireStaff,
  requireSuperAdmin,
  asyncHandler(auth.deleteStaff)
);

module.exports = router;
