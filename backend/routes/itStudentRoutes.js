const express = require("express");
const router = express.Router();

const {
  getStudents, createStudent, updateStudent, setStudentStatus,
  addPayment, deletePayment, deleteStudent,
} = require("../controllers/itStudentController");

router.get("/", getStudents);
router.post("/", createStudent);
router.put("/:id", updateStudent);
router.put("/:id/status", setStudentStatus);
router.post("/:id/payments", addPayment);
router.delete("/:id/payments/:paymentId", deletePayment);
router.delete("/:id", deleteStudent);

module.exports = router;