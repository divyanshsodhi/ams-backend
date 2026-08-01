const mongoose = require("mongoose");
const { SESSION_STATUS, ALL_SESSION_STATUS } = require("../constants/sessionStatus");
const { MEETING_PROVIDERS, ALL_MEETING_PROVIDERS } = require("../constants/meetingProviders");

// Meeting details live on the concrete session so each occurrence can carry its
// own join link/credentials. The provider enum keeps future integrations
// (e.g. Zoom) additive without schema churn.
const meetingSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ALL_MEETING_PROVIDERS,
      default: MEETING_PROVIDERS.NONE,
    },
    meetingId: {
      type: String,
      trim: true,
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// A class session is one concrete occurrence of a class. It always points at an
// enrollment (its academic context) and, for recurring classes, at the schedule
// template that generated it. Extra classes simply omit scheduleId.
const classSessionSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    meeting: {
      type: meetingSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ALL_SESSION_STATUS,
      default: SESSION_STATUS.SCHEDULED,
    },
    // Populated by the actor for manually created sessions; null for
    // job-generated occurrences.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

classSessionSchema.index({ enrollmentId: 1, date: -1 });
classSessionSchema.index({ scheduleId: 1, date: 1 }, { unique: true, sparse: true });
classSessionSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model("ClassSession", classSessionSchema);
