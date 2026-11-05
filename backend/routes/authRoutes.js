
const express = require("express");

const {
  loginAdmin,
  logoutAdmin,
  getCurrentAdmin,
  getLoginConfig,
} = require("../controllers/authController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/config", getLoginConfig);
router.post("/login", loginAdmin);

// Protected routes
router.post("/logout", protectAdmin, logoutAdmin);
router.get("/me", protectAdmin, getCurrentAdmin);

module.exports = router;
