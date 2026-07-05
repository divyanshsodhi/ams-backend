const SESSION_STATUS = Object.freeze({
  SCHEDULED: "scheduled",
  PENDING_CONFIRMATION: "pending_confirmation",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RESCHEDULED: "rescheduled",
  DISPUTED: "disputed",
});

const ALL_SESSION_STATUS = Object.values(SESSION_STATUS);

module.exports = { SESSION_STATUS, ALL_SESSION_STATUS };
