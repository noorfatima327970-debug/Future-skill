const express = require("express");

const {
  getFeeSettings,
  saveFeeSetting,
  deleteFeeSetting,
  getCollection,
  collectFee,
  deleteFeePayment,
  getStudentHistory,
} = require("../controllers/feeController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================================
   FEE SETTINGS
========================================= */

router.get(
  "/settings",
  protectAdmin,
  getFeeSettings
);

router.post(
  "/settings",
  protectAdmin,
  saveFeeSetting
);

router.delete(
  "/settings/:className",
  protectAdmin,
  deleteFeeSetting
);

/* =========================================
   FEE COLLECTION
========================================= */

router.get(
  "/collection",
  protectAdmin,
  getCollection
);

router.post(
  "/collect",
  protectAdmin,
  collectFee
);

router.delete(
  "/payment/:id",
  protectAdmin,
  deleteFeePayment
);

/* =========================================
   STUDENT HISTORY
========================================= */

router.get(
  "/history/:studentId",
  protectAdmin,
  getStudentHistory
);

module.exports = router;