import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/ITCourses.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const ITEMS_PER_PAGE = 8;

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const initialForm = {
  courseName: "",
  durationMonths: "",
  totalFee: "",
  monthlyInstallment: "",
  instructor: "",
};

const emptyStudentForm = {
  name: "",
  fatherName: "",
  phone: "",
  courseId: "",
  startDate: new Date().toISOString().slice(0, 10),
  totalFee: "",
  initialPayment: "",
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const addMonthsStr = (dateStr, months) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + Number(months || 0));
  return d.toISOString().slice(0, 10);
};

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;

const formatDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = String(d).split("-");
  return `${day} ${MONTHS_SHORT[Number(m) - 1] || m} ${y}`;
};

const ITCourses = () => {
  const [tab, setTab] = useState("courses");

  // ==================== COURSES STATE ====================
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ==================== STUDENTS STATE ====================
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [studentFormError, setStudentFormError] = useState("");
  const [savingStudent, setSavingStudent] = useState(false);

  const [detailStudent, setDetailStudent] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    date: todayStr(),
    note: "",
    monthIndex: "0",
  });
  const [paymentError, setPaymentError] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const [deleteStudentModalOpen, setDeleteStudentModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // ==================== FETCH ====================

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_URL}/api/it-courses`, { withCredentials: true });
      if (response.data.success) {
        setCourses(response.data.courses || []);
      } else {
        setError(response.data.message || "Failed to load courses.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load IT courses.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await axios.get(`${API_URL}/api/it-students`, { withCredentials: true });
      if (response.data.success) {
        setStudents(response.data.students || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load IT students.");
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  // ==================== COURSES: SEARCH / PAGINATION ====================

  const filteredCourses = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    if (!searchValue) return courses;
    return courses.filter((course) => {
      const searchableText = [course.courseName, course.instructor]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(searchValue);
    });
  }, [courses, search]);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // ==================== STUDENTS: SEARCH / PAGINATION ====================

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const text = [s.name, s.fatherName, s.courseName, s.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [students, studentSearch]);

  useEffect(() => { setStudentPage(1); }, [studentSearch]);

  const studentTotalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));

  const paginatedStudents = filteredStudents.slice(
    (studentPage - 1) * ITEMS_PER_PAGE,
    studentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (studentPage > studentTotalPages) setStudentPage(studentTotalPages);
  }, [studentPage, studentTotalPages]);

  // ==================== SUMMARY ====================

  const totalCourses = courses.length;

  const totalInstructors = new Set(
    courses.map((c) => c.instructor?.trim()).filter(Boolean)
  ).size;

  const totalMonthlyValue = courses.reduce(
    (sum, c) => sum + Number(c.monthlyInstallment || 0), 0
  );

  const totalCourseValue = courses.reduce(
    (sum, c) => sum + Number(c.totalFee || 0), 0
  );

  const activeStudents = students.filter((s) => s.derivedStatus === "Active").length;
  const completedStudents = students.filter((s) => s.derivedStatus === "Completed").length;
  const pendingFeeTotal = students
    .filter((s) => s.derivedStatus !== "Completed" || Number(s.remainingAmount) > 0)
    .reduce((sum, s) => sum + Number(s.remainingAmount || 0), 0);

  // ==================== COURSE MODALS ====================

  const openAddModal = () => {
    setEditingCourse(null);
    setForm(initialForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setForm({
      courseName: course.courseName || "",
      durationMonths: String(course.durationMonths ?? ""),
      totalFee: String(course.totalFee ?? ""),
      monthlyInstallment: String(course.monthlyInstallment ?? ""),
      instructor: course.instructor || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingCourse(null);
    setForm(initialForm);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const months = Number(form.durationMonths);

    if (!form.courseName.trim() || !Number.isFinite(months) || months < 1 || form.totalFee === "") {
      setFormError("Please fill course name, duration (min 1 month) and total fee.");
      return;
    }

    if (
      !Number.isFinite(Number(form.totalFee)) ||
      Number(form.totalFee) < 0 ||
      (form.monthlyInstallment !== "" &&
        (!Number.isFinite(Number(form.monthlyInstallment)) ||
          Number(form.monthlyInstallment) < 0))
    ) {
      setFormError("Please enter valid course fees.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        courseName: form.courseName.trim(),
        durationMonths: months,
        totalFee: Number(form.totalFee),
        monthlyInstallment: Number(form.monthlyInstallment || 0),
        instructor: form.instructor.trim(),
      };

      let response;

      if (editingCourse) {
        response = await axios.put(
          `${API_URL}/api/it-courses/${editingCourse._id}`,
          payload,
          { withCredentials: true }
        );
      } else {
        response = await axios.post(`${API_URL}/api/it-courses`, payload, { withCredentials: true });
      }

      if (response.data.success) {
        setIsModalOpen(false);
        setEditingCourse(null);
        setForm(initialForm);
        await fetchCourses();
      } else {
        setFormError(response.data.message || "Failed to save course.");
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save course.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (course) => {
    setDeletingCourse(course);
    setIsDeleteModalOpen(true);
    setError("");
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeletingCourse(null);
    setIsDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingCourse) return;
    try {
      setDeleting(true);
      setError("");
      const response = await axios.delete(`${API_URL}/api/it-courses/${deletingCourse._id}`, { withCredentials: true });
      if (response.data.success) {
        setIsDeleteModalOpen(false);
        setDeletingCourse(null);
        await fetchCourses();
      } else {
        setError(response.data.message || "Failed to delete course.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete course.");
      setIsDeleteModalOpen(false);
      setDeletingCourse(null);
    } finally {
      setDeleting(false);
    }
  };

  // ==================== STUDENT MODALS ====================

  const openAddStudentModal = () => {
    setEditingStudent(null);
    setStudentForm(emptyStudentForm);
    setStudentFormError("");
    setStudentModalOpen(true);
  };

  const openEditStudentModal = (s) => {
    setEditingStudent(s);
    setStudentForm({
      name: s.name || "",
      fatherName: s.fatherName || "",
      phone: s.phone || "",
      courseId: String(s.courseId || ""),
      startDate: s.startDate || todayStr(),
      totalFee: String(s.totalFee ?? ""),
      initialPayment: "",
    });
    setStudentFormError("");
    setStudentModalOpen(true);
  };

  const closeStudentModal = () => {
    if (savingStudent) return;
    setStudentModalOpen(false);
    setEditingStudent(null);
    setStudentForm(emptyStudentForm);
    setStudentFormError("");
  };

  const handleStudentFormChange = (event) => {
    const { name, value } = event.target;

    setStudentForm((previous) => {
      const next = { ...previous, [name]: value };

      if (name === "courseId") {
        const course = courses.find((c) => String(c._id) === String(value));
        next.totalFee = course ? String(course.totalFee ?? "") : "";
      }

      return next;
    });
  };

  const formCourse = courses.find(
    (c) => String(c._id) === String(studentForm.courseId)
  );

  const previewEndDate =
    formCourse && studentForm.startDate
      ? addMonthsStr(studentForm.startDate, formCourse.durationMonths)
      : "";

  const handleStudentSubmit = async (event) => {
    event.preventDefault();
    setStudentFormError("");

    if (!studentForm.name.trim() || !studentForm.courseId || !studentForm.startDate) {
      setStudentFormError("Name, course and start date are required.");
      return;
    }

    const fee = Number(studentForm.totalFee);
    if (!Number.isFinite(fee) || fee < 0) {
      setStudentFormError("Enter a valid total fee.");
      return;
    }

    const initPay = Number(studentForm.initialPayment || 0);
    if (studentForm.initialPayment !== "" && (!Number.isFinite(initPay) || initPay < 0)) {
      setStudentFormError("Enter a valid initial payment.");
      return;
    }
    if (initPay > fee) {
      setStudentFormError("Initial payment cannot exceed total fee.");
      return;
    }

    try {
      setSavingStudent(true);

      const payload = {
        name: studentForm.name.trim(),
        fatherName: studentForm.fatherName.trim(),
        phone: studentForm.phone.trim(),
        courseId: studentForm.courseId,
        startDate: studentForm.startDate,
        totalFee: fee,
        initialPayment: initPay,
      };

      let response;

      if (editingStudent) {
        response = await axios.put(
          `${API_URL}/api/it-students/${editingStudent._id}`,
          payload,
          { withCredentials: true }
        );
      } else {
        response = await axios.post(`${API_URL}/api/it-students`, payload, { withCredentials: true });
      }

      if (response.data.success) {
        setStudentModalOpen(false);
        setEditingStudent(null);
        setStudentForm(emptyStudentForm);
        await fetchStudents();
      } else {
        setStudentFormError(response.data.message || "Failed to save student.");
      }
    } catch (err) {
      setStudentFormError(err.response?.data?.message || "Failed to save student.");
    } finally {
      setSavingStudent(false);
    }
  };

  // ==================== DETAIL / PAYMENTS ====================

  const openDetail = (s) => {
    setDetailStudent(s);
    const firstUnpaid = (s.schedule || []).find((slot) => slot.remaining > 0);
    setPaymentForm({
      amount: firstUnpaid ? String(firstUnpaid.remaining) : "",
      date: todayStr(),
      note: "",
      monthIndex: firstUnpaid ? String(firstUnpaid.index) : "0",
    });
    setPaymentError("");
  };

  const closeDetail = () => {
    setDetailStudent(null);
    setPaymentError("");
  };

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((previous) => {
      const next = { ...previous, [name]: value };

      if (name === "monthIndex" && detailStudent) {
        const slot = (detailStudent.schedule || []).find(
          (x) => String(x.index) === String(value)
        );
        next.amount = slot ? String(slot.remaining) : "";
      }

      return next;
    });
  };

  const handleAddPayment = async () => {
    if (!detailStudent) return;

    const amt = Number(paymentForm.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setPaymentError("Enter a valid amount.");
      return;
    }

    const mi = Number(paymentForm.monthIndex);
    if (!Number.isInteger(mi) || mi < 0) {
      setPaymentError("Select a valid month.");
      return;
    }

    try {
      setSavingPayment(true);
      setPaymentError("");

      const response = await axios.post(
        `${API_URL}/api/it-students/${detailStudent._id}/payments`,
        {
          amount: amt,
          date: paymentForm.date,
          note: paymentForm.note,
          monthIndex: mi,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setDetailStudent(response.data.student);

        const updated = response.data.student;
        const firstUnpaid = (updated.schedule || []).find((slot) => slot.remaining > 0);
        setPaymentForm({
          amount: firstUnpaid ? String(firstUnpaid.remaining) : "",
          date: todayStr(),
          note: "",
          monthIndex: firstUnpaid ? String(firstUnpaid.index) : "0",
        });

        await fetchStudents();
      } else {
        setPaymentError(response.data.message || "Failed to add payment.");
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || "Failed to add payment.");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!detailStudent) return;
    try {
      setSavingPayment(true);
      const response = await axios.delete(
        `${API_URL}/api/it-students/${detailStudent._id}/payments/${paymentId}`,
        { withCredentials: true }
      );
      if (response.data.success) {
        setDetailStudent(response.data.student);
        await fetchStudents();
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || "Failed to delete payment.");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSetStatus = async (studentId, status) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/it-students/${studentId}/status`,
        { status },
        { withCredentials: true }
      );
      if (response.data.success) {
        if (detailStudent && String(detailStudent._id) === String(studentId)) {
          setDetailStudent(response.data.student);
        }
        await fetchStudents();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    }
  };

  // ==================== STUDENT DELETE ====================

  const openDeleteStudentModal = (s) => {
    setStudentToDelete(s);
    setDeleteStudentModalOpen(true);
  };

  const closeDeleteStudentModal = () => {
    if (deletingStudent) return;
    setStudentToDelete(null);
    setDeleteStudentModalOpen(false);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      setDeletingStudent(true);
      const response = await axios.delete(
        `${API_URL}/api/it-students/${studentToDelete._id}`,
        { withCredentials: true }
      );
      if (response.data.success) {
        setDeleteStudentModalOpen(false);
        setStudentToDelete(null);
        await fetchStudents();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete student.");
      setDeleteStudentModalOpen(false);
      setStudentToDelete(null);
    } finally {
      setDeletingStudent(false);
    }
  };

  // ==================== BADGE HELPERS ====================

  const getFeeBadge = (s) => {
    if (Number(s.remainingAmount) <= 0) {
      return <span className="itc-badge itc-fee-paid">Paid</span>;
    }
    if (Number(s.paidAmount) > 0) {
      return <span className="itc-badge itc-fee-partial">Partial</span>;
    }
    return <span className="itc-badge itc-fee-unpaid">Unpaid</span>;
  };

  const getStatusBadge = (s) => {
    if (s.derivedStatus === "Completed") {
      return (
        <span className="itc-badge itc-completed">
          {s.autoCompleted && s.status !== "Completed" ? "Completed (auto)" : "Completed"}
        </span>
      );
    }
    return <span className="itc-badge itc-active">Active</span>;
  };

  const getScheduleBadge = (status) => {
    if (status === "Paid") return <span className="itc-badge itc-slot-paid">Paid</span>;
    if (status === "Partial") return <span className="itc-badge itc-slot-partial">Partial</span>;
    if (status === "Due") return <span className="itc-badge itc-slot-due">Due</span>;
    return <span className="itc-badge itc-slot-upcoming">Upcoming</span>;
  };

  const getDaysLeftText = (s) => {
    if (s.derivedStatus === "Completed") return "Course completed";
    if (s.daysLeft >= 0) {
      return s.daysLeft === 0 ? "Ends today" : `${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"} left`;
    }
    return `${Math.abs(s.daysLeft)} day${Math.abs(s.daysLeft) === 1 ? "" : "s"} over`;
  };

  return (
    <div className="attendance-page it-courses-page">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <div
          className="attendance-mobile-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="attendance-main">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="attendance-content">
          {/* HEADER */}

          <div className="attendance-page-header">
            <div>
              <span className="attendance-eyebrow">
                IT CENTER MANAGEMENT
              </span>
              <h1>IT Courses</h1>
              <p>
                {tab === "courses"
                  ? "Manage IT courses, instructors and course fees."
                  : "Admitted students, monthly fee schedule and payments."}
              </p>
            </div>

            {tab === "courses" ? (
              <button
                type="button"
                className="attendance-add-button"
                onClick={openAddModal}
              >
                <FiPlus />
                Add Course
              </button>
            ) : (
              <button
                type="button"
                className="attendance-add-button"
                onClick={openAddStudentModal}
                disabled={courses.length === 0}
              >
                <FiPlus />
                Add Student
              </button>
            )}
          </div>

          {/* TABS */}

          <div className="itc-tabs">
            <button
              type="button"
              className={tab === "courses" ? "active" : ""}
              onClick={() => setTab("courses")}
            >
              <FiBookOpen />
              Courses
            </button>
            <button
              type="button"
              className={tab === "students" ? "active" : ""}
              onClick={() => setTab("students")}
            >
              <FiUsers />
              Students
            </button>
          </div>

          {error && (
            <div className="attendance-error" role="alert">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Close error"
              >
                <FiX />
              </button>
            </div>
          )}

          {/* ==================== COURSES TAB ==================== */}

          {tab === "courses" && (
            <>
              <div className="attendance-stats">
                <div className="attendance-stat-card">
                  <div className="attendance-stat-icon">
                    <FiBookOpen />
                  </div>
                  <div>
                    <span>Total Courses</span>
                    <strong>{totalCourses}</strong>
                  </div>
                </div>

                <div className="attendance-stat-card">
                  <div className="attendance-stat-icon present">
                    <FiUser />
                  </div>
                  <div>
                    <span>Total Instructors</span>
                    <strong>{totalInstructors}</strong>
                  </div>
                </div>

                <div className="attendance-stat-card">
                  <div className="attendance-stat-icon absent">
                    <FiClock />
                  </div>
                  <div>
                    <span>Total Monthly Fees</span>
                    <strong>{formatCurrency(totalMonthlyValue)}</strong>
                  </div>
                </div>

                <div className="attendance-stat-card">
                  <div className="attendance-stat-icon late">
                    <FiDollarSign />
                  </div>
                  <div>
                    <span>Total Course Fees</span>
                    <strong>{formatCurrency(totalCourseValue)}</strong>
                  </div>
                </div>
              </div>

              <section className="attendance-card">
                <div className="attendance-toolbar">
                  <div className="attendance-search">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search course or instructor..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>

                  <div className="attendance-filters">
                    <button
                      type="button"
                      className="attendance-refresh"
                      onClick={fetchCourses}
                      disabled={loading}
                      aria-label="Refresh courses"
                    >
                      <FiRefreshCw
                        className={loading ? "attendance-refresh-spin" : ""}
                      />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="attendance-loading">
                    <div className="attendance-loader" />
                    <span>Loading IT courses...</span>
                  </div>
                ) : paginatedCourses.length === 0 ? (
                  <div className="attendance-empty">
                    <div className="attendance-empty-icon">
                      <FiBookOpen />
                    </div>
                    <h3>
                      {courses.length === 0
                        ? "No IT courses yet"
                        : "No matching courses"}
                    </h3>
                    <p>
                      {courses.length === 0
                        ? "Add your first IT course to get started."
                        : "Try changing your search."}
                    </p>
                    {courses.length === 0 && (
                      <button type="button" onClick={openAddModal}>
                        <FiPlus />
                        Add Course
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="attendance-table-wrapper">
                      <table className="attendance-table it-courses-table">
                        <thead>
                          <tr>
                            <th>COURSE</th>
                            <th>DURATION</th>
                            <th>TOTAL FEE</th>
                            <th>MONTHLY FEE</th>
                            <th>INSTRUCTOR</th>
                            <th>STUDENTS</th>
                            <th>ACTIONS</th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedCourses.map((course) => {
                            const enrolled = students.filter(
                              (s) => String(s.courseId) === String(course._id) && s.derivedStatus !== "Completed"
                            ).length;

                            return (
                              <tr key={course._id}>
                                <td>
                                  <div className="attendance-student">
                                    <div className="attendance-avatar">
                                      <FiBookOpen />
                                    </div>
                                    <div>
                                      <strong>{course.courseName}</strong>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  {course.durationMonths
                                    ? `${course.durationMonths} Month${course.durationMonths === 1 ? "" : "s"}`
                                    : "—"}
                                </td>

                                <td>
                                  <strong className="it-course-fee">
                                    {formatCurrency(course.totalFee)}
                                  </strong>
                                </td>

                                <td>
                                  {Number(course.monthlyInstallment) > 0
                                    ? formatCurrency(course.monthlyInstallment)
                                    : "—"}
                                </td>

                                <td>{course.instructor || "—"}</td>

                                <td>
                                  <span className="itc-enrolled-count">
                                    {enrolled}
                                  </span>
                                </td>

                                <td>
                                  <div className="attendance-actions">
                                    <button
                                      type="button"
                                      className="attendance-edit-button"
                                      onClick={() => openEditModal(course)}
                                      aria-label="Edit course"
                                    >
                                      <FiEdit2 />
                                    </button>

                                    <button
                                      type="button"
                                      className="attendance-delete-button"
                                      onClick={() => openDeleteModal(course)}
                                      aria-label="Delete course"
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="attendance-pagination">
                      <span>
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length)}{" "}
                        of {filteredCourses.length}
                      </span>

                      <div>
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((page) => page - 1)}
                        >
                          Previous
                        </button>

                        <span className="attendance-page-number">
                          {currentPage} / {totalPages}
                        </span>

                        <button
                          type="button"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((page) => page + 1)}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </>
          )}

          {/* ==================== STUDENTS TAB ==================== */}

          {tab === "students" && (
            <>
              <div className="attendance-stats">
                <div className="attendance-stat-card">
                  <div className="attendance-stat-icon">
                    <FiUsers />
                  </div>
                  <div>
                    <span>Total Students</span>
                    <strong>{students.length}</strong>
                  </div>
                </div>

                <div className="attendance-stat-card">
                  <div className="attendance-stat-icon present">
                    <FiCheckCircle />
                  </div>
                  <div>
                    <span>Active</span>
                    <strong>{activeStudents}</strong>
                  </div>
                </div>

                <div className="attendance-stat-card">
                  <div className="attendance-stat-icon absent">
                    <FiClock />
                  </div>
                  <div>
                    <span>Completed</span>
                    <strong>{completedStudents}</strong>
                  </div>
                </div>

                <div className="attendance-stat-card">
                  <div className="attendance-stat-icon late">
                    <FiDollarSign />
                  </div>
                  <div>
                    <span>Pending Fees</span>
                    <strong>{formatCurrency(pendingFeeTotal)}</strong>
                  </div>
                </div>
              </div>

              <section className="attendance-card">
                <div className="attendance-toolbar">
                  <div className="attendance-search">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search student, course or phone..."
                      value={studentSearch}
                      onChange={(event) => setStudentSearch(event.target.value)}
                    />
                  </div>

                  <div className="attendance-filters">
                    <button
                      type="button"
                      className="attendance-refresh"
                      onClick={fetchStudents}
                      disabled={studentsLoading}
                      aria-label="Refresh students"
                    >
                      <FiRefreshCw
                        className={studentsLoading ? "attendance-refresh-spin" : ""}
                      />
                    </button>
                  </div>
                </div>

                {studentsLoading ? (
                  <div className="attendance-loading">
                    <div className="attendance-loader" />
                    <span>Loading students...</span>
                  </div>
                ) : paginatedStudents.length === 0 ? (
                  <div className="attendance-empty">
                    <div className="attendance-empty-icon">
                      <FiUsers />
                    </div>
                    <h3>
                      {students.length === 0
                        ? "No students admitted yet"
                        : "No matching students"}
                    </h3>
                    <p>
                      {students.length === 0
                        ? "Admit your first IT student to get started."
                        : "Try changing your search."}
                    </p>
                    {students.length === 0 && courses.length > 0 && (
                      <button type="button" onClick={openAddStudentModal}>
                        <FiPlus />
                        Add Student
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="attendance-table-wrapper">
                      <table className="attendance-table it-courses-table itc-students-table">
                        <thead>
                          <tr>
                            <th>STUDENT</th>
                            <th>COURSE</th>
                            <th>PROGRESS</th>
                            <th>NEXT DUE</th>
                            <th>FEE</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedStudents.map((s) => (
                            <tr key={s._id}>
                              <td>
                                <div className="attendance-student">
                                  <div className="attendance-avatar">
                                    <FiUser />
                                  </div>
                                  <div>
                                    <strong>{s.name}</strong>
                                    <span>{s.fatherName || s.phone || "—"}</span>
                                  </div>
                                </div>
                              </td>

                              <td>{s.courseName || "—"}</td>

                              <td>
                                <div className="itc-progress-wrap">
                                  <div className="itc-progress">
                                    <span
                                      style={{ width: `${s.progressPercent}%` }}
                                    />
                                  </div>
                                  <span className="itc-progress-text">
                                    {s.durationMonths
                                      ? `${Math.round((s.progressPercent / 100) * s.durationMonths)}/${s.durationMonths} months`
                                      : "—"}
                                  </span>
                                </div>
                              </td>

                              <td>
                                {s.nextDue ? (
                                  <div className="itc-nextdue-cell">
                                    <strong>{s.nextDue.label}</strong>
                                    <span>
                                      {formatDate(s.nextDue.start)} · {formatCurrency(s.nextDue.amount)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="itc-fully-paid">Fully Paid</span>
                                )}
                              </td>

                              <td>
                                <div className="itc-fee-cell">
                                  <strong>
                                    {formatCurrency(s.paidAmount)} / {formatCurrency(s.totalFee)}
                                  </strong>
                                  {getFeeBadge(s)}
                                </div>
                              </td>

                              <td>{getStatusBadge(s)}</td>

                              <td>
                                <div className="attendance-actions">
                                  <button
                                    type="button"
                                    className="attendance-edit-button"
                                    onClick={() => openDetail(s)}
                                    aria-label="View student and payments"
                                    title="View / Payments"
                                  >
                                    <FiEye />
                                  </button>

                                  <button
                                    type="button"
                                    className="attendance-edit-button"
                                    onClick={() => openEditStudentModal(s)}
                                    aria-label="Edit student"
                                  >
                                    <FiEdit2 />
                                  </button>

                                  <button
                                    type="button"
                                    className="attendance-delete-button"
                                    onClick={() => openDeleteStudentModal(s)}
                                    aria-label="Delete student"
                                  >
                                    <FiTrash2 />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="attendance-pagination">
                      <span>
                        Showing {(studentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                        {Math.min(studentPage * ITEMS_PER_PAGE, filteredStudents.length)}{" "}
                        of {filteredStudents.length}
                      </span>

                      <div>
                        <button
                          type="button"
                          disabled={studentPage === 1}
                          onClick={() => setStudentPage((page) => page - 1)}
                        >
                          Previous
                        </button>

                        <span className="attendance-page-number">
                          {studentPage} / {studentTotalPages}
                        </span>

                        <button
                          type="button"
                          disabled={studentPage === studentTotalPages}
                          onClick={() => setStudentPage((page) => page + 1)}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* ==================== ADD / EDIT COURSE MODAL ==================== */}

      {isModalOpen && (
        <div className="attendance-modal-overlay">
          <div className="attendance-modal">
            <div className="attendance-modal-header">
              <div>
                <span>IT COURSE MANAGEMENT</span>
                <h2>
                  {editingCourse ? "Edit Course" : "Add New Course"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>

            <form className="attendance-form" onSubmit={handleSubmit}>
              {formError && (
                <div className="attendance-form-error">
                  {formError}
                </div>
              )}

              <div className="attendance-form-grid">
                <div className="attendance-form-group">
                  <label htmlFor="courseName">Course Name *</label>
                  <input
                    id="courseName"
                    name="courseName"
                    type="text"
                    value={form.courseName}
                    onChange={handleFormChange}
                    placeholder="Web Development"
                    disabled={saving}
                    required
                  />
                </div>

                <div className="attendance-form-group">
                  <label htmlFor="durationMonths">Duration (Months) *</label>
                  <input
                    id="durationMonths"
                    name="durationMonths"
                    type="number"
                    min="1"
                    value={form.durationMonths}
                    onChange={handleFormChange}
                    placeholder="4"
                    disabled={saving}
                    required
                  />
                </div>

                <div className="attendance-form-group">
                  <label htmlFor="totalFee">Total Course Fee *</label>
                  <input
                    id="totalFee"
                    name="totalFee"
                    type="number"
                    min="0"
                    value={form.totalFee}
                    onChange={handleFormChange}
                    placeholder="30000"
                    disabled={saving}
                    required
                  />
                </div>

                <div className="attendance-form-group">
                  <label htmlFor="monthlyInstallment">
                    Monthly Installment
                  </label>
                  <input
                    id="monthlyInstallment"
                    name="monthlyInstallment"
                    type="number"
                    min="0"
                    value={form.monthlyInstallment}
                    onChange={handleFormChange}
                    placeholder="5000"
                    disabled={saving}
                  />
                </div>

                <div className="attendance-form-group">
                  <label htmlFor="instructor">Instructor</label>
                  <input
                    id="instructor"
                    name="instructor"
                    type="text"
                    value={form.instructor}
                    onChange={handleFormChange}
                    placeholder="Instructor name"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="attendance-modal-actions">
                <button
                  type="button"
                  className="attendance-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="attendance-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="attendance-button-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      {editingCourse ? "Update Course" : "Save Course"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD / EDIT STUDENT MODAL ==================== */}

      {studentModalOpen && (
        <div className="attendance-modal-overlay">
          <div className="attendance-modal">
            <div className="attendance-modal-header">
              <div>
                <span>IT STUDENT ADMISSION</span>
                <h2>
                  {editingStudent ? "Edit Student" : "Admit New Student"}
                </h2>
               
              </div>

              <button
                type="button"
                onClick={closeStudentModal}
                disabled={savingStudent}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>

            <form className="attendance-form" onSubmit={handleStudentSubmit}>
              {studentFormError && (
                <div className="attendance-form-error">
                  {studentFormError}
                </div>
              )}

              <div className="attendance-form-grid">
                <div className="attendance-form-group">
                  <label htmlFor="sname">Student Name *</label>
                  <input
                    id="sname"
                    name="name"
                    type="text"
                    value={studentForm.name}
                    onChange={handleStudentFormChange}
                    placeholder="Student name"
                    disabled={savingStudent}
                    required
                  />
                </div>

                <div className="attendance-form-group">
                  <label htmlFor="sfather">Father Name</label>
                  <input
                    id="sfather"
                    name="fatherName"
                    type="text"
                    value={studentForm.fatherName}
                    onChange={handleStudentFormChange}
                    placeholder="Father name"
                    disabled={savingStudent}
                  />
                </div>

                <div className="attendance-form-group">
                  <label htmlFor="sphone">Phone</label>
                  <input
                    id="sphone"
                    name="phone"
                    type="text"
                    value={studentForm.phone}
                    onChange={handleStudentFormChange}
                    placeholder="03xx-xxxxxxx"
                    disabled={savingStudent}
                  />
                </div>

                <div className="attendance-form-group">
                  <label htmlFor="scourse">Course *</label>
                  <select
                    id="scourse"
                    name="courseId"
                    value={studentForm.courseId}
                    onChange={handleStudentFormChange}
                    disabled={savingStudent}
                    required
                  >
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.courseName} — {c.durationMonths} months — {formatCurrency(c.totalFee)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="attendance-form-group">
                  <label htmlFor="sstart">Start Date *</label>
                  <input
                    id="sstart"
                    name="startDate"
                    type="date"
                    value={studentForm.startDate}
                    onChange={handleStudentFormChange}
                    disabled={savingStudent}
                    required
                  />
                </div>

                <div className="attendance-form-group">
                  <label>End Date (auto)</label>
                  <input
                    type="text"
                    value={previewEndDate ? formatDate(previewEndDate) : "—"}
                    disabled
                    className="itc-readonly-input"
                  />
                </div>

                <div className="attendance-form-group">
                  <label htmlFor="sfee">Total Fee *</label>
                  <input
                    id="sfee"
                    name="totalFee"
                    type="number"
                    min="0"
                    value={studentForm.totalFee}
                    onChange={handleStudentFormChange}
                    placeholder="30000"
                    disabled={savingStudent}
                    required
                  />
                </div>

                {!editingStudent && (
                  <div className="attendance-form-group">
                    <label htmlFor="sinit">
                      Initial Payment (admission pe)
                    </label>
                    <input
                      id="sinit"
                      name="initialPayment"
                      type="number"
                      min="0"
                      value={studentForm.initialPayment}
                      onChange={handleStudentFormChange}
                      placeholder="0"
                      disabled={savingStudent}
                    />
                  </div>
                )}
              </div>

              <div className="attendance-modal-actions">
                <button
                  type="button"
                  className="attendance-cancel-button"
                  onClick={closeStudentModal}
                  disabled={savingStudent}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="attendance-save-button"
                  disabled={savingStudent}
                >
                  {savingStudent ? (
                    <>
                      <span className="attendance-button-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      {editingStudent ? "Update Student" : "Admit Student"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== STUDENT DETAIL + PAYMENTS MODAL ==================== */}

      {detailStudent && (
        <div className="attendance-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeDetail(); }}>
          <div className="attendance-modal itc-detail-modal">
            <div className="attendance-modal-header">
              <div>
                <span>STUDENT DETAILS</span>
                <h2>{detailStudent.name}</h2>
                <p>
                  {detailStudent.courseName} • {detailStudent.durationMonths} months
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>

            <div className="itc-detail-body">
              {/* INFO GRID */}

              <div className="itc-info-grid">
                <div>
                  <span>Father Name</span>
                  <strong>{detailStudent.fatherName || "—"}</strong>
                </div>
                <div>
                  <span>Phone</span>
                  <strong>{detailStudent.phone || "—"}</strong>
                </div>
                <div>
                  <span>Monthly Installment</span>
                  <strong>
                    {Number(detailStudent.monthlyInstallment) > 0
                      ? `${formatCurrency(detailStudent.monthlyInstallment)} / month`
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Start Date</span>
                  <strong>{formatDate(detailStudent.startDate)}</strong>
                </div>
                <div>
                  <span>End Date</span>
                  <strong>{formatDate(detailStudent.endDate)}</strong>
                </div>
                <div>
                  <span>Time Left</span>
                  <strong>{getDaysLeftText(detailStudent)}</strong>
                </div>
              </div>

              {/* PROGRESS */}

              <div className="itc-detail-progress">
                <div className="itc-progress">
                  <span style={{ width: `${detailStudent.progressPercent}%` }} />
                </div>
                <span>{detailStudent.progressPercent}% completed</span>
              </div>

              {/* STATUS ACTIONS */}

              <div className="itc-status-actions">
                {detailStudent.derivedStatus === "Completed" ? (
                  <>
                    <span className="itc-badge itc-completed">
                      {detailStudent.autoCompleted && detailStudent.status !== "Completed"
                        ? "Completed (auto)"
                        : "Completed"}
                    </span>

                    {!detailStudent.autoCompleted && (
                      <button
                        type="button"
                        className="itc-reopen"
                        onClick={() => handleSetStatus(detailStudent._id, "Active")}
                      >
                        Reopen (Set Active)
                      </button>
                    )}

                    {detailStudent.autoCompleted && (
                      <span className="itc-auto-note">
                        Duration mukammal ho gayi. Course extend karne ke liye Edit me
                        Start Date ya Course change karein — end date khud recalculate
                        ho jayegi.
                      </span>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className="itc-mark-complete"
                    onClick={() => handleSetStatus(detailStudent._id, "Completed")}
                  >
                    <FiCheckCircle />
                    Mark as Completed
                  </button>
                )}
              </div>

              {/* FEE SUMMARY */}

              <div className="itc-fee-cards">
                <div>
                  <span>Total Fee</span>
                  <strong>{formatCurrency(detailStudent.totalFee)}</strong>
                </div>
                <div>
                  <span>Paid</span>
                  <strong className="itc-green">
                    {formatCurrency(detailStudent.paidAmount)}
                  </strong>
                </div>
                <div>
                  <span>Remaining</span>
                  <strong className={Number(detailStudent.remainingAmount) > 0 ? "itc-red" : "itc-green"}>
                    {formatCurrency(detailStudent.remainingAmount)}
                  </strong>
                </div>
              </div>

              {/* ============ PAYMENT SCHEDULE ============ */}

              <div className="itc-pay-section">
                <span className="itc-section-title">
                  Payment Schedule ({detailStudent.durationMonths} months)
                </span>

                {(detailStudent.schedule || []).length === 0 ? (
                  <div className="itc-no-payments">
                    Schedule unavailable (course duration not set).
                  </div>
                ) : (
                  <table className="attendance-table itc-ledger-table">
                    <thead>
                      <tr>
                        <th>MONTH</th>
                        <th>PERIOD</th>
                        <th>DUE</th>
                        <th>PAID</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailStudent.schedule.map((slot) => (
                        <tr
                          key={slot.index}
                          className={slot.status === "Due" ? "itc-slot-row-due" : ""}
                        >
                          <td>
                            <strong>{slot.label}</strong>
                          </td>
                          <td>
                            {formatDate(slot.start)} – {formatDate(slot.end)}
                          </td>
                          <td>{formatCurrency(slot.due)}</td>
                          <td>{formatCurrency(slot.paid)}</td>
                          <td>{getScheduleBadge(slot.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ADD PAYMENT */}

              <div className="itc-pay-section">
                <span className="itc-section-title">Add Payment</span>

                {paymentError && (
                  <div className="attendance-form-error">{paymentError}</div>
                )}

                <div className="itc-pay-form">
                  <div className="attendance-form-group">
                    <label>For Month *</label>
                    <select
                      name="monthIndex"
                      value={paymentForm.monthIndex}
                      onChange={handlePaymentChange}
                      disabled={savingPayment}
                    >
                      {(detailStudent.schedule || []).map((slot) => (
                        <option key={slot.index} value={String(slot.index)}>
                          {slot.label} — {formatCurrency(slot.remaining)} baqi
                          {slot.status === "Paid" ? " (Paid)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="attendance-form-group">
                    <label>Amount *</label>
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      value={paymentForm.amount}
                      onChange={handlePaymentChange}
                      placeholder="5000"
                      disabled={savingPayment}
                    />
                  </div>

                  <div className="attendance-form-group">
                    <label>Date</label>
                    <input
                      name="date"
                      type="date"
                      value={paymentForm.date}
                      onChange={handlePaymentChange}
                      disabled={savingPayment}
                    />
                  </div>

                  <div className="attendance-form-group">
                    <label>Note</label>
                    <input
                      name="note"
                      type="text"
                      value={paymentForm.note}
                      onChange={handlePaymentChange}
                      placeholder="1st installment..."
                      disabled={savingPayment}
                    />
                  </div>

                  <button
                    type="button"
                    className="attendance-save-button itc-pay-add"
                    onClick={handleAddPayment}
                    disabled={savingPayment}
                  >
                    <FiPlus />
                    Add
                  </button>
                </div>
              </div>

              {/* PAYMENTS LEDGER */}

              <div className="itc-pay-section">
                <span className="itc-section-title">
                  Payment History ({detailStudent.payments.length})
                </span>

                {detailStudent.payments.length === 0 ? (
                  <div className="itc-no-payments">
                    No payments recorded yet.
                  </div>
                ) : (
                  <table className="attendance-table itc-ledger-table">
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>FOR MONTH</th>
                        <th>NOTE</th>
                        <th>AMOUNT</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...detailStudent.payments]
                        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
                        .map((p) => (
                          <tr key={p._id}>
                            <td>{formatDate(p.date)}</td>
                            <td>
                              {Number(p.monthIndex) >= 0
                                ? `Month ${Number(p.monthIndex) + 1}`
                                : "—"}
                            </td>
                            <td>{p.note || "—"}</td>
                            <td>
                              <strong className="it-course-fee">
                                {formatCurrency(p.amount)}
                              </strong>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="attendance-delete-button"
                                onClick={() => handleDeletePayment(p._id)}
                                disabled={savingPayment}
                                aria-label="Delete payment"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE COURSE MODAL ==================== */}

      {isDeleteModalOpen && deletingCourse && (
        <div className="attendance-modal-overlay">
          <div className="attendance-delete-modal">
            <div className="attendance-delete-icon">
              <FiTrash2 />
            </div>

            <h2>Delete Course?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deletingCourse.courseName}</strong>?
            </p>

            <div className="attendance-delete-actions">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE STUDENT MODAL ==================== */}

      {deleteStudentModalOpen && studentToDelete && (
        <div className="attendance-modal-overlay">
          <div className="attendance-delete-modal">
            <div className="attendance-delete-icon">
              <FiTrash2 />
            </div>

            <h2>Delete Student?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{studentToDelete.name}</strong>? Payment history bhi delete
              ho jayegi.
            </p>

            <div className="attendance-delete-actions">
              <button
                type="button"
                onClick={closeDeleteStudentModal}
                disabled={deletingStudent}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={deletingStudent}
              >
                {deletingStudent ? "Deleting..." : "Delete Student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITCourses;