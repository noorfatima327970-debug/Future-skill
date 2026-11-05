const Exam = require("../models/Exam");

const getExams = async (req, res) => {
  try {
    // NO limit() - taake saari 13 classes aayein
    const exams = await Exam.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, exams });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createExam = async (req, res) => {
  try {
    const { examName, examType, className, examDate, endDate, status } = req.body;

    if (!examType || !className || !examDate || !endDate) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const exam = await Exam.findOneAndUpdate(
      { examType, className, examDate },
      { examName, examType, className, examDate, endDate, status },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ success: true, exam });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Exam already exists for this class/date/type." });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateExam = async (req, res) => {
  try {
    const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ success: false, message: "Exam not found." });
    return res.json({ success: true, exam: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteExam = async (req, res) => {
  try {
    const deleted = await Exam.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Exam not found." });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getExams, createExam, updateExam, deleteExam };