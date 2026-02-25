const Joi = require("joi");

const objectId = Joi.string().hex().length(24).messages({
  "string.length": "Invalid Mongo ObjectId",
  "string.hex": "Invalid Mongo ObjectId"
});

module.exports = { Joi, objectId };
