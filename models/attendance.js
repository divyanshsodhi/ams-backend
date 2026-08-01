const mongoose = require("mongoose");
const {
  ATTENDANCE_STATUS,
  ALL_ATTENDANCE_STATUS,
  OVERALL_STATUS,
  ALL_OVERALL_STATUS,
} = require("../constants/attendance");

// Attendance is the 1:1 confirmation record for a class session. Per-party
// statuses are the source of truth for confirmations; overallStatus is a
// derived snapshot of the session lifecycle computed by the attendance service
// (core/domain/attendance.js) so it can never be set independently.
const attendanceSchema = new mongoose.Schema(
  {
    classSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
      required: true,
      unique: true,
    },
    teacherStatus: {
      type: String,
      enum: ALL_ATTENDANCE_STATUS,
      default: ATTENDANCE_STATUS.PENDING,
    },
    studentStatus: {
      type: String,
      enum: ALL_ATTENDANCE_STATUS,
      default: ATTENDANCE_STATUS.PENDING,
    },
    overallStatus: {
      type: String,
      enum: ALL_OVERALL_STATUS,
      default: OVERALL_STATUS.SCHEDULED,
    },
    teacherConfirmedAt: {
      type: Date,
    },
    studentConfirmedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ overallStatus: 1, updatedAt: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
