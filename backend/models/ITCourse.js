const mongoose = require("mongoose");

const itCourseSchema = new mongoose.Schema(
  {
    courseName: { type: String, required: true, trim: true },
    durationMonths: { type: Number, required: true, min: 1 },
    totalFee: { type: Number, required: true, min: 0, default: 0 },
    monthlyInstallment: { type: Number, min: 0, default: 0 },
    instructor: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ITCourse", itCourseSchema);