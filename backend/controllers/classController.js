const Class = require("../models/Class");

const getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .sort({ className: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (error) {
    console.error("Get Classes Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch classes",
    });
  }
};

const getClassById = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    return res.status(200).json({
      success: true,
      class: classItem,
    });
  } catch (error) {
    console.error("Get Class Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch class",
    });
  }
};

const createClass = async (req, res) => {
  try {
    const {
      className,
      classTeacher,
      capacity,
      status,
    } = req.body;

    // section and roomNumber removed
    if (
      !className ||
      capacity === undefined ||
      capacity === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required class fields",
      });
    }

    if (Number(capacity) < 1) {
      return res.status(400).json({
        success: false,
        message: "Class capacity must be at least 1",
      });
    }

    const normalizedClassName = className.trim();

    // Duplicate check on class name only
    const existingClass = await Class.findOne({
      className: normalizedClassName,
    });

    if (existingClass) {
      return res.status(409).json({
        success: false,
        message: "This class already exists",
      });
    }

    const newClass = await Class.create({
      className: normalizedClassName,
      classTeacher: classTeacher?.trim() || "",
      capacity: Number(capacity),
      status: status || "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (error) {
    console.error("Create Class Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This class already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create class",
    });
  }
};

const updateClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const {
      className,
      classTeacher,
      capacity,
      status,
    } = req.body;

    if (className !== undefined) {
      classItem.className = className.trim();
    }

    if (classTeacher !== undefined) {
      classItem.classTeacher = classTeacher.trim();
    }

    if (capacity !== undefined && capacity !== "") {
      if (Number(capacity) < 1) {
        return res.status(400).json({
          success: false,
          message: "Class capacity must be at least 1",
        });
      }

      classItem.capacity = Number(capacity);
    }

    if (status !== undefined) {
      classItem.status = status;
    }

    // Duplicate check on class name only (excluding self)
    const duplicateClass = await Class.findOne({
      _id: { $ne: classItem._id },
      className: classItem.className,
    });

    if (duplicateClass) {
      return res.status(409).json({
        success: false,
        message: "This class already exists",
      });
    }

    await classItem.save();

    return res.status(200).json({
      success: true,
      message: "Class updated successfully",
      class: classItem,
    });
  } catch (error) {
    console.error("Update Class Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This class already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update class",
    });
  }
};

const deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    await Class.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Delete Class Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete class",
    });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};