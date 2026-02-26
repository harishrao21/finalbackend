const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const ApiError = require("../utils/apiError");
const { getPagination } = require("../utils/pagination");

const createBooking = async ({ userId, eventId, seatsBooked }) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        date: { $gt: new Date() },
        availableSeats: { $gte: seatsBooked }
      },
      {
        $inc: { availableSeats: -seatsBooked }
      },
      { new: true, session }
    );

    if (!updatedEvent) {
      throw new ApiError(400, "Booking closed, insufficient seats, or invalid event");
    }

    const booking = await Booking.create(
      [
        {
          user: userId,
          event: eventId,
          seatsBooked,
          paymentStatus: "mock",
          bookingStatus: "confirmed"
        }
      ],
      { session }
    );

    await session.commitTransaction();
    return booking[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const cancelBooking = async ({ bookingId, userId, role }) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    if (role !== "admin" && booking.user.toString() !== userId.toString()) {
      throw new ApiError(403, "You can cancel only your own bookings");
    }

    if (booking.bookingStatus === "cancelled") {
      throw new ApiError(400, "Booking already cancelled");
    }

    booking.bookingStatus = "cancelled";
    await booking.save({ session });

    const eventDoc = await Event.findById(booking.event).session(session);
    if (!eventDoc) {
      throw new ApiError(404, "Event not found");
    }

    eventDoc.availableSeats = Math.min(
      eventDoc.totalSeats,
      eventDoc.availableSeats + booking.seatsBooked
    );
    await eventDoc.save({ session });

    await session.commitTransaction();
    return booking;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getMyBookings = async (userId, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { user: userId };

  const items = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("event")
    .populate("user", "name email role");

  const total = await Booking.countDocuments(filter);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getAllBookings = async (query, adminId) => {
  const { page, limit, skip } = getPagination(query);
  const adminEventIds = await Event.find({ createdBy: adminId }).distinct("_id");
  const filter = { event: { $in: adminEventIds } };
  const items = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("event")
    .populate("user", "name email role");
  const total = await Booking.countDocuments(filter);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  createBooking,
  cancelBooking,
  getMyBookings,
  getAllBookings
};
