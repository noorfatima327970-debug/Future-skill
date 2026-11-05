import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiAlertCircle, FiAward, FiCheck, FiCheckCircle, FiChevronDown, FiClipboard,
  FiEdit2, FiPlus, FiPrinter, FiRefreshCw, FiSearch,
  FiTrash2, FiUser, FiUsers, FiX,
} from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/Results.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Exams.jsx ke bilkul same values taake All-Classes match ho
const CLASS_OPTIONS = [
  { value: "Playgroup", label: "Playgroup" },
  { value: "Nursery", label: "Nursery" },
  { value: "Prep", label: "Prep" },
  { value: "1", label: "Class 1" },
  { value: "2", label: "Class 2" },
  { value: "3", label: "Class 3" },
  { value: "4", label: "Class 4" },
  { value: "5", label: "Class 5" },
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
];
const CLASS_ORDER = CLASS_OPTIONS.map((c) => c.value);

const normalizeClassValue = (value) => {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^class\s+\d+$/i.test(raw)) return raw.replace(/^class\s+/i, "").trim();
  return raw;
};

const getClassLabel = (value) => {
  const n = normalizeClassValue(value);
  const f = CLASS_OPTIONS.find((c) => c.value === n);
  return f ? f.label : String(value || "-");
};

const getDateOnly = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const formatDate = (date) => {
  const only = getDateOnly(date);
  if (!only) return "-";
  const [y, m, d] = only.split("-");
  return `${d} ${MONTHS[Number(m) - 1] || m} ${y}`;
};

const getGrade = (p) => {
  if (p >= 90) return "A+";
  if (p >= 80) return "A";
  if (p >= 70) return "B";
  if (p >= 60) return "C";
  if (p >= 50) return "D";
  return "F";
};

