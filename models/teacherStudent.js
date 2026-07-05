const mongoose = require("mongoose");

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
      default: 8,
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
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

teacherStudentSchema.index({ teacherId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("TeacherStudent", teacherStudentSchema);
