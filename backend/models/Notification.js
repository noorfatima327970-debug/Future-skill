const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "General",
        "Student",
        "Attendance",
        "Fee",
        "Exam",
        "Result",
        "Notice",
        "System",
      ],
      default: "General",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: String,
      default: "System",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  createdAt: -1,
});

notificationSchema.index({
  isRead: 1,
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);