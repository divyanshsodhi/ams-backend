const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { createScheduleSchema, updateScheduleSchema } = require("../validators/schedule.validator");
const { ROLES } = require("../constants/roles");
const scheduleController = require("../controllers/schedule.controller");

router.post("/", authenticate, authorize(ROLES.TEACHER, ROLES.ADMIN), validate(createScheduleSchema), scheduleController.createSchedule);
router.get("/", authenticate, scheduleController.getSchedules);
router.get("/upcoming", authenticate, scheduleController.getUpcomingSchedules);
router.get("/:id", authenticate, scheduleController.getSchedule);
router.put("/:id", authenticate, authorize(ROLES.TEACHER, ROLES.ADMIN), validate(updateScheduleSchema), scheduleController.updateSchedule);
router.delete("/:id", authenticate, authorize(ROLES.TEACHER, ROLES.ADMIN), scheduleController.deleteSchedule);

module.exports = router;
