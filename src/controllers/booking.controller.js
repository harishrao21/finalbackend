const bookingService = require("../services/booking.service");
const { success } = require("../utils/apiResponse");

const createBooking = async (req, res) => {
  const booking = await bookingService.createBooking({
    userId: req.user._id,
    eventId: req.body.eventId,
    seatsBooked: req.body.seatsBooked
  });

  return success(res, 201, "Booking confirmed", booking);
};

const cancelBooking = async (req, res) => {
  const booking = await bookingService.cancelBooking({
    bookingId: req.params.bookingId,
    userId: req.user._id,
    role: req.user.role
  });

  return success(res, 200, "Booking cancelled", booking);
};

const getMyBookings = async (req, res) => {
  const result = await bookingService.getMyBookings(req.user._id, req.query);
  return success(res, 200, "My bookings fetched", result);
};

const getAllBookings = async (req, res) => {
  const result = await bookingService.getAllBookings(req.query, req.user._id);
  return success(res, 200, "All bookings fetched", result);
};

module.exports = {
  createBooking,
  cancelBooking,
  getMyBookings,
  getAllBookings
};
