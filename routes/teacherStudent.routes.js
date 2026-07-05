const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { createStudentSchema, updateStudentSchema, assignStudentSchema } = require("../validators/teacherStudent.validator");
const teacherStudentController = require("../controllers/teacherStudent.controller");

router.post("/students", authenticate, authorize("teacher"), validate(createStudentSchema), teacherStudentController.createStudent);
router.get("/students", authenticate, authorize("teacher"), teacherStudentController.getStudents);
router.get("/students/:id", authenticate, authorize("teacher"), teacherStudentController.getStudent);
router.put("/students/:id", authenticate, authorize("teacher"), validate(updateStudentSchema), teacherStudentController.updateStudent);
router.delete("/students/:id", authenticate, authorize("teacher"), teacherStudentController.deleteStudent);

router.post("/assign-student", authenticate, authorize("admin"), validate(assignStudentSchema), teacherStudentController.assignStudent);
router.get("/relationships", authenticate, authorize("admin"), teacherStudentController.getRelationships);

module.exports = router;
