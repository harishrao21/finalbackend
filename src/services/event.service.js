const mongoose = require("mongoose");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const ApiError = require("../utils/apiError");
const { getPagination } = require("../utils/pagination");

const buildEventFilter = (query = {}, adminId = null) => {
  const filter = {};

  if (adminId) {
    filter.createdBy = adminId;
  }

  if (query.search && query.search.trim()) {
    filter.$text = { $search: query.search.trim() };
  }

  if (query.location) {
    filter.location = { $regex: query.location, $options: "i" };
  }

  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.date.$lte = new Date(query.dateTo);
  }

  return filter;
};

const createEvent = async (payload, adminId) => {
  return Event.create({
    ...payload,
    availableSeats: payload.totalSeats,
    createdBy: adminId
  });
};

const listMyEvents = async (adminId, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = buildEventFilter(query, adminId);
  const items = await Event.find(filter)
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit)
    .populate("createdBy", "name email role");
  const total = await Event.countDocuments(filter);

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

const listEvents = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = buildEventFilter(query);
  const items = await Event.find(filter)
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit)
    .populate("createdBy", "name email role");
  const total = await Event.countDocuments(filter);

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

const getEventById = async (eventId) => {
  const event = await Event.findById(eventId).populate("createdBy", "name email role");
  if (!event) {
    throw new ApiError(404, "Event not found");
  }
  return event;
};

const updateEvent = async (eventId, payload, adminId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }
  if (event.createdBy.toString() !== adminId.toString()) {
    throw new ApiError(403, "You can update only your own events");
  }

  if (payload.totalSeats !== undefined) {
    const activeBookingAgg = await Booking.aggregate([
      { $match: { event: event._id, bookingStatus: "confirmed" } },
      { $group: { _id: null, seats: { $sum: "$seatsBooked" } } }
    ]);

    const bookedSeats = activeBookingAgg[0]?.seats || 0;
    if (payload.totalSeats < bookedSeats) {
      throw new ApiError(400, "totalSeats cannot be less than already booked seats");
    }

    event.availableSeats = payload.totalSeats - bookedSeats;
  }

  Object.assign(event, payload);
  return event.save();
};

const deleteEvent = async (eventId, adminId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const event = await Event.findById(eventId).session(session);
    if (!event) {
      throw new ApiError(404, "Event not found");
    }
    if (event.createdBy.toString() !== adminId.toString()) {
      throw new ApiError(403, "You can delete only your own events");
    }

    // Force-delete mode: remove all bookings for this event first, then delete event.
    await Booking.deleteMany({ event: eventId }).session(session);
    await event.deleteOne({ session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createEvent,
  listEvents,
  listMyEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
