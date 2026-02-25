const { Joi, objectId } = require("./common.validator");

const createOrderSchema = Joi.object({
  eventId: objectId.required(),
  seatsBooked: Joi.number().integer().min(1).required()
});

const verifyPaymentSchema = Joi.object({
  eventId: objectId.required(),
  seatsBooked: Joi.number().integer().min(1).required(),
  razorpayOrderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required()
});

module.exports = {
  createOrderSchema,
  verifyPaymentSchema
};
