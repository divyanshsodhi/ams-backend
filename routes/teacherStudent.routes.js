const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { createStudentSchema, updateStudentSchema, assignStudentSchema } = require("../validators/teacherStudent.validator");
const { ROLES } = require("../constants/roles");
const teacherStudentController = require("../controllers/teacherStudent.controller");

router.post("/students", authenticate, authorize(ROLES.TEACHER), validate(createStudentSchema), teacherStudentController.createStudent);
router.get("/students", authenticate, authorize(ROLES.TEACHER), teacherStudentController.getStudents);
router.get("/students/:id", authenticate, authorize(ROLES.TEACHER), teacherStudentController.getStudent);
router.put("/students/:id", authenticate, authorize(ROLES.TEACHER), validate(updateStudentSchema), teacherStudentController.updateStudent);
router.delete("/students/:id", authenticate, authorize(ROLES.TEACHER), teacherStudentController.deleteStudent);

router.post("/assign-student", authenticate, authorize(ROLES.ADMIN), validate(assignStudentSchema), teacherStudentController.assignStudent);
router.get("/relationships", authenticate, authorize(ROLES.ADMIN), teacherStudentController.getRelationships);

module.exports = router;
