const cron = require("node-cron");
const ClassSession = require("../models/classSession");
const Notification = require("../models/notification");
const logger = require("../core/logger");
const { JOB_SCHEDULES, REMINDER_WINDOW_MINUTES } = require("../config/jobs");
const { SESSION_STATUS } = require("../constants/sessionStatus");
const { NOTIFICATION_TYPES } = require("../constants/notificationTypes");

const startReminderJob = () => {
  cron.schedule(JOB_SCHEDULES.REMINDER, async () => {
    logger.debug("Reminder job started");

    try {
      const now = new Date();
      const reminderWindow = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);

      const upcomingSessions = await ClassSession.find({
        date: {
          $gte: now,
          $lte: reminderWindow,
        },
        status: SESSION_STATUS.SCHEDULED,
      }).populate({
        path: "enrollmentId",
        populate: [
          { path: "teacherId", select: "fullName" },
          { path: "studentId", select: "fullName" },
        ],
      });

      for (const session of upcomingSessions) {
        const enrollment = session.enrollmentId;
        if (!enrollment || !enrollment.teacherId || !enrollment.studentId) {
          continue;
        }

        const notifications = [
          {
            recipientId: enrollment.teacherId._id,
            title: "Upcoming Class",
            message: `Your class with ${enrollment.studentId.fullName} starts soon`,
            type: NOTIFICATION_TYPES.UPCOMING_CLASS,
            metadata: { sessionId: session._id },
          },
          {
            recipientId: enrollment.studentId._id,
            title: "Upcoming Class",
            message: `Your class with ${enrollment.teacherId.fullName} starts soon`,
            type: NOTIFICATION_TYPES.UPCOMING_CLASS,
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
