const mongoose = require("mongoose");

const notificationTypes = [
  "upcoming_class",
  "teacher_confirmed",
  "student_confirmed",
  "class_cancelled",
  "class_rescheduled",
  "extra_class_requested",
  "session_disputed",
];

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: notificationTypes,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
