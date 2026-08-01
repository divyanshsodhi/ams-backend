const jwt = require("jsonwebtoken");
const config = require("../../config");

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRES_IN }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
};

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
