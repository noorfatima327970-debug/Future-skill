const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    rollNo: {
      type: String,
      required: [true, "Roll number is required"],
      unique: true,
      trim: true,
    },

    admissionNo: {
      type: String,
      trim: true,
      default: "",
    },

    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },

    fatherName: {
      type: String,
      required: [true, "Father name is required"],
      trim: true,
    },

    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "Other"],
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    className: {
      type: String,
      required: [true, "Class is required"],
      trim: true,
      enum: [
        "Playgroup",
        "Nursery",
        "Prep",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
      ],
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    admissionDate: {
      type: Date,
      required: [true, "Admission date is required"],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    profilePhoto: {
      type: String,
      default: "",
      maxlength: [5000000, "Profile photo is too large"],
    },
  },
  {
    timestamps: true,
  }
);

// Admission No sirf tab unique hoga jab wo khali na ho.
studentSchema.index(
  { admissionNo: 1 },
  {
    name: "admissionNo_unique_when_present",
    unique: true,
    partialFilterExpression: {
      admissionNo: { $type: "string", $gt: "" },
    },
  }
);

module.exports = mongoose.model("Student", studentSchema);