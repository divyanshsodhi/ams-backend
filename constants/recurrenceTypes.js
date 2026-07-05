const RECURRENCE_TYPES = Object.freeze({
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
});

const DAYS_OF_WEEK = Object.freeze({
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
});

const ALL_RECURRENCE_TYPES = Object.values(RECURRENCE_TYPES);
const ALL_DAYS_OF_WEEK = Object.values(DAYS_OF_WEEK);

module.exports = { RECURRENCE_TYPES, DAYS_OF_WEEK, ALL_RECURRENCE_TYPES, ALL_DAYS_OF_WEEK };
