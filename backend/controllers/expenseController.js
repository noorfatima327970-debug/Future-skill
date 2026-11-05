const mongoose = require("mongoose");
const Expense = require("../models/Expense");

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

// ==================== VALIDATION ====================

const validateExpense = (data) => {
  const { title, category, amount, date } = data;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    !category ||
    amount === undefined ||
    amount === null ||
    amount === "" ||
    !date
  ) {
    return "Please fill all required expense fields";
  }

  if (title.trim().length > 150) {
    return "Expense title cannot exceed 150 characters";
  }

  if (!EXPENSE_CATEGORIES.includes(category)) {
    return "Please select a valid expense category";
  }

  if (
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0
  ) {
    return "Expense amount must be greater than zero";
  }

  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return "Invalid expense date";
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    return "Invalid expense date";
  }

  if (
    data.description !== undefined &&
    typeof data.description !== "string"
  ) {
    return "Invalid expense description";
  }

  if (
    data.description &&
    data.description.trim().length > 1000
  ) {
    return "Description cannot exceed 1000 characters";
  }

  return null;
};

// ==================== GET ALL EXPENSES ====================

const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .sort({
        date: -1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    console.error("Get Expenses Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch expense records",
    });
  }
};

// ==================== GET EXPENSE BY ID ====================

const getExpenseById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense record not found",
      });
    }

    return res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error("Get Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch expense record",
    });
  }
};

// ==================== CREATE EXPENSE ====================

const createExpense = async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      date,
      description,
    } = req.body;

    const validationError = validateExpense(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const expense = await Expense.create({
      title: title.trim(),
      category,
      amount: Number(amount),
      date: new Date(`${date}T00:00:00.000Z`),
      description: description?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense,
    });
  } catch (error) {
    console.error("Create Expense Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create expense",
    });
  }
};

// ==================== UPDATE EXPENSE ====================

const updateExpense = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense record not found",
      });
    }

    const {
      title,
      category,
      amount,
      date,
      description,
    } = req.body;

    const validationError = validateExpense(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    expense.title = title.trim();
    expense.category = category;
    expense.amount = Number(amount);
    expense.date = new Date(`${date}T00:00:00.000Z`);
    expense.description = description?.trim() || "";

    await expense.save();

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Update Expense Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update expense",
    });
  }
};

// ==================== DELETE EXPENSE ====================

const deleteExpense = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
    }

    const expense = await Expense.findByIdAndDelete(
      req.params.id
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete expense",
    });
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};