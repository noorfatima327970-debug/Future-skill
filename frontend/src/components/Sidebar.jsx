import { NavLink, useNavigate } from "react-router-dom";

import {
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiLogOut,
  FiMonitor,
  FiSettings,
  FiTrendingDown,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isOpen = false, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();

      if (onClose) {
        onClose();
      }

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout error:", error);

      navigate("/login", {
        replace: true,
      });
    }
  };

  const handleNavigation = () => {
    if (onClose) {
      onClose();
    }
  };

  /* ========================================
     MAIN MENU
  ======================================== */

  const mainItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <FiGrid />,
    },
  ];

  /* ========================================
     SCHOOL MANAGEMENT
  ======================================== */

  const schoolItems = [
    {
      label: "Students",
      path: "/students",
      icon: <FiUsers />,
    },
    {
      label: "Teachers",
      path: "/teachers",
      icon: <FiUserCheck />,
    },
    {
      label: "Classes",
      path: "/classes",
      icon: <FiBookOpen />,
    },
    {
      label: "Subjects",
      path: "/subjects",
      icon: <FiClipboard />,
    },
    {
      label: "Timetable",
      path: "/timetable",
      icon: <FiCalendar />,
    },
    {
      label: "Attendance",
      path: "/attendance",
      icon: <FiUserCheck />,
    },
    {
      label: "Fees",
      path: "/fees",
      icon: <FiDollarSign />,
    },
    {
      label: "Exams",
      path: "/exams",
      icon: <FiFileText />,
    },
    {
      label: "Results",
      path: "/results",
      icon: <FiBarChart2 />,
    },
  ];

  /* ========================================
     IT CENTER MANAGEMENT
  ======================================== */

  const itCenterItems = [
    {
      label: "IT Courses",
      path: "/it-courses",
      icon: <FiMonitor />,
    },
  ];

  /* ========================================
     GENERAL MANAGEMENT
     Notices + Reports removed
  ======================================== */

  const generalItems = [
    {
      label: "Expenses",
      path: "/expenses",
      icon: <FiTrendingDown />,
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: <FiBell />,
    },
    {
      label: "Academic Sessions",
      path: "/academic-sessions",
      icon: <FiCalendar />,
    },
    {
      label: "Admin Profile",
      path: "/profile",
      icon: <FiUser />,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: <FiSettings />,
    },
  ];

  const renderNavItems = (items) => {
    return items.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={handleNavigation}
        className={({ isActive }) =>
          isActive
            ? "sidebar-nav-item active"
            : "sidebar-nav-item"
        }
      >
        <span className="sidebar-nav-icon">
          {item.icon}
        </span>

        <span>{item.label}</span>
      </NavLink>
    ));
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`dashboard-sidebar ${
          isOpen ? "sidebar-open" : ""
        }`}
      >
        {/* BRAND */}

        <div className="sidebar-brand">
          <img
            src="/logo.png"
            alt="Future Skill School Logo"
            className="sidebar-brand-logo"
          />

          <div className="sidebar-brand-text">
            <strong>
              Future Skill School & IT Center
            </strong>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <FiX />
          </button>
        </div>

        {/* MAIN MENU */}

        <div className="sidebar-section-label">
          MAIN MENU
        </div>

        <nav className="sidebar-nav">
          {renderNavItems(mainItems)}
        </nav>

        {/* SCHOOL MANAGEMENT */}

        <div className="sidebar-section-label">
          SCHOOL MANAGEMENT
        </div>

        <nav className="sidebar-nav">
          {renderNavItems(schoolItems)}
        </nav>

        {/* IT CENTER MANAGEMENT */}

        <div className="sidebar-section-label">
          IT CENTER MANAGEMENT
        </div>

        <nav className="sidebar-nav">
          {renderNavItems(itCenterItems)}
        </nav>

        {/* GENERAL MANAGEMENT */}

        <div className="sidebar-section-label">
          GENERAL MANAGEMENT
        </div>

        <nav className="sidebar-nav">
          {renderNavItems(generalItems)}
        </nav>

        {/* LOGOUT */}

        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span className="sidebar-nav-icon">
              <FiLogOut />
            </span>

            <span>Logout</span>
          </button>

          <div className="sidebar-version">
            Future Skill v1.0
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;