const Settings = require("../models/Settings");

const getDefaultSettings = () => {
  return {
    schoolName: "Future Skill",
    schoolAddress: "",
    schoolPhone: "",
    schoolEmail: "",
    principalName: "",
    currency: "₨",
    dateFormat: "DD/MM/YYYY",
    timezone: "Asia/Karachi",
    attendanceLateAfterMinutes: 10,
    feeDueDay: 10,
    emailNotifications: true,
    noticeNotifications: true,
    feeNotifications: true,
    attendanceNotifications: true,
    printSchoolName: true,
    printSchoolAddress: true,
    printSchoolPhone: true,
  };
};

/*
==================================================
GET SETTINGS
==================================================
*/

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(
        getDefaultSettings()
      );
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Get Settings Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load settings",
    });
  }
};

/*
==================================================
UPDATE SETTINGS
==================================================
*/

const updateSettings = async (req, res) => {
  try {
    const {
      schoolName,
      schoolAddress,
      schoolPhone,
      schoolEmail,
      principalName,
      currency,
      dateFormat,
      timezone,
      attendanceLateAfterMinutes,
      feeDueDay,
      emailNotifications,
      noticeNotifications,
      feeNotifications,
      attendanceNotifications,
      printSchoolName,
      printSchoolAddress,
      printSchoolPhone,
    } = req.body;

    if (!schoolName || !schoolName.trim()) {
      return res.status(400).json({
        success: false,
        message: "School name is required",
      });
    }

    if (
      attendanceLateAfterMinutes !==
        undefined &&
      (
        Number.isNaN(
          Number(attendanceLateAfterMinutes)
        ) ||
        Number(attendanceLateAfterMinutes) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Late after minutes must be 0 or greater",
      });
    }

    if (
      feeDueDay !== undefined &&
      (
        Number.isNaN(Number(feeDueDay)) ||
        Number(feeDueDay) < 1 ||
        Number(feeDueDay) > 31
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Fee due day must be between 1 and 31",
      });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(
        getDefaultSettings()
      );
    }

    settings.schoolName =
      schoolName.trim();

    settings.schoolAddress =
      schoolAddress?.trim() || "";

    settings.schoolPhone =
      schoolPhone?.trim() || "";

    settings.schoolEmail =
      schoolEmail?.trim().toLowerCase() || "";

    settings.principalName =
      principalName?.trim() || "";

    settings.currency = "₨";

    if (dateFormat) {
      settings.dateFormat =
        dateFormat;
    }

    if (timezone) {
      settings.timezone =
        timezone.trim();
    }

    if (
      attendanceLateAfterMinutes !==
      undefined
    ) {
      settings.attendanceLateAfterMinutes =
        Number(
          attendanceLateAfterMinutes
        );
    }

    if (feeDueDay !== undefined) {
      settings.feeDueDay =
        Number(feeDueDay);
    }

    if (
      emailNotifications !==
      undefined
    ) {
      settings.emailNotifications =
        Boolean(emailNotifications);
    }

    if (
      noticeNotifications !==
      undefined
    ) {
      settings.noticeNotifications =
        Boolean(noticeNotifications);
    }

    if (
      feeNotifications !==
      undefined
    ) {
      settings.feeNotifications =
        Boolean(feeNotifications);
    }

    if (
      attendanceNotifications !==
      undefined
    ) {
      settings.attendanceNotifications =
        Boolean(
          attendanceNotifications
        );
    }

    if (
      printSchoolName !==
      undefined
    ) {
      settings.printSchoolName =
        Boolean(printSchoolName);
    }

    if (
      printSchoolAddress !==
      undefined
    ) {
      settings.printSchoolAddress =
        Boolean(
          printSchoolAddress
        );
    }

    if (
      printSchoolPhone !==
      undefined
    ) {
      settings.printSchoolPhone =
        Boolean(
          printSchoolPhone
        );
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error(
      "Update Settings Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};