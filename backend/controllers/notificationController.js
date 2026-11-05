const Notification = require("../models/Notification");

/*
==================================================
GET ALL NOTIFICATIONS
==================================================
*/

const getNotifications = async (req, res) => {
  try {
    const notifications =
      await Notification.find().sort({
        createdAt: -1,
      });

    const unreadCount =
      await Notification.countDocuments({
        isRead: false,
      });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Get Notifications Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load notifications",
    });
  }
};

/*
==================================================
GET SINGLE NOTIFICATION
==================================================
*/

const getNotificationById = async (
  req,
  res
) => {
  try {
    const notification =
      await Notification.findById(
        req.params.id
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(
      "Get Notification Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load notification",
    });
  }
};

/*
==================================================
CREATE NOTIFICATION
==================================================
*/

const createNotification = async (
  req,
  res
) => {
  try {
    const {
      title,
      message,
      type,
      createdBy,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Notification title is required",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Notification message is required",
      });
    }

    const notification =
      await Notification.create({
        title: title.trim(),
        message: message.trim(),
        type: type || "General",
        createdBy:
          createdBy?.trim() || "System",
      });

    return res.status(201).json({
      success: true,
      message:
        "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error(
      "Create Notification Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create notification",
    });
  }
};

/*
==================================================
MARK NOTIFICATION AS READ
==================================================
*/

const markNotificationAsRead = async (
  req,
  res
) => {
  try {
    const notification =
      await Notification.findById(
        req.params.id
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;

    await notification.save();

    return res.status(200).json({
      success: true,
      message:
        "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(
      "Mark Notification Read Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update notification",
    });
  }
};

/*
==================================================
MARK ALL NOTIFICATIONS AS READ
==================================================
*/

const markAllNotificationsAsRead =
  async (req, res) => {
    try {
      await Notification.updateMany(
        { isRead: false },
        {
          $set: {
            isRead: true,
          },
        }
      );

      return res.status(200).json({
        success: true,
        message:
          "All notifications marked as read",
      });
    } catch (error) {
      console.error(
        "Mark All Notifications Read Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update notifications",
      });
    }
  };

/*
==================================================
DELETE NOTIFICATION
==================================================
*/

const deleteNotification = async (
  req,
  res
) => {
  try {
    const notification =
      await Notification.findByIdAndDelete(
        req.params.id
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Notification deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Notification Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete notification",
    });
  }
};

module.exports = {
  getNotifications,
  getNotificationById,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};