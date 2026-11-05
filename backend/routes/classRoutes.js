const express = require("express");

const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} = require("../controllers/classController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protectAdmin, getClasses);

router.get("/:id", protectAdmin, getClassById);

router.post("/", protectAdmin, createClass);

router.put("/:id", protectAdmin, updateClass);

router.delete("/:id", protectAdmin, deleteClass);

module.exports = router;