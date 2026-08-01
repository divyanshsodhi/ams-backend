const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const {
  createExtraSessionSchema,
} = require("../validators/classSession.validator");
const { ROLES } = require("../constants/roles");
const classSessionController = require("../controllers/classSession.controller");

router.get("/", authenticate, classSessionController.getSessions);

router.post(
  "/extra",
  authenticate,
  authorize(ROLES.TEACHER),
  validate(createExtraSessionSchema),
  classSessionController.createExtraSession
);

router.post(
  "/generate/:scheduleId",
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  classSessionController.generateSessions
);

module.exports = router;
