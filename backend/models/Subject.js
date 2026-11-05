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

const subjectSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "Class is required"],
      trim: true,
      enum: CLASS_LIST,
    },

    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Koi unique index nahi — same subject jitni dafa chahe add ho sakta hai

const Subject = mongoose.model("Subject", subjectSchema);

// Purane unique indexes (agar database mein bache hain) ko
// automatically delete kar deta hai server start hote hi
Subject.syncIndexes().catch((error) => {
  console.error("Subject index sync failed:", error.message);
});

module.exports = Subject;