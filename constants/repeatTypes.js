const REPEAT_TYPES = Object.freeze({
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

const ALL_REPEAT_TYPES = Object.values(REPEAT_TYPES);
const ALL_DAYS_OF_WEEK = Object.values(DAYS_OF_WEEK);

module.exports = { REPEAT_TYPES, DAYS_OF_WEEK, ALL_REPEAT_TYPES, ALL_DAYS_OF_WEEK };
