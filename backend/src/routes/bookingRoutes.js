const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const booking = require("../controllers/bookingController");
const {
  authenticate,
  requireStaff,
  requirePermission,
  requireCustomer,
} = require("../middleware/auth");

const router = express.Router();

// Public booking
router.get("/public/availability", asyncHandler(booking.publicAvailability));
router.post("/public/bookings", asyncHandler(booking.createPublicBooking));
router.post(
  "/public/bookings/authenticated",
  authenticate,
  requireCustomer,
  asyncHandler(booking.createPublicBooking)
);
router.get(
  "/mine",
  authenticate,
  requireCustomer,
  asyncHandler(booking.myBookings)
);

// Tables
router.get(
  "/tables",
  authenticate,
  requireStaff,
  requirePermission("tables"),
  asyncHandler(booking.listTables)
);
router.post(
  "/tables",
  authenticate,
  requireStaff,
  requirePermission("tables"),
  asyncHandler(booking.createTable)
);
router.patch(
  "/tables/:id",
  authenticate,
  requireStaff,
  requirePermission("tables"),
  asyncHandler(booking.updateTable)
);
router.delete(
  "/tables/:id",
  authenticate,
  requireStaff,
  requirePermission("tables"),
  asyncHandler(booking.deleteTable)
);

// Schedule / overrides / blocked
router.get(
  "/schedule",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.getWeeklySchedule)
);
router.put(
  "/schedule",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.updateWeeklySchedule)
);
router.get(
  "/date-overrides",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.listDateOverrides)
);
router.post(
  "/date-overrides",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.upsertDateOverride)
);
router.delete(
  "/date-overrides/:id",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.deleteDateOverride)
);
router.get(
  "/blocked-dates",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.listBlockedDates)
);
router.post(
  "/blocked-dates",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.createBlockedDate)
);
router.delete(
  "/blocked-dates/:id",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.deleteBlockedDate)
);

router.get(
  "/day-view",
  authenticate,
  requireStaff,
  requirePermission("tables"),
  asyncHandler(booking.dayView)
);

router.get(
  "/bookings",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.listBookings)
);
router.post(
  "/bookings",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.createStaffBooking)
);
router.patch(
  "/bookings/:id",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.updateBooking)
);
router.delete(
  "/bookings/:id",
  authenticate,
  requireStaff,
  requirePermission("bookings"),
  asyncHandler(booking.deleteBooking)
);

module.exports = router;
