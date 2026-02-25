const { Joi, objectId } = require("./common.validator");

const createBookingSchema = Joi.object({
  eventId: objectId.required(),
  seatsBooked: Joi.number().integer().min(1).required(),
  paymentStatus: Joi.string().valid("pending", "paid", "mock").default("mock")
});

const bookingIdParamSchema = Joi.object({
  bookingId: objectId.required()
});

module.exports = { createBookingSchema, bookingIdParamSchema };
