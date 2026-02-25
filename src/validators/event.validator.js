const { Joi, objectId } = require("./common.validator");

const eventBodySchema = Joi.object({
  title: Joi.string().trim().max(150).required(),
  description: Joi.string().trim().max(2000).required(),
  date: Joi.date().greater("now").required(),
  location: Joi.string().trim().max(200).required(),
  totalSeats: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required()
});

const eventUpdateBodySchema = Joi.object({
  title: Joi.string().trim().max(150),
  description: Joi.string().trim().max(2000),
  date: Joi.date().greater("now"),
  location: Joi.string().trim().max(200),
  totalSeats: Joi.number().integer().min(1),
  price: Joi.number().min(0)
}).min(1);

const eventIdParamSchema = Joi.object({
  eventId: objectId.required()
});

module.exports = {
  eventBodySchema,
  eventUpdateBodySchema,
  eventIdParamSchema
};
