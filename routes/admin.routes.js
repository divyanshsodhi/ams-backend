const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { createTeacherSchema, updateTeacherSchema } = require("../validators/admin.validator");
const adminController = require("../controllers/admin.controller");

router.use(authenticate, authorize("admin"));

router.get("/teachers", adminController.getTeachers);
router.post("/teachers", validate(createTeacherSchema), adminController.createTeacher);
router.get("/teachers/:id", adminController.getTeacher);
router.put("/teachers/:id", validate(updateTeacherSchema), adminController.updateTeacher);
router.delete("/teachers/:id", adminController.deleteTeacher);

module.exports = router;
