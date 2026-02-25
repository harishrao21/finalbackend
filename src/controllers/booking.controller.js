const bookingService = require("../services/booking.service");
const paymentService = require("../services/payment.service");
const env = require("../config/env");
const ExcelJS = require("exceljs");
const ApiError = require("../utils/apiError");
const { success } = require("../utils/apiResponse");

const createBooking = async (req, res) => {
  const booking = await bookingService.createBooking({
    userId: req.user._id,
    eventId: req.body.eventId,
    seatsBooked: req.body.seatsBooked,
    paymentStatus: req.body.paymentStatus
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

const createRazorpayOrder = async (req, res) => {
  const { order, event } = await paymentService.createOrder({
    eventId: req.body.eventId,
    seatsBooked: req.body.seatsBooked,
    userId: req.user._id
  });

  return success(res, 200, "Razorpay order created", {
    mockMode: env.mockRazorpay,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    event: {
      id: event._id,
      title: event.title
    }
  });
};

const verifyRazorpayAndCreateBooking = async (req, res) => {
  const isValid = paymentService.verifySignature({
    razorpayOrderId: req.body.razorpayOrderId,
    razorpayPaymentId: req.body.razorpayPaymentId,
    razorpaySignature: req.body.razorpaySignature
  });

  if (!isValid) {
    throw new ApiError(400, "Invalid Razorpay payment signature");
  }

  const booking = await bookingService.createBooking({
    userId: req.user._id,
    eventId: req.body.eventId,
    seatsBooked: req.body.seatsBooked,
    paymentStatus: "paid",
    paymentGateway: "razorpay",
    gatewayOrderId: req.body.razorpayOrderId,
    gatewayPaymentId: req.body.razorpayPaymentId,
    gatewaySignature: req.body.razorpaySignature
  });

  return success(res, 201, "Payment verified and booking confirmed", booking);
};

const exportAdminReport = async (req, res) => {
  const report = await bookingService.getAdminReportData({
    adminId: req.user._id,
    eventId: req.query.eventId
  });

  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet("Event Seat Summary");
  summarySheet.columns = [
    { header: "Event ID", key: "eventId", width: 28 },
    { header: "Title", key: "title", width: 30 },
    { header: "Total Seats", key: "totalSeats", width: 14 },
    { header: "Booked Seats", key: "bookedSeats", width: 14 },
    { header: "Seats Left", key: "seatsLeft", width: 12 },
    { header: "Event Date", key: "eventDate", width: 20 },
    { header: "Location", key: "location", width: 24 }
  ];
  report.seatSummary.forEach((row) => summarySheet.addRow(row));
  if (report.seatSummary.length === 0) {
    summarySheet.addRow({
      eventId: "No events found",
      title: "-",
      totalSeats: 0,
      bookedSeats: 0,
      seatsLeft: 0,
      eventDate: "-",
      location: "-"
    });
  }

  // Also include recent bookings in the same first sheet so admin can see all data in one view.
  summarySheet.addRow({});
  summarySheet.addRow({ eventId: "Recent User Bookings" });
  summarySheet.addRow({
    eventId: "Booking ID",
    title: "Event",
    totalSeats: "User Name",
    bookedSeats: "User Email",
    seatsLeft: "Seats",
    eventDate: "Booking Status",
    location: "Payment Status"
  });
  report.bookings.forEach((booking) =>
    summarySheet.addRow({
      eventId: String(booking._id),
      title: booking.event?.title || "N/A",
      totalSeats: booking.user?.name || "N/A",
      bookedSeats: booking.user?.email || "N/A",
      seatsLeft: booking.seatsBooked,
      eventDate: booking.bookingStatus,
      location: booking.paymentStatus
    })
  );
  if (report.bookings.length === 0) {
    summarySheet.addRow({
      eventId: "No bookings found",
      title: "-",
      totalSeats: "-",
      bookedSeats: "-",
      seatsLeft: 0,
      eventDate: "-",
      location: "-"
    });
  }

  const bookingsSheet = workbook.addWorksheet("Recent User Bookings");
  bookingsSheet.columns = [
    { header: "Booking ID", key: "bookingId", width: 28 },
    { header: "Event", key: "eventTitle", width: 28 },
    { header: "User Name", key: "userName", width: 20 },
    { header: "User Email", key: "userEmail", width: 28 },
    { header: "Seats Booked", key: "seatsBooked", width: 14 },
    { header: "Booking Status", key: "bookingStatus", width: 14 },
    { header: "Payment Status", key: "paymentStatus", width: 14 },
    { header: "Created At", key: "createdAt", width: 24 }
  ];
  report.bookings.forEach((booking) =>
    bookingsSheet.addRow({
      bookingId: String(booking._id),
      eventTitle: booking.event?.title || "N/A",
      userName: booking.user?.name || "N/A",
      userEmail: booking.user?.email || "N/A",
      seatsBooked: booking.seatsBooked,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt
    })
  );
  if (report.bookings.length === 0) {
    bookingsSheet.addRow({
      bookingId: "No bookings found",
      eventTitle: "-",
      userName: "-",
      userEmail: "-",
      seatsBooked: 0,
      bookingStatus: "-",
      paymentStatus: "-",
      createdAt: "-"
    });
  }

  const fileSuffix = req.query.eventId ? `event_${req.query.eventId}` : "all_events";
  const fileName = `event_report_${fileSuffix}_${Date.now()}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  await workbook.xlsx.write(res);
  res.end();
};

module.exports = {
  createBooking,
  cancelBooking,
  getMyBookings,
  getAllBookings,
  createRazorpayOrder,
  verifyRazorpayAndCreateBooking,
  exportAdminReport
};
