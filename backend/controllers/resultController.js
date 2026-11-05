const Result = require("../models/Result");
const Exam = require("../models/Exam");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

const getGrade = (p) => {
  if (p >= 90) return "A+";
  if (p >= 80) return "A";
  if (p >= 70) return "B";
  if (p >= 60) return "C";
  if (p >= 50) return "D";
  return "F";
};

// "Class 1" aur "1" dono ko "1" bana do taake match ho jaye
const normalizeClassValue = (value) => {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^class\s+\d+$/i.test(raw)) return raw.replace(/^class\s+/i, "").trim();
  return raw;
};

const getStudentClass = (st) => st.className || st.class || st.classNameValue || "";
const getSubjectClass = (s) => s.className || s.class || "";

// GET /api/results
const getResults = async (req, res) => {
  try {
    const results = await Result.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/results/exam/:examId/students
// Yehi tumhare Entry ka main API hai
const getExamStudents = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found." });

    const examClassNorm = normalizeClassValue(exam.className);

    // Students: pehle saare lao, phir JS me match karo
    // taake "1" vs "Class 1" ka masla na aaye
    const allStudents = await Student.find({}).sort({ rollNo: 1, name: 1 });
    const students = allStudents.filter(
      (st) => normalizeClassValue(getStudentClass(st)) === examClassNorm
    );

    const allSubjects = await Subject.find({});
    const subjects = allSubjects.filter(
      (s) => normalizeClassValue(getSubjectClass(s)) === examClassNorm
    );

    const existingResults = await Result.find({ examId: exam._id });
    const resultMap = {};
    existingResults.forEach((r) => {
      resultMap[String(r.studentId)] = r;
    });

    const studentsWithResult = students.map((st) => ({
      _id: st._id,
      name: st.name || st.studentName || "Unnamed",
      rollNo: st.rollNo || "",
      className: getStudentClass(st),
      existingResult: resultMap[String(st._id)] || null,
    }));

    const cleanSubjects = subjects.map((s) => ({
      _id: s._id,
      name: s.name || s.subjectName || "Subject",
    }));

    return res.json({ success: true, students: studentsWithResult, subjects: cleanSubjects, exam });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const calcAndSave = async ({ studentId, examId, subjects }) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new Error("Exam not found.");

  const student = await Student.findById(studentId);
  if (!student) throw new Error("Student not found.");

  let obt = 0, poss = 0;
  const cleanSubs = (subjects || []).map((s) => {
    const t = Number(s.totalMarks) || 0;
    const o = Number(s.obtainedMarks) || 0;
    if (t < 1) throw new Error(`Enter valid total marks for ${s.subjectName}.`);
    if (o < 0 || o > t) throw new Error(`Invalid marks in ${s.subjectName}. Must be 0-${t}.`);
    obt += o; poss += t;
    return { subjectName: s.subjectName, totalMarks: t, obtainedMarks: o };
  });

  const perc = poss > 0 ? Number(((obt / poss) * 100).toFixed(1)) : 0;
  const passing = exam.passingPercentage ?? 40;

  const payload = {
    examId: exam._id,
    studentId: student._id,
    examName: exam.examName || exam.examType,
    examType: exam.examType,
    className: exam.className,
    examDate: exam.examDate,
    endDate: exam.endDate,
    studentName: student.name || student.studentName,
    rollNo: student.rollNo || "",
    subjects: cleanSubs,
    totalObtained: obt,
    totalPossible: poss,
    percentage: perc,
    grade: getGrade(perc),
    status: perc >= passing ? "Pass" : "Fail",
  };

  // upsert taake duplicate error na aaye
  const saved = await Result.findOneAndUpdate(
    { examId: exam._id, studentId: student._id },
    payload,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return saved;
};

// POST /api/results
const createResult = async (req, res) => {
  try {
    const { studentId, examId, subjects } = req.body;
    if (!studentId || !examId || !Array.isArray(subjects)) {
      return res.status(400).json({ success: false, message: "studentId, examId, subjects required." });
    }
    const saved = await calcAndSave({ studentId, examId, subjects });
    return res.status(201).json({ success: true, result: saved });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/results/:id
const updateResult = async (req, res) => {
  try {
    const old = await Result.findById(req.params.id);
    if (!old) return res.status(404).json({ success: false, message: "Result not found." });

    const studentId = req.body.studentId || old.studentId;
    const examId = req.body.examId || old.examId;
    const subjects = req.body.subjects || old.subjects;

    const saved = await calcAndSave({ studentId, examId, subjects });
    return res.json({ success: true, result: saved });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteResult = async (req, res) => {
  try {
    const d = await Result.findByIdAndDelete(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: "Result not found." });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getResults, getExamStudents, createResult, updateResult, deleteResult };