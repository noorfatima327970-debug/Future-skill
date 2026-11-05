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

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["Present", "Absent", "Leave"],
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "Class is required"],
      trim: true,
      enum: CLASS_LIST,
    },

    // "YYYY-MM-DD" string — timezone masla nahi hota
    date: {
      type: String,
      required: [true, "Date is required"],
      trim: true,
    },

    records: {
      type: [attendanceRecordSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Ek class ki ek date ka sirf ek record
attendanceSchema.index(
  { className: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);