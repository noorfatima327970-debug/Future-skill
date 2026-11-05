import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import {
  FiActivity,
  FiAlertCircle,
  FiArrowUpRight,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/Dashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const SCHOOL_TIMEZONE = "Asia/Karachi";

const COLORS = {
  green: "#54764d",
  lightGreen: "#a8bb83",
  amber: "#d49b36",
  red: "#cf6860",
  blue: "#7396b6",
};

const EMPTY_STATS = {
  totalStudents: 0,
  activeStudents: 0,
  inactiveStudents: 0,

  totalTeachers: 0,
  activeTeachers: 0,
  inactiveTeachers: 0,

  totalClasses: 0,
  activeClasses: 0,
  inactiveClasses: 0,

  totalFee: 0,
  feeCollection: 0,
  outstandingFees: 0,

  attendance: 0,

  attendanceDetails: {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
  },
};

const EMPTY_DASHBOARD = {
  stats: EMPTY_STATS,

  charts: {
    admissions: [],
    fees: [],
    attendance: [],
    classes: [],

    results: {
      count: 0,
      pass: 0,
      fail: 0,
      average: null,
    },
  },

  recentStudents: [],
  todayTimetable: [],
};

const formatCurrency = (value) => {
  return `Rs. ${Number(value || 0).toLocaleString(
    "en-PK",
    {
      maximumFractionDigits: 0,
    }
  )}`;
};

const formatDate = (value) => {
  if (!value) return "—";

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
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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

const getClassLabel = (className) => {
  const value = String(className || "").trim();

  if (!value) return "Class not set";

  if (
    ["Playgroup", "Nursery", "Prep"].includes(value)
  ) {
    return value;
  }

  if (/^class\s+/i.test(value)) {
    return value;
  }

  return `Class ${value}`;
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [dashboardData, setDashboardData] =
    useState(EMPTY_DASHBOARD);

  /* ========================================
     FETCH REAL DASHBOARD DATA
  ======================================== */

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/dashboard`,
        {
          withCredentials: true,
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            "Failed to load dashboard data."
        );
      }

      const data = response.data || {};

      setDashboardData({
        stats: {
          ...EMPTY_STATS,
          ...(data.stats || {}),

          attendanceDetails: {
            ...EMPTY_STATS.attendanceDetails,
            ...(data.stats?.attendanceDetails || {}),
          },
        },

        charts: {
          admissions: Array.isArray(
            data.charts?.admissions
          )
            ? data.charts.admissions
            : [],

          fees: Array.isArray(data.charts?.fees)
            ? data.charts.fees
            : [],

          attendance: Array.isArray(
            data.charts?.attendance
          )
            ? data.charts.attendance
            : [],

          classes: Array.isArray(
            data.charts?.classes
          )
            ? data.charts.classes
            : [],

          results: {
            count: 0,
            pass: 0,
            fail: 0,
            average: null,
            ...(data.charts?.results || {}),
          },
        },

        recentStudents: Array.isArray(
          data.recentStudents
        )
          ? data.recentStudents
          : [],

        todayTimetable: Array.isArray(
          data.todayTimetable
        )
          ? data.todayTimetable
          : [],
      });
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Dashboard data load nahi ho saka."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-PK", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: SCHOOL_TIMEZONE,
    });
  }, []);

  const statsData = dashboardData.stats;
  const charts = dashboardData.charts;

  const attendancePercentage = Number(
    statsData.attendance || 0
  );

  const resultSummary = charts.results || {
    count: 0,
    pass: 0,
    fail: 0,
    average: null,
  };

  const hasAdmissions = charts.admissions.some(
    (item) => Number(item.admissions || 0) > 0
  );

  const hasFees = charts.fees.some(
    (item) => Number(item.value || 0) > 0
  );

  const hasAttendance = charts.attendance.some(
    (item) =>
      Number(item.Present || 0) > 0 ||
      Number(item.Absent || 0) > 0 ||
      Number(item.Late || 0) > 0 ||
      Number(item.Leave || 0) > 0
  );

  const stats = [
    {
      label: "Total Students",
      value: statsData.totalStudents,
      note: `${statsData.activeStudents} active students`,
      icon: FiUsers,
      color: "green",
      path: "/students",
    },
    {
      label: "Total Teachers",
      value: statsData.totalTeachers,
      note: `${statsData.activeTeachers} active teachers`,
      icon: FiUserCheck,
      color: "blue",
      path: "/teachers",
    },
    {
      label: "Total Classes",
      value: statsData.totalClasses,
      note: `${statsData.activeClasses} active classes`,
      icon: FiBookOpen,
      color: "amber",
      path: "/classes",
    },
    {
      label: "Fee Collection",
      value: formatCurrency(statsData.feeCollection),
      note: "Total collected amount",
      icon: FiDollarSign,
      color: "purple",
      path: "/fees",
    },
  ];

  const quickActions = [
    {
      label: "Add Student",
      description: "Manage student records",
      icon: FiUsers,
      path: "/students",
      color: "green",
    },
    {
      label: "Manage Fees",
      description: "View fees and pending balances",
      icon: FiDollarSign,
      path: "/fees",
      color: "purple",
    },
    {
      label: "Attendance",
      description: "Mark and review attendance",
      icon: FiCheckCircle,
      path: "/attendance",
      color: "blue",
    },
    {
      label: "Results",
      description: "Manage exam results",
      icon: FiBookOpen,
      path: "/results",
      color: "amber",
    },
  ];

  const chartTooltipStyle = {
    borderRadius: 12,
    border: "1px solid #e4e8df",
    boxShadow: "0 8px 24px rgba(30, 48, 34, 0.08)",
    fontSize: 12,
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-main">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="dashboard-content">
          {/* HEADER */}

          <header className="dashboard-header">
            <div>
              <span className="dashboard-eyebrow">
                FUTURE SKILL SCHOOL
              </span>

              <h1>Dashboard</h1>

              <p className="dashboard-date">
                <FiCalendar />
                {currentDate}
              </p>
            </div>

            <button
              type="button"
              className="dashboard-refresh-button"
              onClick={fetchDashboard}
              disabled={loading}
            >
              <FiRefreshCw
                className={
                  loading ? "refresh-spinning" : ""
                }
              />
              Refresh Data
            </button>
          </header>

          {/* ERROR */}

          {error && (
            <div className="dashboard-error">
              <FiAlertCircle />

              <span>{error}</span>

              <button
                type="button"
                onClick={fetchDashboard}
              >
                Try Again
              </button>
            </div>
          )}

          {/* HERO */}

          <section className="dashboard-hero">
            <div className="dashboard-hero-content">
              <span>SCHOOL OVERVIEW</span>

              <h2>Welcome back, Administrator</h2>

              <p>
                View students, teachers, attendance,
                fees and academic records from one
                professional dashboard.
              </p>
            </div>

            <div className="dashboard-hero-insights">
              <div>
                <span>Overall Attendance</span>

                <strong>
                  {loading
                    ? "—"
                    : `${attendancePercentage}%`}
                </strong>

                <small>
                  {statsData.attendanceDetails.present}{" "}
                  present records
                </small>
              </div>

              <div>
                <span>Outstanding Fees</span>

                <strong>
                  {loading
                    ? "—"
                    : formatCurrency(
                        statsData.outstandingFees
                      )}
                </strong>

                <small>Pending fee amount</small>
              </div>
            </div>
          </section>

          {/* STATS */}

          <section className="dashboard-stats-grid">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  type="button"
                  key={item.label}
                  className="dashboard-stat-card"
                  onClick={() => navigate(item.path)}
                >
                  <div className="dashboard-stat-top">
                    <span
                      className={`dashboard-stat-icon ${item.color}`}
                    >
                      <Icon />
                    </span>

                    <FiArrowUpRight className="dashboard-stat-arrow" />
                  </div>

                  <div className="dashboard-stat-body">
                    <span className="dashboard-stat-title">
                      {item.label}
                    </span>

                    <strong className="dashboard-stat-value">
                      {loading ? "—" : item.value}
                    </strong>

                    <span className="dashboard-stat-description">
                      {item.note}
                    </span>
                  </div>
                </button>
              );
            })}
          </section>

          {/* QUICK ACTIONS */}

          <section className="dashboard-quick-actions">
            <div className="dashboard-quick-actions-header">
              <div>
                <span>QUICK ACTIONS</span>
                <h2>Manage School Records</h2>
              </div>
            </div>

            <div className="dashboard-quick-actions-grid">
              {quickActions.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    type="button"
                    key={item.label}
                    className={`dashboard-quick-action ${item.color}`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="dashboard-quick-icon">
                      <Icon />
                    </span>

                    <span className="dashboard-quick-text">
                      <strong>{item.label}</strong>

                      <small>
                        {item.description}
                      </small>
                    </span>

                    <FiArrowUpRight />
                  </button>
                );
              })}
            </div>
          </section>

          {/* CHARTS */}

          <section className="dashboard-chart-grid">
            {/* ADMISSIONS */}

            <article className="dashboard-panel dashboard-chart-panel">
              <DashboardPanelHeader
                label="ADMISSIONS"
                title="Monthly Admissions"
                description="Student admissions · Last 6 months"
                icon={<FiUsers />}
              />

              {hasAdmissions ? (
                <div className="dashboard-chart">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={charts.admissions}
                      margin={{
                        top: 12,
                        right: 8,
                        left: -18,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        stroke="#edf0e9"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fill: "#7a8577",
                          fontSize: 12,
                        }}
                      />

                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fill: "#7a8577",
                          fontSize: 12,
                        }}
                      />

                      <Tooltip
                        contentStyle={chartTooltipStyle}
                      />

                      <Bar
                        dataKey="admissions"
                        name="Admissions"
                        fill={COLORS.green}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={42}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty
                  loading={loading}
                  message="Admission data available nahi hai."
                />
              )}
            </article>

            {/* FEES */}

            <article className="dashboard-panel dashboard-chart-panel">
              <DashboardPanelHeader
                label="FINANCE"
                title="Fees Overview"
                description="Paid, partial and pending fee records"
                icon={<FiDollarSign />}
                iconClass="finance"
              />

              <div className="dashboard-fee-totals">
                <div>
                  <span>Collected</span>

                  <strong>
                    {formatCurrency(
                      statsData.feeCollection
                    )}
                  </strong>
                </div>

                <div>
                  <span>Outstanding</span>

                  <strong>
                    {formatCurrency(
                      statsData.outstandingFees
                    )}
                  </strong>
                </div>
              </div>

              {hasFees ? (
                <div className="dashboard-chart dashboard-chart-donut">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={charts.fees}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={82}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {charts.fees.map((item) => (
                          <Cell
                            key={item.name}
                            fill={
                              item.name === "Paid"
                                ? COLORS.green
                                : item.name === "Partial"
                                ? COLORS.amber
                                : item.name === "Unpaid"
                                ? COLORS.blue
                                : COLORS.red
                            }
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={chartTooltipStyle}
                      />

                      <Legend
                        verticalAlign="bottom"
                        height={30}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty
                  loading={loading}
                  message="Fee records available nahi hain."
                />
              )}
            </article>

            {/* ATTENDANCE */}

            <article className="dashboard-panel dashboard-chart-panel">
              <DashboardPanelHeader
                label="ATTENDANCE"
                title="Attendance Trends"
                description="Daily attendance · Last 7 days"
                icon={<FiActivity />}
                iconClass="attendance"
              />

              {hasAttendance ? (
                <div className="dashboard-chart dashboard-chart-tall">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={charts.attendance}
                      margin={{
                        top: 12,
                        right: 12,
                        left: -18,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        stroke="#edf0e9"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fill: "#7a8577",
                          fontSize: 12,
                        }}
                      />

                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fill: "#7a8577",
                          fontSize: 12,
                        }}
                      />

                      <Tooltip
                        contentStyle={chartTooltipStyle}
                      />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="Present"
                        stroke={COLORS.green}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="Absent"
                        stroke={COLORS.red}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="Late"
                        stroke={COLORS.amber}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="Leave"
                        stroke={COLORS.blue}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty
                  loading={loading}
                  message="Attendance records available nahi hain."
                />
              )}
            </article>

            {/* CLASS DISTRIBUTION */}

            <article className="dashboard-panel dashboard-chart-panel">
              <DashboardPanelHeader
                label="CLASS DISTRIBUTION"
                title="Students by Class"
                description="Student count in every school class"
                icon={<FiBookOpen />}
                iconClass="classes"
              />

              {charts.classes.length > 0 ? (
                <div className="dashboard-chart dashboard-chart-tall">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={charts.classes}
                      margin={{
                        top: 12,
                        right: 12,
                        left: -18,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        stroke="#edf0e9"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fill: "#7a8577",
                          fontSize: 12,
                        }}
                      />

                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          fill: "#7a8577",
                          fontSize: 12,
                        }}
                      />

                      <Tooltip
                        contentStyle={chartTooltipStyle}
                      />

                      <Bar
                        dataKey="students"
                        name="Students"
                        fill={COLORS.lightGreen}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmpty
                  loading={loading}
                  message="Class-wise student data available nahi hai."
                />
              )}
            </article>

            {/* RESULTS */}

            <article className="dashboard-panel dashboard-chart-panel">
              <DashboardPanelHeader
                label="EXAM RESULTS"
                title="Exam Performance"
                description="Based on saved examination results"
                icon={<FiCheckCircle />}
                iconClass="exams"
              />

              {resultSummary.count > 0 ? (
                <div className="dashboard-exam-summary">
                  <div className="dashboard-exam-average">
                    <span>Average percentage</span>

                    <strong>
                      {resultSummary.average === null
                        ? "—"
                        : `${resultSummary.average}%`}
                    </strong>
                  </div>

                  <div className="dashboard-exam-split">
                    <div>
                      <span className="exam-dot pass" />
                      <span>Pass</span>
                      <strong>{resultSummary.pass}</strong>
                    </div>

                    <div>
                      <span className="exam-dot fail" />
                      <span>Fail</span>
                      <strong>{resultSummary.fail}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <ChartEmpty
                  loading={loading}
                  message="Abhi exam results saved nahi hain."
                />
              )}
            </article>
          </section>

          {/* BOTTOM PANELS */}

          <section className="dashboard-bottom-grid">
            {/* RECENT STUDENTS */}

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span className="dashboard-panel-label">
                    STUDENT RECORDS
                  </span>

                  <h2>Recent Students</h2>
                </div>

                <button
                  type="button"
                  className="dashboard-panel-link"
                  onClick={() => navigate("/students")}
                >
                  View all <FiArrowUpRight />
                </button>
              </div>

              {dashboardData.recentStudents.length > 0 ? (
                <div className="recent-students-list">
                  {dashboardData.recentStudents.map(
                    (student, index) => (
                      <div
                        className="recent-student-row"
                        key={
                          student._id ||
                          student.studentId ||
                          `${student.name}-${index}`
                        }
                      >
                        <div className="recent-student-avatar">
                          {student.profilePhoto ? (
                            <img
                              src={student.profilePhoto}
                              alt={
                                student.name || "Student"
                              }
                            />
                          ) : (
                            getInitials(student.name)
                          )}
                        </div>

                        <div className="recent-student-info">
                          <strong>
                            {student.name ||
                              "Unnamed student"}
                          </strong>

                          <span>
                            {getClassLabel(
                              student.className
                            )}
                            {" · "}
                            Roll No:{" "}
                            {student.rollNo || "—"}
                          </span>
                        </div>

                        <div className="recent-student-date">
                          <span>Admission</span>

                          <strong>
                            {formatDate(
                              student.admissionDate
                            )}
                          </strong>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <ChartEmpty
                  loading={loading}
                  message="Student records available nahi hain."
                />
              )}
            </article>

            {/* TIMETABLE */}

            <article className="dashboard-panel">
              <DashboardPanelHeader
                label="SCHEDULE"
                title="Today's Timetable"
                icon={<FiClock />}
                iconClass="schedule"
              />

              {dashboardData.todayTimetable.length > 0 ? (
                <div className="timetable-list">
                  {dashboardData.todayTimetable.map(
                    (item, index) => (
                      <div
                        className="timetable-row"
                        key={
                          item._id ||
                          `${item.subjectName}-${index}`
                        }
                      >
                        <div className="timetable-time">
                          <strong>
                            {item.startTime || "—"}
                          </strong>

                          <span>
                            {item.endTime || ""}
                          </span>
                        </div>

                        <div className="timetable-subject">
                          <strong>
                            {item.subjectName || "Subject"}
                          </strong>

                          <span>
                            {getClassLabel(
                              item.className
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <ChartEmpty
                  loading={loading}
                  message="Aaj ka timetable available nahi hai."
                />
              )}
            </article>
          </section>

          <footer className="dashboard-footer">
            <span>
              Future Skill School Management System
            </span>

            <span>
              Real database records · {currentDate}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
};

const DashboardPanelHeader = ({
  label,
  title,
  description,
  icon,
  iconClass = "",
}) => {
  return (
    <div className="dashboard-panel-header">
      <div>
        <span className="dashboard-panel-label">
          {label}
        </span>

        <h2>{title}</h2>

        {description && <p>{description}</p>}
      </div>

      <span
        className={`dashboard-panel-icon ${iconClass}`}
      >
        {icon}
      </span>
    </div>
  );
};

const ChartEmpty = ({ loading, message }) => {
  return (
    <div className="dashboard-chart-empty">
      <span className="dashboard-empty-icon">
        {loading ? (
          <FiRefreshCw className="refresh-spinning" />
        ) : (
          <FiAlertCircle />
        )}
      </span>

      <strong>
        {loading
          ? "Loading data..."
          : "No data to display"}
      </strong>

      <p>{message}</p>
    </div>
  );
};

export default Dashboard;