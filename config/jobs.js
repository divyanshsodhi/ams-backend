const JOB_SCHEDULES = Object.freeze({
  MONTHLY_RESET: "0 0 1 * *",
  REMINDER: "*/30 * * * *",
});

const REMINDER_WINDOW_MINUTES = 35;

module.exports = { JOB_SCHEDULES, REMINDER_WINDOW_MINUTES };
