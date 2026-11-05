const express = require("express");

const {
  getAcademicSessions,
  getActiveAcademicSession,
  getAcademicSessionById,
  createAcademicSession,
  updateAcademicSession,
  deleteAcademicSession,
} = require("../controllers/academicSessionController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protectAdmin,
  getAcademicSessions
);

router.get(
  "/active",
  protectAdmin,
  getActiveAcademicSession
);

router.get(
  "/:id",
  protectAdmin,
  getAcademicSessionById
);

router.post(
  "/",
  protectAdmin,
  createAcademicSession
);

router.put(
  "/:id",
  protectAdmin,
  updateAcademicSession
);

router.delete(
  "/:id",
  protectAdmin,
  deleteAcademicSession
);

module.exports = router;