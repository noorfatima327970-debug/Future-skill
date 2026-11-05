const express = require("express");

const {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/teacherController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protectAdmin, getTeachers);

router.get("/:id", protectAdmin, getTeacherById);

router.post("/", protectAdmin, createTeacher);

router.put("/:id", protectAdmin, updateTeacher);

router.delete("/:id", protectAdmin, deleteTeacher);

module.exports = router;