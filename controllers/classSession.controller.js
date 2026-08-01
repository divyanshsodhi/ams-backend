const asyncHandler = require("../core/utils/asyncHandler");
const ApiResponse = require("../core/utils/ApiResponse");
const sessionService = require("../services/session.service");

const getSessions = asyncHandler(async (req, res) => {
  const result = await sessionService.getSessions(req.user, req.query);
  res.status(200).json(ApiResponse.success("Sessions fetched successfully", result));
});

const createExtraSession = asyncHandler(async (req, res) => {
  const session = await sessionService.createExtraSession(req.user, req.body);
  res.status(201).json(ApiResponse.created("Extra class created", session));
});

const generateSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionService.generateSessionsForSchedule(req.params.scheduleId);
  res.status(201).json(ApiResponse.created("Sessions generated successfully", sessions));
});

module.exports = { getSessions, createExtraSession, generateSessions };
