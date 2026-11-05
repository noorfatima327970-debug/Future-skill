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

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const timetableSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "Class is required"],
      trim: true,
      enum: CLASS_LIST,
    },

    day: {
      type: String,
      required: [true, "Day is required"],
      enum: DAYS,
    },

    periodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Period",
      required: [true, "Period is required"],
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },

    teacher: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Ek class ke ek din ke ek period mein sirf ek lecture
timetableSchema.index(
  { className: 1, day: 1, periodId: 1 },
  { unique: true }
);

const Timetable = mongoose.model("Timetable", timetableSchema);

// Index khud sync ho jata hai server start hote hi
Timetable.syncIndexes().catch((error) => {
  console.error("Timetable index sync failed:", error.message);
});

module.exports = Timetable;