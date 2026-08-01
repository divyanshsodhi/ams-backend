const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const {
  confirmAttendanceSchema,
  rescheduleSessionSchema,
} = require("../validators/attendance.validator");
const { ROLES } = require("../constants/roles");
const attendanceController = require("../controllers/attendance.controller");

router.post(
  "/:id/teacher-confirm",
  authenticate,
  authorize(ROLES.TEACHER),
  validate(confirmAttendanceSchema),
  attendanceController.teacherConfirm
);
router.post(
  "/:id/student-confirm",
  authenticate,
  authorize(ROLES.STUDENT),
  validate(confirmAttendanceSchema),
  attendanceController.studentConfirm
);
router.post(
  "/:id/reject",
  authenticate,
  authorize(ROLES.STUDENT),
  attendanceController.rejectSession
);
router.post(
  "/:id/cancel",
  authenticate,
  authorize(ROLES.TEACHER),
  attendanceController.cancelSession
);
router.post(
  "/:id/reschedule",
  authenticate,
  authorize(ROLES.TEACHER),
  validate(rescheduleSessionSchema),
  attendanceController.rescheduleSession
);

module.exports = router;
