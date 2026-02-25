const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const ApiError = require("../utils/apiError");
const { getPagination } = require("../utils/pagination");

const createBooking = async ({
  userId,
  eventId,
  seatsBooked,
  paymentStatus,
  paymentGateway = "mock",
  gatewayOrderId,
  gatewayPaymentId,
  gatewaySignature
}) => {
  const session = await mongoose.startSession();

  try {
    // Start one atomic unit of work: seat deduction + booking creation.
    session.startTransaction();

    // Guard overbooking at DB query level by checking availableSeats in the same update.
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
          paymentStatus,
          bookingStatus: "confirmed",
          paymentGateway,
          gatewayOrderId,
          gatewayPaymentId,
          gatewaySignature
        }
      ],
      { session }
    );

    await session.commitTransaction();
    return booking[0];
  } catch (error) {
    // Roll back event seat changes if booking insert fails.
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const cancelBooking = async ({ bookingId, userId, role }) => {
  const session = await mongoose.startSession();

  try {
    // Cancel booking and restore seats in one transaction to avoid seat mismatch.
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

    // Restore only available seats; totalSeats is the event capacity and must stay constant.
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

  const [items, total] = await Promise.all([
    Booking.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("event")
      .populate("user", "name email role"),
    Booking.countDocuments({ user: userId })
  ]);

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
  const adminObjectId =
    typeof adminId === "string" ? new mongoose.Types.ObjectId(adminId) : adminId;
  const adminEventIds = await Event.find({ createdBy: adminId }).distinct("_id");
  const bookingFilter = { event: { $in: adminEventIds } };
  const seatSummaryMatch = { $match: { createdBy: adminObjectId } };

  const [items, total, seatSummary] = await Promise.all([
    Booking.find(bookingFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("event")
      .populate("user", "name email role"),
    Booking.countDocuments(bookingFilter),
    Event.aggregate([
      seatSummaryMatch,
      {
        $project: {
          _id: 1,
          title: 1,
          totalSeats: 1,
          availableSeats: 1,
          bookedSeats: { $subtract: ["$totalSeats", "$availableSeats"] }
        }
      },
      { $sort: { title: 1 } }
    ])
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    seatSummary
  };
};

const getAdminReportData = async ({ adminId, eventId }) => {
  const adminObjectId =
    typeof adminId === "string" ? new mongoose.Types.ObjectId(adminId) : adminId;
  const adminEventIds = await Event.find({ createdBy: adminObjectId }).distinct("_id");

  if (adminEventIds.length === 0) {
    return {
      seatSummary: [],
      bookings: []
    };
  }

  let filteredEventIds = adminEventIds;
  if (eventId) {
    const normalizedEventId = new mongoose.Types.ObjectId(eventId);
    const isOwnedEvent = adminEventIds.some((id) => id.toString() === normalizedEventId.toString());
    if (!isOwnedEvent) {
      throw new ApiError(404, "Event not found for this admin");
    }
    filteredEventIds = [normalizedEventId];
  }

  const events = await Event.find({ _id: { $in: filteredEventIds } }).sort({ date: 1 });
  const bookings = await Booking.find({ event: { $in: filteredEventIds } })
    .sort({ createdAt: -1 })
    .populate("event")
    .populate("user", "name email role");

  const seatSummary = events.map((event) => ({
    eventId: String(event._id),
    title: event.title,
    totalSeats: event.totalSeats,
    bookedSeats: event.totalSeats - event.availableSeats,
    seatsLeft: event.availableSeats,
    eventDate: event.date,
    location: event.location
  }));

  return {
    seatSummary,
    bookings
  };
};

module.exports = {
  createBooking,
  cancelBooking,
  getMyBookings,
  getAllBookings,
  getAdminReportData
};
