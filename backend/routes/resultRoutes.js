const express = require("express");
const router = express.Router();

const {
  getResults,
  getExamStudents,
  createResult,
  updateResult,
  deleteResult,
} = require("../controllers/resultController");

router.get("/", getResults);
router.get("/exam/:examId/students", getExamStudents);
router.post("/", createResult);
router.put("/:id", updateResult);
router.delete("/:id", deleteResult);

module.exports = router;