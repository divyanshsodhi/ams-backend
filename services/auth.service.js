const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { ConflictError, AuthenticationError, NotFoundError } = require("../core/errors");

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

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

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

  const data = {
    username: userData.username,
    fullName: userData.fullName,
    email: userData.email,
    password: hashedPassword,
    country: userData.country,
    countryCode: userData.countryCode,
    phoneNumber: userData.phoneNumber,
    age: userData.age,
    role: userData.role,
  };

  if (userData.role !== "admin") {
    data.subjects = userData.subjects || [];
  }

  const user = await User.create(data);
  const createdUser = await User.findById(user._id).select("-password -refreshTokens");

  return createdUser;
};

const loginUser = async (identifier, password, device = "unknown") => {
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() },
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

  const userData = await User.findById(user._id).select("-password -refreshTokens");

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

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.mustChangePassword = false;
  await user.save();

  const userData = await User.findById(user._id).select("-password -refreshTokens");
  return userData;
};

const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password -refreshTokens");
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  changePassword,
  getMe,
};
