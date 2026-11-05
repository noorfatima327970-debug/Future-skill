const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 1 },
    date: { type: String, default: "" }, // YYYY-MM-DD
    note: { type: String, trim: true, default: "" },
    monthIndex: { type: Number, default: -1 }, // 0-based month slot (-1 = purani/unassigned)
  },
  { timestamps: false }
);

const itStudentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },

    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "ITCourse", required: true },
    courseName: { type: String, trim: true },
    durationMonths: { type: Number, default: 0 },

    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, required: true },   // auto: start + months

    totalFee: { type: Number, required: true, min: 0 },
    monthlyInstallment: { type: Number, min: 0, default: 0 },

    payments: [paymentSchema],
    status: { type: String, enum: ["Active", "Completed"], default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ITStudent", itStudentSchema);