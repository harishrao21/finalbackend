const express = require("express");
const asyncHandler = require("../middlewares/asyncHandler.middleware");
const validate = require("../middlewares/validate.middleware");
const { protect } = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const bookingController = require("../controllers/booking.controller");
const { createBookingSchema, bookingIdParamSchema } = require("../validators/booking.validator");
const { createOrderSchema, verifyPaymentSchema } = require("../validators/payment.validator");
const { exportReportQuerySchema } = require("../validators/report.validator");

const router = express.Router();

router.use(protect);

router.get("/me", asyncHandler(bookingController.getMyBookings));
router.post("/", validate(createBookingSchema), asyncHandler(bookingController.createBooking));
router.post(
  "/payment/order",
  validate(createOrderSchema),
  asyncHandler(bookingController.createRazorpayOrder)
);
router.post(
  "/payment/verify",
  validate(verifyPaymentSchema),
  asyncHandler(bookingController.verifyRazorpayAndCreateBooking)
);
router.patch("/:bookingId/cancel", validate(bookingIdParamSchema, "params"), asyncHandler(bookingController.cancelBooking));
router.get("/", allowRoles("admin"), asyncHandler(bookingController.getAllBookings));
router.get(
  "/export",
  allowRoles("admin"),
  validate(exportReportQuerySchema, "query"),
  asyncHandler(bookingController.exportAdminReport)
);

module.exports = router;
