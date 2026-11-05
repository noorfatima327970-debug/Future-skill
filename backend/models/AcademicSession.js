const mongoose = require("mongoose");

const academicSessionSchema = new mongoose.Schema(
  {
    sessionName: {
      type: String,
      required: [true, "Session name is required"],
      trim: true,
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Completed"],
      default: "Inactive",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

academicSessionSchema.index(
  { sessionName: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "AcademicSession",
  academicSessionSchema
);