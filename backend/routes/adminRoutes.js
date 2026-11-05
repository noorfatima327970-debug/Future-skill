const express = require("express");

const {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} = require("../controllers/adminController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

/*
==================================================
ADMIN PROFILE
==================================================
*/

router.get(
  "/profile",
  protectAdmin,
  getAdminProfile
);

/*
==================================================
UPDATE PROFILE
==================================================
*/

router.put(
  "/profile",
  protectAdmin,
  updateAdminProfile
);

/*
==================================================
CHANGE PASSWORD
==================================================
*/

router.put(
  "/change-password",
  protectAdmin,
  changeAdminPassword
);

module.exports = router;