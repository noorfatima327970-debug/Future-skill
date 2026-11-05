const mongoose = require("mongoose");

const CLASS_LIST = [
  "Playgroup",
  "Nursery",
  "Prep",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

const PAYMENT_METHODS = ["Cash", "Bank", "EasyPaisa", "JazzCash"];

const feePaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    className: {
      type: String,
      required: true,
      enum: CLASS_LIST,
    },

    // "2026-03" — kis mahine ki fee hai
    month: {
      type: String,
      required: true,
      trim: true,
    },

    // Us waqt ki class fee
    monthlyFee: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      min: 0,
      default: 0,
    },

    paidAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    method: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "Cash",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    receiptNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const FeePayment = mongoose.model("FeePayment", feePaymentSchema);

FeePayment.syncIndexes().catch((error) => {
  console.error("FeePayment index sync failed:", error.message);
});

module.exports = FeePayment;