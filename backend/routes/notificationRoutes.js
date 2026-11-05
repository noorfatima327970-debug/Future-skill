const express = require("express");

const {
  getNotifications,
  getNotificationById,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const protectAdmin = require("../middleware/authMiddleware");

const router = express.Router();

/*
==================================================
GET ALL NOTIFICATIONS
==================================================
*/

router.get(
  "/",
  protectAdmin,
  getNotifications
);

/*
==================================================
MARK ALL AS READ
==================================================
*/

router.put(
  "/mark-all-read",
  protectAdmin,
  markAllNotificationsAsRead
);

/*
==================================================
GET SINGLE NOTIFICATION
==================================================
*/

router.get(
  "/:id",
  protectAdmin,
  getNotificationById
);

/*
==================================================
CREATE NOTIFICATION
==================================================
*/

router.post(
  "/",
  protectAdmin,
  createNotification
);

/*
==================================================
MARK ONE AS READ
==================================================
*/

router.put(
  "/:id/read",
  protectAdmin,
  markNotificationAsRead
);

/*
==================================================
DELETE NOTIFICATION
==================================================
*/

router.delete(
  "/:id",
  protectAdmin,
  deleteNotification
);

module.exports = router;