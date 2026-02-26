const ApiError = require("../utils/apiError");
const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = req.cookies?.accessToken;
    }

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
