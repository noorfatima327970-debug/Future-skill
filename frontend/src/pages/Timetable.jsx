import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiCopy,
  FiPlus,
  FiPrinter,
  FiRefreshCw,
  FiRotateCcw,
  FiSettings,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/Timetable.css";

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

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const DAY_SHORT = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
};

const DEFAULT_PERIODS = [
  { name: "Period 1", startTime: "08:00", endTime: "08:40" },
  { name: "Period 2", startTime: "08:40", endTime: "09:20" },
  { name: "Period 3", startTime: "09:20", endTime: "10:00" },
  { name: "Period 4", startTime: "10:00", endTime: "10:40" },
  { name: "Break", startTime: "10:40", endTime: "11:00" },
  { name: "Period 5", startTime: "11:00", endTime: "11:40" },
  { name: "Period 6", startTime: "11:40", endTime: "12:20" },
  { name: "Period 7", startTime: "12:20", endTime: "13:00" },
  { name: "Period 8", startTime: "13:00", endTime: "13:40" },
];

// "08:00" → 480
const toMinutes = (t) => {
  if (!t) return null;

  const parts = t.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);

  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  return h * 60 + m;
};

// Subject name se stable hue — har subject ka apna color
const subjectHue = (name) => {
  if (!name) return 100;

  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % 360;
};

const getSubjectStyle = (name) => {
  const hue = subjectHue(name);

  return {
    background: `hsl(${hue}, 45%, 92%)`,
    borderColor: `hsl(${hue}, 32%, 77%)`,
    color: `hsl(${hue}, 40%, 28%)`,
  };
};

