import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiClipboard,
  FiPrinter,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/Attendance.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

const STATUSES = ["Present", "Absent", "Leave"];

const STATUS_SHORT = {
  Present: "P",
  Absent: "A",
  Leave: "L",
};

const todayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().split("T")[0];
};

const currentMonth = () => todayString().slice(0, 7);

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0]?.charAt(0).toUpperCase() || "S";
  }

  return `${parts[0]?.charAt(0) || ""}${
    parts[parts.length - 1]?.charAt(0) || ""
  }`.toUpperCase();
};

const formatDay = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

const formatDayLong = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const Attendance = () => {
  const [viewMode, setViewMode] = useState("mark"); // "mark" | "history"

  // Mark view
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(todayString());
  const [students, setStudents] = useState([]);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Student search
  const [studentSearch, setStudentSearch] = useState("");

  // History view
  const [historyClass, setHistoryClass] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [summaryDays, setSummaryDays] = useState([]);
  const [summaryStudents, setSummaryStudents] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Dropdowns
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const successTimerRef = useRef(null);
  const dropdownRef = useRef(null);
  const historyDropdownRef = useRef(null);

  // ========================================
  // SUCCESS FLASH
  // ========================================

  const showSuccess = (message) => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }

    setSuccess(message);

    successTimerRef.current = setTimeout(() => {
      setSuccess("");
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // ========================================
  // DROPDOWNS — outside click / Esc close
  // ========================================

  useEffect(() => {
    if (!isDropdownOpen) return;

    const onOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") setIsDropdownOpen(false);
    };

    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isHistoryDropdownOpen) return;

    const onOutside = (event) => {
      if (
        historyDropdownRef.current &&
        !historyDropdownRef.current.contains(event.target)
      ) {
        setIsHistoryDropdownOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape")
        setIsHistoryDropdownOpen(false);
    };

    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isHistoryDropdownOpen]);

  // ========================================
  // RESET on changes
  // ========================================

  useEffect(() => {
    setError("");
    setSuccess("");
    setHasChanges(false);
    setStudentSearch("");
  }, [selectedClass, date, viewMode, historyClass, month]);

  // ========================================
  // FETCH MARK VIEW
  // ========================================

  const fetchAttendance = async () => {
    if (!selectedClass || !date) {
      setStudents([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/attendance?className=${encodeURIComponent(
          selectedClass
        )}&date=${date}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setStudents(response.data.students || []);
        setAlreadySaved(Boolean(response.data.saved));
        setHasChanges(false);
      } else {
        setError(
          response.data.message || "Failed to load students."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load students. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "mark") {
      fetchAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedClass, date]);

  // ========================================
  // FETCH HISTORY VIEW
  // ========================================

  const fetchSummary = async () => {
    if (!historyClass || !month) {
      setSummaryDays([]);
      setSummaryStudents([]);
      return;
    }

    try {
      setSummaryLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/attendance/summary?className=${encodeURIComponent(
          historyClass
        )}&month=${month}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setSummaryDays(response.data.days || []);
        setSummaryStudents(response.data.students || []);
      } else {
        setError(
          response.data.message || "Failed to load summary."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load summary. Please try again."
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "history") {
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, historyClass, month]);

  // ========================================
  // STATUS HANDLING
  // ========================================

  const setStatus = (studentId, status) => {
    setStudents((previous) =>
      previous.map((student) =>
        student._id === studentId
          ? { ...student, status }
          : student
      )
    );

    setHasChanges(true);
  };

  const markAllPresent = () => {
    setStudents((previous) =>
      previous.map((student) => ({
        ...student,
        status: "Present",
      }))
    );

    setHasChanges(true);
  };

  // ========================================
  // LIVE STATS
  // ========================================

  const stats = useMemo(() => {
    return students.reduce(
      (acc, student) => {
        if (student.status === "Present") acc.present++;
        else if (student.status === "Absent") acc.absent++;
        else if (student.status === "Leave") acc.leave++;
        else acc.unmarked++;

        return acc;
      },
      { present: 0, absent: 0, leave: 0, unmarked: 0 }
    );
  }, [students]);

  const markedCount = students.length - stats.unmarked;

  const allMarked =
    students.length > 0 && markedCount === students.length;

  // ========================================
  // FILTERED STUDENTS (search)
  // ========================================

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    if (!query) return students;

    return students.filter(
      (student) =>
        student.name?.toLowerCase().includes(query) ||
        String(student.rollNo || "")
          .toLowerCase()
          .includes(query)
    );
  }, [students, studentSearch]);

  // ========================================
  // SAVE
  // ========================================

  const handleSave = async () => {
    if (saving) return;

    if (!allMarked) {
      setError("Mark every student before saving.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/api/attendance`,
        {
          className: selectedClass,
          date,
          records: students.map((student) => ({
            student: student._id,
            status: student.status,
          })),
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setAlreadySaved(true);
        setHasChanges(false);

        showSuccess("Attendance saved!");
      } else {
        setError(
          response.data.message ||
            "Failed to save attendance."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save attendance. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // PRINT DAILY SHEET
  // ========================================

  const handlePrint = () => {
    const previousTitle = document.title;

    document.title = `Attendance — ${selectedClass} — ${date}`;

    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };

    window.addEventListener("afterprint", restoreTitle);
    window.print();
  };

  // ========================================
  // SUMMARY STATS
  // ========================================

  const summaryTotals = useMemo(() => {
    return summaryStudents.reduce(
      (acc, student) => ({
        present: acc.present + student.present,
        absent: acc.absent + student.absent,
        leave: acc.leave + student.leave,
      }),
      { present: 0, absent: 0, leave: 0 }
    );
  }, [summaryStudents]);

  return (
    <div className="attendance-layout">
      <Sidebar />

      <div className="attendance-main">
        <Topbar />

        <main className="attendance-content">
          <div className="attendance-page-header">
            <div>
              <span className="attendance-eyebrow">
                ATTENDANCE MANAGEMENT
              </span>

              <h1>Attendance</h1>

              <p>
                Mark daily student attendance class-wise and
                review monthly history.
              </p>
            </div>
          </div>

          <section className="attendance-card">
            {/* TOOLBAR */}
            <div className="attendance-toolbar">
              <div className="attendance-view-toggle">
                <button
                  type="button"
                  className={viewMode === "mark" ? "active" : ""}
                  onClick={() => setViewMode("mark")}
                >
                  <FiCheck />
                  Mark
                </button>

                <button
                  type="button"
                  className={
                    viewMode === "history" ? "active" : ""
                  }
                  onClick={() => setViewMode("history")}
                >
                  <FiClipboard />
                  History
                </button>
              </div>

              {viewMode === "mark" ? (
                <div className="attendance-mark-controls">
                  {/* CLASS DROPDOWN */}
                  <div
                    className={`attendance-dropdown ${
                      isDropdownOpen ? "open" : ""
                    }`}
                    ref={dropdownRef}
                  >
                    <button
                      type="button"
                      className="attendance-dropdown-trigger"
                      onClick={() =>
                        setIsDropdownOpen((open) => !open)
                      }
                      aria-haspopup="listbox"
                      aria-expanded={isDropdownOpen}
                    >
                      <FiUsers className="attendance-dropdown-icon" />

                      <span
                        className={
                          selectedClass
                            ? "has-value"
                            : "placeholder"
                        }
                      >
                        {selectedClass ||
                          "Select Class — Playgroup to 10"}
                      </span>

                      {selectedClass && (
                        <span
                          role="button"
                          tabIndex={0}
                          className="attendance-dropdown-clear"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedClass("");
                            setIsDropdownOpen(false);
                          }}
                          aria-label="Clear class"
                          title="Clear selection"
                        >
                          <FiX />
                        </span>
                      )}

                      <FiChevronDown
                        className={`attendance-dropdown-arrow ${
                          isDropdownOpen ? "rotated" : ""
                        }`}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div
                        className="attendance-dropdown-menu"
                        role="listbox"
                      >
                        {CLASS_LIST.map((className) => (
                          <button
                            key={className}
                            type="button"
                            role="option"
                            aria-selected={
                              selectedClass === className
                            }
                            className={`attendance-dropdown-option ${
                              selectedClass === className
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedClass(className);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <span className="option-name">
                              {className}
                            </span>

                            {selectedClass === className && (
                              <FiCheck className="option-check" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* DATE */}
                  <div className="attendance-date">
                    <FiCalendar />

                    <input
                      type="date"
                      value={date}
                      max={todayString()}
                      onChange={(event) =>
                        setDate(event.target.value)
                      }
                      aria-label="Attendance date"
                    />
                  </div>
                </div>
              ) : (
                <div className="attendance-mark-controls">
                  {/* HISTORY CLASS DROPDOWN */}
                  <div
                    className={`attendance-dropdown ${
                      isHistoryDropdownOpen ? "open" : ""
                    }`}
                    ref={historyDropdownRef}
                  >
                    <button
                      type="button"
                      className="attendance-dropdown-trigger"
                      onClick={() =>
                        setIsHistoryDropdownOpen(
                          (open) => !open
                        )
                      }
                      aria-haspopup="listbox"
                      aria-expanded={isHistoryDropdownOpen}
                    >
                      <FiUsers className="attendance-dropdown-icon" />

                      <span
                        className={
                          historyClass
                            ? "has-value"
                            : "placeholder"
                        }
                      >
                        {historyClass ||
                          "Select Class — Playgroup to 10"}
                      </span>

                      {historyClass && (
                        <span
                          role="button"
                          tabIndex={0}
                          className="attendance-dropdown-clear"
                          onClick={(event) => {
                            event.stopPropagation();
                            setHistoryClass("");
                            setIsHistoryDropdownOpen(false);
                          }}
                          aria-label="Clear class"
                          title="Clear selection"
                        >
                          <FiX />
                        </span>
                      )}

                      <FiChevronDown
                        className={`attendance-dropdown-arrow ${
                          isHistoryDropdownOpen
                            ? "rotated"
                            : ""
                        }`}
                      />
                    </button>

                    {isHistoryDropdownOpen && (
                      <div
                        className="attendance-dropdown-menu"
                        role="listbox"
                      >
                        {CLASS_LIST.map((className) => (
                          <button
                            key={className}
                            type="button"
                            role="option"
                            aria-selected={
                              historyClass === className
                            }
                            className={`attendance-dropdown-option ${
                              historyClass === className
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              setHistoryClass(className);
                              setIsHistoryDropdownOpen(false);
                            }}
                          >
                            <span className="option-name">
                              {className}
                            </span>

                            {historyClass === className && (
                              <FiCheck className="option-check" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* MONTH */}
                  <div className="attendance-date">
                    <FiCalendar />

                    <input
                      type="month"
                      value={month}
                      onChange={(event) =>
                        setMonth(event.target.value)
                      }
                      aria-label="Month"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* MESSAGES */}
            {error && (
              <div className="attendance-error" role="alert">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss"
                >
                  <FiX />
                </button>
              </div>
            )}

            {success && (
              <div className="attendance-success" role="status">
                <FiCheck />
                <span>{success}</span>
              </div>
            )}

            <div className="attendance-body">
              {/* ============ MARK VIEW ============ */}
              {viewMode === "mark" &&
                (!selectedClass ? (
                  <div className="attendance-empty">
                    <div className="attendance-empty-icon">
                      <FiUsers />
                    </div>

                    <h3>No Class Selected</h3>

                    <p>
                      Choose a class and date to mark
                      attendance. Students added in the
                      Students module appear here
                      automatically.
                    </p>

                    <div className="attendance-quick-classes">
                      {CLASS_LIST.map((className) => (
                        <button
                          key={className}
                          type="button"
                          onClick={() =>
                            setSelectedClass(className)
                          }
                        >
                          {className}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : loading ? (
                  <div className="attendance-list">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className="attendance-row-skeleton"
                      ></div>
                    ))}
                  </div>
                ) : students.length === 0 ? (
                  <div className="attendance-empty small">
                    <div className="attendance-empty-icon">
                      <FiUsers />
                    </div>

                    <h3>No Students Found</h3>

                    <p>
                      No students in{" "}
                      <strong>{selectedClass}</strong> yet —
                      add students in the Students module and
                      they will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* ============ STATS CARDS ============ */}
                    <div className="attendance-stats">
                      <div className="attendance-stat-card present">
                        <span className="stat-dot"></span>

                        <div>
                          <span>Present</span>

                          <strong>{stats.present}</strong>
                        </div>
                      </div>

                      <div className="attendance-stat-card absent">
                        <span className="stat-dot"></span>

                        <div>
                          <span>Absent</span>

                          <strong>{stats.absent}</strong>
                        </div>
                      </div>

                      <div className="attendance-stat-card leave">
                        <span className="stat-dot"></span>

                        <div>
                          <span>Leave</span>

                          <strong>{stats.leave}</strong>
                        </div>
                      </div>

                      <div className="attendance-stat-card unmarked">
                        <span className="stat-dot"></span>

                        <div>
                          <span>Unmarked</span>

                          <strong>{stats.unmarked}</strong>
                        </div>
                      </div>
                    </div>

                    {/* MARK HEADER */}
                    <div className="attendance-list-header">
                      <div className="attendance-count-info">
                        <strong>{selectedClass}</strong>

                        <span>
                          {formatDay(date)}
                          {" — "}
                          {markedCount}/{students.length}{" "}
                          marked
                        </span>

                        {alreadySaved && (
                          <span className="saved-badge">
                            Saved
                          </span>
                        )}
                      </div>

                      <div className="attendance-list-actions">
                        {/* SEARCH */}
                        <div className="attendance-search">
                          <FiSearch />

                          <input
                            type="text"
                            placeholder="Find student..."
                            value={studentSearch}
                            onChange={(event) =>
                              setStudentSearch(
                                event.target.value
                              )
                            }
                          />

                          {studentSearch && (
                            <button
                              type="button"
                              onClick={() =>
                                setStudentSearch("")
                              }
                              aria-label="Clear search"
                            >
                              <FiX />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          className="attendance-all-present"
                          onClick={markAllPresent}
                        >
                          Mark All Present
                        </button>

                        <button
                          type="button"
                          className="attendance-refresh"
                          onClick={fetchAttendance}
                          disabled={loading}
                          aria-label="Refresh"
                        >
                          <FiRefreshCw
                            className={loading ? "spin" : ""}
                          />
                        </button>
                      </div>
                    </div>

                    {/* STUDENT LIST */}
                    <div className="attendance-list">
                      {filteredStudents.length === 0 ? (
                        <div className="attendance-search-empty">
                          No student matches "
                          {studentSearch}"
                        </div>
                      ) : (
                        filteredStudents.map((student) => (
                          <div
                            key={student._id}
                            className="attendance-row"
                          >
                            <div className="attendance-student">
                              <div className="attendance-avatar">
                                {student.profilePhoto ? (
                                  <img
                                    src={
                                      student.profilePhoto
                                    }
                                    alt={student.name}
                                  />
                                ) : (
                                  getInitials(student.name)
                                )}
                              </div>

                              <div>
                                <strong>
                                  {student.name}
                                </strong>

                                <span>
                                  Roll No: {student.rollNo}
                                </span>
                              </div>
                            </div>

                            <div className="attendance-status-buttons">
                              {STATUSES.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  className={`status-button ${status.toLowerCase()} ${
                                    student.status === status
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    setStatus(
                                      student._id,
                                      status
                                    )
                                  }
                                  aria-pressed={
                                    student.status === status
                                  }
                                  title={status}
                                >
                                  {STATUS_SHORT[status]}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* SAVE BAR */}
                    <div className="attendance-save-bar">
                      <button
                        type="button"
                        className="attendance-print-button"
                        onClick={handlePrint}
                        disabled={students.length === 0}
                      >
                        <FiPrinter />
                        Print Sheet
                      </button>

                      <button
                        type="button"
                        className="attendance-save-button"
                        onClick={handleSave}
                        disabled={
                          saving ||
                          !allMarked ||
                          (!hasChanges && alreadySaved)
                        }
                      >
                        <FiSave />
                        {saving
                          ? "Saving..."
                          : alreadySaved && !hasChanges
                          ? "Saved"
                          : "Save Attendance"}
                      </button>
                    </div>
                  </>
                ))}

              {/* ============ HISTORY VIEW ============ */}
              {viewMode === "history" &&
                (!historyClass ? (
                  <div className="attendance-empty">
                    <div className="attendance-empty-icon">
                      <FiClipboard />
                    </div>

                    <h3>No Class Selected</h3>

                    <p>
                      Choose a class and month to view the
                      attendance history and percentages.
                    </p>
                  </div>
                ) : summaryLoading ? (
                  <div className="attendance-list">
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        className="attendance-row-skeleton"
                      ></div>
                    ))}
                  </div>
                ) : summaryStudents.length === 0 ? (
                  <div className="attendance-empty small">
                    <div className="attendance-empty-icon">
                      <FiClipboard />
                    </div>

                    <h3>No Records Found</h3>

                    <p>
                      No attendance saved for{" "}
                      <strong>{historyClass}</strong> in this
                      month yet.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="attendance-list-header">
                      <div className="attendance-count-info">
                        <strong>{historyClass}</strong>

                        <span>
                          {summaryDays.length} day
                          {summaryDays.length === 1
                            ? ""
                            : "s"}
                          {" recorded"}
                        </span>
                      </div>

                      <div className="attendance-summary-totals">
                        <span className="pill present">
                          P: {summaryTotals.present}
                        </span>

                        <span className="pill absent">
                          A: {summaryTotals.absent}
                        </span>

                        <span className="pill leave">
                          L: {summaryTotals.leave}
                        </span>
                      </div>
                    </div>

                    <div className="summary-table-wrapper">
                      <table className="summary-table">
                        <thead>
                          <tr>
                            <th className="student-col">
                              Student
                            </th>

                            {summaryDays.map((day) => (
                              <th key={day}>
                                {formatDay(day)}
                              </th>
                            ))}

                            <th>P</th>
                            <th>A</th>
                            <th>L</th>
                            <th className="percent-col">
                              %
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {summaryStudents.map((student) => (
                            <tr key={student._id}>
                              <td className="student-col">
                                <strong>
                                  {student.name}
                                </strong>

                                <span>
                                  Roll {student.rollNo}
                                </span>
                              </td>

                              {summaryDays.map((day) => {
                                const status =
                                  student.statuses[day];

                                return (
                                  <td key={day}>
                                    {status ? (
                                      <span
                                        className={`cell ${status.toLowerCase()}`}
                                      >
                                        {
                                          STATUS_SHORT[
                                            status
                                          ]
                                        }
                                      </span>
                                    ) : (
                                      <span className="cell none">
                                        —
                                      </span>
                                    )}
                                  </td>
                                );
                              })}

                              <td className="count present">
                                {student.present}
                              </td>

                              <td className="count absent">
                                {student.absent}
                              </td>

                              <td className="count leave">
                                {student.leave}
                              </td>

                              <td className="percent-col">
                                <span
                                  className={`percent ${
                                    student.percentage >= 75
                                      ? "good"
                                      : student.percentage >=
                                        50
                                      ? "ok"
                                      : "low"
                                  }`}
                                >
                                  {student.percentage}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ))}
            </div>
          </section>
        </main>
      </div>

      {/* ========================================
          PRINT-ONLY DAILY SHEET
      ======================================== */}
      <section className="attendance-print-section">
        <div className="attendance-print-header">
          <h1>Future Skill School and IT Institute</h1>

          <p className="attendance-print-subtitle">
            Daily Attendance Sheet
          </p>

          <p className="attendance-print-meta">
            <strong>Class:</strong> {selectedClass}
            {" | "}
            <strong>Date:</strong> {formatDayLong(date)}
          </p>
        </div>

        <table className="attendance-print-table">
          <thead>
            <tr>
              <th className="num">#</th>

              <th className="roll">Roll No.</th>

              <th className="name">Student Name</th>

              <th className="status-col">Present</th>

              <th className="status-col">Absent</th>

              <th className="status-col">Leave</th>

              <th className="remarks">Remarks</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student, index) => (
              <tr key={student._id}>
                <td className="num">{index + 1}</td>

                <td className="roll">{student.rollNo}</td>

                <td className="name">
                  {student.name}
                  {student.fatherName
                    ? ` (${student.fatherName})`
                    : ""}
                </td>

                <td className="status-col">
                  {student.status === "Present"
                    ? "✓"
                    : ""}
                </td>

                <td className="status-col">
                  {student.status === "Absent"
                    ? "✓"
                    : ""}
                </td>

                <td className="status-col">
                  {student.status === "Leave" ? "✓" : ""}
                </td>

                <td className="remarks"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="attendance-print-signatures">
          <div>
            <span></span>

            <p>Class Teacher</p>
          </div>

          <div>
            <span></span>

            <p>Principal</p>
          </div>
        </div>

        <div className="attendance-print-footer">
          <span>
            Printed on: {new Date().toLocaleString("en-GB")}
          </span>
        </div>
      </section>
    </div>
  );
};

export default Attendance;