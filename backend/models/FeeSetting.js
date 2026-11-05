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

const feeSettingSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      unique: true,
      enum: CLASS_LIST,
    },

    monthlyFee: {
      type: Number,
      required: [true, "Monthly fee is required"],
      min: [0, "Fee cannot be negative"],
    },

    dueDay: {
      type: Number,
      required: [true, "Due day is required"],
      min: 1,
      max: 28,
    },
  },
  {
    timestamps: true,
  }
);

const FeeSetting = mongoose.model("FeeSetting", feeSettingSchema);

FeeSetting.syncIndexes().catch((error) => {
  console.error("FeeSetting index sync failed:", error.message);
});

module.exports = FeeSetting;