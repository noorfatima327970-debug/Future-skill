const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
      default: "Future Skill",
    },

    schoolAddress: {
      type: String,
      trim: true,
      default: "",
    },

    schoolPhone: {
      type: String,
      trim: true,
      default: "",
    },

    schoolEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    principalName: {
      type: String,
      trim: true,
      default: "",
    },

    currency: {
      type: String,
      trim: true,
      default: "₨",
      enum: ["₨"],
    },

    dateFormat: {
      type: String,
      enum: [
        "DD/MM/YYYY",
        "MM/DD/YYYY",
        "YYYY-MM-DD",
      ],
      default: "DD/MM/YYYY",
    },

    timezone: {
      type: String,
      trim: true,
      default: "Asia/Karachi",
    },

    attendanceLateAfterMinutes: {
      type: Number,
      min: 0,
      default: 10,
    },

    feeDueDay: {
      type: Number,
      min: 1,
      max: 31,
      default: 10,
    },

    emailNotifications: {
      type: Boolean,
      default: true,
    },

    noticeNotifications: {
      type: Boolean,
      default: true,
    },

    feeNotifications: {
      type: Boolean,
      default: true,
    },

    attendanceNotifications: {
      type: Boolean,
      default: true,
    },

    printSchoolName: {
      type: Boolean,
      default: true,
    },

    printSchoolAddress: {
      type: Boolean,
      default: true,
    },

    printSchoolPhone: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Settings",
  settingsSchema
);