const crypto = require("crypto");
const Razorpay = require("razorpay");
const env = require("../config/env");
const Event = require("../models/Event");
const ApiError = require("../utils/apiError");

const assertRazorpayConfigured = () => {
  if (env.mockRazorpay) return;
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new ApiError(500, "Razorpay is not configured on server");
  }
};

const razorpayClient = () => {
  assertRazorpayConfigured();
  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret
  });
};

const createOrder = async ({ eventId, seatsBooked, userId }) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }
  if (new Date(event.date) <= new Date()) {
    throw new ApiError(400, "Booking is closed for this event");
  }
  if (event.availableSeats < seatsBooked) {
    throw new ApiError(400, "Insufficient seats available");
  }

  const amountInPaise = Math.round(event.price * seatsBooked * 100);
  if (amountInPaise < 0) {
    throw new ApiError(400, "Invalid order amount");
  }

  // Free events do not need gateway checkout.
  if (amountInPaise === 0) {
    return {
      order: {
        id: `order_free_${Date.now()}`,
        amount: 0,
        currency: env.paymentCurrency
      },
      event
    };
  }

  if (env.mockRazorpay) {
    return {
      order: {
        id: `order_mock_${Date.now()}`,
        amount: amountInPaise,
        currency: env.paymentCurrency
      },
      event
    };
  }

  const client = razorpayClient();
  const order = await client.orders.create({
    amount: amountInPaise,
    currency: env.paymentCurrency,
    receipt: `evt_${eventId}_usr_${userId}_${Date.now()}`,
    notes: {
      eventId: String(eventId),
      seatsBooked: String(seatsBooked),
      userId: String(userId)
    }
  });

  return {
    order,
    event
  };
};

const verifySignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (env.mockRazorpay) {
    return Boolean(razorpayOrderId && razorpayPaymentId && razorpaySignature);
  }

  assertRazorpayConfigured();

  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return expectedSignature === razorpaySignature;
};

module.exports = {
  createOrder,
  verifySignature
};
