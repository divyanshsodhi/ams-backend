const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const {
  createStudentSchema,
  updateStudentSchema,
  assignStudentSchema,
} = require("../validators/enrollment.validator");
const { ROLES } = require("../constants/roles");
const enrollmentController = require("../controllers/enrollment.controller");

router.post(
  "/students",
  authenticate,
  authorize(ROLES.TEACHER),
  validate(createStudentSchema),
  enrollmentController.createStudent
);
router.get(
  "/students",
  authenticate,
  authorize(ROLES.TEACHER),
  enrollmentController.getStudents
);
router.get(
  "/students/:id",
  authenticate,
  authorize(ROLES.TEACHER),
  enrollmentController.getStudent
);
router.put(
  "/students/:id",
  authenticate,
  authorize(ROLES.TEACHER),
  validate(updateStudentSchema),
  enrollmentController.updateStudent
);
router.delete(
  "/students/:id",
  authenticate,
  authorize(ROLES.TEACHER),
  enrollmentController.deleteStudent
);

router.post(
  "/assign-student",
  authenticate,
  authorize(ROLES.ADMIN),
  validate(assignStudentSchema),
  enrollmentController.assignStudent
);
router.get(
  "/relationships",
  authenticate,
  authorize(ROLES.ADMIN),
  enrollmentController.getEnrollments
);

module.exports = router;
