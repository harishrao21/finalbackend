const { Joi } = require("./common.validator");

const strongPassword = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/)
  .messages({
    "string.pattern.base": "Password must include upper, lower, number, and special character"
  });

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: strongPassword.required(),
  role: Joi.string().valid("admin", "user").default("user"),
  adminPasscode: Joi.when("role", {
    is: "admin",
    then: Joi.string().valid("lpu").required().messages({
      "any.only": "Invalid admin passcode",
      "any.required": "Admin passcode is required for admin signup"
    }),
    otherwise: Joi.string().optional().allow("")
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };
