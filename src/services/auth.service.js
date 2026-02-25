const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiError = require("../utils/apiError");
const { signAccessToken } = require("../utils/jwt");

const createAuthPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const register = async (payload) => {
  const { adminPasscode, ...userInput } = payload;
  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(userInput.password, 12);
  const user = await User.create({
    ...userInput,
    password: hashedPassword
  });

  const token = signAccessToken({ userId: user._id, role: user.role });
  return { user: createAuthPayload(user), token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signAccessToken({ userId: user._id, role: user.role });
  return { user: createAuthPayload(user), token };
};

module.exports = { register, login };
