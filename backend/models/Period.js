const mongoose = require("mongoose");

const periodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Period name is required"],
      trim: true,
    },

    startTime: {
      type: String,
      required: [true, "Start time is required"],
      trim: true,
    },

    endTime: {
      type: String,
      required: [true, "End time is required"],
      trim: true,
    },

    order: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Period", periodSchema);