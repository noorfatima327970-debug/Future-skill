const Timetable = require("../models/Timetable");
const Period = require("../models/Period");

const CLASS_LIST = [
  "Playgroup",
  "Nursery",
  "Prep",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

// ========================================
// GET ALL PERIODS
// ========================================

const getPeriods = async (req, res) => {
  try {
    const periods = await Period.find()
      .sort({ order: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: periods.length,
      periods,
    });
  } catch (error) {
    console.error("Get Periods Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch periods",
    });
  }
};

// ========================================
// CREATE PERIOD
// ========================================

const createPeriod = async (req, res) => {
  try {
    const { name, startTime, endTime } = req.body;

    if (!name || !name.trim() || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message:
          "Period name, start time and end time are required",
      });
    }

    const lastPeriod = await Period.findOne().sort({ order: -1 });

    const period = await Period.create({
      name: name.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      order: lastPeriod ? lastPeriod.order + 1 : 1,
    });

    return res.status(201).json({
      success: true,
      message: "Period added successfully",
      period,
    });
  } catch (error) {
    console.error("Create Period Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add period",
    });
  }
};

// ========================================
// UPDATE PERIOD
// ========================================

const updatePeriod = async (req, res) => {
  try {
    const period = await Period.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: "Period not found",
      });
    }

    const { name, startTime, endTime } = req.body;

    if (name !== undefined && name.trim()) {
      period.name = name.trim();
    }

    if (startTime !== undefined && startTime.trim()) {
      period.startTime = startTime.trim();
    }

    if (endTime !== undefined && endTime.trim()) {
      period.endTime = endTime.trim();
    }

    await period.save();

    return res.status(200).json({
      success: true,
      message: "Period updated successfully",
      period,
    });
  } catch (error) {
    console.error("Update Period Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update period",
    });
  }
};

// ========================================
// DELETE PERIOD (uske lectures bhi delete)
// ========================================

const deletePeriod = async (req, res) => {
  try {
    const period = await Period.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: "Period not found",
      });
    }

    await Timetable.deleteMany({ periodId: req.params.id });
    await Period.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Period and its lectures deleted successfully",
    });
  } catch (error) {
    console.error("Delete Period Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete period",
    });
  }
};

// ========================================
// GET TIMETABLE OF A CLASS
// ========================================

const getTimetable = async (req, res) => {
  try {
    const { className } = req.query;

    if (!className) {
      return res.status(400).json({
        success: false,
        message: "Class is required",
      });
    }

    if (!CLASS_LIST.includes(className)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class selected",
      });
    }

    let entries = await Timetable.find({ className })
      .populate("periodId")
      .lean();

    entries = entries.filter((entry) => entry.periodId);

    const dayOrder = (day) => DAYS.indexOf(day);

    entries.sort(
      (a, b) =>
        dayOrder(a.day) - dayOrder(b.day) ||
        (a.periodId?.order ?? 0) - (b.periodId?.order ?? 0)
    );

    return res.status(200).json({
      success: true,
      count: entries.length,
      className,
      entries,
    });
  } catch (error) {
    console.error("Get Timetable Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
    });
  }
};

// ========================================
// GET TIMETABLE OF A TEACHER (Teacher View)
// GET /api/timetable/teacher?teacher=Name
// ========================================

const getTeacherTimetable = async (req, res) => {
  try {
    const { teacher } = req.query;

    if (!teacher || !teacher.trim()) {
      return res.status(400).json({
        success: false,
        message: "Teacher name is required",
      });
    }

    let entries = await Timetable.find({
      teacher: teacher.trim(),
    })
      .populate("periodId")
      .lean();

    entries = entries.filter((entry) => entry.periodId);

    const dayOrder = (day) => DAYS.indexOf(day);

    entries.sort(
      (a, b) =>
        dayOrder(a.day) - dayOrder(b.day) ||
        (a.periodId?.order ?? 0) - (b.periodId?.order ?? 0)
    );

    return res.status(200).json({
      success: true,
      count: entries.length,
      teacher: teacher.trim(),
      entries,
    });
  } catch (error) {
    console.error("Get Teacher Timetable Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch teacher timetable",
    });
  }
};

