const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

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

const VALID_STATUSES = ["Present", "Absent", "Leave"];

// Students module mein class "5" format mein hai,
// attendance "Class 5" format use karta hai — dono handle
const getClassVariants = (className) => {
  const stripped = String(className).replace(/^Class\s*/, "");
  return [...new Set([className, stripped])];
};

const isValidDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const isValidMonth = (value) =>
  /^\d{4}-\d{2}$/.test(String(value || ""));

// ========================================
// GET ATTENDANCE (students + saved statuses)
// GET /api/attendance?className=Class 5&date=2026-03-26
// ========================================

const getAttendance = async (req, res) => {
  try {
    const { className, date } = req.query;

    if (!className || !CLASS_LIST.includes(className)) {
      return res.status(400).json({
        success: false,
        message: "Valid class is required",
      });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required (YYYY-MM-DD)",
      });
    }

    // Students module se live students — auto appear
    const students = await Student.find({
      className: { $in: getClassVariants(className) },
    })
      .sort({ rollNo: 1, name: 1 })
      .lean();

    const saved = await Attendance.findOne({
      className,
      date,
    }).lean();

    const statusMap = {};

    if (saved) {
      saved.records.forEach((rec) => {
        statusMap[String(rec.student)] = rec.status;
      });
    }

    const list = students.map((student) => ({
      _id: student._id,
      rollNo: student.rollNo,
      name: student.name,
      fatherName: student.fatherName,
      profilePhoto: student.profilePhoto || "",
      status: statusMap[String(student._id)] || null,
    }));

    return res.status(200).json({
      success: true,
      className,
      date,
      saved: Boolean(saved),
      students: list,
    });
  } catch (error) {
    console.error("Get Attendance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
    });
  }
};

// ========================================
// SAVE ATTENDANCE (create or update)
// POST /api/attendance
// ========================================

const saveAttendance = async (req, res) => {
  try {
    const { className, date, records } = req.body;

    if (!className || !CLASS_LIST.includes(className)) {
      return res.status(400).json({
        success: false,
        message: "Valid class is required",
      });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Valid date is required (YYYY-MM-DD)",
      });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Attendance records are required",
      });
    }

    // Har record validate
    for (const rec of records) {
      if (
        !rec.student ||
        !VALID_STATUSES.includes(rec.status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each record needs a student and a valid status (Present / Absent / Leave)",
        });
      }
    }

    // Duplicate students check
    const ids = records.map((r) => String(r.student));

    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate student entries found",
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { className, date },
      {
        className,
        date,
        records: records.map((r) => ({
          student: r.student,
          status: r.status,
        })),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Attendance saved successfully",
      attendance,
    });
  } catch (error) {
    console.error("Save Attendance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save attendance",
    });
  }
};

// ========================================
// MONTHLY SUMMARY
// GET /api/attendance/summary?className=Class 5&month=2026-03
// ========================================

const getAttendanceSummary = async (req, res) => {
  try {
    const { className, month } = req.query;

    if (!className || !CLASS_LIST.includes(className)) {
      return res.status(400).json({
        success: false,
        message: "Valid class is required",
      });
    }

    if (!isValidMonth(month)) {
      return res.status(400).json({
        success: false,
        message: "Valid month is required (YYYY-MM)",
      });
    }

    const records = await Attendance.find({
      className,
      date: { $gte: `${month}-01`, $lte: `${month}-31` },
    })
      .sort({ date: 1 })
      .lean();

    // Jin dates par record hai wahi columns banenge
    const days = [...new Set(records.map((r) => r.date))].sort();

    const studentMap = {};

    records.forEach((dayRecord) => {
      dayRecord.records.forEach((rec) => {
        const key = String(rec.student);

        if (!studentMap[key]) {
          studentMap[key] = {
            statuses: {},
            present: 0,
            absent: 0,
            leave: 0,
          };
        }

        studentMap[key].statuses[dayRecord.date] = rec.status;

        if (rec.status === "Present") studentMap[key].present++;
        if (rec.status === "Absent") studentMap[key].absent++;
        if (rec.status === "Leave") studentMap[key].leave++;
      });
    });

    const studentIds = Object.keys(studentMap);

    let rows = [];

    if (studentIds.length > 0) {
      const students = await Student.find({
        _id: { $in: studentIds },
      })
        .sort({ rollNo: 1, name: 1 })
        .lean();

      rows = students.map((student) => {
        const data = studentMap[String(student._id)];
        const totalMarked =
          data.present + data.absent + data.leave;

        return {
          _id: student._id,
          rollNo: student.rollNo,
          name: student.name,
          statuses: data.statuses,
          present: data.present,
          absent: data.absent,
          leave: data.leave,
          totalMarked,
          percentage:
            totalMarked > 0
              ? Math.round((data.present / totalMarked) * 100)
              : 0,
        };
      });
    }

    return res.status(200).json({
      success: true,
      className,
      month,
      days,
      students: rows,
    });
  } catch (error) {
    console.error("Attendance Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch attendance summary",
    });
  }
};

module.exports = {
  getAttendance,
  saveAttendance,
  getAttendanceSummary,
};