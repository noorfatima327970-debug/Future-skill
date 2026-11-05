const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    examName: { type: String, trim: true },
    examType: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    examDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, required: true },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

// same type+class+date duplicate na bane
examSchema.index({ examType: 1, className: 1, examDate: 1 }, { unique: true });

module.exports = mongoose.model("Exam", examSchema);