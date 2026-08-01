const { SESSION_STATUS, ALL_SESSION_STATUS } = require("./sessionStatus");

const ATTENDANCE_STATUS = Object.freeze({
  PENDING: "pending",
  PRESENT: "present",
  ABSENT: "absent",
  CANCEL_REQUESTED: "cancel_requested",
  RESCHEDULE_REQUESTED: "reschedule_requested",
});

const ALL_ATTENDANCE_STATUS = Object.values(ATTENDANCE_STATUS);

// overallStatus is a derived snapshot of the session lifecycle that is kept in
// sync by the attendance service (see core/domain/attendance.js). It reuses the
// session status vocabulary so reporting can aggregate without a $lookup.
const OVERALL_STATUS = SESSION_STATUS;
const ALL_OVERALL_STATUS = ALL_SESSION_STATUS;

module.exports = {
  ATTENDANCE_STATUS,
  ALL_ATTENDANCE_STATUS,
  OVERALL_STATUS,
  ALL_OVERALL_STATUS,
};
