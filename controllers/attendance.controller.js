const asyncHandler = require("../core/utils/asyncHandler");
const ApiResponse = require("../core/utils/ApiResponse");
const attendanceService = require("../services/attendance.service");
const { PARTY } = require("../constants/attendanceParties");

const teacherConfirm = asyncHandler(async (req, res) => {
  const session = await attendanceService.confirmAttendance(
    req.user,
    req.params.id,
    PARTY.TEACHER,
    req.body.status
  );
  res.status(200).json(ApiResponse.success("Class confirmed", session));
});

const studentConfirm = asyncHandler(async (req, res) => {
  const session = await attendanceService.confirmAttendance(
    req.user,
    req.params.id,
    PARTY.STUDENT,
    req.body.status
  );
  res.status(200).json(ApiResponse.success("Attendance confirmed", session));
});

const rejectSession = asyncHandler(async (req, res) => {
  const session = await attendanceService.disputeSession(req.user, req.params.id);
  res.status(200).json(ApiResponse.success("Session disputed", session));
});

const cancelSession = asyncHandler(async (req, res) => {
  const session = await attendanceService.cancelSession(req.user, req.params.id);
  res.status(200).json(ApiResponse.success("Session cancelled", session));
});

const rescheduleSession = asyncHandler(async (req, res) => {
  const session = await attendanceService.rescheduleSession(req.user, req.params.id, req.body);
  res.status(200).json(ApiResponse.success("Session rescheduled", session));
});

module.exports = {
  teacherConfirm,
  studentConfirm,
  rejectSession,
  cancelSession,
  rescheduleSession,
};
