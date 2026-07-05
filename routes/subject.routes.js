const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { createSubjectSchema, updateSubjectSchema } = require("../validators/subject.validator");
const subjectController = require("../controllers/subject.controller");

router.post("/", authenticate, authorize("admin"), validate(createSubjectSchema), subjectController.createSubject);
router.get("/", authenticate, subjectController.getSubjects);
router.get("/:id", authenticate, subjectController.getSubject);
router.put("/:id", authenticate, authorize("admin"), validate(updateSubjectSchema), subjectController.updateSubject);
router.delete("/:id", authenticate, authorize("admin"), subjectController.deleteSubject);

module.exports = router;
