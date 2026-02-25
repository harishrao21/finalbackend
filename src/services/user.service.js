const User = require("../models/User");
const ApiError = require("../utils/apiError");

const getProfile = async (userId) => {
  const user = await User.findById(userId).select("name email role createdAt");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

module.exports = { getProfile };
