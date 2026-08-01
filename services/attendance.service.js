const ClassSession = require("../models/classSession");
const Attendance = require("../models/attendance");
const Enrollment = require("../models/enrollment");
const { NotFoundError, ValidationError } = require("../core/errors");
const { assertOwnership } = require("../core/utils/ownership");
const { deriveOverallStatus } = require("../core/domain/attendance");
const { ATTENDANCE_STATUS } = require("../constants/attendance");
const { SESSION_STATUS } = require("../constants/sessionStatus");
const { getSessionWithAttendance } = require("./session.service");

const PARTIES = Object.freeze({
  TEACHER: "teacher",
  STUDENT: "student",
});

const assertPartyOwnership = (user, enrollment, party) => {
  const ownerId = party === PARTIES.TEACHER ? enrollment.teacherId : enrollment.studentId;
  assertOwnership(ownerId, user.userId, `Not authorized to act on this session as ${party}`);
};

const loadSessionContext = async (sessionId) => {
  const session = await ClassSession.findById(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  const enrollment = await Enrollment.findById(session.enrollmentId);
  if (!enrollment) {
    throw new NotFoundError("Linked enrollment not found");
  }

  return { session, enrollment };
};

const getAttendance = async (sessionId) => {
  const attendance = await Attendance.findOne({ classSessionId: sessionId });
  if (!attendance) {
    throw new NotFoundError("Attendance record not found");
  }
  return attendance;
};

const applyOverallStatus = async (session, attendance) => {
  attendance.overallStatus = deriveOverallStatus({
    sessionStatus: session.status,
    teacherStatus: attendance.teacherStatus,
    studentStatus: attendance.studentStatus,
  });

  session.status = attendance.overallStatus;
  await Promise.all([session.save(), attendance.save()]);
};

const assertSessionNotTerminal = (session, message) => {
  if ([SESSION_STATUS.CANCELLED, SESSION_STATUS.RESCHEDULED, SESSION_STATUS.DISPUTED].includes(session.status)) {
    throw new ValidationError(message);
  }
};

const confirmAttendance = async (user, sessionId, party, status = ATTENDANCE_STATUS.PRESENT) => {
  const { session, enrollment } = await loadSessionContext(sessionId);
  assertPartyOwnership(user, enrollment, party);
  assertSessionNotTerminal(session, "This session is already settled and cannot be confirmed");

  const attendance = await getAttendance(sessionId);
  const confirmedAt = new Date();

  if (party === PARTIES.TEACHER) {
    attendance.teacherStatus = status;
    attendance.teacherConfirmedAt = confirmedAt;
  } else {
    attendance.studentStatus = status;
    attendance.studentConfirmedAt = confirmedAt;
  }

  await applyOverallStatus(session, attendance);
  return getSessionWithAttendance(sessionId);
};

const cancelSession = async (user, sessionId) => {
  const { session, enrollment } = await loadSessionContext(sessionId);
  assertPartyOwnership(user, enrollment, PARTIES.TEACHER);

  if (session.status === SESSION_STATUS.COMPLETED) {
    throw new ValidationError("Cannot cancel a completed session");
  }

  const attendance = await getAttendance(sessionId);
  attendance.teacherStatus = ATTENDANCE_STATUS.CANCEL_REQUESTED;
  session.status = SESSION_STATUS.CANCELLED;

  await applyOverallStatus(session, attendance);
  return getSessionWithAttendance(sessionId);
};

const rescheduleSession = async (user, sessionId, data) => {
  const { session, enrollment } = await loadSessionContext(sessionId);
  assertPartyOwnership(user, enrollment, PARTIES.TEACHER);

  if (session.status === SESSION_STATUS.COMPLETED) {
    throw new ValidationError("Cannot reschedule a completed session");
  }

  const attendance = await getAttendance(sessionId);

  if (data.date) session.date = data.date;
  if (data.startTime) session.startTime = data.startTime;
  if (data.endTime) session.endTime = data.endTime;

  attendance.teacherStatus = ATTENDANCE_STATUS.RESCHEDULE_REQUESTED;
  session.status = SESSION_STATUS.RESCHEDULED;

  await applyOverallStatus(session, attendance);
  return getSessionWithAttendance(sessionId);
};

const disputeSession = async (user, sessionId) => {
  const { session, enrollment } = await loadSessionContext(sessionId);
  assertPartyOwnership(user, enrollment, PARTIES.STUDENT);

  if (![SESSION_STATUS.SCHEDULED, SESSION_STATUS.PENDING_CONFIRMATION, SESSION_STATUS.COMPLETED].includes(session.status)) {
    throw new ValidationError("This session cannot be disputed in its current state");
  }

  const attendance = await getAttendance(sessionId);
  session.status = SESSION_STATUS.DISPUTED;

  await applyOverallStatus(session, attendance);
  return getSessionWithAttendance(sessionId);
};

module.exports = {
  confirmAttendance,
  cancelSession,
  rescheduleSession,
  disputeSession,
};
