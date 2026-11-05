const mongoose = require("mongoose");

const EXPENSE_CATEGORIES = [
  "Teacher Salaries",
  "Electricity Bills",
  "Water Bills",
  "Building Rent",
  "Stationery",
  "Maintenance",
  "Internet Bills",
  "Furniture",
  "Other",
];

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      maxlength: [150, "Expense title cannot exceed 150 characters"],
    },

    category: {
      type: String,
      required: [true, "Expense category is required"],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: "Please select a valid expense category",
      },
    },

    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0.01, "Expense amount must be greater than zero"],
    },

    date: {
      type: Date,
      required: [true, "Expense date is required"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [
        1000,
        "Description cannot exceed 1000 characters",
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Improve expense sorting and date filtering.
expenseSchema.index({
  date: -1,
});

// Improve category-based filtering.
expenseSchema.index({
  category: 1,
});

module.exports = mongoose.model(
  "Expense",
  expenseSchema
);