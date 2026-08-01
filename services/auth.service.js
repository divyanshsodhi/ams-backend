const bcrypt = require("bcrypt");
const User = require("../models/user");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../core/utils/jwt");
const { hashPassword } = require("../core/utils/hashPassword");
const { USER_SAFE_PROJECTION } = require("../core/utils/projections");
const { ConflictError, AuthenticationError, NotFoundError } = require("../core/errors");
const { ROLES } = require("../constants/roles");
const { USER_DEFAULTS } = require("../constants/userDefaults");

const registerUser = async (userData) => {
  const existingUser = await User.findOne({
    $or: [
      { email: userData.email },
      { username: userData.username },
    ],
  });

  if (existingUser) {
    throw new ConflictError("User already exists");
  }

  const data = {
    username: userData.username,
    fullName: userData.fullName,
    email: userData.email,
    password: await hashPassword(userData.password),
    country: userData.country,
    countryCode: userData.countryCode,
    phoneNumber: userData.phoneNumber,
    age: userData.age,
    role: userData.role,
  };

  if (userData.role !== ROLES.ADMIN) {
    data.subjects = userData.subjects || [];
  }

  const user = await User.create(data);
  return User.findById(user._id).select(USER_SAFE_PROJECTION);
};

const loginUser = async (identifier, password, device = USER_DEFAULTS.DEVICE) => {
  const normalizedIdentifier = identifier.toLowerCase();
  const user = await User.findOne({
    $or: [
      { email: normalizedIdentifier },
      { username: normalizedIdentifier },
    ],
  });

  if (!user) {
    throw new AuthenticationError("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid credentials");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokens.push({ token: refreshToken, device });
  await user.save();

  const userData = await User.findById(user._id).select(USER_SAFE_PROJECTION);

  return { user: userData, accessToken, refreshToken, mustChangePassword: user.mustChangePassword };
};

const refreshUserToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw new AuthenticationError("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const storedToken = user.refreshTokens.find((rt) => rt.token === token);
  if (!storedToken) {
    throw new AuthenticationError("Refresh token not recognized. Please login again");
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== token);
  user.refreshTokens.push({ token: newRefreshToken, device: storedToken.device });
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logoutUser = async (userId, token) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== token);
  await user.save();
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError("Current password is incorrect");
  }

  user.password = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();

  return User.findById(user._id).select(USER_SAFE_PROJECTION);
};

const getMe = async (userId) => {
  const user = await User.findById(userId).select(USER_SAFE_PROJECTION);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  changePassword,
  getMe,
};
