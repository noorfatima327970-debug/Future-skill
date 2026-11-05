const express = require("express");

const {
  getAttendance,
  saveAttendance,
  getAttendanceSummary,
} = require("../controllers/attendanceController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protectAdmin, getAttendance);
router.post("/", protectAdmin, saveAttendance);
router.get("/summary", protectAdmin, getAttendanceSummary);

module.exports = router;