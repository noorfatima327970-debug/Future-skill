import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import axios from "axios";
import html2canvas from "html2canvas";

import {
  FiCheck,
  FiCheckCircle,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiMessageCircle,
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/Fees.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const CLASS_LIST = [
  "Playgroup",
  "Nursery",
  "Prep",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

const METHODS = [
  "Cash",
  "Bank",
  "EasyPaisa",
  "JazzCash",
];

const SCHOOL_NAME =
  "Future Skill School & IT Institute";

const currentMonth = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
};

const formatMoney = (value) => {
  return `Rs. ${Number(value || 0).toLocaleString(
    "en-PK"
  )}`;
};

const formatMonth = (month) => {
  if (!month) return "";

  const [year, monthNumber] = month.split("-");

  return new Date(
    Number(year),
    Number(monthNumber) - 1,
    1
  ).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
};

const formatDay = (date) => {
  if (!date) return "—";

  const convertedDate = new Date(date);

  if (Number.isNaN(convertedDate.getTime())) {
    return "—";
  }

  return convertedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const buildWhatsAppLink = (phone, message) => {
  const digits = String(phone || "").replace(
    /\D/g,
    ""
  );

  const phoneNumber = digits.startsWith("0")
    ? `92${digits.slice(1)}`
    : digits;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;
};

const Fees = () => {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [viewMode, setViewMode] =
    useState("collection");

  /* ========================================
     COLLECTION
  ======================================== */

  const [selectedClass, setSelectedClass] =
    useState("");

  const [month, setMonth] =
    useState(currentMonth());

  const [students, setStudents] = useState([]);

  const [stats, setStats] = useState(null);

  const [dueDay, setDueDay] = useState(10);

  const [hasSetting, setHasSetting] =
    useState(true);

  const [loading, setLoading] = useState(false);

  /* ========================================
     ADD / EDIT FEE
  ======================================== */

  const [feeTarget, setFeeTarget] =
    useState(null);

  const [feeMode, setFeeMode] =
    useState("add");

  const [feeAmount, setFeeAmount] =
    useState("");

  const [feeDiscount, setFeeDiscount] =
    useState("");

  const [feeMethod, setFeeMethod] =
    useState("Cash");

  const [feeNotes, setFeeNotes] =
    useState("");

  const [saving, setSaving] = useState(false);

  const [receipt, setReceipt] =
    useState(null);

  /* ========================================
     DELETE STUDENT PAYMENT
  ======================================== */

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  /* ========================================
     DELETE FEE SETTING
  ======================================== */

  const [
    deleteSettingTarget,
    setDeleteSettingTarget,
  ] = useState(null);

  const [
    deletingSetting,
    setDeletingSetting,
  ] = useState(false);

  /* ========================================
     WHATSAPP / RECEIPT IMAGE
  ======================================== */

  const [messageTarget, setMessageTarget] =
    useState(null);

  const [imageReceipt, setImageReceipt] =
    useState(null);

  const [
    generatingImage,
    setGeneratingImage,
  ] = useState(false);

  const receiptImageRef = useRef(null);

  /* ========================================
     FEE HISTORY
  ======================================== */

  const [historyTarget, setHistoryTarget] =
    useState(null);

  const [historyPayments, setHistoryPayments] =
    useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  /* ========================================
     SETTINGS
  ======================================== */

  const [settings, setSettings] = useState([]);

  const [
    settingsLoading,
    setSettingsLoading,
  ] = useState(false);

  const [editingClass, setEditingClass] =
    useState(null);

  const [editFee, setEditFee] = useState("");

  const [editDueDay, setEditDueDay] =
    useState("10");

  const [
    savingSetting,
    setSavingSetting,
  ] = useState(false);

  /* ========================================
     SEARCH / DROPDOWN
  ======================================== */

  const [studentSearch, setStudentSearch] =
    useState("");

  const [
    isDropdownOpen,
    setIsDropdownOpen,
  ] = useState(false);

  const dropdownRef = useRef(null);

  /* ========================================
     MESSAGES
  ======================================== */

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const successTimerRef = useRef(null);

  /* ========================================
     SUCCESS MESSAGE
  ======================================== */

  const showSuccess = (message) => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }

    setSuccess(message);

    successTimerRef.current = setTimeout(() => {
      setSuccess("");
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  /* ========================================
     CLOSE DROPDOWN OUTSIDE
  ======================================== */

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isDropdownOpen]);

  /* ========================================
     RESET MESSAGES
  ======================================== */

  useEffect(() => {
    setError("");
    setSuccess("");
    setStudentSearch("");
  }, [viewMode, selectedClass, month]);

  /* ========================================
     FETCH COLLECTION
  ======================================== */

  const fetchCollection = async () => {
    if (!selectedClass || !month) {
      setStudents([]);
      setStats(null);

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/fees/collection`,
        {
          params: {
            className: selectedClass,
            month,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setStudents(response.data.students || []);
        setStats(response.data.stats || null);

        setDueDay(response.data.dueDay || 10);

        setHasSetting(
          Boolean(response.data.hasSetting)
        );
      } else {
        setError(
          response.data.message ||
            "Failed to load collection."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load collection. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "collection") {
      fetchCollection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedClass, month]);

  /* ========================================
     FETCH SETTINGS
  ======================================== */

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/api/fees/settings`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setSettings(response.data.settings || []);
      } else {
        setError(
          response.data.message ||
            "Failed to load fee settings."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load fee settings. Please try again."
      );
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "settings") {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  /* ========================================
     STUDENT HISTORY
  ======================================== */

  const openHistory = async (student) => {
    setHistoryTarget(student);
    setHistoryPayments([]);
    setHistoryLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API_URL}/api/fees/history/${student._id}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setHistoryPayments(
          response.data.payments || []
        );
      } else {
        setError(
          response.data.message ||
            "Failed to load student fee history."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load student fee history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryTarget(null);
    setHistoryPayments([]);
  };

  const historyTotals = useMemo(() => {
    return historyPayments.reduce(
      (totals, payment) => {
        totals.paid += Number(
          payment.paidAmount || 0
        );

        totals.discount += Number(
          payment.discount || 0
        );

        totals.months += 1;

        return totals;
      },
      {
        paid: 0,
        discount: 0,
        months: 0,
      }
    );
  }, [historyPayments]);

  /* ========================================
     OPEN ADD / EDIT MODAL
  ======================================== */

  const openAddFee = (student) => {
    setFeeTarget(student);
    setFeeMode("add");

    setFeeAmount(String(student.netPayable));
    setFeeDiscount("");

    setFeeMethod("Cash");
    setFeeNotes("");

    setReceipt(null);
    setError("");
  };

  const openEditFee = (student) => {
    setFeeTarget(student);
    setFeeMode("edit");

    setFeeAmount(String(student.paidAmount));
    setFeeDiscount(
      String(student.discount || "")
    );

    setFeeMethod(student.method || "Cash");
    setFeeNotes(student.notes || "");

    setReceipt(null);
    setError("");
  };

  const closeFeeModal = () => {
    if (saving) return;

    setFeeTarget(null);
    setFeeMode("add");

    setFeeAmount("");
    setFeeDiscount("");

    setFeeMethod("Cash");
    setFeeNotes("");

    setReceipt(null);
    setError("");
  };

  /* ========================================
     SAVE FEE
  ======================================== */

  const handleSaveFee = async (event) => {
    event.preventDefault();

    if (!feeTarget) return;

    try {
      setSaving(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/api/fees/collect`,
        {
          studentId: feeTarget._id,
          month,
          discount: Number(feeDiscount) || 0,
          paidAmount: Number(feeAmount),
          method: feeMethod,
          notes: feeNotes,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setReceipt(response.data.payment);

        showSuccess(
          feeMode === "edit"
            ? "Fee updated successfully!"
            : "Fee collected successfully!"
        );

        await fetchCollection();
      } else {
        setError(
          response.data.message ||
            "Failed to save fee."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save fee. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ========================================
     DELETE STUDENT FEE PAYMENT
  ======================================== */

  const handleDeleteFee = async () => {
    if (!deleteTarget || deleting) return;

    try {
      setDeleting(true);
      setError("");

      const response = await axios.delete(
        `${API_URL}/api/fees/payment/${deleteTarget.paymentId}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setDeleteTarget(null);

        showSuccess("Fee record deleted!");

        await fetchCollection();
      } else {
        setError(
          response.data.message ||
            "Failed to delete fee record."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete fee record. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ========================================
     FEE SETTING FUNCTIONS
  ======================================== */

  const handleEditSetting = (
    className,
    currentSetting
  ) => {
    setEditingClass(className);

    setEditFee(
      currentSetting
        ? String(currentSetting.monthlyFee)
        : ""
    );

    setEditDueDay(
      currentSetting
        ? String(currentSetting.dueDay)
        : "10"
    );

    setError("");
  };

  const cancelEditSetting = () => {
    if (savingSetting) return;

    setEditingClass(null);
    setEditFee("");
    setEditDueDay("10");
  };

  const handleSaveSetting = async (className) => {
    if (savingSetting) return;

    const monthlyFee = Number(editFee);
    const dueDayValue = Number(editDueDay);

    if (
      editFee === "" ||
      !Number.isFinite(monthlyFee) ||
      monthlyFee < 0
    ) {
      setError("Enter a valid monthly fee.");

      return;
    }

    if (
      !Number.isInteger(dueDayValue) ||
      dueDayValue < 1 ||
      dueDayValue > 28
    ) {
      setError(
        "Due day must be between 1 and 28."
      );

      return;
    }

    try {
      setSavingSetting(true);
      setError("");

      const response = await axios.post(
        `${API_URL}/api/fees/settings`,
        {
          className,
          monthlyFee,
          dueDay: dueDayValue,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setEditingClass(null);
        setEditFee("");
        setEditDueDay("10");

        showSuccess("Fee setting saved!");

        await fetchSettings();
      } else {
        setError(
          response.data.message ||
            "Failed to save fee setting."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save fee setting. Please try again."
      );
    } finally {
      setSavingSetting(false);
    }
  };

  /* ========================================
     DELETE CLASS FEE SETTING
  ======================================== */

  const handleDeleteSetting = async () => {
    if (
      !deleteSettingTarget ||
      deletingSetting
    ) {
      return;
    }

    try {
      setDeletingSetting(true);
      setError("");

      const className =
        deleteSettingTarget.className;

      const response = await axios.delete(
        `${API_URL}/api/fees/settings/${encodeURIComponent(
          className
        )}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setDeleteSettingTarget(null);

        if (editingClass === className) {
          cancelEditSetting();
        }

        if (selectedClass === className) {
          setHasSetting(false);
          setStudents([]);
          setStats(null);
        }

        showSuccess("Fee setting deleted!");

        await fetchSettings();
      } else {
        setError(
          response.data.message ||
            "Failed to delete fee setting."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete fee setting. Please try again."
      );
    } finally {
      setDeletingSetting(false);
    }
  };

  /* ========================================
     SEARCH STUDENTS
  ======================================== */

  const filteredStudents = useMemo(() => {
    const query = studentSearch
      .trim()
      .toLowerCase();

    if (!query) return students;

    return students.filter((student) => {
      return (
        student.name?.toLowerCase().includes(query) ||
        String(student.rollNo || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [students, studentSearch]);

  /* ========================================
     RECEIPT IMAGE FUNCTIONS
  ======================================== */

  const openImageReceipt = (type, student) => {
    setImageReceipt({
      type,
      student,
    });
  };

  const closeImageReceipt = () => {
    if (generatingImage) return;

    setImageReceipt(null);
  };

  const handleDownloadImage = async () => {
    if (
      !receiptImageRef.current ||
      generatingImage
    ) {
      return;
    }

    try {
      setGeneratingImage(true);

      const canvas = await html2canvas(
        receiptImageRef.current,
        {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
        }
      );

      const link = document.createElement("a");

      const student = imageReceipt?.student;

      link.download = `receipt-${
        student?.name
          ?.replace(/\s+/g, "-")
          .toLowerCase() || "fee"
      }-${month}.png`;

      link.href = canvas.toDataURL("image/png");

      link.click();

      showSuccess("Receipt image downloaded!");
    } catch (err) {
      console.error("Receipt image error:", err);

      setError(
        "Image download failed. Please try again."
      );
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleWhatsAppImage = async () => {
    await handleDownloadImage();

    if (!imageReceipt?.student?.phone) {
      return;
    }

    const student = imageReceipt.student;

    let message = "";

    if (imageReceipt.type === "notice") {
      message = `Assalam-o-Alaikum!

Aziz e Waldain, aapke bachay *${
        student.name
      }* ki ${formatMonth(
        month
      )} ki fee *${formatMoney(
        student.monthlyFee
      )}* hai.

Baraye meherbani ${dueDay} tareekh tak fee jama karwa dein.

*${SCHOOL_NAME}*`;
    }

    if (imageReceipt.type === "receipt") {
      message = `Assalam-o-Alaikum!

Aziz e Waldain, aapke bachay *${
        student.name
      }* ki fee *${formatMoney(
        student.paidAmount
      )}* jama ho gayi hai.

Receipt image download ho chuki hai. Shukriya!

*${SCHOOL_NAME}*`;
    }

    if (imageReceipt.type === "late") {
      message = `Assalam-o-Alaikum!

Aziz e Waldain, aapke bachay *${
        student.name
      }* ki fee overdue hai.

Baraye meherbani fee foran jama karwa dein.

*${SCHOOL_NAME}*`;
    }

    window.open(
      buildWhatsAppLink(student.phone, message),
      "_blank"
    );
  };

  return (
    <div className="fees-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="fees-main">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="fees-content">
          {/* PAGE HEADER */}

          <div className="fees-page-header">
            <div>
              <span className="fees-eyebrow">
                FEE MANAGEMENT
              </span>

              <h1>Fees</h1>

              <p>
                Collect monthly fees, manage class fee
                settings and send fee receipts through
                WhatsApp.
              </p>
            </div>
          </div>

          <section className="fees-card">
            {/* TOOLBAR */}

            <div className="fees-toolbar">
              <div className="fees-view-toggle">
                <button
                  type="button"
                  className={
                    viewMode === "collection"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setViewMode("collection")
                  }
                >
                  <FiDollarSign />
                  Collection
                </button>

                <button
                  type="button"
                  className={
                    viewMode === "settings"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setViewMode("settings")
                  }
                >
                  <FiSettings />
                  Settings
                </button>
              </div>

              {viewMode === "collection" && (
                <div className="fees-mark-controls">
                  <div
                    ref={dropdownRef}
                    className={`fees-dropdown ${
                      isDropdownOpen ? "open" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="fees-dropdown-trigger"
                      onClick={() =>
                        setIsDropdownOpen(
                          (previous) => !previous
                        )
                      }
                    >
                      <FiUsers className="fees-dropdown-icon" />

                      <span
                        className={
                          selectedClass
                            ? "has-value"
                            : "placeholder"
                        }
                      >
                        {selectedClass ||
                          "Select Class — Playgroup to 10"}
                      </span>

                      {selectedClass && (
                        <span
                          role="button"
                          tabIndex={0}
                          className="fees-dropdown-clear"
                          onClick={(event) => {
                            event.stopPropagation();

                            setSelectedClass("");
                            setIsDropdownOpen(false);
                          }}
                          aria-label="Clear class"
                        >
                          <FiX />
                        </span>
                      )}

                      <FiCheck
                        className={`fees-dropdown-arrow ${
                          isDropdownOpen
                            ? "rotated"
                            : ""
                        }`}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="fees-dropdown-menu">
                        {CLASS_LIST.map((className) => (
                          <button
                            key={className}
                            type="button"
                            className={`fees-dropdown-option ${
                              selectedClass === className
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedClass(className);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <span className="option-name">
                              {className}
                            </span>

                            {selectedClass === className && (
                              <FiCheck className="option-check" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="fees-month">
                    <input
                      type="month"
                      value={month}
                      onChange={(event) =>
                        setMonth(event.target.value)
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ERROR / SUCCESS */}

            {error && (
              <div className="fees-error">
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

            {success && (
              <div className="fees-success">
                <FiCheck />
                <span>{success}</span>
              </div>
            )}

            <div className="fees-body">
              {/* COLLECTION */}

              {viewMode === "collection" &&
                (!selectedClass ? (
                  <div className="fees-empty">
                    <div className="fees-empty-icon">
                      <FiUsers />
                    </div>

                    <h3>No Class Selected</h3>

                    <p>
                      Choose a class and month to collect
                      fees.
                    </p>

                    <div className="fees-quick-classes">
                      {CLASS_LIST.map((className) => (
                        <button
                          key={className}
                          type="button"
                          onClick={() =>
                            setSelectedClass(className)
                          }
                        >
                          {className}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : loading ? (
                  <div className="fees-list">
                    {[0, 1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="fees-row-skeleton"
                      />
                    ))}
                  </div>
                ) : !hasSetting ? (
                  <div className="fees-empty small">
                    <div className="fees-empty-icon">
                      <FiSettings />
                    </div>

                    <h3>No Fee Setting</h3>

                    <p>
                      First set monthly fee and due date
                      for{" "}
                      <strong>{selectedClass}</strong>{" "}
                      in Settings.
                    </p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="fees-empty small">
                    <div className="fees-empty-icon">
                      <FiUsers />
                    </div>

                    <h3>No Students Found</h3>

                    <p>
                      No students found in{" "}
                      <strong>{selectedClass}</strong>.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* COLLECTION STATS */}

                    {stats && (
                      <div className="fees-stats">
                        <div className="fees-stat-card">
                          <span>Collected</span>

                          <strong>
                            {formatMoney(stats.collected)}
                          </strong>
                        </div>

                        <div className="fees-stat-card">
                          <span>Expected</span>

                          <strong>
                            {formatMoney(stats.expected)}
                          </strong>
                        </div>

                        <div className="fees-stat-card green">
                          <span>Paid</span>

                          <strong>{stats.paid}</strong>
                        </div>

                        <div className="fees-stat-card orange">
                          <span>Partial</span>

                          <strong>{stats.partial}</strong>
                        </div>

                        <div className="fees-stat-card red">
                          <span>Unpaid</span>

                          <strong>{stats.pending}</strong>
                        </div>
                      </div>
                    )}

                    <div className="fees-list-header">
                      <div className="fees-count-info">
                        <strong>{selectedClass}</strong>

                        <span>
                          {formatMonth(month)}
                          {" — Due day: "}
                          {dueDay}
                        </span>
                      </div>

                      <div className="fees-list-actions">
                        <div className="fees-search">
                          <input
                            type="text"
                            placeholder="Find student..."
                            value={studentSearch}
                            onChange={(event) =>
                              setStudentSearch(
                                event.target.value
                              )
                            }
                          />

                          {studentSearch && (
                            <button
                              type="button"
                              onClick={() =>
                                setStudentSearch("")
                              }
                              aria-label="Clear search"
                            >
                              <FiX />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          className="fees-refresh"
                          onClick={fetchCollection}
                          disabled={loading}
                          aria-label="Refresh"
                        >
                          <FiRefreshCw
                            className={
                              loading ? "spin" : ""
                            }
                          />
                        </button>
                      </div>
                    </div>

                    {/* STUDENT LIST */}

                    <div className="fees-list">
                      {filteredStudents.length === 0 ? (
                        <div className="fees-search-empty">
                          No student matches "
                          {studentSearch}"
                        </div>
                      ) : (
                        filteredStudents.map((student) => (
                          <div
                            key={student._id}
                            className="fees-row"
                          >
                            <div
                              className="fees-student clickable"
                              onClick={() =>
                                openHistory(student)
                              }
                              title="View fee history"
                            >
                              <div>
                                <strong>
                                  {student.name}
                                </strong>

                                <span>
                                  Roll {student.rollNo}
                                  {student.phone
                                    ? ` · ${student.phone}`
                                    : " · No phone"}
                                  {" · View history"}
                                </span>
                              </div>
                            </div>

                            <div className="fees-amount">
                              <strong>
                                {formatMoney(
                                  student.netPayable
                                )}
                              </strong>

                              {student.status ===
                                "Partial" && (
                                <>
                                  <span className="paid-line">
                                    Paid:{" "}
                                    {formatMoney(
                                      student.paidAmount
                                    )}
                                  </span>

                                  <span className="remaining-line">
                                    Remaining:{" "}
                                    {formatMoney(
                                      student.netPayable -
                                        student.paidAmount
                                    )}
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="fees-status-side">
                              <span
                                className={`fees-status ${String(
                                  student.status
                                ).toLowerCase()}`}
                              >
                                {student.status}
                              </span>

                              <button
                                type="button"
                                className="fees-message-button"
                                onClick={() =>
                                  setMessageTarget(student)
                                }
                                disabled={!student.phone}
                                title={
                                  student.phone
                                    ? "Send WhatsApp message"
                                    : "No phone number"
                                }
                              >
                                <FiMessageCircle />
                                Message
                              </button>

                              {student.paymentId ? (
                                <>
                                  <button
                                    type="button"
                                    className="fees-collect-button"
                                    onClick={() =>
                                      openEditFee(student)
                                    }
                                  >
                                    <FiEdit2 />
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="fees-delete-button"
                                    onClick={() =>
                                      setDeleteTarget(student)
                                    }
                                  >
                                    <FiTrash2 />
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="fees-collect-button"
                                  onClick={() =>
                                    openAddFee(student)
                                  }
                                >
                                  <FiPlus />
                                  Add Fee
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ))}

              {/* SETTINGS */}

              {viewMode === "settings" &&
                (settingsLoading ? (
                  <div className="fees-list">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="fees-row-skeleton"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="settings-list">
                    {CLASS_LIST.map((className) => {
                      const currentSetting = settings.find(
                        (item) =>
                          item.className === className
                      );

                      return (
                        <div
                          key={className}
                          className="setting-row"
                        >
                          <strong>{className}</strong>

                          {editingClass === className ? (
                            <div className="setting-edit">
                              <input
                                type="number"
                                min="0"
                                placeholder="Monthly fee"
                                value={editFee}
                                onChange={(event) =>
                                  setEditFee(
                                    event.target.value
                                  )
                                }
                                disabled={savingSetting}
                              />

                              <input
                                type="number"
                                min="1"
                                max="28"
                                placeholder="Due day"
                                value={editDueDay}
                                onChange={(event) =>
                                  setEditDueDay(
                                    event.target.value
                                  )
                                }
                                disabled={savingSetting}
                              />

                              <button
                                type="button"
                                className="setting-save"
                                onClick={() =>
                                  handleSaveSetting(
                                    className
                                  )
                                }
                                disabled={savingSetting}
                                title="Save setting"
                              >
                                <FiCheck />
                              </button>

                              <button
                                type="button"
                                className="setting-cancel"
                                onClick={cancelEditSetting}
                                disabled={savingSetting}
                                title="Cancel"
                              >
                                <FiX />
                              </button>
                            </div>
                          ) : (
                            <div className="setting-view">
                              {currentSetting ? (
                                <span>
                                  {formatMoney(
                                    currentSetting.monthlyFee
                                  )}
                                  {" · Due: "}
                                  {currentSetting.dueDay}
                                </span>
                              ) : (
                                <span className="not-set">
                                  Not set
                                </span>
                              )}

                              <div className="setting-actions">
                                <button
                                  type="button"
                                  className="setting-edit-button"
                                  onClick={() =>
                                    handleEditSetting(
                                      className,
                                      currentSetting
                                    )
                                  }
                                >
                                  <FiEdit2 />

                                  {currentSetting
                                    ? "Edit"
                                    : "Set"}
                                </button>

                                {currentSetting && (
                                  <button
                                    type="button"
                                    className="setting-delete-button"
                                    onClick={() =>
                                      setDeleteSettingTarget(
                                        currentSetting
                                      )
                                    }
                                  >
                                    <FiTrash2 />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          </section>
        </main>
      </div>

      {/* ========================================
          HISTORY MODAL
      ======================================== */}

      {historyTarget && (
        <div
          className="fees-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeHistory();
            }
          }}
        >
          <div className="fees-modal history-modal">
            <div className="fees-modal-header">
              <div>
                <span>FEE HISTORY</span>

                <h2>{historyTarget.name}</h2>

                <p>
                  {historyTarget.className} · Roll{" "}
                  {historyTarget.rollNo}
                </p>
              </div>

              <button
                type="button"
                className="fees-modal-close"
                onClick={closeHistory}
                aria-label="Close history"
              >
                <FiX />
              </button>
            </div>

            {historyLoading ? (
              <div className="history-loading">
                Loading history...
              </div>
            ) : historyPayments.length === 0 ? (
              <div className="history-empty">
                <p>
                  No fee payments recorded yet for this
                  student.
                </p>
              </div>
            ) : (
              <div className="history-body">
                <div className="history-totals">
                  <div className="history-total-card">
                    <span>Months Paid</span>
                    <strong>{historyTotals.months}</strong>
                  </div>

                  <div className="history-total-card">
                    <span>Total Paid</span>

                    <strong>
                      {formatMoney(historyTotals.paid)}
                    </strong>
                  </div>

                  <div className="history-total-card">
                    <span>Total Discounts</span>

                    <strong>
                      {formatMoney(
                        historyTotals.discount
                      )}
                    </strong>
                  </div>
                </div>

                <div className="history-list">
                  {historyPayments.map((payment) => {
                    const payable =
                      Number(payment.monthlyFee || 0) -
                      Number(payment.discount || 0);

                    const isPaid =
                      Number(payment.paidAmount || 0) >=
                      payable;

                    return (
                      <div
                        key={payment._id}
                        className="history-row"
                      >
                        <div className="history-month">
                          <strong>
                            {formatMonth(payment.month)}
                          </strong>

                          <span>
                            {formatDay(payment.paidAt)}
                          </span>
                        </div>

                        <div className="history-detail">
                          <strong>
                            {formatMoney(
                              payment.paidAmount
                            )}
                          </strong>

                          <span>
                            {payment.method}
                            {Number(payment.discount) > 0 &&
                              ` · ${formatMoney(
                                payment.discount
                              )} discount`}
                          </span>
                        </div>

                        <span
                          className={`fees-status ${
                            isPaid ? "paid" : "partial"
                          }`}
                        >
                          {isPaid ? "Paid" : "Partial"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================
          MESSAGE CHOICE MODAL
      ======================================== */}

      {messageTarget && (
        <div
          className="fees-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMessageTarget(null);
            }
          }}
        >
          <div className="fees-modal message-modal">
            <div className="fees-modal-header">
              <div>
                <span>WHATSAPP MESSAGE</span>

                <h2>{messageTarget.name}</h2>

                <p>
                  {messageTarget.className} · Roll{" "}
                  {messageTarget.rollNo} ·{" "}
                  {messageTarget.phone || "No phone"}
                </p>
              </div>

              <button
                type="button"
                className="fees-modal-close"
                onClick={() => setMessageTarget(null)}
                aria-label="Close message options"
              >
                <FiX />
              </button>
            </div>

            <div className="message-options">
              <button
                type="button"
                className="message-option"
                onClick={() => {
                  openImageReceipt(
                    "notice",
                    messageTarget
                  );

                  setMessageTarget(null);
                }}
              >
                <span className="message-option-icon blue">
                  📋
                </span>

                <div>
                  <strong>Fee Notice</strong>

                  <span>
                    Fee demand —{" "}
                    {formatMoney(
                      messageTarget.monthlyFee
                    )}
                    {" · Due "}
                    {dueDay} {formatMonth(month)}
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="message-option"
                disabled={
                  messageTarget.status === "Pending" ||
                  messageTarget.status === "Late"
                }
                onClick={() => {
                  openImageReceipt(
                    "receipt",
                    messageTarget
                  );

                  setMessageTarget(null);
                }}
              >
                <span className="message-option-icon green">
                  ✅
                </span>

                <div>
                  <strong>Paid Receipt</strong>

                  <span>
                    {messageTarget.status === "Paid" ||
                    messageTarget.status === "Partial"
                      ? `Receipt of collected fee — ${formatMoney(
                          messageTarget.paidAmount
                        )}`
                      : "Fee not collected yet"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="message-option"
                disabled={messageTarget.status !== "Late"}
                onClick={() => {
                  openImageReceipt(
                    "late",
                    messageTarget
                  );

                  setMessageTarget(null);
                }}
              >
                <span className="message-option-icon orange">
                  ⚠️
                </span>

                <div>
                  <strong>Late Reminder</strong>

                  <span>
                    {messageTarget.status === "Late"
                      ? "Fee is overdue — send reminder"
                      : "Fee is not overdue yet"}
                  </span>
                </div>
              </button>
            </div>

            <p className="message-modal-note">
              Choose an option. Receipt image will be
              prepared for download and WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* ========================================
          RECEIPT IMAGE MODAL
      ======================================== */}

      {imageReceipt && (
        <div
          className="fees-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !generatingImage
            ) {
              closeImageReceipt();
            }
          }}
        >
          <div className="fees-modal image-receipt-modal">
            <div className="fees-modal-header">
              <div>
                <span>
                  {imageReceipt.type === "notice"
                    ? "FEE NOTICE"
                    : imageReceipt.type === "late"
                    ? "LATE REMINDER"
                    : "FEE RECEIPT"}
                </span>

                <h2>{imageReceipt.student.name}</h2>

                <p>
                  Download this receipt image and attach
                  it in WhatsApp.
                </p>
              </div>

              <button
                type="button"
                className="fees-modal-close"
                onClick={closeImageReceipt}
                disabled={generatingImage}
                aria-label="Close receipt"
              >
                <FiX />
              </button>
            </div>

            <div className="image-receipt-wrapper">
              <div
                ref={receiptImageRef}
                className="receipt-card"
              >
                <div className="receipt-card-header">
                  <div className="receipt-school-logo">
                    🎓
                  </div>

                  <div className="receipt-school-name">
                    {SCHOOL_NAME}
                  </div>

                  <div
                    className={`receipt-card-type ${
                      imageReceipt.type === "notice"
                        ? "blue"
                        : imageReceipt.type === "late"
                        ? "red"
                        : "green"
                    }`}
                  >
                    {imageReceipt.type === "notice"
                      ? "FEE NOTICE"
                      : imageReceipt.type === "late"
                      ? "FEE OVERDUE REMINDER"
                      : "FEE PAID RECEIPT"}
                  </div>
                </div>

                <div className="receipt-card-body">
                  <div className="receipt-card-row">
                    <span>Student Name</span>

                    <strong>
                      {imageReceipt.student.name}
                    </strong>
                  </div>

                  <div className="receipt-card-row">
                    <span>Father Name</span>

                    <strong>
                      {imageReceipt.student.fatherName ||
                        "—"}
                    </strong>
                  </div>

                  <div className="receipt-card-row">
                    <span>Class</span>

                    <strong>
                      {imageReceipt.student.className}
                      {" · Roll "}
                      {imageReceipt.student.rollNo}
                    </strong>
                  </div>

                  <div className="receipt-card-row">
                    <span>Fee Month</span>

                    <strong>{formatMonth(month)}</strong>
                  </div>

                  {imageReceipt.type === "receipt" && (
                    <>
                      <div className="receipt-card-row">
                        <span>Receipt No.</span>

                        <strong>
                          {imageReceipt.student.receiptNo ||
                            "—"}
                        </strong>
                      </div>

                      <div className="receipt-card-row">
                        <span>Payment Date</span>

                        <strong>
                          {formatDay(
                            imageReceipt.student.paidAt
                          )}
                        </strong>
                      </div>
                    </>
                  )}
                </div>

                <div className="receipt-card-amount">
                  {imageReceipt.type === "notice" && (
                    <>
                      <span>Fee Payable</span>

                      <strong>
                        {formatMoney(
                          imageReceipt.student.monthlyFee
                        )}
                      </strong>

                      <small>
                        Last date: {dueDay}{" "}
                        {formatMonth(month)}
                      </small>
                    </>
                  )}

                  {imageReceipt.type === "late" && (
                    <>
                      <span>Fee Overdue</span>

                      <strong>
                        {formatMoney(
                          imageReceipt.student.netPayable
                        )}
                      </strong>

                      <small>
                        Due date: {dueDay}{" "}
                        {formatMonth(month)}
                      </small>
                    </>
                  )}

                  {imageReceipt.type === "receipt" && (
                    <>
                      <span>Amount Paid</span>

                      <strong>
                        {formatMoney(
                          imageReceipt.student.paidAmount
                        )}
                      </strong>

                      <small>
                        {imageReceipt.student.method ||
                          "Cash"}
                        {" · "}
                        {formatMoney(
                          imageReceipt.student.monthlyFee
                        )}{" "}
                        fee
                      </small>
                    </>
                  )}
                </div>

                <div className="receipt-card-footer">
                  <span>
                    {imageReceipt.type === "notice" &&
                      "Please submit the fee before the due date."}

                    {imageReceipt.type === "late" &&
                      "Please submit the fee as soon as possible."}

                    {imageReceipt.type === "receipt" &&
                      "Thank you! This is a verified receipt."}
                  </span>

                  <span className="receipt-card-brand">
                    💚 Taleem — Hamara Waada
                  </span>
                </div>
              </div>

              <p className="image-receipt-hint">
                Pehle image download karein, phir
                WhatsApp mein attach kar ke bhejein.
              </p>
            </div>

            {/* UPDATED CLOSE / WHATSAPP BUTTONS */}

            <div className="preview-actions">
              <button
                type="button"
                className="receipt-close-button"
                onClick={closeImageReceipt}
                disabled={generatingImage}
              >
                <FiX />
                Close
              </button>

              {imageReceipt.student.phone && (
                <button
                  type="button"
                  className="receipt-whatsapp-button"
                  onClick={handleWhatsAppImage}
                  disabled={generatingImage}
                >
                  <FiMessageCircle />
                  WhatsApp
                </button>
              )}

              <button
                type="button"
                className="receipt-download-button"
                onClick={handleDownloadImage}
                disabled={generatingImage}
              >
                <FiDownload />

                {generatingImage
                  ? "Preparing..."
                  : "Download Image"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          ADD / EDIT FEE MODAL
      ======================================== */}

      {feeTarget && (
        <div
          className="fees-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeFeeModal();
            }
          }}
        >
          <div className="fees-modal">
            <div className="fees-modal-header">
              <div>
                <span>
                  {feeMode === "edit"
                    ? "EDIT FEE"
                    : "ADD FEE"}
                </span>

                <h2>{feeTarget.name}</h2>

                <p>
                  {feeTarget.className} · Roll{" "}
                  {feeTarget.rollNo} ·{" "}
                  {formatMonth(month)}
                </p>
              </div>

              <button
                type="button"
                className="fees-modal-close"
                onClick={closeFeeModal}
                disabled={saving}
                aria-label="Close fee form"
              >
                <FiX />
              </button>
            </div>

            {receipt ? (
              <div className="receipt-view">
                <div className="receipt-check">
                  <FiCheckCircle />
                </div>

                <h2>
                  {feeMode === "edit"
                    ? "Fee Updated!"
                    : "Fee Collected!"}
                </h2>

                <div className="receipt-details">
                  <div>
                    <span>Receipt No.</span>
                    <strong>{receipt.receiptNo}</strong>
                  </div>

                  <div>
                    <span>Student</span>
                    <strong>{receipt.studentName}</strong>
                  </div>

                  <div>
                    <span>Month</span>

                    <strong>
                      {formatMonth(receipt.month)}
                    </strong>
                  </div>

                  <div>
                    <span>Fee</span>

                    <strong>
                      {formatMoney(receipt.monthlyFee)}
                    </strong>
                  </div>

                  <div>
                    <span>Discount</span>

                    <strong>
                      {formatMoney(receipt.discount)}
                    </strong>
                  </div>

                  <div>
                    <span>Paid</span>

                    <strong>
                      {formatMoney(receipt.paidAmount)}
                    </strong>
                  </div>

                  <div>
                    <span>Method</span>
                    <strong>{receipt.method}</strong>
                  </div>

                  <div>
                    <span>Date</span>

                    <strong>
                      {formatDay(receipt.paidAt)}
                    </strong>
                  </div>
                </div>

                <div className="receipt-actions">
                  {feeTarget.phone && (
                    <button
                      type="button"
                      className="receipt-download-button"
                      onClick={() =>
                        openImageReceipt("receipt", {
                          ...feeTarget,
                          receiptNo: receipt.receiptNo,
                          paidAmount: receipt.paidAmount,
                          discount: receipt.discount,
                          monthlyFee: receipt.monthlyFee,
                          method: receipt.method,
                          paidAt: receipt.paidAt,
                        })
                      }
                    >
                      <FiDownload />
                      Receipt Image
                    </button>
                  )}

                  <button
                    type="button"
                    className="fees-cancel-button"
                    onClick={closeFeeModal}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form
                className="fees-form"
                onSubmit={handleSaveFee}
              >
                {error && (
                  <div className="fees-form-error">
                    {error}
                  </div>
                )}

                {feeMode === "edit" && (
                  <div className="edit-notice">
                    Existing payment is being edited.
                  </div>
                )}

                <div className="fees-form-grid">
                  <div className="fees-form-group">
                    <label>Monthly Fee</label>

                    <input
                      type="text"
                      value={formatMoney(
                        feeTarget.monthlyFee
                      )}
                      disabled
                    />
                  </div>

                  <div className="fees-form-group">
                    <label>Discount (Rs.)</label>

                    <input
                      type="number"
                      min="0"
                      max={feeTarget.monthlyFee}
                      placeholder="0"
                      value={feeDiscount}
                      onChange={(event) =>
                        setFeeDiscount(
                          event.target.value
                        )
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="fees-form-group">
                    <label>Paid Amount (Rs.) *</label>

                    <input
                      type="number"
                      min="1"
                      required
                      value={feeAmount}
                      onChange={(event) =>
                        setFeeAmount(
                          event.target.value
                        )
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="fees-form-group">
                    <label>Method</label>

                    <select
                      value={feeMethod}
                      onChange={(event) =>
                        setFeeMethod(
                          event.target.value
                        )
                      }
                      disabled={saving}
                    >
                      {METHODS.map((method) => (
                        <option
                          key={method}
                          value={method}
                        >
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="fees-form-group full">
                    <label>Notes</label>

                    <input
                      type="text"
                      placeholder="Optional note..."
                      value={feeNotes}
                      onChange={(event) =>
                        setFeeNotes(event.target.value)
                      }
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="fees-form-footer">
                  <div className="fees-form-footer-right">
                    <button
                      type="button"
                      className="fees-cancel-button"
                      onClick={closeFeeModal}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="fees-save-button"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : feeMode === "edit"
                        ? "Update Fee"
                        : "Save Payment"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================
          DELETE STUDENT PAYMENT MODAL
      ======================================== */}

      {deleteTarget && (
        <div
          className="fees-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="fees-delete-modal">
            <div className="fees-delete-icon">
              <FiTrash2 />
            </div>

            <h2>Delete Fee Record?</h2>

            <p>
              The fee record of{" "}
              <strong>{deleteTarget.name}</strong> will
              be deleted. Student record will remain
              safe.
            </p>

            <div className="fees-delete-actions">
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
                onClick={handleDeleteFee}
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Fee Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          DELETE FEE SETTING MODAL
      ======================================== */}

      {deleteSettingTarget && (
        <div
          className="fees-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deletingSetting
            ) {
              setDeleteSettingTarget(null);
            }
          }}
        >
          <div className="fees-delete-modal fee-setting-delete-modal">
            <div className="fees-delete-icon">
              <FiTrash2 />
            </div>

            <h2>Delete Fee Setting?</h2>

            <p>
              Are you sure you want to remove fee
              setting for{" "}
              <strong>
                {deleteSettingTarget.className}
              </strong>
              ?
            </p>

            <div className="setting-delete-summary">
              <span>Monthly Fee</span>

              <strong>
                {formatMoney(
                  deleteSettingTarget.monthlyFee
                )}
              </strong>

              <span>Due Day</span>

              <strong>
                {deleteSettingTarget.dueDay}
              </strong>
            </div>

            <p className="setting-delete-note">
              Existing student payments and payment
              history will not be deleted.
            </p>

            <div className="fees-delete-actions">
              <button
                type="button"
                onClick={() =>
                  setDeleteSettingTarget(null)
                }
                disabled={deletingSetting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete"
                onClick={handleDeleteSetting}
                disabled={deletingSetting}
              >
                {deletingSetting
                  ? "Deleting..."
                  : "Delete Setting"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;