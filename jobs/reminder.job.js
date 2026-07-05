const cron = require("node-cron");
const ClassSession = require("../models/classSession");
const Notification = require("../models/notification");
const logger = require("../core/logger");

const startReminderJob = () => {
  cron.schedule("*/30 * * * *", async () => {
    logger.debug("Reminder job started");

    try {
      const now = new Date();
      const reminderWindow = new Date(now.getTime() + 35 * 60 * 1000);

      const upcomingSessions = await ClassSession.find({
        classDate: {
          $gte: now,
          $lte: reminderWindow,
        },
        status: "scheduled",
      }).populate("teacherId", "fullName")
        .populate("studentId", "fullName");

      for (const session of upcomingSessions) {
        const notifications = [
          {
            recipientId: session.teacherId._id,
            title: "Upcoming Class",
            message: `Your class with ${session.studentId.fullName} starts soon`,
            type: "upcoming_class",
            metadata: { sessionId: session._id },
          },
          {
            recipientId: session.studentId._id,
            title: "Upcoming Class",
            message: `Your class with ${session.teacherId.fullName} starts soon`,
            type: "upcoming_class",
            metadata: { sessionId: session._id },
          },
        ];

        await Notification.insertMany(notifications);
      }

      if (upcomingSessions.length > 0) {
        logger.info("Reminders sent", { count: upcomingSessions.length });
      }
    } catch (error) {
      logger.error("Reminder job failed", { error: error.message });
    }
  });
};

module.exports = { startReminderJob };
