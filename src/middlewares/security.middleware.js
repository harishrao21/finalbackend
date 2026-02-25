const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const xssClean = require("xss-clean");
const compression = require("compression");
const env = require("../config/env");

const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later"
  }
});

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.clientUrls.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS origin not allowed"));
    }
  },
  credentials: true
};

const applySecurity = (app) => {
  app.use(helmet());
  app.use(compression());
  app.use(cors(corsOptions));
  app.use(limiter);
  app.use(mongoSanitize());
  app.use(xssClean());
  app.use(hpp());
};

module.exports = applySecurity;
