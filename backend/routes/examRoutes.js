const express = require("express");
const router = express.Router();

const {
  getExams,
  createExam,
  updateExam,
  deleteExam,
} = require("../controllers/examController");

router.get("/", getExams);
router.post("/", createExam);
router.put("/:id", updateExam);
router.delete("/:id", deleteExam);

// YE LINE SAB SE ZAROORI HAI - isi ke baghair server.js:92 error aata hai
module.exports = router;