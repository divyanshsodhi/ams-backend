const mongoose = require("mongoose");
const { RELATIONSHIP_STATUS, DEFAULT_MONTHLY_CLASSES, ALL_RELATIONSHIP_STATUS } = require("../constants/relationshipStatus");

const teacherStudentSchema = new mongoose.Schema(
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
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    monthlyClasses: {
      type: Number,
      default: DEFAULT_MONTHLY_CLASSES,
      min: 1,
    },
    previousCompletedClasses: {
      type: Number,
      default: 0,
    },
    completedClassesCurrentCycle: {
      type: Number,
      default: 0,
    },
    cycleStartDate: {
      type: Date,
      default: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
    cycleEndDate: {
      type: Date,
      default: () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999),
    },
    status: {
      type: String,
      enum: ALL_RELATIONSHIP_STATUS,
      default: RELATIONSHIP_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

teacherStudentSchema.index({ teacherId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("TeacherStudent", teacherStudentSchema);
