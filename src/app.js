const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const env = require("./config/env");
const applySecurity = require("./middlewares/security.middleware");
const routes = require("./routes");
const notFoundMiddleware = require("./middlewares/notFound.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

applySecurity(app);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.nodeEnv !== "test") {
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
}

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is healthy" });
});

app.use("/api/v1", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
