const Subject = require("../models/Subject");

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

// ========================================
// GET SUBJECTS OF A CLASS
// GET /api/subjects?className=Class 1
// ========================================

const getSubjects = async (req, res) => {
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

    const subjects = await Subject.find({ className })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: subjects.length,
      className,
      subjects,
    });
  } catch (error) {
    console.error("Get Subjects Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
    });
  }
};

// ========================================
// GET SUBJECT COUNTS PER CLASS
// GET /api/subjects/counts
// ========================================

const getSubjectCounts = async (req, res) => {
  try {
    const counts = await Subject.aggregate([
      {
        $group: {
          _id: "$className",
          count: { $sum: 1 },
        },
      },
    ]);

    // Sari classes ke liye default 0
    const countsMap = {};

    CLASS_LIST.forEach((className) => {
      countsMap[className] = 0;
    });

    counts.forEach((item) => {
      if (countsMap[item._id] !== undefined) {
        countsMap[item._id] = item.count;
      }
    });

    return res.status(200).json({
      success: true,
      counts: countsMap,
    });
  } catch (error) {
    console.error("Get Subject Counts Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subject counts",
    });
  }
};

// ========================================
// ADD SUBJECT TO A CLASS
// POST /api/subjects
// ========================================

const createSubject = async (req, res) => {
  try {
    const { className, name } = req.body;

    if (!className || !name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Class and subject name are required",
      });
    }

    if (!CLASS_LIST.includes(className)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class selected",
      });
    }

    const subject = await Subject.create({
      className,
      name: name.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Subject added successfully",
      subject,
    });
  } catch (error) {
    console.error("Create Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add subject",
    });
  }
};

// ========================================
// UPDATE SUBJECT
// PUT /api/subjects/:id
// ========================================

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject name is required",
      });
    }

    subject.name = name.trim();

    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });
  } catch (error) {
    console.error("Update Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update subject",
    });
  }
};

// ========================================
// DELETE SUBJECT
// DELETE /api/subjects/:id
// ========================================

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    await Subject.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Delete Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete subject",
    });
  }
};

module.exports = {
  getSubjects,
  getSubjectCounts,
  createSubject,
  updateSubject,
  deleteSubject,
};