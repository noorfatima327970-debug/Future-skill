const express = require("express");

const {
  getPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getTimetable,
  getTeacherTimetable,
  saveSlot,
  copyTimetable,
  resetTimetable,
  deleteSlot,
} = require("../controllers/timetableController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Periods routes
router.get("/periods", protectAdmin, getPeriods);
router.post("/periods", protectAdmin, createPeriod);
router.put("/periods/:id", protectAdmin, updatePeriod);
router.delete("/periods/:id", protectAdmin, deletePeriod);

// Teacher view / copy / reset — /:id se pehle
router.get("/teacher", protectAdmin, getTeacherTimetable);
router.post("/copy", protectAdmin, copyTimetable);
router.post("/reset", protectAdmin, resetTimetable);

// Timetable slots
router.get("/", protectAdmin, getTimetable);
router.post("/", protectAdmin, saveSlot);
router.delete("/:id", protectAdmin, deleteSlot);

module.exports = router;