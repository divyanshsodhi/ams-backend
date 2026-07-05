const asyncHandler = require("../core/utils/asyncHandler");
const ApiResponse = require("../core/utils/ApiResponse");
const scheduleService = require("../services/schedule.service");

const createSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.createSchedule(req.user, req.body);
  res.status(201).json(ApiResponse.created("Schedule created successfully", schedule));
});

const getSchedules = asyncHandler(async (req, res) => {
  const result = await scheduleService.getSchedules(req.user, req.query);
  res.status(200).json(ApiResponse.success("Schedules fetched successfully", result));
});

const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.updateSchedule(req.user, req.params.id, req.body);
  res.status(200).json(ApiResponse.success("Schedule updated successfully", schedule));
});

const deleteSchedule = asyncHandler(async (req, res) => {
  await scheduleService.deleteSchedule(req.user, req.params.id);
  res.status(200).json(ApiResponse.success("Schedule deleted successfully"));
});

const getUpcomingSchedules = asyncHandler(async (req, res) => {
  const result = await scheduleService.getUpcomingSchedules(req.user, req.query);
  res.status(200).json(ApiResponse.success("Upcoming schedules fetched successfully", result));
});

module.exports = { createSchedule, getSchedules, updateSchedule, deleteSchedule, getUpcomingSchedules };
