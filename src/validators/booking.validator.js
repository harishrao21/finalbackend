const { Joi, objectId } = require("./common.validator");

const createBookingSchema = Joi.object({
  eventId: objectId.required(),
  seatsBooked: Joi.number().integer().min(1).required()
});

const bookingIdParamSchema = Joi.object({
  bookingId: objectId.required()
});

module.exports = { createBookingSchema, bookingIdParamSchema };
