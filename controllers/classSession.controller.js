const asyncHandler = require("../core/utils/asyncHandler");
const ApiResponse = require("../core/utils/ApiResponse");
const sessionService = require("../services/session.service");

const getSessions = asyncHandler(async (req, res) => {
  const result = await sessionService.getSessions(req.user, req.query);
  res.status(200).json(ApiResponse.success("Sessions fetched successfully", result));
});

const teacherConfirm = asyncHandler(async (req, res) => {
  const session = await sessionService.teacherConfirm(req.user.userId, req.params.id);
  res.status(200).json(ApiResponse.success("Class confirmed", session));
});

const studentConfirm = asyncHandler(async (req, res) => {
  const session = await sessionService.studentConfirm(req.user.userId, req.params.id);
  res.status(200).json(ApiResponse.success("Attendance confirmed", session));
});

const rejectSession = asyncHandler(async (req, res) => {
  const session = await sessionService.rejectSession(req.user.userId, req.params.id, req.body);
  res.status(200).json(ApiResponse.success("Session rejected", session));
});

const createExtraSession = asyncHandler(async (req, res) => {
  const session = await sessionService.createExtraSession(req.user, req.body);
  res.status(201).json(ApiResponse.created("Extra class created", session));
});

const cancelSession = asyncHandler(async (req, res) => {
  const session = await sessionService.cancelSession(req.user, req.params.id, req.body);
  res.status(200).json(ApiResponse.success("Session cancelled", session));
});

const rescheduleSession = asyncHandler(async (req, res) => {
  const session = await sessionService.rescheduleSession(req.user, req.params.id, req.body);
  res.status(200).json(ApiResponse.success("Session rescheduled", session));
});

const generateSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionService.generateSessionsForSchedule(req.params.scheduleId);
  res.status(201).json(ApiResponse.created("Sessions generated successfully", sessions));
});

module.exports = { getSessions, teacherConfirm, studentConfirm, rejectSession, createExtraSession, cancelSession, rescheduleSession, generateSessions };
