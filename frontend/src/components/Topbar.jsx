import { useEffect, useRef, useState } from "react";

import axios from "axios";

import {
  FiBell,
  FiChevronDown,
  FiChevronRight,
  FiMenu,
  FiSearch,
  FiX,
  FiGrid,
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiClipboard,
  FiCalendar,
  FiDollarSign,
  FiTrendingDown,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiUser,
} from "react-icons/fi";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "../styles/TopbarSearch.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ==================== SEARCH PAGES ====================

const SEARCH_PAGES = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: FiGrid,
    keywords: "home overview",
  },
  {
    label: "Students",
    path: "/students",
    icon: FiUsers,
    keywords: "student admission registration",
  },
  {
    label: "Teachers",
    path: "/teachers",
    icon: FiUserCheck,
    keywords: "teacher staff faculty",
  },
  {
    label: "Classes & Sections",
    path: "/classes",
    icon: FiBookOpen,
    keywords: "class section",
  },
  {
    label: "Subjects",
    path: "/subjects",
    icon: FiClipboard,
    keywords: "subject courses",
  },
  {
    label: "Timetable",
    path: "/timetable",
    icon: FiCalendar,
    keywords: "schedule periods",
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: FiUserCheck,
    keywords: "present absent leave",
  },
  {
    label: "Fees",
    path: "/fees",
    icon: FiDollarSign,
    keywords: "fee payments collection",
  },
  {
    label: "Expenses",
    path: "/expenses",
    icon: FiTrendingDown,
    keywords: "expense bills salary rent",
  },
  {
    label: "Exams",
    path: "/exams",
    icon: FiFileText,
    keywords: "exam tests",
  },
  {
    label: "Results",
    path: "/results",
    icon: FiBarChart2,
    keywords: "result marks grades",
  },
  {
    label: "Notices",
    path: "/notices",
    icon: FiBell,
    keywords: "notice announcements",
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: FiBell,
    keywords: "alerts messages",
  },
  {
    label: "Academic Sessions",
    path: "/academic-sessions",
    icon: FiCalendar,
    keywords: "academic session year",
  },
  {
    label: "Reports",
    path: "/reports",
    icon: FiBarChart2,
    keywords: "reports analytics",
  },
  {
    label: "Admin Profile",
    path: "/profile",
    icon: FiUser,
    keywords: "administrator account",
  },
  {
    label: "Settings",
    path: "/settings",
    icon: FiSettings,
    keywords: "settings preferences",
  },
];

// ==================== TOPBAR ====================