// ========================================
// SAVE A SLOT — with teacher conflict detection
// POST /api/timetable
// ========================================

const saveSlot = async (req, res) => {
  try {
    const {
      className,
      day,
      periodId,
      subject,
      teacher,
      force,
    } = req.body;

    if (
      !className ||
      !day ||
      !periodId ||
      !subject ||
      !subject.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Class, day, period and subject are required",
      });
    }

    if (!CLASS_LIST.includes(className)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class selected",
      });
    }

    if (!DAYS.includes(day)) {
      return res.status(400).json({
        success: false,
        message: "Invalid day selected",
      });
    }

    const period = await Period.findById(periodId);

    if (!period) {
      return res.status(400).json({
        success: false,
        message: "Selected period does not exist",
      });
    }

    const teacherName = teacher?.trim() || "";

    // ===== TEACHER CONFLICT CHECK =====
    if (teacherName && !force) {
      const conflict = await Timetable.findOne({
        teacher: teacherName,
        day,
        periodId,
        className: { $ne: className },
      }).lean();

      if (conflict) {
        return res.status(409).json({
          success: false,
          conflict: true,
          message: `${teacherName} is already teaching ${conflict.subject} (${conflict.className}) in this period.`,
          conflictDetails: {
            className: conflict.className,
            subject: conflict.subject,
            day: conflict.day,
          },
        });
      }
    }

    const entry = await Timetable.findOneAndUpdate(
      {
        className,
        day,
        periodId,
      },
      {
        className,
        day,
        periodId,
        subject: subject.trim(),
        teacher: teacherName,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    ).populate("periodId");

    return res.status(200).json({
      success: true,
      message: "Lecture saved successfully",
      entry,
    });
  } catch (error) {
    console.error("Save Slot Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save lecture",
    });
  }
};

// ========================================
// COPY TIMETABLE (from another class)
// POST /api/timetable/copy
// ========================================

const copyTimetable = async (req, res) => {
  try {
    const { fromClass, toClass } = req.body;

    if (!fromClass || !toClass) {
      return res.status(400).json({
        success: false,
        message: "Both classes are required",
      });
    }

    if (
      !CLASS_LIST.includes(fromClass) ||
      !CLASS_LIST.includes(toClass)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid class selected",
      });
    }

    if (fromClass === toClass) {
      return res.status(400).json({
        success: false,
        message: "Select a different class to copy from",
      });
    }

    const sourceEntries = await Timetable.find({
      className: fromClass,
    }).lean();

    if (sourceEntries.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No lectures found in ${fromClass}`,
      });
    }

    let copied = 0;

    for (const item of sourceEntries) {
      await Timetable.findOneAndUpdate(
        {
          className: toClass,
          day: item.day,
          periodId: item.periodId,
        },
        {
          className: toClass,
          day: item.day,
          periodId: item.periodId,
          subject: item.subject,
          teacher: item.teacher || "",
        },
        {
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );

      copied++;
    }

    return res.status(200).json({
      success: true,
      message: `${copied} lectures copied from ${fromClass} to ${toClass}`,
      count: copied,
    });
  } catch (error) {
    console.error("Copy Timetable Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to copy timetable",
    });
  }
};

// ========================================
// RESET TIMETABLE (class ka pura data delete)
// POST /api/timetable/reset
// ========================================

const resetTimetable = async (req, res) => {
  try {
    const { className } = req.body;

    if (!className || !CLASS_LIST.includes(className)) {
      return res.status(400).json({
        success: false,
        message: "Valid class is required",
      });
    }

    const result = await Timetable.deleteMany({ className });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} lectures removed from ${className}`,
      count: result.deletedCount,
    });
  } catch (error) {
    console.error("Reset Timetable Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset timetable",
    });
  }
};

// ========================================
// DELETE A SLOT
// ========================================

const deleteSlot = async (req, res) => {
  try {
    const entry = await Timetable.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }

    await Timetable.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Lecture deleted successfully",
    });
  } catch (error) {
    console.error("Delete Slot Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete lecture",
    });
  }
};

module.exports = {
  getPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getTimetable,
  getTeacherTimetable,
  saveSlot,
  copyTimetable,
  resetTimetable,
  deleteSlot,
};