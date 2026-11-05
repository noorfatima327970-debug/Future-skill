const mongoose = require("mongoose");

const resultSubjectSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true, trim: true },
    totalMarks: { type: Number, required: true, default: 100 },
    obtainedMarks: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },

    // Exam se copy taake View me group ho sake
    examName: { type: String, trim: true },
    examType: { type: String, trim: true },
    className: { type: String, required: true, trim: true },
    examDate: { type: String, trim: true }, // YYYY-MM-DD
    endDate: { type: String, trim: true },

    studentName: { type: String, trim: true },
    rollNo: { type: String, trim: true },

    subjects: [resultSubjectSchema],

    totalObtained: { type: Number, default: 0 },
    totalPossible: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, default: "F" },
    status: { type: String, enum: ["Pass", "Fail"], default: "Fail" },
  },
  { timestamps: true }
);

// 1 student ka 1 exam me 1 hi result
resultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Result", resultSchema);