const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { createSubjectSchema, updateSubjectSchema } = require("../validators/subject.validator");
const { ROLES } = require("../constants/roles");
const subjectController = require("../controllers/subject.controller");

router.post("/", authenticate, authorize(ROLES.ADMIN), validate(createSubjectSchema), subjectController.createSubject);
router.get("/", authenticate, subjectController.getSubjects);
router.get("/:id", authenticate, subjectController.getSubject);
router.put("/:id", authenticate, authorize(ROLES.ADMIN), validate(updateSubjectSchema), subjectController.updateSubject);
router.delete("/:id", authenticate, authorize(ROLES.ADMIN), subjectController.deleteSubject);

module.exports = router;
