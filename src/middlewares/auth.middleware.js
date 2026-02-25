const ApiError = require("../utils/apiError");
const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return req.cookies?.accessToken;
};

const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next(new ApiError(401, "Authentication required"));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new ApiError(401, "Invalid token user"));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { protect };
