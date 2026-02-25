const userService = require("../services/user.service");
const { success } = require("../utils/apiResponse");

const getMyProfile = async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  return success(res, 200, "Profile fetched", user);
};

module.exports = { getMyProfile };
