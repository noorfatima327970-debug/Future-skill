import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/Subjects.css";

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

// Har word ka pehla letter capital — "english book" → "English Book"
const capitalizeWords = (value) =>
  value.replace(/\b\w/g, (char) => char.toUpperCase());

const Subjects = () => {
  const [selectedClass, setSelectedClass] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [classCounts, setClassCounts] = useState({});

  const [newSubject, setNewSubject] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Custom dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const inputRef = useRef(null);
  const editInputRef = useRef(null);
  const successTimerRef = useRef(null);
  const dropdownRef = useRef(null);

  // ========================================
  // SUCCESS FLASH — 2 second baad khud gayab
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
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  // ========================================
  // CLASS SWITCH — sab kuch reset
  // ========================================

  useEffect(() => {
    setNewSubject("");
    setError("");
    setSuccess("");
    setEditingId(null);
    setEditValue("");
    setDeleteTarget(null);
  }, [selectedClass]);

  // ========================================
  // FETCH CLASS COUNTS (dropdown ke liye)
  // ========================================

  const fetchClassCounts = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/subjects/counts`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setClassCounts(response.data.counts || {});
      }
    } catch {
      // Counts optional hain — fail ho toh chup-chaap ignore
    }
  };

  useEffect(() => {
    fetchClassCounts();
  }, []);

  // ========================================
  // FETCH SUBJECTS OF SELECTED CLASS
  // ========================================

  const fetchSubjects = async (className) => {
    if (!className) {
      setSubjects([]);
      return;
    }

    try {
      setSubjectsLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/subjects?className=${encodeURIComponent(
          className
        )}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setSubjects(response.data.subjects || []);
      } else {
        setError(response.data.message || "Failed to load subjects.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load subjects. Please try again."
      );
    } finally {
      setSubjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects(selectedClass);
  }, [selectedClass]);

  // ========================================
  // CLASS SELECT / CLEAR
  // ========================================

  const handleClassSelect = (className) => {
    setSelectedClass(className);
    setIsDropdownOpen(false);
  };

  // Clear button — wapas shuru wale page par
  const handleClearClass = (event) => {
    // Trigger ka click-up na chale — warna dropdown khul jayega
    event.stopPropagation();

    setSelectedClass("");
    setIsDropdownOpen(false);
  };

  // ========================================
  // ADD SUBJECT
  // ========================================

  const handleAddSubject = async (event) => {
    event.preventDefault();

    if (!selectedClass) {
      setError("Please select a class first.");
      return;
    }

    if (!newSubject.trim()) {
      setError("Please enter a subject name.");
      return;
    }

    try {
      setAdding(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/api/subjects`,
        {
          className: selectedClass,
          name: capitalizeWords(newSubject.trim()),
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setNewSubject("");

        showSuccess(
          `${response.data.subject.name} added to ${selectedClass}!`
        );

        await Promise.all([
          fetchSubjects(selectedClass),
          fetchClassCounts(),
        ]);

        // Focus wapas input par — lagatar add karna aasan
        inputRef.current?.focus();
      } else {
        setError(response.data.message || "Failed to add subject.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to add subject. Please try again."
      );
    } finally {
      setAdding(false);
    }
  };

  // ========================================
  // EDIT SUBJECT (inline)
  // ========================================

  const handleEditStart = (subject) => {
    if (savingEdit || deleting) return;

    setEditingId(subject._id);
    setEditValue(subject.name);
    setError("");

    // Naya input render hone ke baad focus
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleEditCancel = () => {
    if (savingEdit) return;

    setEditingId(null);
    setEditValue("");
  };

  const handleEditSave = async (subject) => {
    if (savingEdit) return;

    if (!editValue.trim()) {
      setError("Please enter a subject name.");
      return;
    }

    try {
      setSavingEdit(true);
      setError("");

      const response = await axios.put(
        `${API_URL}/api/subjects/${subject._id}`,
        {
          name: capitalizeWords(editValue.trim()),
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        const updated = response.data.subject;

        setSubjects((previous) =>
          previous.map((item) =>
            item._id === subject._id ? updated : item
          )
        );

        setEditingId(null);
        setEditValue("");

        showSuccess("Subject updated!");
      } else {
        setError(response.data.message || "Failed to update subject.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update subject. Please try again."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // ========================================
  // DELETE SUBJECT (confirmation ke baad)
  // ========================================

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;

    try {
      setDeleting(true);
      setError("");

      const response = await axios.delete(
        `${API_URL}/api/subjects/${deleteTarget._id}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        const deletedName = deleteTarget.name;

        setSubjects((previous) =>
          previous.filter((item) => item._id !== deleteTarget._id)
        );

        setDeleteTarget(null);

        showSuccess(`${deletedName} deleted!`);

        fetchClassCounts();
      } else {
        setError(response.data.message || "Failed to delete subject.");
        setDeleteTarget(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete subject. Please try again."
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="subjects-layout">
      <Sidebar />

      <div className="subjects-main">
        <Topbar />

        <main className="subjects-content">
          <div className="subjects-page-header">
            <div>
              <span className="subjects-eyebrow">
                SUBJECT MANAGEMENT
              </span>

              <h1>Subjects</h1>

              <p>
                Manage class-wise subjects and books for each
                grade.
              </p>
            </div>
          </div>

          <section className="subjects-card">
            {/* CUSTOM CLASS DROPDOWN — counts + clear button */}
            <div className="subjects-toolbar">
              <div
                className={`subjects-dropdown ${
                  isDropdownOpen ? "open" : ""
                }`}
                ref={dropdownRef}
              >
                <button
                  type="button"
                  className="subjects-dropdown-trigger"
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  <FiBookOpen className="subjects-dropdown-book" />

                  <span
                    className={
                      selectedClass ? "has-value" : "placeholder"
                    }
                  >
                    {selectedClass ||
                      "Select Class — Playgroup to 10"}
                  </span>

                  {/* CLEAR BUTTON — class select ho toh dikhe */}
                  {selectedClass && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="subjects-dropdown-clear"
                      onClick={handleClearClass}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          handleClearClass(event);
                        }
                      }}
                      aria-label="Clear class selection"
                      title="Clear selection"
                    >
                      <FiX />
                    </span>
                  )}

                  <FiChevronDown
                    className={`subjects-dropdown-arrow ${
                      isDropdownOpen ? "rotated" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div
                    className="subjects-dropdown-menu"
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
                        className={`subjects-dropdown-option ${
                          selectedClass === className
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleClassSelect(className)
                        }
                      >
                        <span className="option-name">
                          {className}
                        </span>

                        <span className="option-right">
                          {classCounts[className] !==
                            undefined && (
                            <span className="option-count">
                              {classCounts[className]}
                            </span>
                          )}

                          {selectedClass === className && (
                            <FiCheck className="option-check" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="subjects-refresh"
                onClick={() => fetchSubjects(selectedClass)}
                disabled={!selectedClass || subjectsLoading}
                aria-label="Refresh subjects"
              >
                <FiRefreshCw
                  className={subjectsLoading ? "spin" : ""}
                />
              </button>
            </div>

            {/* MESSAGES */}
            {error && (
              <div className="subjects-error" role="alert">
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
              <div className="subjects-success" role="status">
                <FiCheck />
                <span>{success}</span>
              </div>
            )}

            <div className="subjects-body">
              {!selectedClass ? (
                /* NO CLASS SELECTED — STARTING PAGE */
                <div className="subjects-empty">
                  <div className="subjects-empty-icon">
                    <FiBookOpen />
                  </div>

                  <h3>No Class Selected</h3>

                  <p>
                    Choose a class from the dropdown above to view
                    and manage its subjects and books.
                  </p>

                  <div className="subjects-quick-classes">
                    {CLASS_LIST.map((className) => (
                      <button
                        key={className}
                        type="button"
                        onClick={() => setSelectedClass(className)}
                      >
                        {className}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* CLASS TITLE + ADD FORM */}
                  <div className="subjects-panel-header">
                    <h2>
                      {selectedClass} —{" "}
                      <span>
                        {subjectsLoading
                          ? "..."
                          : `${subjects.length} ${
                              subjects.length === 1
                                ? "Subject"
                                : "Subjects"
                            }`}
                      </span>
                    </h2>

                    <form
                      className="subjects-add-form"
                      onSubmit={handleAddSubject}
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="e.g. English Book"
                        value={newSubject}
                        onChange={(event) =>
                          setNewSubject(
                            capitalizeWords(event.target.value)
                          )
                        }
                        disabled={adding}
                      />

                      <button
                        type="submit"
                        disabled={adding || !newSubject.trim()}
                      >
                        <FiPlus />
                        {adding ? "Adding..." : "Add Subject"}
                      </button>
                    </form>
                  </div>

                  {/* SUBJECTS LIST */}
                  {subjectsLoading ? (
                    /* LOADING SKELETON */
                    <div className="subjects-chips">
                      {[0, 1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className="subject-chip-skeleton"
                        ></div>
                      ))}
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="subjects-empty small">
                      <div className="subjects-empty-icon">
                        <FiBookOpen />
                      </div>

                      <h3>No Subjects Yet</h3>

                      <p>
                        Use the form above to add the first subject
                        or book for{" "}
                        <strong>{selectedClass}</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="subjects-chips">
                      {subjects.map((subject) =>
                        editingId === subject._id ? (
                          /* EDIT MODE CHIP */
                          <div
                            key={subject._id}
                            className="subject-chip editing"
                          >
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editValue}
                              onChange={(event) =>
                                setEditValue(
                                  capitalizeWords(
                                    event.target.value
                                  )
                                )
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  handleEditSave(subject);
                                }

                                if (event.key === "Escape") {
                                  handleEditCancel();
                                }
                              }}
                              disabled={savingEdit}
                            />

                            <button
                              type="button"
                              className="subject-chip-save"
                              onClick={() =>
                                handleEditSave(subject)
                              }
                              disabled={
                                savingEdit || !editValue.trim()
                              }
                              aria-label="Save"
                              title="Save (Enter)"
                            >
                              <FiCheck />
                            </button>

                            <button
                              type="button"
                              className="subject-chip-cancel"
                              onClick={handleEditCancel}
                              disabled={savingEdit}
                              aria-label="Cancel"
                              title="Cancel (Esc)"
                            >
                              <FiX />
                            </button>
                          </div>
                        ) : (
                          /* NORMAL CHIP */
                          <div
                            key={subject._id}
                            className="subject-chip"
                          >
                            <span>{subject.name}</span>

                            <div className="subject-chip-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditStart(subject)
                                }
                                disabled={
                                  editingId !== null || deleting
                                }
                                aria-label={`Edit ${subject.name}`}
                                title={`Edit ${subject.name}`}
                              >
                                <FiEdit2 />
                              </button>

                              <button
                                type="button"
                                className="subject-chip-delete"
                                onClick={() =>
                                  setDeleteTarget(subject)
                                }
                                disabled={
                                  editingId !== null || deleting
                                }
                                aria-label={`Delete ${subject.name}`}
                                title={`Delete ${subject.name}`}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* ========================================
          DELETE CONFIRMATION MODAL
      ======================================== */}
      {deleteTarget && (
        <div
          className="subjects-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="subject-delete-modal">
            <div className="subject-delete-icon">
              <FiTrash2 />
            </div>

            <h2>Delete Subject?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong> from{" "}
              <strong>{selectedClass}</strong>? This action cannot
              be undone.
            </p>

            <div className="subject-delete-actions">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;