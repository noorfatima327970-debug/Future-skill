import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiPlus,
  FiPrinter,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/Students.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const CLASS_LIST = [
  "Playgroup",
  "Nursery",
  "Prep",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
];

const PRE_PRIMARY_CLASSES = [
  "Playgroup",
  "Nursery",
  "Prep",
];

const getClassKey = (value) => {
  return String(value || "")
    .trim()
    .replace(/^class\s+/i, "")
    .toLowerCase();
};

const getClassLabel = (className) => {
  const value = String(className || "").trim();

  if (!value) return "-";

  const cleanValue = value
    .replace(/^class\s+/i, "")
    .trim();

  const prePrimaryClass = PRE_PRIMARY_CLASSES.find(
    (item) =>
      item.toLowerCase() === cleanValue.toLowerCase()
  );

  if (prePrimaryClass) {
    return prePrimaryClass;
  }

  return `Class ${cleanValue}`;
};

const formatDate = (value) => {
  if (!value) return "-";

  const stringValue = String(value);

  const match = stringValue.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (match) {
    const [, year, month, day] = match;

    const date = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        12
      )
    );

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Students = () => {
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [selectedClass, setSelectedClass] =
    useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [editingStudent, setEditingStudent] =
    useState(null);

  const [deleteStudent, setDeleteStudent] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [formLoading, setFormLoading] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [statusUpdatingId, setStatusUpdatingId] =
    useState(null);

  const studentsPerPage = 8;

  const emptyForm = {
    rollNo: "",
    admissionNo: "",
    name: "",
    fatherName: "",
    gender: "",
    dateOfBirth: "",
    className: "",
    phone: "",
    address: "",
    admissionDate: "",
    status: "Active",
    profilePhoto: "",
  };

  const [formData, setFormData] =
    useState(emptyForm);

  /* ========================================
     FETCH STUDENTS
  ======================================== */

  const fetchStudents = async (
    showRefreshLoader = false
  ) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axios.get(
        `${API_URL}/api/students`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setStudents(response.data.students || []);
      } else {
        setError(
          response.data.message ||
            "Failed to load students."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load students. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* ========================================
     CLASSES
  ======================================== */

  const classOptions = useMemo(() => {
    const classMap = new Map();

    CLASS_LIST.forEach((className) => {
      classMap.set(
        getClassKey(className),
        className
      );
    });

    students.forEach((student) => {
      const className = String(
        student.className || ""
      ).trim();

      if (!className) return;

      const classKey = getClassKey(className);

      if (!classMap.has(classKey)) {
        classMap.set(classKey, className);
      }
    });

    return Array.from(classMap.values());
  }, [students]);

  const classCards = useMemo(() => {
    return classOptions.map((className) => {
      const classKey = getClassKey(className);

      const classStudents = students.filter(
        (student) =>
          getClassKey(student.className) ===
          classKey
      );

      const active = classStudents.filter(
        (student) =>
          String(student.status || "")
            .trim()
            .toLowerCase() === "active"
      ).length;

      const inactive = classStudents.filter(
        (student) =>
          String(student.status || "")
            .trim()
            .toLowerCase() === "inactive"
      ).length;

      return {
        className,
        total: classStudents.length,
        active,
        inactive,
      };
    });
  }, [classOptions, students]);

  /* ========================================
     SELECTED CLASS STUDENTS
  ======================================== */

  const selectedClassStudents = useMemo(() => {
    if (!selectedClass) return [];

    const selectedClassKey =
      getClassKey(selectedClass);

    return students.filter(
      (student) =>
        getClassKey(student.className) ===
        selectedClassKey
    );
  }, [students, selectedClass]);

  /* ========================================
     FILTER + SEARCH
  ======================================== */

  const filteredStudents = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return selectedClassStudents.filter(
      (student) => {
        const searchableValues = [
          student.name,
          student.rollNo,
          student.admissionNo,
          student.fatherName,
          student.phone,
        ];

        const matchesSearch =
          !searchValue ||
          searchableValues.some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(searchValue)
          );

        const studentStatus = String(
          student.status || ""
        )
          .trim()
          .toLowerCase();

        const matchesStatus =
          statusFilter === "All" ||
          studentStatus ===
            statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
      }
    );
  }, [
    selectedClassStudents,
    search,
    statusFilter,
  ]);

  /* ========================================
     SORT BY ROLL NUMBER
  ======================================== */

  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];

    return list.sort((first, second) => {
      const rollCompare = String(
        first.rollNo || ""
      ).localeCompare(
        String(second.rollNo || ""),
        "en",
        {
          numeric: true,
          sensitivity: "base",
        }
      );

      if (rollCompare !== 0) {
        return rollCompare;
      }

      return String(first.name || "").localeCompare(
        String(second.name || ""),
        "en",
        {
          sensitivity: "base",
        }
      );
    });
  }, [filteredStudents]);

  /* ========================================
     PAGINATION
  ======================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      sortedStudents.length / studentsPerPage
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * studentsPerPage;

  const paginatedStudents = sortedStudents.slice(
    startIndex,
    startIndex + studentsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, selectedClass]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* ========================================
     NAVIGATION
  ======================================== */

  const openClassStudents = (className) => {
    setSelectedClass(className);
    setSearch("");
    setStatusFilter("All");
    setCurrentPage(1);
    setError("");
  };

  const goBackToClasses = () => {
    setSelectedClass(null);
    setSearch("");
    setStatusFilter("All");
    setCurrentPage(1);
    setError("");
  };

  /* ========================================
     FORM HANDLERS
  ======================================== */

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      setFormData((previous) => ({
        ...previous,
        profilePhoto: readerEvent.target.result,
      }));
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  const handleRemovePhoto = () => {
    setFormData((previous) => ({
      ...previous,
      profilePhoto: "",
    }));
  };

  const openAddForm = () => {
    setEditingStudent(null);

    setFormData({
      ...emptyForm,
      className: selectedClass || "",
    });

    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (student) => {
    setEditingStudent(student);
    setFormError("");

    setFormData({
      rollNo: student.rollNo || "",
      admissionNo: student.admissionNo || "",
      name: student.name || "",
      fatherName: student.fatherName || "",
      gender: student.gender || "",
      dateOfBirth: student.dateOfBirth
        ? String(student.dateOfBirth).substring(
            0,
            10
          )
        : "",
      className: student.className || "",
      phone: student.phone || "",
      address: student.address || "",
      admissionDate: student.admissionDate
        ? String(student.admissionDate).substring(
            0,
            10
          )
        : "",
      status: student.status || "Active",
      profilePhoto: student.profilePhoto || "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (formLoading) return;

    setShowForm(false);
    setEditingStudent(null);
    setFormData(emptyForm);
    setFormError("");
  };

  /* ========================================
     CREATE / UPDATE
  ======================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    if (
      !formData.rollNo.trim() ||
      !formData.name.trim() ||
      !formData.fatherName.trim() ||
      !formData.gender ||
      !formData.className.trim() ||
      !formData.admissionDate
    ) {
      setFormError(
        "Please fill all required fields."
      );
      return;
    }

    const payload = {
      ...formData,
      rollNo: formData.rollNo.trim(),
      admissionNo: formData.admissionNo.trim(),
      name: formData.name.trim(),
      fatherName: formData.fatherName.trim(),
      className: formData.className.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
    };

    try {
      setFormLoading(true);

      let response;

      if (editingStudent) {
        response = await axios.put(
          `${API_URL}/api/students/${editingStudent._id}`,
          payload,
          {
            withCredentials: true,
          }
        );
      } else {
        response = await axios.post(
          `${API_URL}/api/students`,
          payload,
          {
            withCredentials: true,
          }
        );
      }

      if (response.data.success) {
        await fetchStudents();

        setShowForm(false);
        setEditingStudent(null);
        setFormData(emptyForm);
        setFormError("");
      } else {
        setFormError(
          response.data.message ||
            "Unable to save student."
        );
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Unable to save student. Please try again."
      );
    } finally {
      setFormLoading(false);
    }
  };

  /* ========================================
     DELETE
  ======================================== */

  const handleDelete = async () => {
    if (!deleteStudent) return;

    try {
      setDeleting(true);

      const response = await axios.delete(
        `${API_URL}/api/students/${deleteStudent._id}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setDeleteStudent(null);
        await fetchStudents();
      } else {
        setError(
          response.data.message ||
            "Unable to delete student."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete student. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ========================================
     STATUS UPDATE
  ======================================== */

  const handleToggleStatus = async (
    student
  ) => {
    if (statusUpdatingId !== null) return;

    const currentStatus = String(
      student.status || ""
    )
      .trim()
      .toLowerCase();

    const nextStatus =
      currentStatus === "active"
        ? "Inactive"
        : "Active";

    try {
      setStatusUpdatingId(student._id);
      setError("");

      const response = await axios.put(
        `${API_URL}/api/students/${student._id}`,
        {
          status: nextStatus,
        },
        {
          withCredentials: true,
        }
      );

      if (!response.data.success) {
        setError(
          response.data.message ||
            "Unable to update student status."
        );
        return;
      }

      if (response.data.student) {
        setStudents((previous) =>
          previous.map((item) =>
            item._id === student._id
              ? {
                  ...item,
                  ...response.data.student,
                }
              : item
          )
        );
      } else {
        await fetchStudents(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update status. Please try again."
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  /* ========================================
     PRINT
  ======================================== */

  const handlePrint = () => {
    if (!selectedClass || sortedStudents.length === 0) {
      return;
    }

    const previousTitle = document.title;

    document.title = `Student List - ${getClassLabel(
      selectedClass
    )}`;

    const restoreTitle = () => {
      document.title = previousTitle;

      window.removeEventListener(
        "afterprint",
        restoreTitle
      );
    };

    window.addEventListener(
      "afterprint",
      restoreTitle
    );

    window.setTimeout(() => {
      window.print();
    }, 150);
  };

  /* ========================================
     HELPERS
  ======================================== */

  const getInitials = (name = "") => {
    const parts = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return "S";
    }

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[
      parts.length - 1
    ].charAt(0)}`.toUpperCase();
  };

  const activeStudents = students.filter(
    (student) =>
      String(student.status || "")
        .trim()
        .toLowerCase() === "active"
  ).length;

  const inactiveStudents = students.filter(
    (student) =>
      String(student.status || "")
        .trim()
        .toLowerCase() === "inactive"
  ).length;

  return (
    <div className="students-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <div
          className="students-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="students-main">
        <Topbar
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="students-content">
          <div className="students-page-header">
            <div>
              <span className="students-eyebrow">
                STUDENT MANAGEMENT
              </span>

              <h1>
                {selectedClass
                  ? getClassLabel(selectedClass)
                  : "Students"}
              </h1>

              <p>
                {selectedClass
                  ? `Manage students of ${getClassLabel(
                      selectedClass
                    )}. Students are shown roll number wise.`
                  : "Choose a class to view and manage school students."}
              </p>
            </div>

            <button
              type="button"
              className="add-student-button"
              onClick={openAddForm}
            >
              <FiPlus />
              Add Student
            </button>
          </div>

          <div className="students-mini-stats">
            <div className="students-mini-card">
              <div className="students-mini-icon total">
                <FiUsers />
              </div>

              <div>
                <span>Total Students</span>
                <strong>{students.length}</strong>
              </div>
            </div>

            <div className="students-mini-card">
              <div className="students-mini-icon active">
                <span />
              </div>

              <div>
                <span>Active Students</span>
                <strong>{activeStudents}</strong>
              </div>
            </div>

            <div className="students-mini-card">
              <div className="students-mini-icon inactive">
                <span />
              </div>

              <div>
                <span>Inactive Students</span>
                <strong>{inactiveStudents}</strong>
              </div>
            </div>
          </div>

          {!selectedClass && (
            <section className="students-class-panel">
              <div className="students-class-panel-header">
                <div>
                  <h2>Select a Class</h2>

                  <p>
                    Click a class to view students roll
                    number wise.
                  </p>
                </div>

                <button
                  type="button"
                  className="refresh-students-button"
                  onClick={() => fetchStudents(true)}
                  disabled={refreshing}
                  title="Refresh"
                >
                  <FiRefreshCw
                    className={
                      refreshing ? "spinning" : ""
                    }
                  />
                </button>
              </div>

              {error && (
                <div className="students-error">
                  <FiAlertCircle />
                  <span>{error}</span>

                  <button
                    type="button"
                    onClick={() => fetchStudents()}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {loading ? (
                <div className="students-loading">
                  <div className="students-loader" />
                  <span>Loading classes...</span>
                </div>
              ) : (
                <div className="students-class-grid">
                  {classCards.map((item) => (
                    <button
                      key={item.className}
                      type="button"
                      className="students-class-card"
                      onClick={() =>
                        openClassStudents(
                          item.className
                        )
                      }
                    >
                      <div className="students-class-card-top">
                        <span className="students-class-icon">
                          <FiUsers />
                        </span>

                        <FiChevronRight />
                      </div>

                      <h3>
                        {getClassLabel(item.className)}
                      </h3>

                      <p>
                        {item.total}{" "}
                        {item.total === 1
                          ? "Student"
                          : "Students"}
                      </p>

                      <div className="students-class-card-stats">
                        <span>
                          <strong>{item.active}</strong>
                          Active
                        </span>

                        <span>
                          <strong>{item.inactive}</strong>
                          Inactive
                        </span>
                      </div>

                      <div className="students-class-card-footer">
                        View Students
                        <FiChevronRight />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {selectedClass && (
            <>
              <div className="students-class-backbar">
                <button
                  type="button"
                  onClick={goBackToClasses}
                >
                  <FiChevronLeft />
                  All Classes
                </button>

                <div>
                  <span>CLASS STUDENTS</span>

                  <strong>
                    {getClassLabel(selectedClass)}
                  </strong>
                </div>

                <p>
                  {selectedClassStudents.length}{" "}
                  {selectedClassStudents.length === 1
                    ? "student"
                    : "students"}
                </p>
              </div>

              <section className="students-card">
                <div className="students-toolbar">
                  <div className="students-search">
                    <FiSearch />

                    <input
                      type="text"
                      placeholder="Search name, roll no, admission no..."
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                    />
                  </div>

                  <div className="students-toolbar-right">
                    <span className="students-roll-note">
                      Roll No. wise list
                    </span>

                    <div className="students-filters">
                      <select
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(
                            event.target.value
                          )
                        }
                      >
                        <option value="All">
                          All Status
                        </option>

                        <option value="Active">
                          Active
                        </option>

                        <option value="Inactive">
                          Inactive
                        </option>
                      </select>

                      <button
                        type="button"
                        className="print-students-button"
                        onClick={handlePrint}
                        disabled={
                          loading ||
                          refreshing ||
                          statusUpdatingId !== null ||
                          sortedStudents.length === 0
                        }
                      >
                        <FiPrinter />
                        Print
                      </button>

                      <button
                        type="button"
                        className="refresh-students-button"
                        onClick={() =>
                          fetchStudents(true)
                        }
                        disabled={refreshing}
                        title="Refresh"
                      >
                        <FiRefreshCw
                          className={
                            refreshing
                              ? "spinning"
                              : ""
                          }
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="students-error">
                    <FiAlertCircle />
                    <span>{error}</span>

                    <button
                      type="button"
                      onClick={() => fetchStudents()}
                    >
                      Try Again
                    </button>
                  </div>
                )}

                <div className="students-table-wrapper">
                  {loading ? (
                    <div className="students-loading">
                      <div className="students-loader" />
                      <span>Loading students...</span>
                    </div>
                  ) : paginatedStudents.length === 0 ? (
                    <div className="students-empty">
                      <div className="students-empty-icon">
                        <FiUsers />
                      </div>

                      <h3>
                        {selectedClassStudents.length ===
                        0
                          ? `No students in ${getClassLabel(
                              selectedClass
                            )} yet`
                          : "No students found"}
                      </h3>

                      <p>
                        {selectedClassStudents.length ===
                        0
                          ? "Add students to see them here."
                          : "Try changing search or status filter."}
                      </p>

                      <button
                        type="button"
                        onClick={openAddForm}
                      >
                        <FiPlus />
                        Add Student
                      </button>
                    </div>
                  ) : (
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Admission No.</th>
                          <th>Class</th>
                          <th>Father Name</th>
                          <th>Phone</th>
                          <th>Admission Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedStudents.map(
                          (student) => {
                            const isActive =
                              String(
                                student.status || ""
                              )
                                .trim()
                                .toLowerCase() ===
                              "active";

                            return (
                              <tr key={student._id}>
                                <td>
                                  <div className="student-info">
                                    <div className="student-table-avatar">
                                      {student.profilePhoto ? (
                                        <img
                                          src={
                                            student.profilePhoto
                                          }
                                          alt={
                                            student.name ||
                                            "Student"
                                          }
                                          className="student-table-avatar-img"
                                        />
                                      ) : (
                                        getInitials(
                                          student.name
                                        )
                                      )}
                                    </div>

                                    <div>
                                      <strong>
                                        {student.name ||
                                          "-"}
                                      </strong>

                                      <span>
                                        Roll No:{" "}
                                        {student.rollNo ||
                                          "-"}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  <span className="admission-number">
                                    {student.admissionNo ||
                                      "-"}
                                  </span>
                                </td>

                                <td>
                                  <div className="class-info">
                                    <strong>
                                      {getClassLabel(
                                        student.className
                                      )}
                                    </strong>
                                  </div>
                                </td>

                                <td>
                                  {student.fatherName ||
                                    "-"}
                                </td>

                                <td>
                                  {student.phone || "-"}
                                </td>

                                <td>
                                  {formatDate(
                                    student.admissionDate
                                  )}
                                </td>

                                <td>
                                  <button
                                    type="button"
                                    className={`student-status student-status-toggle ${
                                      isActive
                                        ? "active"
                                        : "inactive"
                                    }`}
                                    onClick={() =>
                                      handleToggleStatus(
                                        student
                                      )
                                    }
                                    disabled={
                                      statusUpdatingId !==
                                      null
                                    }
                                  >
                                    <span />

                                    {statusUpdatingId ===
                                    student._id
                                      ? "Updating..."
                                      : student.status ||
                                        "Inactive"}
                                  </button>
                                </td>

                                <td>
                                  <div className="student-actions">
                                    <button
                                      type="button"
                                      className="edit-student"
                                      onClick={() =>
                                        openEditForm(
                                          student
                                        )
                                      }
                                      title="Edit Student"
                                    >
                                      <FiEdit2 />
                                    </button>

                                    <button
                                      type="button"
                                      className="delete-student"
                                      onClick={() =>
                                        setDeleteStudent(
                                          student
                                        )
                                      }
                                      title="Delete Student"
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {!loading &&
                  sortedStudents.length > 0 && (
                    <div className="students-pagination">
                      <span>
                        Showing{" "}
                        <strong>
                          {startIndex + 1}-
                          {Math.min(
                            startIndex +
                              studentsPerPage,
                            sortedStudents.length
                          )}
                        </strong>{" "}
                        of{" "}
                        <strong>
                          {sortedStudents.length}
                        </strong>{" "}
                        students
                      </span>

                      <div className="pagination-buttons">
                        <button
                          type="button"
                          disabled={
                            safeCurrentPage === 1
                          }
                          onClick={() =>
                            setCurrentPage(
                              (page) => page - 1
                            )
                          }
                        >
                          <FiChevronLeft />
                        </button>

                        {Array.from(
                          {
                            length: totalPages,
                          },
                          (_, index) => index + 1
                        ).map((page) => (
                          <button
                            key={page}
                            type="button"
                            className={
                              page === safeCurrentPage
                                ? "active"
                                : ""
                            }
                            onClick={() =>
                              setCurrentPage(page)
                            }
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          type="button"
                          disabled={
                            safeCurrentPage ===
                            totalPages
                          }
                          onClick={() =>
                            setCurrentPage(
                              (page) => page + 1
                            )
                          }
                        >
                          <FiChevronRight />
                        </button>
                      </div>
                    </div>
                  )}
              </section>
            </>
          )}
        </div>
      </main>

      {showForm && (
        <div className="student-modal-overlay">
          <div className="student-modal">
            <div className="student-modal-header">
              <div>
                <span>
                  {editingStudent
                    ? "UPDATE RECORD"
                    : "NEW RECORD"}
                </span>

                <h2>
                  {editingStudent
                    ? "Edit Student"
                    : "Add Student"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={formLoading}
              >
                <FiX />
              </button>
            </div>

            {formError && (
              <div className="student-form-error">
                <FiAlertCircle />
                <span>{formError}</span>
              </div>
            )}

            <form
              className="student-form"
              onSubmit={handleSubmit}
            >
              <div className="student-form-grid">
                <div className="student-form-group">
                  <label>
                    Roll No <span>*</span>
                  </label>

                  <input
                    name="rollNo"
                    type="text"
                    placeholder="e.g. 001"
                    value={formData.rollNo}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                </div>

                <div className="student-form-group">
                  <label>Admission No.</label>

                  <input
                    name="admissionNo"
                    type="text"
                    placeholder="ADM-2026-001"
                    value={formData.admissionNo}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    Student Name <span>*</span>
                  </label>

                  <input
                    name="name"
                    type="text"
                    placeholder="Enter student name"
                    value={formData.name}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    Father Name <span>*</span>
                  </label>

                  <input
                    name="fatherName"
                    type="text"
                    placeholder="Enter father name"
                    value={formData.fatherName}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    Gender <span>*</span>
                  </label>

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  >
                    <option value="">
                      Select gender
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

                <div className="student-form-group">
                  <label>Date of Birth</label>

                  <input
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    Class <span>*</span>
                  </label>

                  <select
                    name="className"
                    value={formData.className}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  >
                    <option value="">
                      Select class
                    </option>

                    {classOptions.map((className) => (
                      <option
                        key={className}
                        value={className}
                      >
                        {getClassLabel(className)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="student-form-group">
                  <label>Phone</label>

                  <input
                    name="phone"
                    type="tel"
                    placeholder="03XX-XXXXXXX"
                    value={formData.phone}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    Admission Date <span>*</span>
                  </label>

                  <input
                    name="admissionDate"
                    type="date"
                    value={formData.admissionDate}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  />
                </div>

                <div className="student-form-group">
                  <label>Status</label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    disabled={formLoading}
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </div>

                <div className="student-form-group student-form-full">
                  <label>
                    Student Photo (Optional)
                  </label>

                  <div className="student-photo-wrapper">
                    {formData.profilePhoto ? (
                      <>
                        <img
                          src={formData.profilePhoto}
                          alt="Student Preview"
                          className="student-photo-preview"
                        />

                        <button
                          type="button"
                          className="student-photo-remove"
                          onClick={handleRemovePhoto}
                          disabled={formLoading}
                        >
                          <FiX />
                          Remove Photo
                        </button>
                      </>
                    ) : (
                      <div className="student-photo-placeholder">
                        <FiUsers />
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={formLoading}
                    />
                  </div>
                </div>

                <div className="student-form-group student-form-full">
                  <label>Address</label>

                  <textarea
                    name="address"
                    placeholder="Enter student address"
                    value={formData.address}
                    onChange={handleFormChange}
                    disabled={formLoading}
                    rows="3"
                  />
                </div>
              </div>

              <div className="student-form-actions">
                <button
                  type="button"
                  className="cancel-student-button"
                  onClick={closeForm}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-student-button"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <span />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiPlus />

                      {editingStudent
                        ? "Update Student"
                        : "Save Student"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteStudent && (
        <div className="student-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-icon">
              <FiTrash2 />
            </div>

            <h2>Delete Student?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteStudent.name}</strong>?
              This action cannot be undone.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                onClick={() => setDeleteStudent(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT ONLY */}

      <section className="students-print-section">
        <div className="students-print-header">
          <h1>
            Future Skill School and IT Institute
          </h1>

          <p className="students-print-subtitle">
            Student List
          </p>
        </div>

        <p>
          <strong>Class:</strong>{" "}
          {selectedClass
            ? getClassLabel(selectedClass)
            : "All Classes"}
          {" | "}
          <strong>Status:</strong> {statusFilter}
          {" | "}
          <strong>Total Students:</strong>{" "}
          {sortedStudents.length}
        </p>

        {search.trim() && (
          <p>
            <strong>Search:</strong>{" "}
            {search.trim()}
          </p>
        )}

        <table className="students-print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Roll No.</th>
              <th>Student Name</th>
              <th>Father Name</th>
              <th>Class</th>
              <th>Admission No.</th>
              <th>Phone</th>
              <th>Admission Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {sortedStudents.map((student, index) => (
              <tr key={student._id}>
                <td>{index + 1}</td>
                <td>{student.rollNo || "-"}</td>
                <td>{student.name || "-"}</td>
                <td>{student.fatherName || "-"}</td>
                <td>
                  {getClassLabel(student.className)}
                </td>
                <td>
                  {student.admissionNo || "-"}
                </td>
                <td>{student.phone || "-"}</td>
                <td>
                  {formatDate(student.admissionDate)}
                </td>
                <td>{student.status || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="students-print-footer">
          Printed on:{" "}
          {new Date().toLocaleString("en-GB")}
        </div>
      </section>
    </div>
  );
};

export default Students;
