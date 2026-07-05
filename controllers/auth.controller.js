const asyncHandler = require("../core/utils/asyncHandler");
const ApiResponse = require("../core/utils/ApiResponse");
const authService = require("../services/auth.service");

const registerUser = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  res.status(201).json(ApiResponse.created("User created successfully", user));
});

const loginUser = asyncHandler(async (req, res) => {
  const device = req.headers["user-agent"] || "unknown";
  const result = await authService.loginUser(req.body.identifier, req.body.password, device);
  res.status(200).json(ApiResponse.success("Login successful", result));
});

const refreshToken = asyncHandler(async (req, res) => {
  const tokens = await authService.refreshUserToken(req.body.refreshToken);
  res.status(200).json(ApiResponse.success("Tokens refreshed successfully", tokens));
});

const logoutUser = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user.userId, req.body.refreshToken);
  res.status(200).json(ApiResponse.success("Logged out successfully"));
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.userId);
  res.status(200).json(ApiResponse.success("User fetched successfully", user));
});

module.exports = { registerUser, loginUser, refreshToken, logoutUser, getMe };
