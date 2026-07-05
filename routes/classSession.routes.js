const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const classSessionController = require("../controllers/classSession.controller");

router.get("/", authenticate, classSessionController.getSessions);

router.post("/:id/teacher-confirm", authenticate, authorize("teacher"), classSessionController.teacherConfirm);
router.post("/:id/student-confirm", authenticate, authorize("student"), classSessionController.studentConfirm);
router.post("/:id/reject", authenticate, authorize("student"), classSessionController.rejectSession);
router.post("/:id/cancel", authenticate, authorize("teacher"), classSessionController.cancelSession);
router.post("/:id/reschedule", authenticate, authorize("teacher"), classSessionController.rescheduleSession);

router.post("/extra", authenticate, authorize("teacher"), classSessionController.createExtraSession);

router.post("/generate/:scheduleId", authenticate, authorize("teacher", "admin"), classSessionController.generateSessions);

module.exports = router;
