const cron = require("node-cron");
const TeacherStudent = require("../models/teacherStudent");
const logger = require("../core/logger");

const startMonthlyResetJob = () => {
  cron.schedule("0 0 1 * *", async () => {
    logger.info("Monthly reset job started");

    try {
      const result = await TeacherStudent.updateMany(
        {},
        [
          {
            $set: {
              previousCompletedClasses: { $add: ["$previousCompletedClasses", "$completedClassesCurrentCycle"] },
              completedClassesCurrentCycle: 0,
              cycleStartDate: {
                $dateFromParts: {
                  year: { $year: new Date() },
                  month: { $month: new Date() },
                  day: 1,
                },
              },
              cycleEndDate: {
                $dateFromParts: {
                  year: { $year: new Date() },
                  month: { $add: [{ $month: new Date() }, 1] },
                  day: 0,
                  hour: 23,
                  minute: 59,
                  second: 59,
                },
              },
            },
          },
        ],
        { multi: true }
      );

      logger.info("Monthly reset completed", { modifiedCount: result.modifiedCount });
    } catch (error) {
      logger.error("Monthly reset failed", { error: error.message });
    }
  });
};

module.exports = { startMonthlyResetJob };
