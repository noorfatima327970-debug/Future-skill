const express = require("express");

const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protectAdmin,
  getExpenses
);

router.get(
  "/:id",
  protectAdmin,
  getExpenseById
);

router.post(
  "/",
  protectAdmin,
  createExpense
);

router.put(
  "/:id",
  protectAdmin,
  updateExpense
);

router.delete(
  "/:id",
  protectAdmin,
  deleteExpense
);

module.exports = router;