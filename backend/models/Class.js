const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
    },

    classTeacher: {
      type: String,
      trim: true,
      default: "",
    },

    capacity: {
      type: Number,
      required: [true, "Class capacity is required"],
      min: [1, "Capacity must be at least 1"],
      default: 30,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// section removed — ab sirf className unique hai
classSchema.index(
  { className: 1 },
  { unique: true }
);

module.exports = mongoose.model("Class", classSchema);