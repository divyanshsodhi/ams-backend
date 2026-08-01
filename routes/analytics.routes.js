const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { ROLES } = require("../constants/roles");
const analyticsController = require("../controllers/analytics.controller");

router.get("/admin", authenticate, authorize(ROLES.ADMIN), analyticsController.getAdminAnalytics);
router.get("/teacher", authenticate, authorize(ROLES.TEACHER), analyticsController.getTeacherAnalytics);
router.get("/student", authenticate, authorize(ROLES.STUDENT), analyticsController.getStudentAnalytics);

module.exports = router;
