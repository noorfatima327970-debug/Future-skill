import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiTrendingDown,
  FiX,
  FiFileText,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/Attendance.css";
import "../styles/Expenses.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const ITEMS_PER_PAGE = 8;

const EXPENSE_CATEGORIES = [
  "Teacher Salaries",
  "Electricity Bills",
  "Water Bills",
  "Building Rent",
  "Stationery",
  "Maintenance",
  "Internet Bills",
  "Furniture",
  "Other",
];

// ==================== DATE HELPERS ====================

const getTodayDate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateInputValue = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);

    if (match) return match[1];
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  const dateString = getDateInputValue(value);

  if (!dateString) return "—";

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatCurrency = (amount) => {
  return `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;
};

// ==================== INITIAL FORM ====================

const initialForm = {
  title: "",
  category: "",
  amount: "",
  date: getTodayDate(),
  description: "",
};

// ==================== COMPONENT ====================

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] =
    useState(false);

  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] =
    useState(null);

  const [form, setForm] = useState(initialForm);

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  // ==================== FETCH EXPENSES ====================

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/expenses`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setExpenses(response.data.expenses || []);
      } else {
        setError(
          response.data.message ||
            "Failed to load expenses."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load expenses. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // ==================== FILTERS ====================

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFilter, categoryFilter]);

  const filteredExpenses = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return expenses.filter((item) => {
      const searchableText = [
        item.title,
        item.category,
        item.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue ||
        searchableText.includes(searchValue);

      const matchesDate =
        !dateFilter ||
        getDateInputValue(item.date) === dateFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      return (
        matchesSearch &&
        matchesDate &&
        matchesCategory
      );
    });
  }, [expenses, search, dateFilter, categoryFilter]);

  // ==================== PAGINATION ====================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE)
  );

  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ==================== SUMMARY ====================

  const summary = useMemo(() => {
    const today = getTodayDate();
    const currentMonth = today.slice(0, 7);

    return expenses.reduce(
      (totals, item) => {
        const amount = Number(item.amount) || 0;
        const itemDate = getDateInputValue(item.date);

        totals.total += amount;

        if (itemDate === today) {
          totals.today += amount;
        }

        if (itemDate.slice(0, 7) === currentMonth) {
          totals.month += amount;
        }

        return totals;
      },
      {
        total: 0,
        today: 0,
        month: 0,
      }
    );
  }, [expenses]);

  // ==================== ADD MODAL ====================

  const openAddModal = () => {
    setEditingExpense(null);

    setForm({
      ...initialForm,
      date: getTodayDate(),
    });

    setFormError("");
    setIsModalOpen(true);
  };

  // ==================== EDIT MODAL ====================

  const openEditModal = (item) => {
    setEditingExpense(item);

    setForm({
      title: item.title || "",
      category: item.category || "",
      amount: String(item.amount ?? ""),
      date: getDateInputValue(item.date),
      description: item.description || "",
    });

    setFormError("");
    setIsModalOpen(true);
  };

  // ==================== CLOSE MODAL ====================

  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingExpense(null);

    setForm({
      ...initialForm,
      date: getTodayDate(),
    });

    setFormError("");
  };

  // ==================== FORM CHANGE ====================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==================== SAVE EXPENSE ====================

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (
      !form.title.trim() ||
      !form.category ||
      form.amount === "" ||
      !form.date
    ) {
      setFormError(
        "Please fill all required expense fields."
      );
      return;
    }

    if (
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setFormError(
        "Expense amount must be greater than zero."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        description: form.description.trim(),
      };

      let response;

      if (editingExpense) {
        response = await axios.put(
          `${API_URL}/api/expenses/${editingExpense._id}`,
          payload,
          {
            withCredentials: true,
          }
        );
      } else {
        response = await axios.post(
          `${API_URL}/api/expenses`,
          payload,
          {
            withCredentials: true,
          }
        );
      }

      if (response.data.success) {
        await fetchExpenses();
        closeModalAfterSave();
      } else {
        setFormError(
          response.data.message ||
            "Failed to save expense."
        );
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Failed to save expense."
      );
    } finally {
      setSaving(false);
    }
  };

  const closeModalAfterSave = () => {
    setIsModalOpen(false);
    setEditingExpense(null);

    setForm({
      ...initialForm,
      date: getTodayDate(),
    });

    setFormError("");
  };

  // ==================== DELETE MODAL ====================

  const openDeleteModal = (item) => {
    setDeletingExpense(item);
    setIsDeleteModalOpen(true);
    setError("");
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeletingExpense(null);
    setIsDeleteModalOpen(false);
  };

  // ==================== DELETE EXPENSE ====================

  const handleDelete = async () => {
    if (!deletingExpense) return;

    try {
      setDeleting(true);
      setError("");

      const response = await axios.delete(
        `${API_URL}/api/expenses/${deletingExpense._id}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        await fetchExpenses();

        setDeletingExpense(null);
        setIsDeleteModalOpen(false);
      } else {
        setError(
          response.data.message ||
            "Failed to delete expense."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete expense."
      );

      setDeletingExpense(null);
      setIsDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // ==================== REFRESH ====================

  const handleRefresh = async () => {
    await fetchExpenses();
  };

  // ==================== JSX ====================

  return (
    <div className="attendance-page expenses-page">
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
        <Topbar
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="attendance-content">

          {/* ==================== HEADER ==================== */}

          <div className="attendance-page-header">
            <div>
              <span className="attendance-eyebrow">
                FINANCIAL MANAGEMENT
              </span>

              <h1>Expenses</h1>

              <p>
                Track and manage all school expense records.
              </p>
            </div>

            <button
              type="button"
              className="attendance-add-button"
              onClick={openAddModal}
            >
              <FiPlus />
              Add Expense
            </button>
          </div>

          {/* ==================== STATS ==================== */}

          <div className="attendance-stats">

            <div className="attendance-stat-card">
              <div className="attendance-stat-icon">
                <FiDollarSign />
              </div>

              <div>
                <span>Total Expenses</span>
                <strong>
                  {formatCurrency(summary.total)}
                </strong>
              </div>
            </div>

            <div className="attendance-stat-card">
              <div className="attendance-stat-icon present">
                <FiCalendar />
              </div>

              <div>
                <span>Today's Expenses</span>
                <strong>
                  {formatCurrency(summary.today)}
                </strong>
              </div>
            </div>

            <div className="attendance-stat-card">
              <div className="attendance-stat-icon late">
                <FiTrendingDown />
              </div>

              <div>
                <span>This Month</span>
                <strong>
                  {formatCurrency(summary.month)}
                </strong>
              </div>
            </div>

            <div className="attendance-stat-card">
              <div className="attendance-stat-icon absent">
                <FiFileText />
              </div>

              <div>
                <span>Total Records</span>
                <strong>{expenses.length}</strong>
              </div>
            </div>

          </div>

          {/* ==================== EXPENSE CARD ==================== */}

          <section className="attendance-card">

            {/* TOOLBAR */}

            <div className="attendance-toolbar">

              <div className="attendance-search">
                <FiSearch />

                <input
                  type="text"
                  placeholder="Search expense title or category..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <div className="attendance-filters">

                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) =>
                    setDateFilter(event.target.value)
                  }
                />

                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(event.target.value)
                  }
                >
                  <option value="All">
                    All Categories
                  </option>

                  {EXPENSE_CATEGORIES.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="attendance-refresh"
                  onClick={handleRefresh}
                  disabled={loading}
                  aria-label="Refresh expenses"
                >
                  <FiRefreshCw
                    className={
                      loading
                        ? "attendance-refresh-spin"
                        : ""
                    }
                  />
                </button>

              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div
                className="attendance-error"
                role="alert"
              >
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

            {/* LOADING */}

            {loading ? (
              <div className="attendance-loading">
                <div className="attendance-loader" />
                <span>Loading expenses...</span>
              </div>
            ) : paginatedExpenses.length === 0 ? (

              /* EMPTY STATE */

              <div className="attendance-empty">

                <div className="attendance-empty-icon">
                  <FiDollarSign />
                </div>

                <h3>
                  {expenses.length === 0
                    ? "No expense records yet"
                    : "No matching expenses"}
                </h3>

                <p>
                  {expenses.length === 0
                    ? "Add your first school expense to get started."
                    : "Try changing your search or filters."}
                </p>

                {expenses.length === 0 && (
                  <button
                    type="button"
                    onClick={openAddModal}
                  >
                    <FiPlus />
                    Add Expense
                  </button>
                )}

              </div>
            ) : (
              <>

                {/* ==================== TABLE ==================== */}

                <div className="attendance-table-wrapper">
                  <table className="attendance-table expenses-table">

                    <thead>
                      <tr>
                        <th>EXPENSE</th>
                        <th>CATEGORY</th>
                        <th>AMOUNT</th>
                        <th>DATE</th>
                        <th>DESCRIPTION</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedExpenses.map((item) => (
                        <tr key={item._id}>

                          {/* TITLE */}

                          <td>
                            <div className="attendance-student">

                              <div className="attendance-avatar">
                                <FiDollarSign />
                              </div>

                              <div>
                                <strong>{item.title}</strong>
                                <span>School Expense</span>
                              </div>

                            </div>
                          </td>

                          {/* CATEGORY */}

                          <td>
                            <span className="expenses-category">
                              {item.category}
                            </span>
                          </td>

                          {/* AMOUNT */}

                          <td>
                            <strong className="expenses-amount">
                              {formatCurrency(item.amount)}
                            </strong>
                          </td>

                          {/* DATE */}

                          <td>
                            <span className="attendance-date">
                              {formatDate(item.date)}
                            </span>
                          </td>

                          {/* DESCRIPTION */}

                          <td>
                            <span className="attendance-remarks">
                              {item.description || "—"}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td>
                            <div className="attendance-actions">

                              <button
                                type="button"
                                className="attendance-edit-button"
                                onClick={() =>
                                  openEditModal(item)
                                }
                                aria-label="Edit expense"
                              >
                                <FiEdit2 />
                              </button>

                              <button
                                type="button"
                                className="attendance-delete-button"
                                onClick={() =>
                                  openDeleteModal(item)
                                }
                                aria-label="Delete expense"
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

                {/* ==================== PAGINATION ==================== */}

                <div className="attendance-pagination">

                  <span>
                    Showing{" "}
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    {" "}to{" "}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredExpenses.length
                    )}
                    {" "}of {filteredExpenses.length}
                  </span>

                  <div>

                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) => page - 1)
                      }
                    >
                      Previous
                    </button>

                    <span className="attendance-page-number">
                      {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((page) => page + 1)
                      }
                    >
                      Next
                    </button>

                  </div>
                </div>

              </>
            )}

          </section>
        </div>
      </main>

      {/* ==================== ADD / EDIT MODAL ==================== */}

      {isModalOpen && (
        <div className="attendance-modal-overlay">

          <div className="attendance-modal">

            <div className="attendance-modal-header">
              <div>
                <span>EXPENSE MANAGEMENT</span>

                <h2>
                  {editingExpense
                    ? "Edit Expense"
                    : "Add New Expense"}
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
              className="attendance-form"
              onSubmit={handleSubmit}
            >

              {formError && (
                <div className="attendance-form-error">
                  {formError}
                </div>
              )}

              <div className="attendance-form-grid">

                {/* EXPENSE TITLE */}

                <div className="attendance-form-group attendance-form-full">
                  <label htmlFor="title">
                    Expense Title *
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Enter expense title"
                    value={form.title}
                    onChange={handleFormChange}
                    disabled={saving}
                    maxLength={150}
                    required
                  />
                </div>

                {/* CATEGORY */}

                <div className="attendance-form-group">
                  <label htmlFor="category">
                    Category *
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    disabled={saving}
                    required
                  >
                    <option value="">
                      Select Category
                    </option>

                    {EXPENSE_CATEGORIES.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AMOUNT */}

                <div className="attendance-form-group">
                  <label htmlFor="amount">
                    Amount (Rs.) *
                  </label>

                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter amount"
                    value={form.amount}
                    onChange={handleFormChange}
                    disabled={saving}
                    required
                  />
                </div>

                {/* DATE */}

                <div className="attendance-form-group">
                  <label htmlFor="date">
                    Expense Date *
                  </label>

                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleFormChange}
                    disabled={saving}
                    required
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="attendance-form-group attendance-form-full">
                  <label htmlFor="description">
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    placeholder="Optional expense description..."
                    value={form.description}
                    onChange={handleFormChange}
                    disabled={saving}
                    maxLength={1000}
                  />
                </div>

              </div>

              {/* MODAL BUTTONS */}

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
                      {editingExpense
                        ? "Update Expense"
                        : "Save Expense"}
                    </>
                  )}
                </button>

              </div>
            </form>

          </div>
        </div>
      )}

      {/* ==================== DELETE MODAL ==================== */}

      {isDeleteModalOpen && deletingExpense && (
        <div className="attendance-modal-overlay">

          <div className="attendance-delete-modal">

            <div className="attendance-delete-icon">
              <FiTrash2 />
            </div>

            <h2>Delete Expense?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deletingExpense.title}</strong>
              {" "}expense of{" "}
              <strong>
                {formatCurrency(deletingExpense.amount)}
              </strong>
              ?
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
                {deleting
                  ? "Deleting..."
                  : "Delete Expense"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Expenses;