const asyncHandler = require("../core/utils/asyncHandler");
const ApiResponse = require("../core/utils/ApiResponse");
const analyticsService = require("../services/analytics.service");

const getAdminAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getAdminAnalytics();
  res.status(200).json(ApiResponse.success("Admin analytics fetched successfully", data));
});

const getTeacherAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTeacherAnalytics(req.user.userId);
  res.status(200).json(ApiResponse.success("Teacher analytics fetched successfully", data));
});

const getStudentAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getStudentAnalytics(req.user.userId);
  res.status(200).json(ApiResponse.success("Student analytics fetched successfully", data));
});

module.exports = { getAdminAnalytics, getTeacherAnalytics, getStudentAnalytics };