const getRemarks = (grade) => {
  switch (grade) {
    case "A+": return "Outstanding performance! Keep up the excellent work.";
    case "A": return "Excellent result. Very well done.";
    case "B": return "Good performance. Keep improving.";
    case "C": return "Satisfactory result. More effort is needed.";
    case "D": return "Needs improvement. Work harder next time.";
    default: return "Needs serious improvement. Better preparation required.";
  }
};

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const examFromUrl = new URLSearchParams(location.search).get("examId");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(examFromUrl ? "entry" : "view");
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [examStudents, setExamStudents] = useState([]);
  const [examSubjects, setExamSubjects] = useState([]);
  const [entryClass, setEntryClass] = useState("");
  const [selectedExamId, setSelectedExamId] = useState(examFromUrl || "");
  const [subjectTotals, setSubjectTotals] = useState({});
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSingleId, setSavingSingleId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [entrySearch, setEntrySearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [printTarget, setPrintTarget] = useState(null);
  const [printExamTarget, setPrintExamTarget] = useState(null);
  const successTimerRef = useRef(null);

  const showSuccess = (msg) => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setSuccess(msg);
    successTimerRef.current = setTimeout(() => setSuccess(""), 2500);
  };

  useEffect(() => () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); }, []);

  const fetchResults = async () => {
    try {
      setLoading(true); setError("");
      const res = await axios.get(`${API_URL}/api/results`, { withCredentials: true });
      if (res.data.success) setResults(res.data.results || []);
      else setError(res.data.message || "Failed to load results.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load results. Please try again.");
    } finally { setLoading(false); }
  };

  const fetchExams = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/exams`, { withCredentials: true });
      if (res.data.success) setExams(res.data.exams || []);
    } catch { setError("Failed to load exams."); }
  };

  useEffect(() => { fetchResults(); fetchExams(); }, []);

  const selectedExam = useMemo(() => exams.find((e) => String(e._id) === String(selectedExamId)), [exams, selectedExamId]);

  useEffect(() => {
    if (examFromUrl) { setSelectedExamId(examFromUrl); setViewMode("entry"); }
  }, [examFromUrl]);

  useEffect(() => {
    if (selectedExam) setEntryClass(normalizeClassValue(selectedExam.className));
  }, [selectedExam]);

  const filteredExamsForEntry = useMemo(() => {
    if (!entryClass) return exams;
    const n = normalizeClassValue(entryClass);
    return exams.filter((e) => normalizeClassValue(e.className) === n);
  }, [exams, entryClass]);

  const fetchExamStudents = async (examId) => {
    if (!examId) { setExamStudents([]); setExamSubjects([]); setSubjectTotals({}); setMarks({}); return; }
    try {
      setStudentsLoading(true); setError("");
      const res = await axios.get(`${API_URL}/api/results/exam/${examId}/students`, { withCredentials: true });
      if (res.data.success) {
        const sData = res.data.students || [];
        const subData = res.data.subjects || [];
        setExamStudents(sData);
        setExamSubjects(subData);
        const tInit = {};
        subData.forEach((s) => {
          let found = null;
          for (const st of sData) {
            const m = st.existingResult?.subjects?.find((x) => x.subjectName === s.name);
            if (m) { found = m.totalMarks; break; }
          }
          tInit[s.name] = found !== null && found !== undefined ? String(found) : "100";
        });
        setSubjectTotals(tInit);
        const mInit = {};
        sData.forEach((st) => {
          const per = {};
          subData.forEach((s) => {
            const m = st.existingResult?.subjects?.find((x) => x.subjectName === s.name);
            per[s.name] = m ? String(m.obtainedMarks) : "";
          });
          mInit[st._id] = per;
        });
        setMarks(mInit);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load exam students.");
    } finally { setStudentsLoading(false); }
  };

  useEffect(() => { fetchExamStudents(selectedExamId); }, [selectedExamId]);

  const handleEntryClassSelect = (c) => {
    setEntryClass(c); setEntrySearch(""); setExpandedStudentId(null);
    if (selectedExam && normalizeClassValue(selectedExam.className) !== normalizeClassValue(c)) {
      setSelectedExamId(""); navigate("/results", { replace: true });
    }
  };

  const handleExamSelect = (examId) => {
    setSelectedExamId(examId); setEntrySearch(""); setExpandedStudentId(null);
    const ex = exams.find((e) => String(e._id) === String(examId));
    if (ex) setEntryClass(normalizeClassValue(ex.className));
    navigate(examId ? `/results?examId=${examId}` : "/results", { replace: true });
  };

  const computeStudent = (studentId) => {
    const per = marks[studentId] || {};
    let obt = 0, poss = 0, count = 0;
    examSubjects.forEach((s) => {
      const oStr = per[s.name], tStr = subjectTotals[s.name];
      if (oStr !== "" && oStr !== undefined && tStr !== "" && tStr !== undefined) {
        const o = Number(oStr), t = Number(tStr);
        if (Number.isFinite(o) && Number.isFinite(t) && t > 0) { obt += o; poss += t; count++; }
      }
    });
    if (count === 0 || poss === 0) return { totalObtained: 0, totalPossible: 0, percentage: null, grade: "-", status: "-" };
    const perc = Number(((obt / poss) * 100).toFixed(1));
    const pp = selectedExam?.passingPercentage ?? 40;
    return { totalObtained: obt, totalPossible: poss, percentage: perc, grade: getGrade(perc), status: perc >= pp ? "Pass" : "Fail" };
  };

  const entryProgress = useMemo(() => {
    if (examStudents.length === 0 || examSubjects.length === 0) return { done: 0, total: examStudents.length };
    const done = examStudents.filter((st) => {
      const per = marks[st._id] || {};
      return examSubjects.every((s) => per[s.name] !== "" && per[s.name] !== undefined);
    }).length;
    return { done, total: examStudents.length };
  }, [examStudents, examSubjects, marks]);

  const filteredEntryStudents = useMemo(() => {
    const q = entrySearch.trim().toLowerCase();
    if (!q) return examStudents;
    return examStudents.filter((st) => st.name?.toLowerCase().includes(q) || String(st.rollNo || "").toLowerCase().includes(q));
  }, [examStudents, entrySearch]);

  const entryPositionsMap = useMemo(() => {
    const list = examStudents.map((st) => {
      const per = marks[st._id] || {};
      let obt = 0, poss = 0, c = 0;
      examSubjects.forEach((s) => {
        const oStr = per[s.name], tStr = subjectTotals[s.name];
        if (oStr !== "" && oStr !== undefined && tStr !== "" && tStr !== undefined) {
          const o = Number(oStr), t = Number(tStr);
          if (Number.isFinite(o) && Number.isFinite(t) && t > 0) { obt += o; poss += t; c++; }
        }
      });
      return { id: String(st._id), perc: c > 0 && poss > 0 ? Number(((obt / poss) * 100).toFixed(1)) : null };
    }).filter((x) => x.perc !== null).sort((a, b) => b.perc - a.perc);
    const map = {};
    let rank = 1;
    list.forEach((item, idx) => {
      if (idx > 0 && item.perc < list[idx - 1].perc) rank = idx + 1;
      let sfx = "th";
      if (rank === 1) sfx = "st"; else if (rank === 2) sfx = "nd"; else if (rank === 3) sfx = "rd";
      map[item.id] = `${rank}${sfx}`;
    });
    return map;
  }, [examStudents, marks, subjectTotals, examSubjects]);

  const buildSubjectsArray = (studentId) => {
    const st = examStudents.find((x) => String(x._id) === String(studentId));
    const per = marks[studentId] || {};
    const entered = examSubjects.filter((s) => per[s.name] !== "" && per[s.name] !== undefined);
    if (entered.length === 0) return { error: "Enter at least one subject marks.", arr: null, student: st };
    const arr = [];
    for (const s of entered) {
      const total = Number(subjectTotals[s.name]);
      const obt = Number(per[s.name]);
      if (!Number.isFinite(total) || total < 1) return { error: `Enter valid total marks for ${s.name}.`, arr: null, student: st };
      if (!Number.isFinite(obt) || obt < 0 || obt > total) return { error: `Invalid marks for ${st.name} in ${s.name}. Must be 0-${total}.`, arr: null, student: st };
      arr.push({ subjectName: s.name, totalMarks: total, obtainedMarks: obt });
    }
    return { error: null, arr, student: st };
  };

  const saveBulkResults = async () => {
    if (!selectedExam) { setError("Please select an exam first."); return; }
    if (examSubjects.length === 0) { setError("No subjects found. Add subjects first."); return; }
    const toSave = [];
    for (const st of examStudents) {
      const r = buildSubjectsArray(String(st._id));
      if (r.error && r.arr === null && examStudents.length === 1) { setError(r.error); return; }
      if (r.arr) {
        if (r.error) { setError(r.error); return; }
        toSave.push(r);
      }
    }
    if (toSave.length === 0) { setError("Enter marks for at least one student."); return; }
    try {
      setSaving(true); setError("");
      for (const item of toSave) {
        if (item.student.existingResult) {
          await axios.put(`${API_URL}/api/results/${item.student.existingResult._id}`, { studentId: item.student._id, examId: selectedExamId, subjects: item.arr }, { withCredentials: true });
        } else {
          await axios.post(`${API_URL}/api/results`, { studentId: item.student._id, examId: selectedExamId, subjects: item.arr }, { withCredentials: true });
        }
      }
      showSuccess("Results saved successfully!");
      await fetchResults(); await fetchExamStudents(selectedExamId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save results.");
    } finally { setSaving(false); }
  };

  const saveSingleResult = async (studentId) => {
    if (!selectedExam) { setError("Please select an exam first."); return; }
    const r = buildSubjectsArray(String(studentId));
    if (r.error || !r.arr) { setError(r.error || "Enter marks first."); return; }
    try {
      setSavingSingleId(String(studentId)); setError("");
      if (r.student.existingResult) {
        await axios.put(`${API_URL}/api/results/${r.student.existingResult._id}`, { studentId: r.student._id, examId: selectedExamId, subjects: r.arr }, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/api/results`, { studentId: r.student._id, examId: selectedExamId, subjects: r.arr }, { withCredentials: true });
      }
      showSuccess(`Result saved for ${r.student.name}!`);
      await fetchResults(); await fetchExamStudents(selectedExamId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save result.");
    } finally { setSavingSingleId(null); }
  };

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    return results.filter((r) => {
      const m = !q || r.studentName?.toLowerCase().includes(q) || r.examName?.toLowerCase().includes(q) || getClassLabel(r.className)?.toLowerCase().includes(q) || r.grade?.toLowerCase().includes(q);
      return m && (!classFilter || normalizeClassValue(r.className) === normalizeClassValue(classFilter)) && (!statusFilter || r.status === statusFilter) && (!gradeFilter || r.grade === gradeFilter);
    });
  }, [results, search, classFilter, statusFilter, gradeFilter]);

  const groupedByExam = useMemo(() => {
    const g = {};
    filteredResults.forEach((r) => {
      const k = String(r.examId);
      if (!g[k]) g[k] = { examId: k, examName: r.examName, className: r.className, list: [] };
      g[k].list.push(r);
    });
    Object.values(g).forEach((x) => x.list.sort((a, b) => String(a.rollNo || a.studentName).localeCompare(String(b.rollNo || b.studentName), undefined, { numeric: true })));
    return Object.values(g).sort((a, b) => {
      const oa = CLASS_ORDER.indexOf(normalizeClassValue(a.className)), ob = CLASS_ORDER.indexOf(normalizeClassValue(b.className));
      if (oa !== ob) return oa - ob;
      return String(a.examName || "").localeCompare(String(b.examName || ""));
    });
  }, [filteredResults]);

  const positionsMap = useMemo(() => {
    const map = {}, groups = {};
    results.forEach((r) => {
      const k = String(r.examId);
      if (!groups[k]) groups[k] = [];
      groups[k].push(r);
    });
    Object.keys(groups).forEach((examId) => {
      const list = [...groups[examId]].sort((a, b) => b.percentage - a.percentage || b.totalObtained - a.totalObtained);
      let rank = 1;
      list.forEach((item, idx) => {
        if (idx > 0 && item.percentage < list[idx - 1].percentage) rank = idx + 1;
        let sfx = "th";
        if (rank === 1) sfx = "st"; else if (rank === 2) sfx = "nd"; else if (rank === 3) sfx = "rd";
        map[item._id] = `${rank}${sfx}`;
      });
    });
    return map;
  }, [results]);

  const stats = useMemo(() => {
    const total = results.length;
    const passed = results.filter((r) => r.status === "Pass").length;
    const failed = results.filter((r) => r.status === "Fail").length;
    const avg = total > 0 ? (results.reduce((s, r) => s + Number(r.percentage || 0), 0) / total).toFixed(1) : "0.0";
    return { total, passed, failed, average: avg };
  }, [results]);

  const getGradeClass = (g) => {
    if (g === "A+" || g === "A") return "grade-excellent";
    if (g === "B") return "grade-good";
    if (g === "C") return "grade-average";
    if (g === "D") return "grade-pass";
    return "grade-fail";
  };

  const handleEditInEntry = (result) => {
    setEntryClass(normalizeClassValue(result.className));
    setSelectedExamId(String(result.examId));
    setExpandedStudentId(String(result.studentId));
    setViewMode("entry");
    navigate(`/results?examId=${result.examId}`, { replace: true });
  };

  const handleDeleteResult = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/api/results/${deleteTarget._id}`, { withCredentials: true });
      setDeleteTarget(null);
      showSuccess("Result deleted!");
      await fetchResults();
      if (selectedExamId) await fetchExamStudents(selectedExamId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete result.");
    } finally { setDeleting(false); }
  };

  const triggerPrint = (title) => {
    setTimeout(() => {
      const prev = document.title;
      document.title = title;
      window.print();
      document.title = prev;
    }, 150);
  };

  const handlePrintSingle = (result) => {
    setPrintExamTarget(null);
    setPrintTarget({ ...result });
    triggerPrint(`Report_${result.studentName}_${result.examName || ""}`);
  };

  const handlePrintDraft = (studentId) => {
    const st = examStudents.find((x) => String(x._id) === String(studentId));
    if (!st || !selectedExam) return;
    const comp = computeStudent(String(studentId));
    if (comp.percentage === null) { setError("Enter marks first to print."); return; }
    const per = marks[String(studentId)] || {};
    const arr = examSubjects.filter((s) => per[s.name] !== "" && per[s.name] !== undefined)
      .map((s) => ({ subjectName: s.name, totalMarks: Number(subjectTotals[s.name]), obtainedMarks: Number(per[s.name]) }));
    setPrintExamTarget(null);
    setPrintTarget({
      studentName: st.name,
      rollNo: st.rollNo || "",
      className: selectedExam.className,
      examName: selectedExam.examName || selectedExam.examType,
      examDate: selectedExam.examDate,
      endDate: selectedExam.endDate,
      subjects: arr,
      totalObtained: comp.totalObtained,
      totalPossible: comp.totalPossible,
      percentage: comp.percentage,
      grade: comp.grade,
      status: comp.status,
      position: entryPositionsMap[String(studentId)] || "—",
    });
    triggerPrint(`Report_${st.name}_${selectedExam.examName || selectedExam.examType}`);
  };

  const handlePrintExam = (examId) => {
    const list = [...results.filter((r) => String(r.examId) === String(examId))]
      .sort((a, b) => String(a.rollNo || a.studentName).localeCompare(String(b.rollNo || b.studentName), undefined, { numeric: true }));
    if (list.length === 0) return;
    const first = list[0];
    const order = [];
    list.forEach((r) => { (r.subjects || []).forEach((s) => { if (!order.includes(s.subjectName)) order.push(s.subjectName); }); });
    setPrintTarget(null);
    setPrintExamTarget({ examId, examName: first.examName, className: first.className, list, subjects: order });
    triggerPrint(`Marksheet_${first.className}_${first.examName || ""}`);
  };

  return (
    <div className="results-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && <div className="results-sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      <main className="results-main">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="results-content">
          <div className="results-page-header">
            <div>
              <span className="results-eyebrow">ACADEMIC MANAGEMENT</span>
              <h1>Results</h1>
              <p>Select a class, open a student, enter subject marks, print full report card.</p>
            </div>
            <button type="button" className="add-result-button" onClick={() => navigate("/exams")}><FiPlus /> Add Exam</button>
          </div>

          {error && <div className="results-error" role="alert"><FiAlertCircle /><span>{error}</span><button type="button" onClick={() => setError("")}><FiX /></button></div>}
          {success && <div className="results-success" role="status"><FiCheckCircle /><span>{success}</span><button type="button" onClick={() => setSuccess("")}><FiX /></button></div>}

          <div className="results-mini-stats">
            <div className="results-mini-card"><div className="results-mini-icon total"><FiAward /></div><div><span>Total Results</span><strong>{stats.total}</strong></div></div>
            <div className="results-mini-card"><div className="results-mini-icon active-completed"><span></span></div><div><span>Passed</span><strong>{stats.passed}</strong></div></div>
            <div className="results-mini-card"><div className="results-mini-icon inactive"><span></span></div><div><span>Failed</span><strong>{stats.failed}</strong></div></div>
            <div className="results-mini-card"><div className="results-mini-icon average"><FiAward /></div><div><span>Average</span><strong>{stats.average}%</strong></div></div>
          </div>

          <section className="results-card">
            <div className="results-toolbar">
              <div className="results-view-toggle">
                <button type="button" className={viewMode === "view" ? "active" : ""} onClick={() => setViewMode("view")}><FiClipboard /> View Results</button>
                <button type="button" className={viewMode === "entry" ? "active" : ""} onClick={() => setViewMode("entry")}><FiPlus /> Result Entry</button>
              </div>
              {viewMode === "view" && (
                <div className="results-filters">
                  <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                    <option value="">All Classes</option>
                    {CLASS_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                  <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                    <option value="">All Grades</option>
                    <option value="A+">A+</option><option value="A">A</option><option value="B">B</option>
                    <option value="C">C</option><option value="D">D</option><option value="F">F</option>
                  </select>
                  <button type="button" className="refresh-results-button" onClick={() => { fetchResults(); fetchExams(); }}><FiRefreshCw /></button>
                </div>
              )}
            </div>

            <div className="results-body">
              {viewMode === "entry" && (
                <div className="results-bulk-section">
                  <div className="results-class-quick">
                    <span>Step 1 — Select Class:</span>
                    <div className="results-class-quick-buttons">
                      {CLASS_OPTIONS.map((c) => (
                        <button key={c.value} type="button" className={normalizeClassValue(entryClass) === c.value ? "active" : ""} onClick={() => handleEntryClassSelect(c.value)}>{c.label}</button>
                      ))}
                    </div>
                  </div>

                  <div className="results-bulk-header-standalone">
                    <span className="results-step-label">Step 2 — Select Exam:</span>
                    <div className="results-bulk-select">
                      <FiUsers />
                      <select value={selectedExamId} onChange={(e) => handleExamSelect(e.target.value)} disabled={!entryClass}>
                        <option value="">{entryClass ? `Select Exam for ${getClassLabel(entryClass)}` : "Select Class first"}</option>
                        {filteredExamsForEntry.map((ex) => (
                          <option key={ex._id} value={ex._id}>{ex.examName || ex.examType} — {getClassLabel(ex.className)} ({formatDate(ex.examDate)}{ex.endDate ? ` to ${formatDate(ex.endDate)}` : ""})</option>
                        ))}
                      </select>
                    </div>
                    {entryClass && filteredExamsForEntry.length === 0 && (
                      <div className="results-no-exam-hint">
                        <span>No exam found for {getClassLabel(entryClass)}.</span>
                        <button type="button" onClick={() => navigate("/exams")}>Create Exam</button>
                      </div>
                    )}
                  </div>

                  {!selectedExamId ? (
                    <div className="results-bulk-empty"><FiUsers /><p>Select a class, then select its exam. Students will appear below.</p></div>
                  ) : studentsLoading ? (
                    <div className="results-bulk-loading">Loading students...</div>
                  ) : examSubjects.length === 0 ? (
                    <div className="results-bulk-empty">
                      <FiUsers />
                      <p>{examStudents.length} students found for {selectedExam ? getClassLabel(selectedExam.className) : ""}, but no subjects. Add subjects first.</p>
                      <button type="button" className="add-result-button" onClick={() => navigate("/subjects")}>Go to Subjects</button>
                    </div>
                  ) : examStudents.length === 0 ? (
                    <div className="results-bulk-empty">
                      <FiUsers />
                      <p>No students in {selectedExam ? getClassLabel(selectedExam.className) : ""}. Add students first.</p>
                      <button type="button" className="add-result-button" onClick={() => navigate("/students")}>Go to Students</button>
                    </div>
                  ) : (
                    <>
                      {selectedExam && (
                        <div className="results-selected-exam-info">
                          <div><span>Exam Name</span><strong>{selectedExam.examName || selectedExam.examType}</strong></div>
                          <div><span>Target Class</span><strong>{getClassLabel(selectedExam.className)}</strong></div>
                          <div><span>Progress</span><strong>{entryProgress.done}/{entryProgress.total} completed</strong></div>
                          <div><span>Passing %</span><strong>{selectedExam.passingPercentage ?? 40}%</strong></div>
                        </div>
                      )}

                      <div className="results-entry-hint">Step 3 — Click a student below. All subjects, total, obtained, grade and position will open. Enter marks and Save.</div>

                      <div className="results-inner-search">
                        <FiSearch />
                        <input type="text" placeholder="Find student in this class..." value={entrySearch} onChange={(e) => setEntrySearch(e.target.value)} />
                        {entrySearch && <button type="button" onClick={() => setEntrySearch("")}><FiX /></button>}
                      </div>

                      <div className="results-entry-list">
                        {filteredEntryStudents.length === 0 ? (
                          <div className="results-no-match">No student matches {entrySearch}</div>
                        ) : filteredEntryStudents.map((st) => {
                          const sid = String(st._id);
                          const comp = computeStudent(sid);
                          const isOpen = expandedStudentId === sid;
                          const per = marks[sid] || {};
                          return (
                            <div key={st._id} className={`results-entry-student ${isOpen ? "open" : ""}`}>
                              <button type="button" className="results-entry-student-header" onClick={() => setExpandedStudentId(isOpen ? null : sid)}>
                                <div className="results-entry-student-info">
                                  <div className="results-bulk-avatar"><FiUser /></div>
                                  <div><strong>{st.name}</strong><span>Roll {st.rollNo || "-"} · {st.existingResult ? "Saved" : "Not entered"}</span></div>
                                </div>
                                <div className="results-entry-student-summary">
                                  {comp.percentage !== null ? (
                                    <>
                                      <strong>{comp.totalObtained}/{comp.totalPossible}</strong>
                                      <strong className="result-percentage">{comp.percentage}%</strong>
                                      <span className={`result-grade ${getGradeClass(comp.grade)}`}>{comp.grade}</span>
                                      <span className={`result-status ${comp.status === "Pass" ? "active" : "inactive"}`}><span></span>{comp.status}</span>
                                    </>
                                  ) : (
                                    <span className="results-entry-empty-hint">Click to enter marks</span>
                                  )}
                                  <FiChevronDown className={`results-entry-chevron ${isOpen ? "open" : ""}`} />
                                </div>
                              </button>

                              {isOpen && (
                                <div className="results-entry-detail">
                                  <div className="results-entry-subjects">
                                    {examSubjects.map((s) => (
                                      <div key={s._id || s.name} className="results-entry-subject-row">
                                        <span className="results-entry-subject-name">{s.name}</span>
                                        <div className="results-entry-inputs">
                                          <label>Total<input type="number" min="1" value={subjectTotals[s.name] ?? ""} onChange={(e) => setSubjectTotals((p) => ({ ...p, [s.name]: e.target.value }))} /></label>
                                          <label>Obtained<input type="number" min="0" max={Number(subjectTotals[s.name]) || 0} placeholder="Obt" value={per[s.name] ?? ""} onChange={(e) => setMarks((prev) => ({ ...prev, [sid]: { ...(prev[sid] || {}), [s.name]: e.target.value } }))} /></label>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="results-entry-detail-footer">
                                    <div className="results-entry-live-summary">
                                      <div><span>Total</span><strong>{comp.percentage === null ? "-" : `${comp.totalObtained}/${comp.totalPossible}`}</strong></div>
                                      <div><span>Percentage</span><strong>{comp.percentage === null ? "-" : `${comp.percentage}%`}</strong></div>
                                      <div><span>Grade</span><strong>{comp.grade}</strong></div>
                                      <div><span>Position</span><strong>{entryPositionsMap[sid] || "-"}</strong></div>
                                      <div><span>Status</span><strong>{comp.status}</strong></div>
                                    </div>
                                    <div className="results-entry-detail-actions">
                                      <button type="button" className="print-class-marksheet-btn" onClick={() => handlePrintDraft(sid)} disabled={comp.percentage === null}><FiPrinter /> Print Report</button>
                                      <button type="button" className="add-result-button" onClick={() => saveSingleResult(sid)} disabled={savingSingleId === sid || saving}>
                                        <FiCheck /> {savingSingleId === sid ? "Saving..." : "Save This Student"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="results-bulk-save-bar">
                        <button type="button" className="add-result-button" onClick={saveBulkResults} disabled={saving}>
                          <FiCheck /> {saving ? "Saving..." : "Save All Results"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {viewMode === "view" && (
                <>
                  <div className="results-inner-search">
                    <FiSearch />
                    <input type="text" placeholder="Search student or exam..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && <button type="button" onClick={() => setSearch("")}><FiX /></button>}
                  </div>

                  {loading ? (
                    <div className="results-loading"><div className="results-loader"></div><span>Loading results...</span></div>
                  ) : groupedByExam.length === 0 ? (
                    <div className="results-empty">
                      <div className="results-empty-icon"><FiAward /></div>
                      <h3>No results found</h3>
                      <p>Select Result Entry tab above to add results.</p>
                    </div>
                  ) : (
                    groupedByExam.map((group) => (
                      <div key={group.examId} className="class-group-wrapper">
                        <div className="class-group-header">
                          <div>
                            <h2>{group.examName} — {getClassLabel(group.className)}</h2>
                            <span>{group.list.length} Students recorded</span>
                          </div>
                          <button type="button" className="print-class-marksheet-btn" onClick={() => handlePrintExam(group.examId)}>
                            <FiPrinter /> Print Marksheet
                          </button>
                        </div>
                        <div className="results-table-wrapper">
                          <table className="results-table">
                            <thead><tr><th></th><th>Student</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Position</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                              {group.list.map((r) => (
                                <Fragment key={r._id}>
                                  <tr className={expandedId === r._id ? "expanded-row" : ""}>
                                    <td>
                                      <button type="button" className={`expand-btn ${expandedId === r._id ? "open" : ""}`} onClick={() => setExpandedId(expandedId === r._id ? null : r._id)} title="View subjects"><FiChevronDown /></button>
                                    </td>
                                    <td>
                                      <div className="result-student-cell">
                                        <div className="result-student-icon"><FiUser /></div>
                                        <div><strong>{r.studentName}</strong><span>Roll No: {r.rollNo || "—"}</span></div>
                                      </div>
                                    </td>
                                    <td><strong>{r.totalObtained} / {r.totalPossible}</strong></td>
                                    <td><strong className="result-percentage">{r.percentage}%</strong></td>
                                    <td><span className={`result-grade ${getGradeClass(r.grade)}`}>{r.grade}</span></td>
                                    <td><span className="position-badge">{positionsMap[r._id] || "—"}</span></td>
                                    <td><span className={`result-status ${r.status === "Pass" ? "active" : "inactive"}`}><span></span>{r.status}</span></td>
                                    <td>
                                      <div className="result-actions">
                                        <button type="button" className="result-action-btn print" onClick={() => handlePrintSingle(r)} title="Print full report card"><FiPrinter /></button>
                                        <button type="button" className="edit-result" onClick={() => handleEditInEntry(r)} title="Edit in entry"><FiEdit2 /></button>
                                        <button type="button" className="delete-result" onClick={() => setDeleteTarget(r)}><FiTrash2 /></button>
                                      </div>
                                    </td>
                                  </tr>
                                  {expandedId === r._id && (
                                    <tr className="subject-detail-row">
                                      <td colSpan={8}>
                                        <div className="subject-breakdown">
                                          {(r.subjects || []).map((s, idx) => (
                                            <div key={idx} className="subject-breakdown-item">
                                              <span>{s.subjectName}</span>
                                              <strong>{s.obtainedMarks}/{s.totalMarks}</strong>
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {deleteTarget && (
        <div className="result-modal-overlay">
          <div className="delete-modal">
            <div className="delete-icon-wrapper"><FiTrash2 /></div>
            <h2>Delete Result?</h2>
            <p>Delete full report card of <strong>{deleteTarget.studentName}</strong> for <strong>{deleteTarget.examName}</strong>?</p>
            <div className="delete-modal-actions">
              <button type="button" className="result-cancel-btn" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="confirm-delete-btn" onClick={handleDeleteResult} disabled={deleting}>{deleting ? "Deleting..." : "Delete Result"}</button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE REPORT CARD PRINT */}
      {printTarget && (
        <section className="results-print-single">
          <div className="print-report-header">
            <h1>Future Skill School & IT Institute</h1>
            <p className="print-report-subtitle">Official Student Report Card — {printTarget.examName}</p>
          </div>

          <div className="print-report-body">
            <div className="print-report-grid">
              <div><span>Student Name:</span><strong>{printTarget.studentName}</strong></div>
              <div><span>Class:</span><strong>{getClassLabel(printTarget.className)}</strong></div>
              <div><span>Roll Number:</span><strong>{printTarget.rollNo || "—"}</strong></div>
              <div><span>Class Position:</span><strong>{printTarget.position || positionsMap[printTarget._id] || "—"}</strong></div>
              {(printTarget.examDate || printTarget.endDate) && (
                <div><span>Exam Dates:</span><strong>{formatDate(printTarget.examDate)} — {formatDate(printTarget.endDate)}</strong></div>
              )}
              <div><span>Examination:</span><strong>{printTarget.examName}</strong></div>
            </div>

            <table className="print-report-table">
              <thead>
                <tr><th>Subject</th><th>Total Marks</th><th>Obtained Marks</th><th>%</th></tr>
              </thead>
              <tbody>
                {(printTarget.subjects || []).map((s, i) => (
                  <tr key={i}>
                    <td>{s.subjectName}</td>
                    <td>{s.totalMarks}</td>
                    <td>{s.obtainedMarks}</td>
                    <td>{s.totalMarks > 0 ? `${Math.round((s.obtainedMarks / s.totalMarks) * 100)}%` : "—"}</td>
                  </tr>
                ))}
                <tr className="print-total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>{printTarget.totalPossible}</strong></td>
                  <td><strong>{printTarget.totalObtained}</strong></td>
                  <td><strong>{printTarget.percentage}%</strong></td>
                </tr>
              </tbody>
            </table>

            <div className="print-report-summary">
              <div><span>Percentage</span><strong>{printTarget.percentage}%</strong></div>
              <div><span>Grade</span><strong>{printTarget.grade}</strong></div>
              <div>
                <span>Status</span>
                <strong style={{ color: printTarget.status === "Pass" ? "#39734b" : "#aa554d" }}>
                  {printTarget.status}
                </strong>
              </div>
            </div>

            <div className="print-report-remarks">
              <span>Remarks</span>
              <p>{getRemarks(printTarget.grade)}</p>
            </div>
          </div>

          <div className="print-report-signatures">
            <div><span></span><p>Class Teacher</p></div>
            <div><span></span><p>Principal</p></div>
          </div>

          <div className="print-report-footer">
            <span>Printed on: {new Date().toLocaleString("en-GB")}</span>
          </div>
        </section>
      )}

      {/* CLASS MARKSHEET PRINT */}
      {printExamTarget && (
        <section className="results-print-class">
          <div className="print-report-header">
            <h1>Future Skill School & IT Institute</h1>
            <p className="print-report-subtitle">Class Marksheet — {printExamTarget.className} — {printExamTarget.examName}</p>
          </div>
          <div className="print-report-body">
            <table className="print-report-table">
              <thead>
                <tr>
                  <th>Roll No.</th><th>Student Name</th>
                  {printExamTarget.subjects.map((s) => <th key={s}>{s}</th>)}
                  <th>Total</th><th>%</th><th>Grade</th><th>Status</th><th>Position</th>
                </tr>
              </thead>
              <tbody>
                {printExamTarget.list.map((r) => (
                  <tr key={r._id}>
                    <td>{r.rollNo || "—"}</td>
                    <td><strong>{r.studentName}</strong></td>
                    {printExamTarget.subjects.map((sName) => {
                      const m = (r.subjects || []).find((x) => x.subjectName === sName);
                      return <td key={sName}>{m ? `${m.obtainedMarks}/${m.totalMarks}` : "—"}</td>;
                    })}
                    <td><strong>{r.totalObtained}/{r.totalPossible}</strong></td>
                    <td>{r.percentage}%</td>
                    <td><strong>{r.grade}</strong></td>
                    <td style={{ color: r.status === "Pass" ? "#39734b" : "#aa554d", fontWeight: "bold" }}>{r.status}</td>
                    <td><strong>{positionsMap[r._id] || "—"}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="print-report-signatures">
            <div><span></span><p>Class Teacher</p></div>
            <div><span></span><p>Principal</p></div>
          </div>
          <div className="print-report-footer"><span>Printed on: {new Date().toLocaleString("en-GB")}</span></div>
        </section>
      )}
    </div>
  );
};

export default Results;