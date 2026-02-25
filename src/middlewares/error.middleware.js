const { JsonWebTokenError, TokenExpiredError } = require("jsonwebtoken");
const Joi = require("joi");
const env = require("../config/env");

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err instanceof Joi.ValidationError) {
    statusCode = 400;
    message = err.details.map((detail) => detail.message).join(", ");
  }

  if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Token expired";
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate resource conflict";
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(env.nodeEnv === "development" ? { stack: err.stack } : {})
  });
};

module.exports = errorMiddleware;
