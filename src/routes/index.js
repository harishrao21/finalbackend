const express = require("express");
const authRoutes = require("./auth.routes");
const eventRoutes = require("./event.routes");
const bookingRoutes = require("./booking.routes");
const userRoutes = require("./user.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/events", eventRoutes);
router.use("/bookings", bookingRoutes);
router.use("/users", userRoutes);

module.exports = router;
