const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { ROLES } = require("../constants/roles");
const classSessionController = require("../controllers/classSession.controller");

router.get("/", authenticate, classSessionController.getSessions);

router.post("/:id/teacher-confirm", authenticate, authorize(ROLES.TEACHER), classSessionController.teacherConfirm);
router.post("/:id/student-confirm", authenticate, authorize(ROLES.STUDENT), classSessionController.studentConfirm);
router.post("/:id/reject", authenticate, authorize(ROLES.STUDENT), classSessionController.rejectSession);
router.post("/:id/cancel", authenticate, authorize(ROLES.TEACHER), classSessionController.cancelSession);
router.post("/:id/reschedule", authenticate, authorize(ROLES.TEACHER), classSessionController.rescheduleSession);

router.post("/extra", authenticate, authorize(ROLES.TEACHER), classSessionController.createExtraSession);

router.post("/generate/:scheduleId", authenticate, authorize(ROLES.TEACHER, ROLES.ADMIN), classSessionController.generateSessions);

module.exports = router;
