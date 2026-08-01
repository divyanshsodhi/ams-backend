const mongoose = require("mongoose");
const { REPEAT_TYPES, ALL_REPEAT_TYPES, ALL_DAYS_OF_WEEK } = require("../constants/repeatTypes");
const { DEFAULT_TIMEZONE } = require("../constants/timezone");

// A schedule is a recurring template bound to an enrollment. Teacher, student
// and subject are intentionally not duplicated here; they are always resolved
// through the enrollment reference so a schedule can never contradict its
// enrollment.
const scheduleSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    repeatType: {
      type: String,
      enum: ALL_REPEAT_TYPES,
      required: true,
    },
    daysOfWeek: {
      type: [
        {
          type: String,
          enum: ALL_DAYS_OF_WEEK,
        },
      ],
      required: true,
      validate: {
        validator: (days) => days.length > 0,
        message: "At least one day must be selected",
      },
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    timezone: {
      type: String,
      required: true,
      default: DEFAULT_TIMEZONE,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

scheduleSchema.index({ enrollmentId: 1, isActive: 1 });
scheduleSchema.index({ enrollmentId: 1, startDate: 1 });

module.exports = mongoose.model("Schedule", scheduleSchema);
