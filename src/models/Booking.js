const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: 1
    },
    bookingStatus: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed"
    },
    paymentStatus: {
      type: String,
      enum: ["mock"],
      default: "mock"
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

bookingSchema.index({ user: 1, event: 1, bookingStatus: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
