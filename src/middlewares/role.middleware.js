const ApiError = require("../utils/apiError");

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "Forbidden: insufficient permissions"));
  }
  return next();
};

module.exports = { allowRoles };
