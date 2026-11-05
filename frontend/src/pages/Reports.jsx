import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";

import {
  FiAlertCircle,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/Reports.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const ITEMS_PER_PAGE = 8;

const EMPTY_FILTERS = {
  search: "",
  status: "",
  className: "",
  section: "",
  startDate: "",
  endDate: "",
  month: "",
};

const REPORT_CONFIG = {
  summary: {
    endpoint: "/api/reports/summary",
    responseKey: "summary",
  },

  students: {
    endpoint: "/api/reports/students",
    responseKey: "students",
  },

  attendance: {
    endpoint: "/api/reports/attendance",
    responseKey: "attendance",
  },

  fees: {
    endpoint: "/api/reports/fees",
    responseKey: "fees",
  },

  results: {
    endpoint: "/api/reports/results",
    responseKey: "results",
  },

  classes: {
    endpoint: "/api/reports/classes",
    responseKey: "classes",
  },
};

const REPORT_TABS = [
  {
    id: "summary",
    label: "Summary",
    icon: FiBarChart2,
  },
  {
    id: "students",
    label: "Students",
    icon: FiUsers,
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: FiCheckCircle,
  },
  {
    id: "fees",
    label: "Fees",
    icon: FiDollarSign,
  },
  {
    id: "results",
    label: "Results",
    icon: FiBarChart2,
  },
  {
    id: "classes",
    label: "Classes",
    icon: FiBookOpen,
  },
];

const buildParams = (filters) => {
  const params = {};

  if (filters.search.trim()) {
    params.search = filters.search.trim();
  }

  if (filters.status) {
    params.status = filters.status;
  }

  if (filters.className) {
    params.className = filters.className;
  }

  if (filters.section) {
    params.section = filters.section;
  }

  if (filters.startDate) {
    params.startDate = filters.startDate;
  }

  if (filters.endDate) {
    params.endDate = filters.endDate;
  }

  if (filters.month) {
    params.month = filters.month;
  }

  return params;
};

const formatDate = (value) => {
  if (!value) return "-";

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

const formatCurrency = (amount) => {
  return `Rs. ${Number(amount || 0).toLocaleString(
    "en-PK",
    {
      maximumFractionDigits: 2,
    }
  )}`;
};

const getStatusClass = (value) => {
  if (!value) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
};

const Reports = () => {
  const [activeReport, setActiveReport] =
    useState("summary");

  const [reportData, setReportData] = useState({
    summary: null,
    students: [],
    attendance: [],
    fees: [],
    results: [],
    classes: [],
  });

  const [classOptions, setClassOptions] =
    useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] =
    useState(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState(EMPTY_FILTERS);

  const [page, setPage] = useState(1);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const requestIdRef = useRef(0);

  /* ==============================
     LOAD SELECTED REPORT
  ============================== */

  const loadReport = useCallback(
    async (
      reportType = "summary",
      filterValues = EMPTY_FILTERS
    ) => {
      const config = REPORT_CONFIG[reportType];

      if (!config) return;

      const requestId = ++requestIdRef.current;

      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          config.endpoint,
          {
            params: buildParams(filterValues),
          }
        );

        if (!response.data.success) {
          throw new Error(
            response.data.message ||
              "Failed to load report."
          );
        }

        if (requestId !== requestIdRef.current) {
          return;
        }

        const receivedData =
          response.data[config.responseKey];

        setReportData((previous) => ({
          ...previous,

          [config.responseKey]:
            reportType === "summary"
              ? receivedData || null
              : Array.isArray(receivedData)
              ? receivedData
              : [],
        }));
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        console.error("Report error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load report."
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  /* ==============================
     LOAD CLASSES FOR FILTERS
  ============================== */

  const loadClassOptions = useCallback(async () => {
    try {
      const response = await api.get(
        "/api/reports/class-options"
      );

      if (response.data.success) {
        setClassOptions(
          response.data.classes || []
        );
      }
    } catch (err) {
      console.error(
        "Could not load class options:",
        err
      );
    }
  }, []);

  useEffect(() => {
    loadClassOptions();
  }, [loadClassOptions]);

  useEffect(() => {
    setPage(1);

    loadReport(activeReport, appliedFilters);
  }, [
    activeReport,
    appliedFilters,
    loadReport,
  ]);

  /* ==============================
     REPORT ITEMS / PAGINATION
  ============================== */

  const reportItems = useMemo(() => {
    switch (activeReport) {
      case "students":
        return reportData.students;

      case "attendance":
        return reportData.attendance;

      case "fees":
        return reportData.fees;

      case "results":
        return reportData.results;

      case "classes":
        return reportData.classes;

      default:
        return [];
    }
  }, [activeReport, reportData]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      reportItems.length / ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const currentItems = useMemo(() => {
    const startIndex =
      (page - 1) * ITEMS_PER_PAGE;

    return reportItems.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [page, reportItems]);

  /* ==============================
     SUMMARY DATA
  ============================== */

  const summary = reportData.summary;

  const studentStats =
    summary?.students || {
      total: 0,
      active: 0,
      inactive: 0,
    };

  const attendanceStats =
    summary?.attendance || {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
    };

  const feeStats =
    summary?.fees || {
      records: 0,
      totalFee: 0,
      paidAmount: 0,
      remainingAmount: 0,
    };

  const resultStats =
    summary?.results || {
      total: 0,
      pass: 0,
      fail: 0,
      averagePercentage: 0,
    };

  /* ==============================
     FILTER OPTIONS
  ============================== */

  const classNames = useMemo(() => {
    return [
      ...new Set(
        classOptions
          .map((item) => item.className)
          .filter(Boolean)
      ),
    ];
  }, [classOptions]);

  const sections = useMemo(() => {
    return [
      ...new Set(
        classOptions
          .filter((item) => {
            return (
              !filters.className ||
              item.className ===
                filters.className
            );
          })
          .map((item) => item.section)
          .filter(Boolean)
      ),
    ];
  }, [classOptions, filters.className]);

  const statusOptions = useMemo(() => {
    if (activeReport === "students") {
      return ["Active", "Inactive"];
    }

    if (activeReport === "attendance") {
      return [
        "Present",
        "Absent",
        "Late",
        "Leave",
      ];
    }

    if (activeReport === "fees") {
      return [
        "Paid",
        "Partial",
        "Unpaid",
        "Overdue",
      ];
    }

    if (activeReport === "results") {
      return ["Pass", "Fail"];
    }

    return [];
  }, [activeReport]);

  /* ==============================
     HANDLERS
  ============================== */

  const updateFilter = (name, value) => {
    setFilters((previous) => {
      const nextFilters = {
        ...previous,
        [name]: value,
      };

      if (name === "className") {
        nextFilters.section = "";
      }

      return nextFilters;
    });
  };

  const handleApplyFilters = () => {
    setPage(1);

    setAppliedFilters({
      ...filters,
    });
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      ...EMPTY_FILTERS,
    };

    setPage(1);
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
  };

  const handleRefresh = () => {
    loadClassOptions();
    loadReport(activeReport, appliedFilters);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTabChange = (reportType) => {
    setPage(1);
    setError("");
    setActiveReport(reportType);
  };

  /* ==============================
     SUMMARY UI
  ============================== */

  const renderSummary = () => {
    if (!summary) {
      return (
        <div className="reports-empty">
          <FiFileText />

          <h3>No summary data found</h3>

          <p>
            Add students, attendance, fees
            and result records first.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="reports-stat-grid">
          <div className="report-stat-card">
            <div className="report-stat-icon students">
              <FiUsers />
            </div>

            <div>
              <span>Total Students</span>

              <strong>
                {studentStats.total}
              </strong>

              <small>
                {studentStats.active} active
              </small>
            </div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon attendance">
              <FiCheckCircle />
            </div>

            <div>
              <span>
                Attendance Records
              </span>

              <strong>
                {attendanceStats.total}
              </strong>

              <small>
                {attendanceStats.present} present
              </small>
            </div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon fees">
              <FiDollarSign />
            </div>

            <div>
              <span>Fee Collection</span>

              <strong>
                {formatCurrency(
                  feeStats.paidAmount
                )}
              </strong>

              <small>
                {formatCurrency(
                  feeStats.remainingAmount
                )}{" "}
                outstanding
              </small>
            </div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon results">
              <FiBarChart2 />
            </div>

            <div>
              <span>Average Result</span>

              <strong>
                {Number(
                  resultStats.averagePercentage || 0
                ).toFixed(2)}
                %
              </strong>

              <small>
                {resultStats.pass} passed
              </small>
            </div>
          </div>
        </div>

        <div className="reports-summary-grid">
          <div className="reports-panel">
            <div className="reports-panel-header">
              <div>
                <h3>Student Overview</h3>

                <p>
                  Current student statistics
                </p>
              </div>
            </div>

            <div className="overview-list">
              <div>
                <span>Total Students</span>
                <strong>
                  {studentStats.total}
                </strong>
              </div>

              <div>
                <span>Active Students</span>
                <strong>
                  {studentStats.active}
                </strong>
              </div>

              <div>
                <span>Inactive Students</span>
                <strong>
                  {studentStats.inactive}
                </strong>
              </div>
            </div>
          </div>

          <div className="reports-panel">
            <div className="reports-panel-header">
              <div>
                <h3>
                  Attendance Overview
                </h3>

                <p>
                  Attendance record breakdown
                </p>
              </div>
            </div>

            <div className="overview-list">
              <div>
                <span>Present</span>
                <strong>
                  {attendanceStats.present}
                </strong>
              </div>

              <div>
                <span>Absent</span>
                <strong>
                  {attendanceStats.absent}
                </strong>
              </div>

              <div>
                <span>Late</span>
                <strong>
                  {attendanceStats.late}
                </strong>
              </div>

              <div>
                <span>Leave</span>
                <strong>
                  {attendanceStats.leave}
                </strong>
              </div>
            </div>
          </div>

          <div className="reports-panel">
            <div className="reports-panel-header">
              <div>
                <h3>Fee Overview</h3>

                <p>
                  Overall fee collection
                </p>
              </div>
            </div>

            <div className="overview-list">
              <div>
                <span>Total Fee</span>

                <strong>
                  {formatCurrency(
                    feeStats.totalFee
                  )}
                </strong>
              </div>

              <div>
                <span>Collected</span>

                <strong>
                  {formatCurrency(
                    feeStats.paidAmount
                  )}
                </strong>
              </div>

              <div>
                <span>Outstanding</span>

                <strong>
                  {formatCurrency(
                    feeStats.remainingAmount
                  )}
                </strong>
              </div>
            </div>
          </div>

          <div className="reports-panel">
            <div className="reports-panel-header">
              <div>
                <h3>Result Overview</h3>

                <p>
                  Overall examination results
                </p>
              </div>
            </div>

            <div className="overview-list">
              <div>
                <span>Total Results</span>

                <strong>
                  {resultStats.total}
                </strong>
              </div>

              <div>
                <span>Passed</span>

                <strong>
                  {resultStats.pass}
                </strong>
              </div>

              <div>
                <span>Failed</span>

                <strong>
                  {resultStats.fail}
                </strong>
              </div>

              <div>
                <span>Average</span>

                <strong>
                  {Number(
                    resultStats.averagePercentage || 0
                  ).toFixed(2)}
                  %
                </strong>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  /* ==============================
     TABLES
  ============================== */

  const renderStudentReport = () => (
    <ReportTable
      title="Student Report"
      description="Complete student records"
    >
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Admission No.</th>
            <th>Father Name</th>
            <th>Class</th>
            <th>Gender</th>
            <th>Admission Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {currentItems.map((student) => (
            <tr
              key={
                student._id ||
                student.studentId
              }
            >
              <td>
                <div className="table-person">
                  <div className="table-avatar">
                    {student.name
                      ?.charAt(0)
                      .toUpperCase() || "S"}
                  </div>

                  <div>
                    <strong>
                      {student.name || "-"}
                    </strong>

                    <span>
                      {student.studentId || "-"}
                    </span>
                  </div>
                </div>
              </td>

              <td>
                {student.admissionNo || "-"}
              </td>

              <td>
                {student.fatherName || "-"}
              </td>

              <td>
                {student.className || "-"} -{" "}
                {student.section || "-"}
              </td>

              <td>
                {student.gender || "-"}
              </td>

              <td>
                {formatDate(
                  student.admissionDate
                )}
              </td>

              <td>
                <span
                  className={`status-badge ${getStatusClass(
                    student.status
                  )}`}
                >
                  {student.status || "-"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportTable>
  );

  const renderAttendanceReport = () => (
    <ReportTable
      title="Attendance Report"
      description="Student attendance records"
    >
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Class</th>
            <th>Date</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>

        <tbody>
          {currentItems.map((item) => (
            <tr key={item._id}>
              <td>
                <strong>
                  {item.studentName || "-"}
                </strong>
              </td>

              <td>
                {item.className || "-"} -{" "}
                {item.section || "-"}
              </td>

              <td>
                {formatDate(item.date)}
              </td>

              <td>
                <span
                  className={`status-badge ${getStatusClass(
                    item.status
                  )}`}
                >
                  {item.status || "-"}
                </span>
              </td>

              <td>
                {item.remarks || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportTable>
  );

  const renderFeeReport = () => (
    <ReportTable
      title="Fee Report"
      description="Student fee collection records"
    >
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Class</th>
            <th>Month</th>
            <th>Total Fee</th>
            <th>Paid</th>
            <th>Remaining</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {currentItems.map((fee) => (
            <tr key={fee._id}>
              <td>
                <strong>
                  {fee.studentName || "-"}
                </strong>
              </td>

              <td>
                {fee.className || "-"} -{" "}
                {fee.section || "-"}
              </td>

              <td>{fee.month || "-"}</td>

              <td>
                {formatCurrency(fee.totalFee)}
              </td>

              <td className="amount-positive">
                {formatCurrency(
                  fee.paidAmount
                )}
              </td>

              <td className="amount-negative">
                {formatCurrency(
                  fee.remainingAmount
                )}
              </td>

              <td>
                {formatDate(fee.dueDate)}
              </td>

              <td>
                <span
                  className={`status-badge ${getStatusClass(
                    fee.status
                  )}`}
                >
                  {fee.status || "-"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportTable>
  );

  const renderResultReport = () => (
    <ReportTable
      title="Exam & Result Report"
      description="Student examination performance"
    >
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Exam</th>
            <th>Subject</th>
            <th>Class</th>
            <th>Marks</th>
            <th>Percentage</th>
            <th>Grade</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {currentItems.map((result) => (
            <tr key={result._id}>
              <td>
                <strong>
                  {result.studentName || "-"}
                </strong>
              </td>

              <td>
                {result.examName || "-"}
              </td>

              <td>
                {result.subjectName || "-"}
              </td>

              <td>
                {result.className || "-"} -{" "}
                {result.section || "-"}
              </td>

              <td>
                {result.obtainedMarks || 0} /{" "}
                {result.totalMarks || 0}
              </td>

              <td>
                {Number(
                  result.percentage || 0
                ).toFixed(2)}
                %
              </td>

              <td>
                <span className="grade-badge">
                  {result.grade || "-"}
                </span>
              </td>

              <td>
                <span
                  className={`status-badge ${getStatusClass(
                    result.status
                  )}`}
                >
                  {result.status || "-"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportTable>
  );

  const renderClassReport = () => (
    <ReportTable
      title="Class-wise Report"
      description="Class capacity and student statistics"
    >
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Section</th>
            <th>Class Teacher</th>
            <th>Room</th>
            <th>Capacity</th>
            <th>Students</th>
            <th>Active</th>
            <th>Available Seats</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {currentItems.map((item) => (
            <tr key={item._id}>
              <td>
                <strong>
                  {item.className || "-"}
                </strong>
              </td>

              <td>{item.section || "-"}</td>

              <td>
                {item.classTeacher || "-"}
              </td>

              <td>
                {item.roomNumber || "-"}
              </td>

              <td>{item.capacity || 0}</td>

              <td>
                {item.totalStudents || 0}
              </td>

              <td>
                {item.activeStudents || 0}
              </td>

              <td>
                {item.availableSeats || 0}
              </td>

              <td>
                <span
                  className={`status-badge ${getStatusClass(
                    item.status
                  )}`}
                >
                  {item.status || "-"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportTable>
  );

  /* ==============================
     MAIN REPORT CONTENT
  ============================== */

  const renderReport = () => {
    if (loading) {
      return (
        <div className="reports-loading">
          <FiRefreshCw className="spin" />
          <span>Generating report...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="reports-error">
          <FiAlertCircle />

          <div>
            <strong>
              Unable to load report
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
          >
            Try Again
          </button>
        </div>
      );
    }

    if (activeReport === "summary") {
      return renderSummary();
    }

    if (reportItems.length === 0) {
      return (
        <div className="reports-empty">
          <FiFileText />

          <h3>No records found</h3>

          <p>
            No data matches the selected
            filters.
          </p>
        </div>
      );
    }

    switch (activeReport) {
      case "students":
        return renderStudentReport();

      case "attendance":
        return renderAttendanceReport();

      case "fees":
        return renderFeeReport();

      case "results":
        return renderResultReport();

      case "classes":
        return renderClassReport();

      default:
        return renderSummary();
    }
  };

  const shouldShowSectionFilter = [
    "students",
    "attendance",
    "fees",
    "results",
  ].includes(activeReport);

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-main">
        <Topbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="reports-page">
          <div className="reports-header">
            <div>
              <span className="reports-eyebrow">
                MANAGEMENT REPORTS
              </span>

              <h1>Reports</h1>

              <p>
                Analyze students, attendance,
                fees, exams and class
                performance.
              </p>
            </div>

            <div className="reports-header-actions">
              <button
                type="button"
                className="reports-secondary-btn"
                onClick={handleRefresh}
                disabled={loading}
              >
                <FiRefreshCw
                  className={
                    loading ? "spin" : ""
                  }
                />
                Refresh
              </button>

              <button
                type="button"
                className="reports-primary-btn"
                onClick={handlePrint}
              >
                <FiFileText />
                Print Report
              </button>
            </div>
          </div>

          <div className="report-tabs">
            {REPORT_TABS.map(
              ({
                id,
                label,
                icon: Icon,
              }) => (
                <button
                  key={id}
                  type="button"
                  className={
                    activeReport === id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    handleTabChange(id)
                  }
                >
                  <Icon />
                  {label}
                </button>
              )
            )}
          </div>

          {activeReport !== "summary" && (
            <div className="reports-filters">
              <div className="report-search">
                <FiSearch />

                <input
                  type="text"
                  placeholder="Search report..."
                  value={filters.search}
                  onChange={(event) =>
                    updateFilter(
                      "search",
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                value={filters.className}
                onChange={(event) =>
                  updateFilter(
                    "className",
                    event.target.value
                  )
                }
              >
                <option value="">
                  All Classes
                </option>

                {classNames.map((name) => (
                  <option
                    key={name}
                    value={name}
                  >
                    {name}
                  </option>
                ))}
              </select>

              {shouldShowSectionFilter && (
                <select
                  value={filters.section}
                  onChange={(event) =>
                    updateFilter(
                      "section",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All Sections
                  </option>

                  {sections.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      Section {item}
                    </option>
                  ))}
                </select>
              )}

              {statusOptions.length > 0 && (
                <select
                  value={filters.status}
                  onChange={(event) =>
                    updateFilter(
                      "status",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All Status
                  </option>

                  {statusOptions.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              )}

              {activeReport === "attendance" && (
                <>
                  <div className="date-input">
                    <FiCalendar />

                    <input
                      type="date"
                      aria-label="Start date"
                      value={filters.startDate}
                      onChange={(event) =>
                        updateFilter(
                          "startDate",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="date-input">
                    <FiCalendar />

                    <input
                      type="date"
                      aria-label="End date"
                      value={filters.endDate}
                      onChange={(event) =>
                        updateFilter(
                          "endDate",
                          event.target.value
                        )
                      }
                    />
                  </div>
                </>
              )}

              {activeReport === "fees" && (
                <input
                  className="month-input"
                  type="text"
                  placeholder="Fee month"
                  value={filters.month}
                  onChange={(event) =>
                    updateFilter(
                      "month",
                      event.target.value
                    )
                  }
                />
              )}

              <button
                type="button"
                className="filter-apply-btn"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                Apply
              </button>

              <button
                type="button"
                className="filter-clear-btn"
                onClick={handleClearFilters}
                title="Clear filters"
                aria-label="Clear filters"
              >
                <FiX />
              </button>
            </div>
          )}

          <div className="reports-content">
            {renderReport()}
          </div>

          {activeReport !== "summary" &&
            !loading &&
            !error &&
            reportItems.length > 0 && (
              <div className="reports-pagination">
                <span>
                  Showing{" "}
                  {(page - 1) *
                    ITEMS_PER_PAGE +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    page * ITEMS_PER_PAGE,
                    reportItems.length
                  )}{" "}
                  of {reportItems.length}
                </span>

                <div>
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() =>
                      setPage(
                        (currentPage) =>
                          currentPage - 1
                      )
                    }
                    aria-label="Previous page"
                  >
                    <FiChevronLeft />
                  </button>

                  <strong>{page}</strong>

                  <span>/ {totalPages}</span>

                  <button
                    type="button"
                    disabled={
                      page === totalPages
                    }
                    onClick={() =>
                      setPage(
                        (currentPage) =>
                          currentPage + 1
                      )
                    }
                    aria-label="Next page"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
};

const ReportTable = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="reports-panel report-table-panel">
      <div className="reports-panel-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      <div className="report-table-wrapper">
        {children}
      </div>
    </div>
  );
};

export default Reports;