const Timetable = () => {
  const [viewMode, setViewMode] = useState("class"); // "class" | "teacher"

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const [entries, setEntries] = useState([]);
  const [teacherEntries, setTeacherEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Periods
  const [periods, setPeriods] = useState([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [periodsModalOpen, setPeriodsModalOpen] = useState(false);

  const [newPeriodName, setNewPeriodName] = useState("");
  const [newPeriodStart, setNewPeriodStart] = useState("");
  const [newPeriodEnd, setNewPeriodEnd] = useState("");
  const [addingPeriod, setAddingPeriod] = useState(false);

  const [editingPeriodId, setEditingPeriodId] = useState(null);
  const [editPeriodName, setEditPeriodName] = useState("");
  const [editPeriodStart, setEditPeriodStart] = useState("");
  const [editPeriodEnd, setEditPeriodEnd] = useState("");
  const [savingPeriod, setSavingPeriod] = useState(false);

  const [periodDeleteTarget, setPeriodDeleteTarget] = useState(null);
  const [deletingPeriod, setDeletingPeriod] = useState(false);
  const [addingDefaults, setAddingDefaults] = useState(false);

  // Slot modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState("");
  const [modalPeriod, setModalPeriod] = useState(null);
  const [modalEntryId, setModalEntryId] = useState(null);
  const [modalSubject, setModalSubject] = useState("");
  const [modalTeacher, setModalTeacher] = useState("");
  const [saving, setSaving] = useState(false);
  const [slotDeleting, setSlotDeleting] = useState(false);
  const [conflictInfo, setConflictInfo] = useState(null);

  // Copy / Reset modals
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyFromClass, setCopyFromClass] = useState("");
  const [copying, setCopying] = useState(false);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Dropdown data
  const [classSubjects, setClassSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // NOW tick — har minute update
  const [nowTick, setNowTick] = useState(0);

  const successTimerRef = useRef(null);
  const dropdownRef = useRef(null);

  const hasSelection =
    viewMode === "class"
      ? Boolean(selectedClass)
      : Boolean(selectedTeacher);

  // ========================================
  // NOW TICKER
  // ========================================

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick((n) => n + 1);
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // ========================================
  // CURRENT PERIOD (aaj + time ke hisab se)
  // ========================================

  const currentPeriodId = useMemo(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString("en-US", {
      weekday: "long",
    });

    if (!DAYS.includes(dayName)) return null;

    const minutes = now.getHours() * 60 + now.getMinutes();

    const found = periods.find((p) => {
      const start = toMinutes(p.startTime);
      const end = toMinutes(p.endTime);

      return (
        start !== null &&
        end !== null &&
        minutes >= start &&
        minutes <= end
      );
    });

    return found?._id || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods, nowTick]);

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
  // DROPDOWN — bahar click ya Esc par band
  // ========================================

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  // ========================================
  // RESET on class/teacher/view change
  // ========================================

  useEffect(() => {
    setError("");
    setSuccess("");
    setModalOpen(false);
  }, [selectedClass, selectedTeacher, viewMode]);

  // ========================================
  // FETCH PERIODS
  // ========================================

  const fetchPeriods = async () => {
    try {
      setPeriodsLoading(true);

      const response = await axios.get(
        `${API_URL}/api/timetable/periods`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setPeriods(response.data.periods || []);
      }
    } catch {
      // Ignore
    } finally {
      setPeriodsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  // ========================================
  // FETCH TEACHERS
  // ========================================

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/teachers`,
          {
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setTeachers(response.data.teachers || []);
        }
      } catch {
        // Optional
      }
    };

    fetchTeachers();
  }, []);

  // ========================================
  // FETCH SUBJECTS OF SELECTED CLASS
  // ========================================

  useEffect(() => {
    if (!selectedClass) {
      setClassSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/subjects?className=${encodeURIComponent(
            selectedClass
          )}`,
          {
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setClassSubjects(response.data.subjects || []);
        }
      } catch {
        setClassSubjects([]);
      }
    };

    fetchSubjects();
  }, [selectedClass]);

  // ========================================
  // FETCH CLASS TIMETABLE
  // ========================================

  const fetchTimetable = async (className) => {
    if (!className) {
      setEntries([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/timetable?className=${encodeURIComponent(
          className
        )}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setEntries(response.data.entries || []);
      } else {
        setError(
          response.data.message || "Failed to load timetable."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load timetable. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "class") {
      fetchTimetable(selectedClass);
    }
  }, [viewMode, selectedClass]);

  // ========================================
  // FETCH TEACHER TIMETABLE
  // ========================================

  const fetchTeacherTimetable = async (teacherName) => {
    if (!teacherName) {
      setTeacherEntries([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/timetable/teacher?teacher=${encodeURIComponent(
          teacherName
        )}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setTeacherEntries(response.data.entries || []);
      } else {
        setError(
          response.data.message || "Failed to load timetable."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load timetable. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "teacher") {
      fetchTeacherTimetable(selectedTeacher);
    } else {
      setTeacherEntries([]);
    }
  }, [viewMode, selectedTeacher]);

  // ========================================
  // ENTRY MAP (active view ke hisab se)
  // ========================================

  const activeEntries =
    viewMode === "class" ? entries : teacherEntries;

  const entryMap = useMemo(() => {
    const map = {};

    activeEntries.forEach((entry) => {
      const periodKey = entry.periodId?._id || entry.periodId;

      if (periodKey) {
        map[`${entry.day}-${periodKey}`] = entry;
      }
    });

    return map;
  }, [activeEntries]);

  // ========================================
  // DROPDOWN SELECT / CLEAR
  // ========================================

  const handleDropdownSelect = (value) => {
    if (viewMode === "class") {
      setSelectedClass(value);
    } else {
      setSelectedTeacher(value);
    }

    setIsDropdownOpen(false);
  };

  const handleClearSelection = (event) => {
    event.stopPropagation();

    if (viewMode === "class") {
      setSelectedClass("");
    } else {
      setSelectedTeacher("");
    }

    setIsDropdownOpen(false);
  };

  const dropdownValue =
    viewMode === "class" ? selectedClass : selectedTeacher;

  // ========================================
  // REFRESH (active view)
  // ========================================

  const handleRefresh = () => {
    if (viewMode === "class") {
      fetchTimetable(selectedClass);
    } else {
      fetchTeacherTimetable(selectedTeacher);
    }
  };

  // ========================================
  // PERIODS — ADD
  // ========================================

  const handleAddPeriod = async (event) => {
    event.preventDefault();

    if (!newPeriodName.trim() || !newPeriodStart || !newPeriodEnd) {
      setError(
        "Period name, start time and end time are required."
      );
      return;
    }

    try {
      setAddingPeriod(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/api/timetable/periods`,
        {
          name: newPeriodName.trim(),
          startTime: newPeriodStart,
          endTime: newPeriodEnd,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setNewPeriodName("");
        setNewPeriodStart("");
        setNewPeriodEnd("");

        await fetchPeriods();
        showSuccess("Period added!");
      } else {
        setError(response.data.message || "Failed to add period.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to add period. Please try again."
      );
    } finally {
      setAddingPeriod(false);
    }
  };

  // ========================================
  // PERIODS — DEFAULT QUICK ADD
  // ========================================

  const handleAddDefaultPeriods = async () => {
    if (addingDefaults) return;

    try {
      setAddingDefaults(true);
      setError("");

      for (const item of DEFAULT_PERIODS) {
        await axios.post(
          `${API_URL}/api/timetable/periods`,
          item,
          {
            withCredentials: true,
          }
        );
      }

      await fetchPeriods();
      showSuccess("Default periods added!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to add default periods. Please try again."
      );
    } finally {
      setAddingDefaults(false);
    }
  };

  // ========================================
  // PERIODS — EDIT
  // ========================================

  const handlePeriodEditStart = (period) => {
    if (savingPeriod || deletingPeriod) return;

    setEditingPeriodId(period._id);
    setEditPeriodName(period.name);
    setEditPeriodStart(period.startTime);
    setEditPeriodEnd(period.endTime);
    setError("");
  };

  const handlePeriodEditCancel = () => {
    if (savingPeriod) return;

    setEditingPeriodId(null);
    setEditPeriodName("");
    setEditPeriodStart("");
    setEditPeriodEnd("");
  };

  const handlePeriodEditSave = async (period) => {
    if (savingPeriod) return;

    if (
      !editPeriodName.trim() ||
      !editPeriodStart ||
      !editPeriodEnd
    ) {
      setError(
        "Period name, start time and end time are required."
      );
      return;
    }

    try {
      setSavingPeriod(true);
      setError("");

      const response = await axios.put(
        `${API_URL}/api/timetable/periods/${period._id}`,
        {
          name: editPeriodName.trim(),
          startTime: editPeriodStart,
          endTime: editPeriodEnd,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setEditingPeriodId(null);
        setEditPeriodName("");
        setEditPeriodStart("");
        setEditPeriodEnd("");

        await fetchPeriods();

        if (viewMode === "class" && selectedClass) {
          await fetchTimetable(selectedClass);
        } else if (viewMode === "teacher" && selectedTeacher) {
          await fetchTeacherTimetable(selectedTeacher);
        }

        showSuccess("Period updated!");
      } else {
        setError(
          response.data.message || "Failed to update period."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update period. Please try again."
      );
    } finally {
      setSavingPeriod(false);
    }
  };

  // ========================================
  // PERIODS — DELETE
  // ========================================

  const handlePeriodDeleteConfirm = async () => {
    if (!periodDeleteTarget || deletingPeriod) return;

    try {
      setDeletingPeriod(true);
      setError("");

      const response = await axios.delete(
        `${API_URL}/api/timetable/periods/${periodDeleteTarget._id}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setPeriodDeleteTarget(null);

        await fetchPeriods();

        if (viewMode === "class" && selectedClass) {
          await fetchTimetable(selectedClass);
        } else if (viewMode === "teacher" && selectedTeacher) {
          await fetchTeacherTimetable(selectedTeacher);
        }

        showSuccess("Period deleted!");
      } else {
        setError(
          response.data.message || "Failed to delete period."
        );
        setPeriodDeleteTarget(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete period. Please try again."
      );
      setPeriodDeleteTarget(null);
    } finally {
      setDeletingPeriod(false);
    }
  };

  // ========================================
  // SLOT MODAL — open / close
  // ========================================

  const openSlotModal = (day, period) => {
    const entry = entryMap[`${day}-${period._id}`];

    setModalDay(day);
    setModalPeriod(period);
    setModalEntryId(entry ? entry._id : null);
    setModalSubject(entry ? entry.subject : "");
    setModalTeacher(entry ? entry.teacher : "");
    setConflictInfo(null);
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving || slotDeleting) return;

    setModalOpen(false);
    setModalDay("");
    setModalPeriod(null);
    setModalEntryId(null);
    setModalSubject("");
    setModalTeacher("");
    setConflictInfo(null);
    setError("");
  };

  // ========================================
  // SAVE SLOT — with conflict handling
  // ========================================

  const submitSlot = async (force = false) => {
    if (!modalSubject) {
      setError("Please select a subject.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        className: selectedClass,
        day: modalDay,
        periodId: modalPeriod._id,
        subject: modalSubject,
        teacher: modalTeacher,
      };

      if (force) {
        payload.force = true;
      }

      const response = await axios.post(
        `${API_URL}/api/timetable`,
        payload,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        const saved = response.data.entry;

        setEntries((previous) => {
          const filtered = previous.filter(
            (item) =>
              !(
                item.day === saved.day &&
                (item.periodId?._id || item.periodId) ===
                  (saved.periodId?._id || saved.periodId)
              )
          );

          return [...filtered, saved];
        });

        setModalOpen(false);
        setConflictInfo(null);

        showSuccess(
          `${saved.subject} — ${DAY_SHORT[saved.day]}, ${
            saved.periodId?.name || ""
          } saved!`
        );
      } else {
        setError(
          response.data.message || "Failed to save lecture."
        );
      }
    } catch (err) {
      // Conflict — warning dikhao
      if (
        err.response?.status === 409 &&
        err.response?.data?.conflict
      ) {
        setConflictInfo(err.response.data);
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to save lecture. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSlot = (event) => {
    event.preventDefault();
    submitSlot(false);
  };

  const handleForceSave = () => {
    submitSlot(true);
  };

  // ========================================
  // DELETE SLOT
  // ========================================

  const handleDeleteSlot = async () => {
    if (!modalEntryId || slotDeleting) return;

    try {
      setSlotDeleting(true);
      setError("");

      const response = await axios.delete(
        `${API_URL}/api/timetable/${modalEntryId}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setEntries((previous) =>
          previous.filter((item) => item._id !== modalEntryId)
        );

        setModalOpen(false);

        showSuccess("Lecture deleted!");
      } else {
        setError(
          response.data.message || "Failed to delete lecture."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete lecture. Please try again."
      );
    } finally {
      setSlotDeleting(false);
    }
  };

  // ========================================
  // COPY TIMETABLE
  // ========================================

  const handleCopyConfirm = async () => {
    if (!copyFromClass || copying) return;

    try {
      setCopying(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/api/timetable/copy`,
        {
          fromClass: copyFromClass,
          toClass: selectedClass,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setCopyModalOpen(false);
        setCopyFromClass("");

        showSuccess(
          response.data.message || "Timetable copied!"
        );

        await fetchTimetable(selectedClass);
      } else {
        setError(
          response.data.message || "Failed to copy timetable."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to copy timetable. Please try again."
      );
    } finally {
      setCopying(false);
    }
  };

  // ========================================
  // RESET TIMETABLE
  // ========================================

  const handleResetConfirm = async () => {
    if (resetting) return;

    try {
      setResetting(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/api/timetable/reset`,
        {
          className: selectedClass,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setResetModalOpen(false);

        showSuccess(
          response.data.message || "Timetable reset!"
        );

        await fetchTimetable(selectedClass);
      } else {
        setError(
          response.data.message || "Failed to reset timetable."
        );
        setResetModalOpen(false);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset timetable. Please try again."
      );
      setResetModalOpen(false);
    } finally {
      setResetting(false);
    }
  };

  // ========================================
  // PRINT
  // ========================================

  const handlePrint = () => {
    const previousTitle = document.title;

    document.title =
      viewMode === "class"
        ? `Class Timetable — ${selectedClass}`
        : `Teacher Timetable — ${selectedTeacher}`;

    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };

    window.addEventListener("afterprint", restoreTitle);
    window.print();
  };

  const printSubtitle =
    viewMode === "class"
      ? `Class Timetable — ${selectedClass || "—"}`
      : `Teacher Timetable — ${selectedTeacher || "—"}`;

  return (
    <div className="timetable-layout">
      <Sidebar />

      <div className="timetable-main">
        <Topbar />

        <main className="timetable-content">
          <div className="timetable-page-header">
            <div>
              <span className="timetable-eyebrow">
                TIMETABLE MANAGEMENT
              </span>

              <h1>Timetable</h1>

              <p>
                Weekly timetables — click any slot to add or edit
                a lecture, switch to Teacher View for teacher
                schedules.
              </p>
            </div>
          </div>

          <section className="timetable-card">
            {/* TOOLBAR */}
            <div className="timetable-toolbar">
              <div
                className={`timetable-dropdown ${
                  isDropdownOpen ? "open" : ""
                }`}
                ref={dropdownRef}
              >
                <button
                  type="button"
                  className="timetable-dropdown-trigger"
                  onClick={() =>
                    setIsDropdownOpen((open) => !open)
                  }
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  {viewMode === "class" ? (
                    <FiCalendar className="timetable-dropdown-icon" />
                  ) : (
                    <FiUsers className="timetable-dropdown-icon" />
                  )}

                  <span
                    className={
                      dropdownValue ? "has-value" : "placeholder"
                    }
                  >
                    {viewMode === "class"
                      ? dropdownValue ||
                        "Select Class — Playgroup to 10"
                      : dropdownValue || "Select Teacher"}
                  </span>

                  {dropdownValue && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="timetable-dropdown-clear"
                      onClick={handleClearSelection}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          handleClearSelection(event);
                        }
                      }}
                      aria-label="Clear selection"
                      title="Clear selection"
                    >
                      <FiX />
                    </span>
                  )}

                  <FiChevronDown
                    className={`timetable-dropdown-arrow ${
                      isDropdownOpen ? "rotated" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div
                    className="timetable-dropdown-menu"
                    role="listbox"
                  >
                    {viewMode === "class"
                      ? CLASS_LIST.map((className) => (
                          <button
                            key={className}
                            type="button"
                            role="option"
                            aria-selected={
                              selectedClass === className
                            }
                            className={`timetable-dropdown-option ${
                              selectedClass === className
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleDropdownSelect(className)
                            }
                          >
                            <span className="option-name">
                              {className}
                            </span>

                            {selectedClass === className && (
                              <FiCheck className="option-check" />
                            )}
                          </button>
                        ))
                      : teachers.map((teacher) => (
                          <button
                            key={teacher._id}
                            type="button"
                            role="option"
                            aria-selected={
                              selectedTeacher === teacher.name
                            }
                            className={`timetable-dropdown-option ${
                              selectedTeacher === teacher.name
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleDropdownSelect(teacher.name)
                            }
                          >
                            <span className="option-name">
                              {teacher.name}
                            </span>

                            {selectedTeacher ===
                              teacher.name && (
                              <FiCheck className="option-check" />
                            )}
                          </button>
                        ))}
                  </div>
                )}
              </div>

              <div className="timetable-toolbar-actions">
                {/* VIEW TOGGLE */}
                <div className="timetable-view-toggle">
                  <button
                    type="button"
                    className={
                      viewMode === "class" ? "active" : ""
                    }
                    onClick={() => setViewMode("class")}
                  >
                    <FiCalendar />
                    Class
                  </button>

                  <button
                    type="button"
                    className={
                      viewMode === "teacher" ? "active" : ""
                    }
                    onClick={() => setViewMode("teacher")}
                  >
                    <FiUsers />
                    Teacher
                  </button>
                </div>

                <button
                  type="button"
                  className="timetable-periods-button"
                  onClick={() => setPeriodsModalOpen(true)}
                  aria-label="Manage periods"
                >
                  <FiSettings />
                  Periods
                </button>

                {viewMode === "class" && (
                  <button
                    type="button"
                    className="timetable-periods-button"
                    onClick={() => {
                      setCopyFromClass("");
                      setError("");
                      setCopyModalOpen(true);
                    }}
                    disabled={!selectedClass}
                    aria-label="Copy timetable"
                  >
                    <FiCopy />
                    Copy
                  </button>
                )}

                {viewMode === "class" && (
                  <button
                    type="button"
                    className="timetable-periods-button timetable-reset-button"
                    onClick={() => {
                      setError("");
                      setResetModalOpen(true);
                    }}
                    disabled={!selectedClass || entries.length === 0}
                    aria-label="Reset timetable"
                  >
                    <FiRotateCcw />
                    Reset
                  </button>
                )}

                <button
                  type="button"
                  className="timetable-periods-button"
                  onClick={handlePrint}
                  disabled={!hasSelection || loading}
                  aria-label="Print timetable"
                >
                  <FiPrinter />
                  Print
                </button>

                <button
                  type="button"
                  className="timetable-refresh"
                  onClick={handleRefresh}
                  disabled={!hasSelection || loading}
                  aria-label="Refresh timetable"
                >
                  <FiRefreshCw
                    className={loading ? "spin" : ""}
                  />
                </button>
              </div>
            </div>

            {/* MESSAGES */}
            {error && (
              <div className="timetable-error" role="alert">
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
              <div className="timetable-success" role="status">
                <FiCheck />
                <span>{success}</span>
              </div>
            )}

            <div className="timetable-body">
              {!hasSelection ? (
                /* NOTHING SELECTED */
                <div className="timetable-empty">
                  <div className="timetable-empty-icon">
                    {viewMode === "class" ? (
                      <FiCalendar />
                    ) : (
                      <FiUsers />
                    )}
                  </div>

                  <h3>
                    {viewMode === "class"
                      ? "No Class Selected"
                      : "No Teacher Selected"}
                  </h3>

                  <p>
                    {viewMode === "class"
                      ? "Choose a class from the dropdown above to view and manage its weekly timetable."
                      : "Choose a teacher from the dropdown above to view their weekly schedule."}
                  </p>

                  {viewMode === "class" && (
                    <div className="timetable-quick-classes">
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
                  )}

                  {viewMode === "teacher" &&
                    teachers.length > 0 && (
                      <div className="timetable-quick-classes">
                        {teachers
                          .slice(0, 8)
                          .map((teacher) => (
                            <button
                              key={teacher._id}
                              type="button"
                              onClick={() =>
                                setSelectedTeacher(teacher.name)
                              }
                            >
                              {teacher.name}
                            </button>
                          ))}
                      </div>
                    )}
                </div>
              ) : periods.length === 0 ? (
                /* NO PERIODS */
                <div className="timetable-empty">
                  <div className="timetable-empty-icon">
                    <FiSettings />
                  </div>

                  <h3>No Periods Yet</h3>

                  <p>
                    First define periods and their timings using
                    the Periods button above.
                  </p>

                  <button
                    type="button"
                    className="timetable-empty-button"
                    onClick={() => setPeriodsModalOpen(true)}
                  >
                    <FiSettings />
                    Manage Periods
                  </button>
                </div>
              ) : (
                /* TIMETABLE GRID */
                <div className="timetable-grid-wrapper">
                  <table className="timetable-grid">
                    <thead>
                      <tr>
                        <th className="period-col">
                          Period
                        </th>

                        {DAYS.map((day) => (
                          <th key={day}>
                            {DAY_SHORT[day]}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {periods.map((period) => {
                        const isBreak = /break/i.test(
                          period.name || ""
                        );

                        const isCurrent =
                          period._id === currentPeriodId;

                        return (
                          <tr key={period._id}>
                            <td
                              className={`period-col ${
                                isBreak ? "break" : ""
                              } ${isCurrent ? "current" : ""}`}
                            >
                              <strong>
                                {period.name}

                                {isCurrent && (
                                  <span className="now-badge">
                                    NOW
                                  </span>
                                )}
                              </strong>

                              <span>
                                {period.startTime} –{" "}
                                {period.endTime}
                              </span>
                            </td>

                            {DAYS.map((day) => {
                              if (isBreak) {
                                return (
                                  <td
                                    key={day}
                                    className="break-cell"
                                  ></td>
                                );
                              }

                              const entry =
                                entryMap[`${day}-${period._id}`];

                              return (
                                <td key={day}>
                                  {loading ? (
                                    <div className="slot skeleton"></div>
                                  ) : entry ? (
                                    <button
                                      type="button"
                                      className="slot filled"
                                      style={getSubjectStyle(
                                        entry.subject
                                      )}
                                      onClick={() => {
                                        if (
                                          viewMode === "class"
                                        ) {
                                          openSlotModal(
                                            day,
                                            period
                                          );
                                        } else {
                                          // Teacher view —
                                          // class par le jao
                                          setViewMode("class");
                                          setSelectedClass(
                                            entry.className
                                          );
                                        }
                                      }}
                                      title={
                                        viewMode === "class"
                                          ? "Edit lecture"
                                          : `Open ${entry.className} timetable`
                                      }
                                    >
                                      <strong>
                                        {entry.subject}
                                      </strong>

                                      <span>
                                        {viewMode === "class"
                                          ? entry.teacher
                                          : entry.className}
                                      </span>
                                    </button>
                                  ) : viewMode === "class" ? (
                                    <button
                                      type="button"
                                      className="slot empty"
                                      onClick={() =>
                                        openSlotModal(
                                          day,
                                          period
                                        )
                                      }
                                      title="Add lecture"
                                      aria-label={`Add lecture ${day} ${period.name}`}
                                    >
                                      <FiPlus />
                                    </button>
                                  ) : (
                                    <div className="slot empty static"></div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* ========================================
          MANAGE PERIODS MODAL
      ======================================== */}
      {periodsModalOpen && (
        <div
          className="timetable-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingPeriod &&
              !deletingPeriod &&
              !addingPeriod
            ) {
              setPeriodsModalOpen(false);
            }
          }}
        >
          <div className="timetable-modal periods-modal">
            <div className="timetable-modal-header">
              <div>
                <span>PERIOD SETTINGS</span>

                <h2>Manage Periods</h2>

                <p>
                  Add, edit or remove periods and their timings.
                </p>
              </div>

              <button
                type="button"
                className="timetable-modal-close"
                onClick={() => setPeriodsModalOpen(false)}
                disabled={
                  savingPeriod ||
                  deletingPeriod ||
                  addingPeriod
                }
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="periods-modal-body">
              {error && (
                <div className="timetable-form-error">
                  {error}
                </div>
              )}

              <form
                className="period-add-form"
                onSubmit={handleAddPeriod}
              >
                <input
                  type="text"
                  placeholder="Name (e.g. Period 9)"
                  value={newPeriodName}
                  onChange={(event) =>
                    setNewPeriodName(event.target.value)
                  }
                  disabled={addingPeriod}
                />

                <input
                  type="time"
                  value={newPeriodStart}
                  onChange={(event) =>
                    setNewPeriodStart(event.target.value)
                  }
                  disabled={addingPeriod}
                  aria-label="Start time"
                />

                <input
                  type="time"
                  value={newPeriodEnd}
                  onChange={(event) =>
                    setNewPeriodEnd(event.target.value)
                  }
                  disabled={addingPeriod}
                  aria-label="End time"
                />

                <button
                  type="submit"
                  disabled={
                    addingPeriod ||
                    !newPeriodName.trim() ||
                    !newPeriodStart ||
                    !newPeriodEnd
                  }
                >
                  <FiPlus />
                  {addingPeriod ? "Adding..." : "Add"}
                </button>
              </form>

              {periodsLoading ? (
                <div className="periods-loading">
                  Loading periods...
                </div>
              ) : periods.length === 0 ? (
                <div className="periods-empty">
                  <p>No periods defined yet.</p>

                  <button
                    type="button"
                    onClick={handleAddDefaultPeriods}
                    disabled={addingDefaults}
                  >
                    <FiPlus />
                    {addingDefaults
                      ? "Adding..."
                      : "Add Default Periods (1–8 + Break)"}
                  </button>
                </div>
              ) : (
                <div className="periods-list">
                  {periods.map((period) =>
                    editingPeriodId === period._id ? (
                      <div
                        key={period._id}
                        className="period-row editing"
                      >
                        <input
                          type="text"
                          value={editPeriodName}
                          onChange={(event) =>
                            setEditPeriodName(
                              event.target.value
                            )
                          }
                          disabled={savingPeriod}
                          aria-label="Period name"
                        />

                        <input
                          type="time"
                          value={editPeriodStart}
                          onChange={(event) =>
                            setEditPeriodStart(
                              event.target.value
                            )
                          }
                          disabled={savingPeriod}
                          aria-label="Start time"
                        />

                        <input
                          type="time"
                          value={editPeriodEnd}
                          onChange={(event) =>
                            setEditPeriodEnd(
                              event.target.value
                            )
                          }
                          disabled={savingPeriod}
                          aria-label="End time"
                        />

                        <div className="period-row-actions">
                          <button
                            type="button"
                            className="period-save"
                            onClick={() =>
                              handlePeriodEditSave(period)
                            }
                            disabled={
                              savingPeriod ||
                              !editPeriodName.trim() ||
                              !editPeriodStart ||
                              !editPeriodEnd
                            }
                            aria-label="Save period"
                            title="Save"
                          >
                            <FiCheck />
                          </button>

                          <button
                            type="button"
                            className="period-cancel"
                            onClick={handlePeriodEditCancel}
                            disabled={savingPeriod}
                            aria-label="Cancel"
                            title="Cancel"
                          >
                            <FiX />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={period._id}
                        className={`period-row ${
                          /break/i.test(period.name || "")
                            ? "break"
                            : ""
                        }`}
                      >
                        <div className="period-row-info">
                          <strong>{period.name}</strong>

                          <span>
                            {period.startTime} –{" "}
                            {period.endTime}
                          </span>
                        </div>

                        <div className="period-row-actions">
                          <button
                            type="button"
                            className="period-edit"
                            onClick={() =>
                              handlePeriodEditStart(period)
                            }
                            disabled={
                              editingPeriodId !== null ||
                              deletingPeriod
                            }
                            aria-label={`Edit ${period.name}`}
                            title="Edit"
                          >
                            <FiCheck />
                          </button>

                          <button
                            type="button"
                            className="period-delete"
                            onClick={() =>
                              setPeriodDeleteTarget(period)
                            }
                            disabled={
                              editingPeriodId !== null ||
                              deletingPeriod
                            }
                            aria-label={`Delete ${period.name}`}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          COPY TIMETABLE MODAL
      ======================================== */}
      {copyModalOpen && (
        <div
          className="timetable-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !copying
            ) {
              setCopyModalOpen(false);
            }
          }}
        >
          <div className="timetable-modal">
            <div className="timetable-modal-header">
              <div>
                <span>COPY TIMETABLE</span>

                <h2>Copy Timetable</h2>

                <p>Copy lectures from another class.</p>
              </div>

              <button
                type="button"
                className="timetable-modal-close"
                onClick={() => setCopyModalOpen(false)}
                disabled={copying}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="timetable-form">
              {error && (
                <div className="timetable-form-error">
                  {error}
                </div>
              )}

              <div className="timetable-form-group">
                <label htmlFor="copyFromClass">
                  Copy From <span>*</span>
                </label>

                <select
                  id="copyFromClass"
                  value={copyFromClass}
                  onChange={(event) =>
                    setCopyFromClass(event.target.value)
                  }
                  disabled={copying}
                >
                  <option value="">Select class</option>

                  {CLASS_LIST.filter(
                    (c) => c !== selectedClass
                  ).map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="copy-info">
                All lectures of{" "}
                <strong>
                  {copyFromClass || "the selected class"}
                </strong>{" "}
                will be copied to{" "}
                <strong>{selectedClass}</strong>. Existing
                lectures of {selectedClass} at the same slots
                will be replaced.
              </div>

              <div className="timetable-form-footer">
                <div className="timetable-form-footer-right">
                  <button
                    type="button"
                    className="timetable-cancel-button"
                    onClick={() => setCopyModalOpen(false)}
                    disabled={copying}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="timetable-save-button"
                    onClick={handleCopyConfirm}
                    disabled={copying || !copyFromClass}
                  >
                    {copying ? "Copying..." : "Copy Timetable"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          RESET TIMETABLE CONFIRM
      ======================================== */}
      {resetModalOpen && (
        <div
          className="timetable-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !resetting
            ) {
              setResetModalOpen(false);
            }
          }}
        >
          <div className="timetable-delete-modal">
            <div className="timetable-delete-icon">
              <FiRotateCcw />
            </div>

            <h2>Reset Timetable?</h2>

            <p>
              This will delete{" "}
              <strong>all {entries.length} lectures</strong> of{" "}
              <strong>{selectedClass}</strong>. This action
              cannot be undone.
            </p>

            <div className="timetable-delete-actions">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                disabled={resetting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete"
                onClick={handleResetConfirm}
                disabled={resetting}
              >
                {resetting ? "Resetting..." : "Reset Timetable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          DELETE PERIOD CONFIRM
      ======================================== */}
      {periodDeleteTarget && (
        <div
          className="timetable-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deletingPeriod
            ) {
              setPeriodDeleteTarget(null);
            }
          }}
        >
          <div className="timetable-delete-modal">
            <div className="timetable-delete-icon">
              <FiTrash2 />
            </div>

            <h2>Delete Period?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{periodDeleteTarget.name}</strong>? All
              lectures scheduled in this period will also be
              removed. This action cannot be undone.
            </p>

            <div className="timetable-delete-actions">
              <button
                type="button"
                onClick={() => setPeriodDeleteTarget(null)}
                disabled={deletingPeriod}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete"
                onClick={handlePeriodDeleteConfirm}
                disabled={deletingPeriod}
              >
                {deletingPeriod ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          SLOT MODAL — ADD / EDIT LECTURE
      ======================================== */}
      {modalOpen && (
        <div
          className="timetable-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving &&
              !slotDeleting
            ) {
              closeModal();
            }
          }}
        >
          <div className="timetable-modal">
            <div className="timetable-modal-header">
              <div>
                <span>
                  {modalEntryId
                    ? "EDIT LECTURE"
                    : "NEW LECTURE"}
                </span>

                <h2>
                  {selectedClass} — {modalDay}
                </h2>

                <p>
                  {modalPeriod?.name || ""}
                  {modalPeriod
                    ? ` (${modalPeriod.startTime} – ${modalPeriod.endTime})`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                className="timetable-modal-close"
                onClick={closeModal}
                disabled={saving || slotDeleting}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <form
              className="timetable-form"
              onSubmit={handleSaveSlot}
            >
              {error && (
                <div className="timetable-form-error">
                  {error}
                </div>
              )}

              {/* CONFLICT WARNING */}
              {conflictInfo && (
                <div className="timetable-conflict-warning">
                  <p>
                    <strong>Teacher conflict!</strong>{" "}
                    {conflictInfo.message}
                  </p>

                  <button
                    type="button"
                    className="conflict-force-button"
                    onClick={handleForceSave}
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Anyway"}
                  </button>
                </div>
              )}

              <div className="timetable-form-group">
                <label htmlFor="modalSubject">
                  Subject <span>*</span>
                </label>

                <select
                  id="modalSubject"
                  value={modalSubject}
                  onChange={(event) =>
                    setModalSubject(event.target.value)
                  }
                  disabled={saving || slotDeleting}
                >
                  <option value="">Select subject</option>

                  {classSubjects.map((subject) => (
                    <option
                      key={subject._id}
                      value={subject.name}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>

                {classSubjects.length === 0 && (
                  <small>
                    No subjects found for this class — add
                    subjects in the Subjects module first.
                  </small>
                )}
              </div>

              <div className="timetable-form-group">
                <label htmlFor="modalTeacher">Teacher</label>

                <select
                  id="modalTeacher"
                  value={modalTeacher}
                  onChange={(event) =>
                    setModalTeacher(event.target.value)
                  }
                  disabled={saving || slotDeleting}
                >
                  <option value="">Select teacher</option>

                  {teachers.map((teacher) => (
                    <option
                      key={teacher._id}
                      value={teacher.name}
                    >
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="timetable-form-footer">
                {modalEntryId && (
                  <button
                    type="button"
                    className="timetable-delete-button"
                    onClick={handleDeleteSlot}
                    disabled={saving || slotDeleting}
                  >
                    <FiTrash2 />
                    {slotDeleting ? "Deleting..." : "Delete"}
                  </button>
                )}

                <div className="timetable-form-footer-right">
                  <button
                    type="button"
                    className="timetable-cancel-button"
                    onClick={closeModal}
                    disabled={saving || slotDeleting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="timetable-save-button"
                    disabled={
                      saving ||
                      slotDeleting ||
                      !modalSubject ||
                      Boolean(conflictInfo)
                    }
                  >
                    {saving
                      ? "Saving..."
                      : modalEntryId
                      ? "Update Lecture"
                      : "Add Lecture"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================
          PRINT-ONLY TIMETABLE
      ======================================== */}
      <section className="timetable-print-section">
        <div className="timetable-print-header">
          <h1>Future Skill School and IT Institute</h1>

          <p className="timetable-print-subtitle">
            {printSubtitle}
          </p>
        </div>

        <table className="timetable-print-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Time</th>

              {DAYS.map((day) => (
                <th key={day}>{DAY_SHORT[day]}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {periods.map((period) => {
              const isBreak = /break/i.test(
                period.name || ""
              );

              return (
                <tr
                  key={period._id}
                  className={isBreak ? "print-break-row" : ""}
                >
                  <td>{period.name}</td>

                  <td>
                    {period.startTime} – {period.endTime}
                  </td>

                  {DAYS.map((day) => {
                    const entry =
                      entryMap[`${day}-${period._id}`];

                    return (
                      <td
                        key={day}
                        style={
                          entry && !isBreak
                            ? getSubjectStyle(entry.subject)
                            : undefined
                        }
                      >
                        {entry ? (
                          <>
                            <strong>{entry.subject}</strong>

                            <span>
                              {viewMode === "class"
                                ? entry.teacher
                                : entry.className}
                            </span>
                          </>
                        ) : (
                          ""
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="timetable-print-footer">
          <span>
            Printed on: {new Date().toLocaleString("en-GB")}
          </span>
        </div>
      </section>
    </div>
  );
};

export default Timetable;