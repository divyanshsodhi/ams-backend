const mongoose = require("mongoose");
const {
  ENROLLMENT_STATUS,
  ALL_ENROLLMENT_STATUS,
  DEFAULT_MONTHLY_CLASSES,
  DEFAULT_EXTRA_MONTHLY_CLASSES,
} = require("../constants/enrollment");

// An enrollment is the atomic academic unit: one teacher teaches exactly one
// subject to one student. Every schedule, class session and attendance record
// hangs off this aggregate, so teacher/student/subject context is resolved
// through this reference instead of being duplicated on child collections.
const enrollmentSchema = new mongoose.Schema(
  {
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
      required: true,
    },
    monthlyClasses: {
      type: Number,
      required: true,
      min: 1,
      default: DEFAULT_MONTHLY_CLASSES,
    },
    extraMonthlyClasses: {
      type: Number,
      required: true,
      min: 0,
      default: DEFAULT_EXTRA_MONTHLY_CLASSES,
    },
    quotaEffectiveFrom: {
      type: Date,
      required: true,
      default: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
    status: {
      type: String,
      enum: ALL_ENROLLMENT_STATUS,
      default: ENROLLMENT_STATUS.ACTIVE,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
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

enrollmentSchema.index({ teacherId: 1, studentId: 1, subjectId: 1 }, { unique: true });
enrollmentSchema.index({ teacherId: 1, status: 1 });
enrollmentSchema.index({ studentId: 1, status: 1 });
enrollmentSchema.index({ subjectId: 1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
