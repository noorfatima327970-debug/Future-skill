const ITCourse = require("../models/ITCourse");

const getCourses = async (req, res) => {
  try {
    const courses = await ITCourse.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, courses });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { courseName, durationMonths, totalFee, monthlyInstallment, instructor } = req.body;

    const months = Number(durationMonths);
    if (!courseName || !Number.isFinite(months) || months < 1 || totalFee === undefined) {
      return res.status(400).json({
        success: false,
        message: "Course name, duration (months, min 1) and total fee are required.",
      });
    }

    const course = await ITCourse.create({
      courseName,
      durationMonths: months,
      totalFee: Number(totalFee),
      monthlyInstallment: Number(monthlyInstallment || 0),
      instructor: instructor || "",
    });

    return res.status(201).json({ success: true, course });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const updated = await ITCourse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    return res.json({ success: true, course: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const deleted = await ITCourse.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCourses, createCourse, updateCourse, deleteCourse };