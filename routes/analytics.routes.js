const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const analyticsController = require("../controllers/analytics.controller");

router.get("/admin", authenticate, authorize("admin"), analyticsController.getAdminAnalytics);
router.get("/teacher", authenticate, authorize("teacher"), analyticsController.getTeacherAnalytics);
router.get("/student", authenticate, authorize("student"), analyticsController.getStudentAnalytics);

module.exports = router;
