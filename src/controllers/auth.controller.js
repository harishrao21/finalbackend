const env = require("../config/env");
const authService = require("../services/auth.service");
const { success } = require("../utils/apiResponse");

const buildCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  maxAge: env.cookieExpiresInDays * 24 * 60 * 60 * 1000
});

const register = async (req, res) => {
  const result = await authService.register(req.body);
  res.cookie("accessToken", result.token, buildCookieOptions());
  return success(res, 201, "Registration successful", { user: result.user });
};

const login = async (req, res) => {
  const result = await authService.login(req.body);
  res.cookie("accessToken", result.token, buildCookieOptions());
  return success(res, 200, "Login successful", { user: result.user });
};

const logout = async (req, res) => {
  res.clearCookie("accessToken", buildCookieOptions());
  return success(res, 200, "Logout successful");
};

module.exports = { register, login, logout };
