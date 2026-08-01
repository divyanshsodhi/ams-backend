const NOTIFICATION_TYPES = Object.freeze({
  UPCOMING_CLASS: "upcoming_class",
  TEACHER_CONFIRMED: "teacher_confirmed",
  STUDENT_CONFIRMED: "student_confirmed",
  CLASS_CANCELLED: "class_cancelled",
  CLASS_RESCHEDULED: "class_rescheduled",
  EXTRA_CLASS_REQUESTED: "extra_class_requested",
  SESSION_DISPUTED: "session_disputed",
});

const ALL_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPES);

module.exports = { NOTIFICATION_TYPES, ALL_NOTIFICATION_TYPES };
