const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { createScheduleSchema, updateScheduleSchema } = require("../validators/schedule.validator");
const scheduleController = require("../controllers/schedule.controller");

router.post("/", authenticate, authorize("teacher", "admin"), validate(createScheduleSchema), scheduleController.createSchedule);
router.get("/", authenticate, scheduleController.getSchedules);
router.get("/upcoming", authenticate, scheduleController.getUpcomingSchedules);
router.put("/:id", authenticate, authorize("teacher", "admin"), validate(updateScheduleSchema), scheduleController.updateSchedule);
router.delete("/:id", authenticate, authorize("teacher", "admin"), scheduleController.deleteSchedule);

module.exports = router;
