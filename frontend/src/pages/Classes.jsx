import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiBookOpen,
  FiCheckCircle,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/Classes.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialForm = {
  className: "",
  classTeacher: "",
  capacity: "",
  status: "Active",
};

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  const fetchClasses = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axios.get(`${API_URL}/api/classes`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setClasses(response.data.classes || []);
      } else {
        setError(response.data.message || "Failed to load classes.");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load classes. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return classes.filter((cls) => {
      const matchesSearch =
        !query ||
        cls.className?.toLowerCase().includes(query) ||
        cls.classTeacher?.toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [classes, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredClasses.length / itemsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedClasses = filteredClasses.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // ========================================
  // STATS
  // ========================================

  const activeClasses = classes.filter(
    (cls) => cls.status === "Active"
  ).length;

  const inactiveClasses = classes.filter(
    (cls) => cls.status === "Inactive"
  ).length;

  const totalCapacity = classes.reduce(
    (sum, cls) => sum + Number(cls.capacity || 0),
    0
  );

  const openAddModal = () => {
    setEditingClass(null);
    setForm(initialForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);

    setForm({
      className: cls.className || "",
      classTeacher: cls.classTeacher || "",
      capacity: cls.capacity ?? "",
      status: cls.status || "Active",
    });

    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingClass(null);
    setForm(initialForm);
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (
      !form.className.trim() ||
      form.capacity === "" ||
      Number(form.capacity) < 1
    ) {
      return "Please enter class name and a valid student capacity.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      let response;

      if (editingClass) {
        response = await axios.put(
          `${API_URL}/api/classes/${editingClass._id}`,
          form,
          {
            withCredentials: true,
          }
        );
      } else {
        response = await axios.post(`${API_URL}/api/classes`, form, {
          withCredentials: true,
        });
      }

      if (response.data.success) {
        closeModal();
        await fetchClasses(true);
      } else {
        setFormError(
          response.data.message || "Failed to save class."
        );
      }
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          "Failed to save class. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      const response = await axios.delete(
        `${API_URL}/api/classes/${deleteTarget._id}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setDeleteTarget(null);
        await fetchClasses(true);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to delete class. Please try again."
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);
  };

  return (
    <div className="classes-layout">
      <Sidebar />

      <div className="classes-main">
        <Topbar />

        <main className="classes-content">
          <div className="classes-page-header">
            <div>
              <span className="classes-eyebrow">CLASS MANAGEMENT</span>

              <h1>Classes</h1>

              <p>
                Manage school classes, class teachers and student
                capacity.
              </p>
            </div>

            <button
              type="button"
              className="classes-add-button"
              onClick={openAddModal}
            >
              <FiPlus />
              Add Class
            </button>
          </div>

          <div className="classes-stats">
            <div className="class-stat-card">
              <div className="class-stat-icon">
                <FiBookOpen />
              </div>

              <div>
                <span>Total Classes</span>
                <strong>{classes.length}</strong>
              </div>
            </div>

            <div className="class-stat-card">
              <div className="class-stat-icon">
                <FiCheckCircle />
              </div>

              <div>
                <span>Active Classes</span>
                <strong>{activeClasses}</strong>
              </div>
            </div>

            <div className="class-stat-card">
              <div className="class-stat-icon">
                <FiXCircle />
              </div>

              <div>
                <span>Inactive Classes</span>
                <strong>{inactiveClasses}</strong>
              </div>
            </div>

            <div className="class-stat-card">
              <div className="class-stat-icon">
                <FiUsers />
              </div>

              <div>
                <span>Total Capacity</span>
                <strong>{totalCapacity}</strong>
              </div>
            </div>
          </div>

          <section className="classes-card">
            <div className="classes-toolbar">
              <div className="classes-search">
                <FiSearch />

                <input
                  type="text"
                  placeholder="Search by class name, teacher..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="classes-toolbar-actions">
                <button
                  type="button"
                  className="classes-refresh"
                  onClick={() => fetchClasses(true)}
                  disabled={refreshing}
                  aria-label="Refresh classes"
                >
                  <FiRefreshCw
                    className={refreshing ? "spin" : ""}
                  />
                </button>
              </div>
            </div>

            {error && (
              <div className="classes-error" role="alert">
                {error}
              </div>
            )}

            {loading ? (
              <div className="classes-loading">
                Loading classes...
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="classes-empty">
                <div className="classes-empty-icon">
                  <FiBookOpen />
                </div>

                <h3>No classes found</h3>

                <p>
                  {search
                    ? "Try changing your search."
                    : "Add your first class to get started."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="classes-empty-button"
                  >
                    <FiPlus />
                    Add Class
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="classes-table-wrapper">
                  <table className="classes-table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Class Teacher</th>
                        <th>Student Capacity</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedClasses.map((cls) => (
                        <tr key={cls._id}>
                          <td>
                            <div className="class-name-cell">
                              <div className="class-avatar">
                                {cls.className
                                  ?.charAt(0)
                                  .toUpperCase() || "C"}
                              </div>

                              <div>
                                <strong>{cls.className}</strong>
                              </div>
                            </div>
                          </td>

                          <td>{cls.classTeacher || "—"}</td>

                          <td>
                            <span className="class-capacity">
                              {cls.capacity} students
                            </span>
                          </td>

                          <td>
                            <span
                              className={`class-status ${
                                cls.status === "Active"
                                  ? "active"
                                  : "inactive"
                              }`}
                            >
                              {cls.status}
                            </span>
                          </td>

                          <td>
                            <div className="class-actions">
                              <button
                                type="button"
                                className="class-action edit"
                                onClick={() =>
                                  openEditModal(cls)
                                }
                                aria-label={`Edit ${cls.className}`}
                              >
                                <FiEdit2 />
                              </button>

                              <button
                                type="button"
                                className="class-action delete"
                                onClick={() =>
                                  setDeleteTarget(cls)
                                }
                                aria-label={`Delete ${cls.className}`}
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

                <div className="classes-pagination">
                  <span>
                    Showing{" "}
                    <strong>
                      {filteredClasses.length === 0
                        ? 0
                        : (safeCurrentPage - 1) * itemsPerPage + 1}
                    </strong>{" "}
                    to{" "}
                    <strong>
                      {Math.min(
                        safeCurrentPage * itemsPerPage,
                        filteredClasses.length
                      )}
                    </strong>{" "}
                    of <strong>{filteredClasses.length}</strong>{" "}
                    classes
                  </span>

                  <div className="pagination-buttons">
                    <button
                      type="button"
                      onClick={() => goToPage(safeCurrentPage - 1)}
                      disabled={safeCurrentPage === 1}
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    )
                      .slice(
                        Math.max(0, safeCurrentPage - 3),
                        Math.min(totalPages, safeCurrentPage + 2)
                      )
                      .map((page) => (
                        <button
                          type="button"
                          key={page}
                          className={
                            page === safeCurrentPage ? "active" : ""
                          }
                          onClick={() => goToPage(page)}
                        >
                          {page}
                        </button>
                      ))}

                    <button
                      type="button"
                      onClick={() => goToPage(safeCurrentPage + 1)}
                      disabled={safeCurrentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>

      {isModalOpen && (
        <div
          className="classes-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="classes-modal">
            <div className="classes-modal-header">
              <div>
                <span>CLASS INFORMATION</span>

                <h2>
                  {editingClass ? "Edit Class" : "Add Class"}
                </h2>
              </div>

              <button
                type="button"
                className="classes-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <form
              className="classes-form"
              onSubmit={handleSubmit}
            >
              {formError && (
                <div className="classes-form-error">
                  {formError}
                </div>
              )}

              <div className="classes-form-grid">
                <div className="class-form-group">
                  <label htmlFor="className">
                    Class Name <span>*</span>
                  </label>

                  <input
                    id="className"
                    name="className"
                    type="text"
                    placeholder="e.g. Class 5"
                    value={form.className}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="class-form-group">
                  <label htmlFor="classTeacher">
                    Class Teacher
                  </label>

                  <input
                    id="classTeacher"
                    name="classTeacher"
                    type="text"
                    placeholder="Enter teacher name"
                    value={form.classTeacher}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="class-form-group">
                  <label htmlFor="capacity">
                    Student Capacity <span>*</span>
                  </label>

                  <input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    placeholder="e.g. 30"
                    value={form.capacity}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="class-form-group">
                  <label htmlFor="status">Status</label>

                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="classes-form-footer">
                <button
                  type="button"
                  className="class-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="class-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingClass
                    ? "Update Class"
                    : "Add Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="classes-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="class-delete-modal">
            <div className="class-delete-icon">
              <FiTrash2 />
            </div>

            <h2>Delete Class?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.className}</strong>? This action
              cannot be undone.
            </p>

            <div className="class-delete-actions">
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
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Class"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;