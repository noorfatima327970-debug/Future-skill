import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiEdit2,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/Exams.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EXAM_TYPES = ["Monthly Test", "Mid Term", "Final Term", "Quiz", "Assessment", "Other"];
const EXAM_STATUSES = ["Scheduled", "Completed", "Cancelled"];

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

const emptyForm = {
  examType: "Monthly Test",
  examDate: "",
  endDate: "",
  status: "Scheduled",
};

const normalizeClassValue = (value) => {
  if (value === null || value === undefined) return "";
  const rawValue = String(value).trim();
  if (!rawValue) return "";
  if (/^class\s+\d+$/i.test(rawValue)) return rawValue.replace(/^class\s+/i, "").trim();
  return rawValue;
};

const getClassLabel = (value) => {
  const normalized = normalizeClassValue(value);
  const found = CLASS_OPTIONS.find((c) => c.value === normalized);
  return found ? found.label : normalized;
};

// Timezone safe: date ko hamesha "YYYY-MM-DD" string me rakho
const getDateOnly = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDateForInput = (date) => getDateOnly(date);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (date) => {
  const only = getDateOnly(date);
  if (!only) return "-";
  const [y, m, d] = only.split("-");
  const monthName = MONTHS[Number(m) - 1] || m;
  return `${d} ${monthName} ${y}`;
};

const getClassesText = (group) => {
  if (!group?.classes?.length) return "All Classes";
  if (group.classes.includes("All")) return "All Classes";
  if (group.classes.length >= CLASS_OPTIONS.length) return "All Classes (Playgroup to Class 10)";
  if (group.classes.length === 1) return getClassLabel(group.classes[0]);
  return `${group.classes.length} Classes`;
};

export default function Exams() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [editingGroup, setEditingGroup] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_URL}/api/exams`, { withCredentials: true });
      if (res.data?.success) setExams(res.data.exams || []);
      else setError(res.data?.message || "Failed to load exams");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Same Type + Same Dates wale exams ko aik group (aik row) bana do
  const groupedExams = useMemo(() => {
    const map = new Map();

    exams.forEach((exam) => {
      const start = getDateOnly(exam.examDate);
      const end = getDateOnly(exam.endDate);
      const key = [exam.examType || "", start, end, exam.status || ""].join("|");

      if (!map.has(key)) {
        map.set(key, {
          key,
          examType: exam.examType || "-",
          examDate: start,
          endDate: end,
          status: exam.status || "-",
          records: [],
          classes: [],
        });
      }

      const group = map.get(key);
      group.records.push(exam);

      const cls = normalizeClassValue(exam.className);
      if (cls && !group.classes.includes(cls)) group.classes.push(cls);
    });

    return Array.from(map.values());
  }, [exams]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupedExams;
    return groupedExams.filter((g) => {
      return (
        String(g.examType || "").toLowerCase().includes(q) ||
        String(g.status || "").toLowerCase().includes(q) ||
        getClassesText(g).toLowerCase().includes(q)
      );
    });
  }, [groupedExams, search]);

  // Results page kholo (wahan class select karke yehi exam mil jayega)
  const handleOpenResults = () => {
    navigate("/results");
  };

  const openAddModal = () => {
    setEditingGroup(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setForm({
      examType: group.examType || "Monthly Test",
      examDate: formatDateForInput(group.examDate),
      endDate: formatDateForInput(group.endDate),
      status: group.status || "Scheduled",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingGroup(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const buildPayload = (classValue) => ({
    examName: `${form.examType} - ${getClassLabel(classValue)}`,
    examType: form.examType,
    className: classValue,
    examDate: form.examDate,
    endDate: form.endDate,
    status: form.status,
  });

  const saveForClass = async (classValue, existingId) => {
    const payload = buildPayload(classValue);
    let res;
    if (existingId) {
      res = await axios.put(`${API_URL}/api/exams/${existingId}`, payload, {
        withCredentials: true,
      });
    } else {
      res = await axios.post(`${API_URL}/api/exams`, payload, { withCredentials: true });
    }
    if (res.data && res.data.success === false) {
      throw new Error(res.data.message || "Failed to save exam.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.examType || !form.examDate || !form.endDate) {
      setFormError("Please fill all required fields.");
      return;
    }

    if (form.endDate < form.examDate) {
      setFormError("End Date, Start Date se pehle nahi ho sakti.");
      return;
    }

    try {
      setSaving(true);

      if (editingGroup) {
        // Jo classes pehle se hain un ko update karo
        const covered = new Set();

        for (const record of editingGroup.records) {
          const cls = normalizeClassValue(record.className);

          if (cls === "All") {
            await saveForClass("All", record._id);
            CLASS_OPTIONS.forEach((c) => covered.add(c.value));
            continue;
          }

          if (!cls) continue;
          await saveForClass(cls, record._id);
          covered.add(cls);
        }

        // Jo classes reh gayi hain un ke liye naya bana do (taake ye All Classes ban jaye)
        for (const c of CLASS_OPTIONS) {
          if (!covered.has(c.value)) {
            await saveForClass(c.value, null);
          }
        }
      } else {
        // Naya exam: Playgroup se Class 10 tak sab ke liye khud banao
        for (const c of CLASS_OPTIONS) {
          const existing = exams.find(
            (ex) =>
              normalizeClassValue(ex.className) === c.value &&
              ex.examType === form.examType &&
              getDateOnly(ex.examDate) === form.examDate
          );

          if (existing?._id) {
            await saveForClass(c.value, existing._id);
          } else {
            await saveForClass(c.value, null);
          }
        }
      }

      await fetchExams();
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save exam.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (group) => {
    setDeletingGroup(group);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (saving) return;
    setDeleteModalOpen(false);
    setDeletingGroup(null);
  };

  const handleDelete = async () => {
    if (!deletingGroup?.records?.length) return;
    try {
      setSaving(true);

      for (const record of deletingGroup.records) {
        if (!record?._id) continue;
        await axios.delete(`${API_URL}/api/exams/${record._id}`, { withCredentials: true });
      }

      await fetchExams();
      closeDeleteModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete exam.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="exams-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="exams-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="exams-main">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="exams-content">
          <div className="exams-page-header">
            <div>
              <span className="exams-eyebrow">ACADEMIC MANAGEMENT</span>
              <h1>Exams</h1>
             <p>This exam will be created for all classes (Playgroup to Class 10).</p>
            </div>

            <div className="exams-header-actions">
              <button type="button" className="exams-print-button" onClick={fetchExams}>
                <FiRefreshCw /> Refresh
              </button>

              <button type="button" className="add-exam-button" onClick={openAddModal}>
                <FiPlus /> Add Exam
              </button>
            </div>
          </div>

          {error && (
            <div className="exams-error">
              <FiAlertCircle />
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Close error">
                <FiX />
              </button>
            </div>
          )}

          <section className="exams-card">
            <div className="exams-toolbar">
              <div className="exams-search">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search by exam type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="exams-table-wrapper">
              {loading ? (
                <div className="exams-loading">
                  <div className="exams-loader" />
                  <span>Loading exams...</span>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="exams-empty">
                  <div className="exams-empty-icon">
                    <FiBookOpen />
                  </div>
                  <h3>No exams found</h3>
                  <p>Add your first exam to get started.</p>
                  <button type="button" className="add-exam-button" onClick={openAddModal}>
                    <FiPlus /> Add Exam
                  </button>
                </div>
              ) : (
                <table className="exams-table">
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th style={{ width: 170 }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredGroups.map((group) => (
                      <tr key={group.key}>
                        <td>
                          <div className="exam-info">
                            <div className="exam-table-avatar">
                              <FiBookOpen />
                            </div>
                            <div>
                              <strong>{group.examType || "-"}</strong>
                              <span>{getClassesText(group)}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="exam-date-cell">
                            <FiCalendar />
                            <span>{formatDate(group.examDate)}</span>
                          </div>
                        </td>

                        <td>
                          <div className="exam-date-cell">
                            <FiCalendar />
                            <span>{formatDate(group.endDate)}</span>
                          </div>
                        </td>

                        <td>
                          <span className="pill pill-muted">{group.status || "-"}</span>
                        </td>

                        <td>
                          <div className="exam-actions">
                            <button
                              type="button"
                              className="results-exam"
                              onClick={handleOpenResults}
                              title="Open Results"
                            >
                              <FiFileText />
                            </button>

                            <button
                              type="button"
                              className="edit-exam"
                              onClick={() => openEditModal(group)}
                              title="Edit"
                            >
                              <FiEdit2 />
                            </button>

                            <button
                              type="button"
                              className="delete-exam"
                              onClick={() => openDeleteModal(group)}
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>

        {/* ADD / EDIT MODAL */}
        {modalOpen && (
          <div
            className="exam-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div className="exam-modal">
              <div className="exam-modal-header">
                <div>
                  <span>{editingGroup ? "UPDATE EXAM" : "NEW EXAM"}</span>
                  <h2>{editingGroup ? "Edit Exam" : "Add Exam"}</h2>
                  
                </div>

                <button type="button" onClick={closeModal} disabled={saving} aria-label="Close modal">
                  <FiX />
                </button>
              </div>

              <form className="exam-form" onSubmit={handleSubmit}>
                {formError && (
                  <div className="exam-form-error">
                    <FiAlertCircle />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="exam-form-grid">
                  <div className="exam-form-group">
                    <label>
                      Exam Type <span>*</span>
                    </label>
                    <select name="examType" value={form.examType} onChange={handleFormChange} disabled={saving}>
                      {EXAM_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="exam-form-group">
                    <label>Status</label>
                    <select name="status" value={form.status} onChange={handleFormChange} disabled={saving}>
                      {EXAM_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="exam-form-group">
                    <label>
                      Start Date <span>*</span>
                    </label>
                    <input type="date" name="examDate" value={form.examDate} onChange={handleFormChange} disabled={saving} />
                  </div>

                  <div className="exam-form-group">
                    <label>
                      End Date <span>*</span>
                    </label>
                    <input type="date" name="endDate" value={form.endDate} onChange={handleFormChange} disabled={saving} />
                  </div>
                </div>

                <div className="exam-modal-footer">
                  <button type="button" className="exam-cancel-btn" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>

                  <button type="submit" className="save-exam-button" disabled={saving}>
                    {saving ? "Saving..." : editingGroup ? "Update Exam" : "Save Exam"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {deleteModalOpen && deletingGroup && (
          <div
            className="exam-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDeleteModal();
            }}
          >
            <div className="delete-modal">
              <div className="delete-icon-wrapper">
                <FiTrash2 />
              </div>

              <h2>Delete Exam?</h2>
              <p>
                Are you sure you want to delete{" "}
                <strong>
                  {deletingGroup.examType} - {getClassesText(deletingGroup)}
                </strong>
                 This action cannot be undone.
                 ? It will be removed from all classes. This action cannot be undone.
              </p>

              <div className="delete-modal-actions">
                <button type="button" className="exam-cancel-btn" onClick={closeDeleteModal} disabled={saving}>
                  Cancel
                </button>

                <button type="button" className="confirm-delete-btn" onClick={handleDelete} disabled={saving}>
                  {saving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}