const Topbar = ({ onMenuClick }) => {
  const { admin } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);

  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const adminName = admin?.name || "Admin";

  const firstLetter = adminName
    .charAt(0)
    .toUpperCase();

  // ==================== NOTIFICATIONS ====================

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get(
        "/api/notifications"
      );

      if (response.data.success) {
        setUnreadCount(
          response.data.unreadCount || 0
        );
      }
    } catch (error) {
      console.error(
        "Notification Count Error:",
        error
      );
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(
      fetchUnreadCount,
      30000
    );

    return () => clearInterval(interval);
  }, [location.pathname]);

  // ==================== FILTER SEARCH ====================

  const searchValue = search.trim().toLowerCase();

  const filteredPages = searchValue
    ? SEARCH_PAGES.filter((page) => {
        const text = `
          ${page.label}
          ${page.keywords}
        `.toLowerCase();

        return text.includes(searchValue);
      })
    : SEARCH_PAGES;

  // ==================== KEYBOARD SHORTCUT ====================

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        setIsSearchOpen(true);

        inputRef.current?.focus();
      }

      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleGlobalKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleGlobalKeyDown
      );
    };
  }, []);

  // ==================== OUTSIDE CLICK ====================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // ==================== ROUTE CHANGE ====================

  useEffect(() => {
    setSearch("");
    setIsSearchOpen(false);
    setActiveIndex(0);
  }, [location.pathname]);

  // ==================== SEARCH NAVIGATION ====================

  const handleSearchNavigation = (path) => {
    setSearch("");
    setIsSearchOpen(false);
    setActiveIndex(0);

    navigate(path);
  };

  // ==================== SEARCH KEYBOARD ====================

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setIsSearchOpen(true);

      setActiveIndex((previous) =>
        Math.min(
          previous + 1,
          filteredPages.length - 1
        )
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((previous) =>
        Math.max(previous - 1, 0)
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (filteredPages.length > 0) {
        const selectedPage =
          filteredPages[activeIndex] ||
          filteredPages[0];

        handleSearchNavigation(
          selectedPage.path
        );
      }
    }

    if (event.key === "Escape") {
      setIsSearchOpen(false);

      inputRef.current?.blur();
    }
  };

  // ==================== OTHER NAVIGATION ====================

  const handleNotificationClick = () => {
    navigate("/notifications");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  // ==================== JSX ====================

  return (
    <header className="dashboard-topbar">

      <div className="topbar-left">

        {/* MOBILE MENU */}

        <button
          type="button"
          className="topbar-mobile-menu"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <FiMenu />
        </button>

        {/* ==================== GLOBAL SEARCH ==================== */}

        <div
          className={`topbar-search-container ${
            isSearchOpen ? "search-active" : ""
          }`}
          ref={searchRef}
        >

          <div className="topbar-search">

            <FiSearch className="topbar-search-icon" />

            <input
              ref={inputRef}
              type="text"
              placeholder="Search anything..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setActiveIndex(0);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                setIsSearchOpen(true);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              autoComplete="off"
              aria-label="Search pages"
              aria-expanded={isSearchOpen}
              aria-controls="topbar-search-results"
            />

            {search ? (
              <button
                type="button"
                className="topbar-search-clear"
                onClick={() => {
                  setSearch("");
                  setActiveIndex(0);
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            ) : (
              <span className="topbar-search-shortcut">
                ⌘ K
              </span>
            )}

          </div>

          {/* ==================== SEARCH DROPDOWN ==================== */}

          {isSearchOpen && (
            <div
              className="topbar-search-dropdown"
              id="topbar-search-results"
            >

              <div className="topbar-search-dropdown-header">
                <span>
                  {searchValue
                    ? "SEARCH RESULTS"
                    : "QUICK NAVIGATION"}
                </span>

                <span>
                  {filteredPages.length} results
                </span>
              </div>

              {filteredPages.length > 0 ? (
                <div className="topbar-search-results">

                  {filteredPages.map((page, index) => {
                    const Icon = page.icon;

                    return (
                      <button
                        key={page.path}
                        type="button"
                        className={`topbar-search-result ${
                          activeIndex === index
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handleSearchNavigation(
                            page.path
                          )
                        }
                        onMouseEnter={() =>
                          setActiveIndex(index)
                        }
                      >

                        <span className="topbar-search-result-icon">
                          <Icon />
                        </span>

                        <span className="topbar-search-result-info">
                          <strong>
                            {page.label}
                          </strong>

                          <small>
                            Open {page.label}
                          </small>
                        </span>

                        <FiChevronRight className="topbar-search-result-arrow" />

                      </button>
                    );
                  })}

                </div>
              ) : (
                <div className="topbar-search-empty">

                  <FiSearch />

                  <strong>
                    No results found
                  </strong>

                  <p>
                    No pages match "{search}"
                  </p>

                </div>
              )}

              <div className="topbar-search-footer">
                <span>
                  ↑ ↓ Navigate
                </span>

                <span>
                  ↵ Select
                </span>

                <span>
                  ESC Close
                </span>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ==================== RIGHT SIDE ==================== */}

      <div className="topbar-right">

        {/* NOTIFICATIONS */}

        <button
          type="button"
          className="topbar-notification"
          onClick={handleNotificationClick}
          aria-label="Open notifications"
          title="Notifications"
        >
          <FiBell />

          {unreadCount > 0 && (
            <span className="topbar-notification-badge">
              {unreadCount > 99
                ? "99+"
                : unreadCount}
            </span>
          )}
        </button>

        <div className="topbar-divider" />

        {/* ADMIN PROFILE */}

        <button
          type="button"
          className="topbar-profile"
          onClick={handleProfileClick}
          aria-label="Admin profile"
        >
          <div className="topbar-avatar">
            {firstLetter}
          </div>

          <div className="topbar-admin-info">
            <strong>{adminName}</strong>
            <span>Administrator</span>
          </div>

          <FiChevronDown className="topbar-chevron" />
        </button>

      </div>

    </header>
  );
};

export default Topbar;