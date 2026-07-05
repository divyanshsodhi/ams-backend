const mongoose = require("mongoose");
const { ALL_SESSION_TYPES } = require("../constants/sessionTypes");
const { ALL_SESSION_STATUS } = require("../constants/sessionStatus");

const classSessionSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    classDate: {
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
    sessionType: {
      type: String,
      enum: ALL_SESSION_TYPES,
      default: "regular",
    },
    teacherConfirmed: {
      type: Boolean,
      default: false,
    },
    studentConfirmed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ALL_SESSION_STATUS,
      default: "scheduled",
    },
    reason: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
    rescheduledTo: {
      date: Date,
      startTime: String,
      endTime: String,
    },
  },
  {
    timestamps: true,
  }
);

classSessionSchema.index({ teacherId: 1, classDate: -1 });
classSessionSchema.index({ studentId: 1, classDate: -1 });
classSessionSchema.index({ scheduleId: 1, classDate: 1 }, { unique: true });

module.exports = mongoose.model("ClassSession", classSessionSchema);
