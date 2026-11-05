const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },

    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },

    className: {
      type: String,
      required: [true, "Class is required"],
      trim: true,
    },

    section: {
      type: String,
      required: [true, "Section is required"],
      trim: true,
      uppercase: true,
    },

    month: {
      type: String,
      required: [true, "Fee month is required"],
      trim: true,
    },

    totalFee: {
      type: Number,
      required: [true, "Total fee is required"],
      min: [0, "Total fee cannot be negative"],
    },

    paidAmount: {
      type: Number,
      required: [true, "Paid amount is required"],
      min: [0, "Paid amount cannot be negative"],
      default: 0,
    },

    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, "Remaining amount cannot be negative"],
    },

    // Date of the latest recorded payment.
    // Null means no payment date has been recorded.
    paymentDate: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },

    status: {
      type: String,
      enum: ["Paid", "Partial", "Unpaid", "Overdue"],
      default: "Unpaid",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// One fee record per student for each month.
feeSchema.index(
  {
    studentId: 1,
    month: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Fee", feeSchema);