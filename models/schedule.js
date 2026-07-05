const mongoose = require("mongoose");
const { ALL_RECURRENCE_TYPES, ALL_DAYS_OF_WEEK } = require("../constants/recurrenceTypes");

const scheduleSchema = new mongoose.Schema(
  {
    teacherStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherStudent",
      required: true,
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
      required: true,
    },
    recurrenceType: {
      type: String,
      enum: ALL_RECURRENCE_TYPES,
      required: true,
    },
    daysOfWeek: [
      {
        type: String,
        enum: ALL_DAYS_OF_WEEK,
      },
    ],
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    meetingMode: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },
    meetingLink: {
      type: String,
    },
    location: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Schedule", scheduleSchema);
