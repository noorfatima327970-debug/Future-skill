import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/AcademicSessions.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const ITEMS_PER_PAGE = 8;

const initialForm = {
  sessionName: "",
  startDate: "",
  endDate: "",
  status: "Inactive",
  description: "",
};

const AcademicSessions = () => {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [showModal, setShowModal] =
    useState(false);

  const [editingSession, setEditingSession] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);

  const [formError, setFormError] =
    useState("");

  const [saving, setSaving] = useState(false);

  const [deleteSession, setDeleteSession] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [activeSession, setActiveSession] =
    useState(null);

  const fetchSessions = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axios.get(
        `${API_URL}/api/academic-sessions`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        const sessionData =
          response.data.sessions || [];

        setSessions(sessionData);

        const active =
          sessionData.find(
            (session) =>
              session.status === "Active"
          ) || null;

        setActiveSession(active);
      } else {
        setError(
          response.data.message ||
            "Failed to load academic sessions"
        );
      }
    } catch (err) {
      console.error(
        "Fetch Academic Sessions Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load academic sessions"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return sessions.filter((session) => {
      const matchesSearch =
        !query ||
        session.sessionName
          ?.toLowerCase()
          .includes(query) ||
        session.description
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        session.status === statusFilter;

      return (
        matchesSearch && matchesStatus
      );
    });
  }, [
    sessions,
    search,
    statusFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredSessions.length /
        ITEMS_PER_PAGE
    )
  );

  const paginatedSessions =
    filteredSessions.slice(
      (currentPage - 1) *
        ITEMS_PER_PAGE,
      currentPage *
        ITEMS_PER_PAGE
    );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const totalSessions =
    sessions.length;

  const activeCount =
    sessions.filter(
      (session) =>
        session.status === "Active"
    ).length;

  const inactiveCount =
    sessions.filter(
      (session) =>
        session.status === "Inactive"
    ).length;

  const completedCount =
    sessions.filter(
      (session) =>
        session.status === "Completed"
    ).length;

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusClass = (status) => {
    if (status === "Active") {
      return "status-active";
    }

    if (status === "Completed") {
      return "status-completed";
    }

    return "status-inactive";
  };

  const handleInputChange = (event) => {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const openAddModal = () => {
    setEditingSession(null);

    setForm({
      ...initialForm,
      status: "Inactive",
    });

    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (session) => {
    setEditingSession(session);

    setForm({
      sessionName:
        session.sessionName || "",
      startDate: session.startDate
        ? session.startDate.slice(0, 10)
        : "",
      endDate: session.endDate
        ? session.endDate.slice(0, 10)
        : "",
      status:
        session.status || "Inactive",
      description:
        session.description || "",
    });

    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingSession(null);
    setForm(initialForm);
    setFormError("");
  };

  const validateForm = () => {
    const sessionName =
      form.sessionName.trim();

    if (!sessionName) {
      return "Session name is required";
    }

    if (!form.startDate) {
      return "Start date is required";
    }

    if (!form.endDate) {
      return "End date is required";
    }

    const startDate = new Date(
      `${form.startDate}T00:00:00`
    );

    const endDate = new Date(
      `${form.endDate}T00:00:00`
    );

    if (endDate <= startDate) {
      return "End date must be after start date";
    }

    if (
      form.status === "Active" &&
      activeSession &&
      editingSession &&
      activeSession._id !==
        editingSession._id
    ) {
      return "Another academic session is already active. Please make it inactive first.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        sessionName:
          form.sessionName.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        description:
          form.description.trim(),
      };

      if (editingSession) {
        await axios.put(
          `${API_URL}/api/academic-sessions/${editingSession._id}`,
          payload,
          {
            withCredentials: true,
          }
        );
      } else {
        await axios.post(
          `${API_URL}/api/academic-sessions`,
          payload,
          {
            withCredentials: true,
          }
        );
      }

      closeModal();

      await fetchSessions();
    } catch (err) {
      console.error(
        "Save Academic Session Error:",
        err
      );

      setFormError(
        err.response?.data?.message ||
          "Failed to save academic session"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (
    session
  ) => {
    if (session.status === "Active") {
      return;
    }

    setDeleteSession(session);
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteSession(null);
  };

  const confirmDelete = async () => {
    if (!deleteSession) return;

    if (
      deleteSession.status === "Active"
    ) {
      return;
    }

    try {
      setDeleting(true);

      await axios.delete(
        `${API_URL}/api/academic-sessions/${deleteSession._id}`,
        {
          withCredentials: true,
        }
      );

      setDeleteSession(null);

      await fetchSessions();
    } catch (err) {
      console.error(
        "Delete Academic Session Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete academic session"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (
    event
  ) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (
      filteredSessions.length === 0
    ) {
      return null;
    }

    const pages = [];

    for (
      let page = 1;
      page <= totalPages;
      page += 1
    ) {
      pages.push(page);
    }

    return (
      <div className="academic-pagination">
        <button
          type="button"
          className="pagination-arrow"
          onClick={() =>
            goToPage(currentPage - 1)
          }
          disabled={currentPage === 1}
        >
          ‹
        </button>

        {pages.map((page) => (
          <button
            type="button"
            key={page}
            className={`pagination-page ${
              currentPage === page
                ? "active"
                : ""
            }`}
            onClick={() =>
              goToPage(page)
            }
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          className="pagination-arrow"
          onClick={() =>
            goToPage(currentPage + 1)
          }
          disabled={
            currentPage === totalPages
          }
        >
          ›
        </button>
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="dashboard-main">
        <Topbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="academic-page">
          <div className="academic-page-header">
            <div>
              <span className="academic-page-kicker">
                ACADEMIC MANAGEMENT
              </span>

              <h1>
                Academic Sessions
              </h1>

              <p>
                Manage school academic
                years and active sessions.
              </p>
            </div>

            <button
              type="button"
              className="academic-add-button"
              onClick={openAddModal}
            >
              <FiPlus />
              Add Session
            </button>
          </div>

          {error && (
            <div className="academic-error-banner">
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

          {activeSession && (
            <div className="active-session-banner">
              <div className="active-session-icon">
                <FiCheckCircle />
              </div>

              <div className="active-session-content">
                <span>
                  CURRENT ACTIVE SESSION
                </span>

                <strong>
                  {activeSession.sessionName}
                </strong>

                <small>
                  {formatDate(
                    activeSession.startDate
                  )}{" "}
                  —{" "}
                  {formatDate(
                    activeSession.endDate
                  )}
                </small>
              </div>

              <div className="active-session-badge">
                Active
              </div>
            </div>
          )}

          <section className="academic-stats-grid">
            <div className="academic-stat-card">
              <div className="academic-stat-icon total">
                <FiCalendar />
              </div>

              <div>
                <span>
                  Total Sessions
                </span>
                <strong>
                  {totalSessions}
                </strong>
              </div>
            </div>

            <div className="academic-stat-card">
              <div className="academic-stat-icon active">
                <FiCheckCircle />
              </div>

              <div>
                <span>
                  Active Sessions
                </span>
                <strong>
                  {activeCount}
                </strong>
              </div>
            </div>

            <div className="academic-stat-card">
              <div className="academic-stat-icon inactive">
                <FiClock />
              </div>

              <div>
                <span>
                  Inactive Sessions
                </span>
                <strong>
                  {inactiveCount}
                </strong>
              </div>
            </div>

            <div className="academic-stat-card">
              <div className="academic-stat-icon completed">
                <FiCheckCircle />
              </div>

              <div>
                <span>
                  Completed
                </span>
                <strong>
                  {completedCount}
                </strong>
              </div>
            </div>
          </section>

          <section className="academic-card">
            <div className="academic-toolbar">
              <div className="academic-search">
                <FiSearch />

                <input
                  type="text"
                  value={search}
                  onChange={
                    handleSearchChange
                  }
                  placeholder="Search sessions..."
                />
              </div>

              <div className="academic-toolbar-right">
                <div className="academic-filter">
                  <FiFilter />

                  <select
                    value={statusFilter}
                    onChange={
                      handleStatusFilterChange
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
                    <option value="Completed">
                      Completed
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  className="academic-refresh-button"
                  onClick={() =>
                    fetchSessions(true)
                  }
                  disabled={
                    loading || refreshing
                  }
                >
                  <FiRefreshCw
                    className={
                      refreshing
                        ? "spinning"
                        : ""
                    }
                  />
                  Refresh
                </button>
              </div>
            </div>

            <div className="academic-table-wrapper">
              {loading ? (
                <div className="academic-state">
                  <div className="academic-loader"></div>
                  <p>
                    Loading academic
                    sessions...
                  </p>
                </div>
              ) : paginatedSessions.length ===
                0 ? (
                <div className="academic-empty-state">
                  <div className="academic-empty-icon">
                    <FiCalendar />
                  </div>

                  <h3>
                    No academic sessions
                    found
                  </h3>

                  <p>
                    {search ||
                    statusFilter !== "All"
                      ? "Try changing your search or filter."
                      : "Create your first academic session to get started."}
                  </p>

                  {!search &&
                    statusFilter ===
                      "All" && (
                      <button
                        type="button"
                        onClick={
                          openAddModal
                        }
                      >
                        <FiPlus />
                        Add Session
                      </button>
                    )}
                </div>
              ) : (
                <table className="academic-table">
                  <thead>
                    <tr>
                      <th>
                        Session
                      </th>
                      <th>
                        Start Date
                      </th>
                      <th>
                        End Date
                      </th>
                      <th>
                        Duration
                      </th>
                      <th>
                        Status
                      </th>
                      <th className="action-column">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedSessions.map(
                      (session) => (
                        <tr
                          key={
                            session._id
                          }
                        >
                          <td>
                            <div className="session-name-cell">
                              <div className="session-icon">
                                <FiCalendar />
                              </div>

                              <div>
                                <strong>
                                  {
                                    session.sessionName
                                  }
                                </strong>

                                {session.description && (
                                  <span>
                                    {
                                      session.description
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="date-value">
                              {formatDate(
                                session.startDate
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="date-value">
                              {formatDate(
                                session.endDate
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="duration-value">
                              {formatDate(
                                session.startDate
                              )}{" "}
                              —{" "}
                              {formatDate(
                                session.endDate
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`session-status ${getStatusClass(
                                session.status
                              )}`}
                            >
                              <span></span>
                              {
                                session.status
                              }
                            </span>
                          </td>

                          <td>
                            <div className="session-actions">
                              <button
                                type="button"
                                className="session-action edit"
                                onClick={() =>
                                  openEditModal(
                                    session
                                  )
                                }
                                title="Edit session"
                              >
                                <FiEdit2 />
                              </button>

                              <button
                                type="button"
                                className={`session-action delete ${
                                  session.status ===
                                  "Active"
                                    ? "disabled"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleDeleteClick(
                                    session
                                  )
                                }
                                disabled={
                                  session.status ===
                                  "Active"
                                }
                                title={
                                  session.status ===
                                  "Active"
                                    ? "Active session cannot be deleted"
                                    : "Delete session"
                                }
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {!loading &&
              filteredSessions.length >
                0 && (
                <div className="academic-table-footer">
                  <span>
                    Showing{" "}
                    <strong>
                      {(currentPage - 1) *
                        ITEMS_PER_PAGE +
                        1}
                    </strong>{" "}
                    to{" "}
                    <strong>
                      {Math.min(
                        currentPage *
                          ITEMS_PER_PAGE,
                        filteredSessions.length
                      )}
                    </strong>{" "}
                    of{" "}
                    <strong>
                      {
                        filteredSessions.length
                      }
                    </strong>{" "}
                    sessions
                  </span>

                  {renderPagination()}
                </div>
              )}
          </section>
        </main>
      </div>

      {showModal && (
        <div
          className="academic-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="academic-modal">
            <div className="academic-modal-header">
              <div>
                <span>
                  {editingSession
                    ? "UPDATE SESSION"
                    : "NEW SESSION"}
                </span>

                <h2>
                  {editingSession
                    ? "Edit Academic Session"
                    : "Add Academic Session"}
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

            <form
              onSubmit={handleSubmit}
            >
              {formError && (
                <div className="academic-form-error">
                  {formError}
                </div>
              )}

              <div className="academic-form-grid">
                <div className="academic-form-group full">
                  <label htmlFor="sessionName">
                    Session Name
                    <span>*</span>
                  </label>

                  <input
                    id="sessionName"
                    name="sessionName"
                    type="text"
                    value={
                      form.sessionName
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. 2026-2027"
                    disabled={saving}
                  />
                </div>

                <div className="academic-form-group">
                  <label htmlFor="startDate">
                    Start Date
                    <span>*</span>
                  </label>

                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={
                      form.startDate
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={saving}
                  />
                </div>

                <div className="academic-form-group">
                  <label htmlFor="endDate">
                    End Date
                    <span>*</span>
                  </label>

                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={
                      form.endDate
                    }
                    min={
                      form.startDate ||
                      undefined
                    }
                    onChange={
                      handleInputChange
                    }
                    disabled={saving}
                  />
                </div>

                <div className="academic-form-group full">
                  <label htmlFor="status">
                    Status
                    <span>*</span>
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={
                      handleInputChange
                    }
                    disabled={saving}
                  >
                    <option value="Inactive">
                      Inactive
                    </option>
                    <option value="Active">
                      Active
                    </option>
                    <option value="Completed">
                      Completed
                    </option>
                  </select>

                  {form.status ===
                    "Active" && (
                    <small className="academic-help-text">
                      Only one academic
                      session can be active
                      at a time.
                    </small>
                  )}
                </div>

                <div className="academic-form-group full">
                  <label htmlFor="description">
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows="4"
                    value={
                      form.description
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Add a short description about this academic session..."
                    disabled={saving}
                  ></textarea>
                </div>
              </div>

              <div className="academic-modal-footer">
                <button
                  type="button"
                  className="academic-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="academic-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="button-loader"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      {editingSession
                        ? "Update Session"
                        : "Create Session"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteSession && (
        <div
          className="academic-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteModal();
            }
          }}
        >
          <div className="academic-delete-modal">
            <div className="delete-warning-icon">
              <FiTrash2 />
            </div>

            <h2>
              Delete Academic Session?
            </h2>

            <p>
              Are you sure you want to
              delete{" "}
              <strong>
                {deleteSession.sessionName}
              </strong>
              ? This action cannot be
              undone.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="academic-cancel-button"
                onClick={
                  closeDeleteModal
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="academic-delete-confirm"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="button-loader"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    Delete Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicSessions;