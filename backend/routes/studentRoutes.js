const express = require("express");

const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Get all students
router.get("/", protectAdmin, getStudents);

// Get single student
router.get("/:id", protectAdmin, getStudentById);

// Create student
router.post("/", protectAdmin, createStudent);

// Update student
router.put("/:id", protectAdmin, updateStudent);

// Delete student
router.delete("/:id", protectAdmin, deleteStudent);

module.exports = router;