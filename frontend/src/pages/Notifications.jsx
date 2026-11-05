import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiSearch,
  FiTrash2,
  FiAlertCircle,
  FiBookOpen,
  FiDollarSign,
  FiFileText,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/Notifications.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const notificationTypes = [
  "All",
  "General",
  "Student",
  "Attendance",
  "Fee",
  "Exam",
  "Result",
  "Notice",
  "System",
];

const getTypeIcon = (type) => {
  switch (type) {
    case "Student":
      return <FiUsers />;

    case "Attendance":
      return <FiCheckCircle />;

    case "Fee":
      return <FiDollarSign />;

    case "Exam":
      return <FiFileText />;

    case "Result":
      return <FiBookOpen />;

    case "Notice":
      return <FiBell />;

    case "System":
      return <FiAlertCircle />;

    default:
      return <FiInfo />;
  }
};

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleString(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const getTimeAgo = (date) => {
  if (!date) {
    return "";
  }

  const now = new Date();
  const created = new Date(date);

  const difference =
    now.getTime() - created.getTime();

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `${days} day${
      days > 1 ? "s" : ""
    } ago`;
  }

  return formatDate(date);
};

const Notifications = () => {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("All");

  const [readFilter, setReadFilter] =
    useState("All");

  const [selectedNotification, setSelectedNotification] =
    useState(null);

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/api/notifications"
        );

      if (response.data.success) {
        setNotifications(
          response.data.notifications || []
        );
      } else {
        setError(
          response.data.message ||
            "Failed to load notifications"
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;
  }, [notifications]);

  const readCount = useMemo(() => {
    return notifications.filter(
      (notification) =>
        notification.isRead
    ).length;
  }, [notifications]);

  const filteredNotifications =
    useMemo(() => {
      return notifications.filter(
        (notification) => {
          const searchText =
            search.trim().toLowerCase();

          const matchesSearch =
            !searchText ||
            notification.title
              ?.toLowerCase()
              .includes(searchText) ||
            notification.message
              ?.toLowerCase()
              .includes(searchText) ||
            notification.type
              ?.toLowerCase()
              .includes(searchText);

          const matchesType =
            typeFilter === "All" ||
            notification.type ===
              typeFilter;

          const matchesRead =
            readFilter === "All" ||
            (readFilter === "Unread" &&
              !notification.isRead) ||
            (readFilter === "Read" &&
              notification.isRead);

          return (
            matchesSearch &&
            matchesType &&
            matchesRead
          );
        }
      );
    }, [
      notifications,
      search,
      typeFilter,
      readFilter,
    ]);

  const handleMarkAsRead = async (
    notification
  ) => {
    if (notification.isRead) {
      setSelectedNotification(
        notification
      );

      return;
    }

    try {
      setActionLoading(true);

      const response =
        await api.put(
          `/api/notifications/${notification._id}/read`
        );

      if (response.data.success) {
        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id
              ? {
                  ...item,
                  isRead: true,
                }
              : item
          )
        );

        setSelectedNotification({
          ...notification,
          isRead: true,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update notification"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead =
    async () => {
      if (unreadCount === 0) {
        return;
      }

      try {
        setActionLoading(true);

        const response =
          await api.put(
            "/api/notifications/mark-all-read"
          );

        if (response.data.success) {
          setNotifications((current) =>
            current.map(
              (notification) => ({
                ...notification,
                isRead: true,
              })
            )
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to mark notifications as read"
        );
      } finally {
        setActionLoading(false);
      }
    };

  const handleDelete = async (
    notificationId
  ) => {
    try {
      setActionLoading(true);

      const response =
        await api.delete(
          `/api/notifications/${notificationId}`
        );

      if (response.data.success) {
        setNotifications((current) =>
          current.filter(
            (notification) =>
              notification._id !==
              notificationId
          )
        );

        setSelectedNotification(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete notification"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openNotification = (
    notification
  ) => {
    handleMarkAsRead(notification);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() =>
          setIsSidebarOpen(false)
        }
      />

      <div className="dashboard-main">
        <Topbar
          onMenuClick={() =>
            setIsSidebarOpen(true)
          }
        />

        <main className="notifications-page">
          <div className="notifications-page-header">
            <div>
              <span className="notifications-eyebrow">
                NOTIFICATION CENTER
              </span>

              <h1>Notifications</h1>

              <p>
                Stay updated with important
                school management activities.
              </p>
            </div>

            <button
              type="button"
              className="notifications-refresh-button"
              onClick={fetchNotifications}
              disabled={loading}
            >
              <FiClock />
              Refresh
            </button>
          </div>

          {error && (
            <div className="notifications-error">
              <FiAlertCircle />
              <span>{error}</span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                aria-label="Close error"
              >
                <FiX />
              </button>
            </div>
          )}

          <div className="notifications-stats">
            <div className="notification-stat-card">
              <div className="notification-stat-icon total">
                <FiBell />
              </div>

              <div>
                <span>Total Notifications</span>
                <strong>
                  {notifications.length}
                </strong>
              </div>
            </div>

            <div className="notification-stat-card">
              <div className="notification-stat-icon unread">
                <FiAlertCircle />
              </div>

              <div>
                <span>Unread</span>
                <strong>
                  {unreadCount}
                </strong>
              </div>
            </div>

            <div className="notification-stat-card">
              <div className="notification-stat-icon read">
                <FiCheckCircle />
              </div>

              <div>
                <span>Read</span>
                <strong>
                  {readCount}
                </strong>
              </div>
            </div>
          </div>

          <section className="notifications-card">
            <div className="notifications-toolbar">
              <div className="notifications-search">
                <FiSearch />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search notifications..."
                />
              </div>

              <div className="notifications-filters">
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                >
                  {notificationTypes.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type === "All"
                          ? "All Types"
                          : type}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={readFilter}
                  onChange={(event) =>
                    setReadFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="All">
                    All Notifications
                  </option>

                  <option value="Unread">
                    Unread
                  </option>

                  <option value="Read">
                    Read
                  </option>
                </select>

                <button
                  type="button"
                  className="mark-all-button"
                  onClick={
                    handleMarkAllAsRead
                  }
                  disabled={
                    unreadCount === 0 ||
                    actionLoading
                  }
                >
                  <FiCheck />
                  Mark All Read
                </button>
              </div>
            </div>

            <div className="notifications-list">
              {loading ? (
                <div className="notifications-state">
                  <div className="notifications-loader"></div>
                  <p>
                    Loading notifications...
                  </p>
                </div>
              ) : filteredNotifications.length ===
                0 ? (
                <div className="notifications-state">
                  <div className="notifications-empty-icon">
                    <FiBell />
                  </div>

                  <h3>
                    No notifications found
                  </h3>

                  <p>
                    There are no notifications
                    matching your current
                    filters.
                  </p>
                </div>
              ) : (
                filteredNotifications.map(
                  (notification) => (
                    <div
                      key={
                        notification._id
                      }
                      className={`notification-item ${
                        notification.isRead
                          ? "read"
                          : "unread"
                      }`}
                      onClick={() =>
                        openNotification(
                          notification
                        )
                      }
                    >
                      <div
                        className={`notification-type-icon ${notification.type.toLowerCase()}`}
                      >
                        {getTypeIcon(
                          notification.type
                        )}
                      </div>

                      <div className="notification-content">
                        <div className="notification-title-row">
                          <h3>
                            {
                              notification.title
                            }
                          </h3>

                          {!notification.isRead && (
                            <span className="unread-dot"></span>
                          )}
                        </div>

                        <p>
                          {
                            notification.message
                          }
                        </p>

                        <div className="notification-meta">
                          <span>
                            {
                              notification.type
                            }
                          </span>

                          <span>
                            {getTimeAgo(
                              notification.createdAt
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="notification-actions">
                        {!notification.isRead && (
                          <button
                            type="button"
                            title="Mark as read"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              handleMarkAsRead(
                                notification
                              );
                            }}
                          >
                            <FiCheck />
                          </button>
                        )}

                        <button
                          type="button"
                          title="Delete"
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            handleDelete(
                              notification._id
                            );
                          }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        </main>
      </div>

      {selectedNotification && (
        <div
          className="notification-modal-overlay"
          onClick={() =>
            setSelectedNotification(null)
          }
        >
          <div
            className="notification-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="notification-modal-header">
              <div className="notification-modal-icon">
                {getTypeIcon(
                  selectedNotification.type
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedNotification(
                    null
                  )
                }
                aria-label="Close notification"
              >
                <FiX />
              </button>
            </div>

            <div className="notification-modal-body">
              <span className="notification-modal-type">
                {selectedNotification.type}
              </span>

              <h2>
                {selectedNotification.title}
              </h2>

              <p>
                {
                  selectedNotification.message
                }
              </p>

              <div className="notification-modal-info">
                <div>
                  <span>Created</span>
                  <strong>
                    {formatDate(
                      selectedNotification.createdAt
                    )}
                  </strong>
                </div>

                <div>
                  <span>Created By</span>
                  <strong>
                    {
                      selectedNotification.createdBy
                    }
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    {selectedNotification.isRead
                      ? "Read"
                      : "Unread"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="notification-modal-footer">
              <button
                type="button"
                className="notification-delete-button"
                onClick={() =>
                  handleDelete(
                    selectedNotification._id
                  )
                }
                disabled={actionLoading}
              >
                <FiTrash2 />
                Delete
              </button>

              <button
                type="button"
                className="notification-close-button"
                onClick={() =>
                  setSelectedNotification(
                    null
                  )
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;