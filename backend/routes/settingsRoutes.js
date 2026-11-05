const express = require("express");

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

/*
==================================================
GET SETTINGS
==================================================
*/

router.get(
  "/",
  protectAdmin,
  getSettings
);

/*
==================================================
UPDATE SETTINGS
==================================================
*/

router.put(
  "/",
  protectAdmin,
  updateSettings
);

module.exports = router;