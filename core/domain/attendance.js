const { SESSION_STATUS } = require("../../constants/sessionStatus");
const { ATTENDANCE_STATUS } = require("../../constants/attendance");

const { SCHEDULED, PENDING_CONFIRMATION, COMPLETED, CANCELLED, RESCHEDULED, DISPUTED } =
  SESSION_STATUS;
const { PENDING } = ATTENDANCE_STATUS;

// Once a session reaches a terminal lifecycle state it cannot be reported back
// to an in-progress state; the lifecycle always wins over party confirmations.
const LIFECYCLE_OVERRIDES = Object.freeze([CANCELLED, RESCHEDULED, DISPUTED, COMPLETED]);

/**
 * Derives the overall attendance status from the session lifecycle and the
 * per-party confirmation statuses. Rules:
 *  - A terminal lifecycle state (cancelled/rescheduled/disputed/completed) is
 *    returned as-is.
 *  - The session settles as completed once BOTH parties have reported
 *    (present or absent); per-party statuses carry the actual attendance.
 *  - If exactly one party has reported the session is pending confirmation.
 *  - Otherwise it remains scheduled.
 */
const deriveOverallStatus = ({ sessionStatus, teacherStatus, studentStatus }) => {
  if (LIFECYCLE_OVERRIDES.includes(sessionStatus)) {
    return sessionStatus;
  }

  const teacherActed = teacherStatus !== PENDING;
  const studentActed = studentStatus !== PENDING;

  if (teacherActed && studentActed) {
    return COMPLETED;
  }

  if (teacherActed || studentActed) {
    return PENDING_CONFIRMATION;
  }

  return SCHEDULED;
};

module.exports = { deriveOverallStatus };
