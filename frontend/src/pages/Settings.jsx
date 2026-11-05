import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiInfo,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiSettings as FiSettingsIcon,
  FiShield,
  FiUser,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/Settings.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const defaultSettings = {
  schoolName: "Future Skill",
  schoolAddress: "",
  schoolPhone: "",
  schoolEmail: "",
  principalName: "",
  currency: "₨",
  dateFormat: "DD/MM/YYYY",
  timezone: "Asia/Karachi",
  attendanceLateAfterMinutes: 10,
  feeDueDay: 10,
  emailNotifications: true,
  noticeNotifications: true,
  feeNotifications: true,
  attendanceNotifications: true,
  printSchoolName: true,
  printSchoolAddress: true,
  printSchoolPhone: true,
};

const Settings = () => {
  const [settings, setSettings] =
    useState(defaultSettings);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState({
      type: "",
      text: "",
    });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/api/settings"
      );

      if (response.data.success) {
        setSettings({
          ...defaultSettings,
          ...response.data.settings,
        });
      }
    } catch (error) {
      console.error(
        "Settings Load Error:",
        error
      );

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to load settings",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setMessage({
      type: "",
      text: "",
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!settings.schoolName.trim()) {
      setMessage({
        type: "error",
        text: "School name is required",
      });

      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...settings,
        attendanceLateAfterMinutes:
          Number(
            settings.attendanceLateAfterMinutes
          ),
        feeDueDay: Number(
          settings.feeDueDay
        ),
      };

      const response = await api.put(
        "/api/settings",
        payload
      );

      if (response.data.success) {
        setSettings({
          ...defaultSettings,
          ...response.data.settings,
        });

        setMessage({
          type: "success",
          text:
            "Settings saved successfully",
        });
      }
    } catch (error) {
      console.error(
        "Settings Save Error:",
        error
      );

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        Loading settings...
      </div>
    );
  }

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

        <main className="settings-page">
          <div className="settings-header">
            <div>
              <span className="settings-eyebrow">
                SYSTEM CONFIGURATION
              </span>

              <h1>Settings</h1>

              <p>
                Manage your school and system
                preferences.
              </p>
            </div>

            <button
              type="button"
              className="settings-save-top"
              onClick={handleSave}
              disabled={saving}
            >
              <FiSave />

              {saving
                ? "Saving..."
                : "Save Settings"}
            </button>
          </div>

          {message.text && (
            <div
              className={`settings-message ${message.type}`}
            >
              {message.type ===
                "success" && <FiCheck />}

              {message.type ===
                "error" && <FiInfo />}

              <span>{message.text}</span>
            </div>
          )}

          <form
            onSubmit={handleSave}
            className="settings-content"
          >
            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <FiBookOpen />
                </div>

                <div>
                  <h2>
                    School Information
                  </h2>

                  <p>
                    Basic information about your
                    school.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-field">
                  <label htmlFor="schoolName">
                    School Name
                  </label>

                  <div className="settings-input">
                    <FiBookOpen />

                    <input
                      id="schoolName"
                      type="text"
                      name="schoolName"
                      value={
                        settings.schoolName
                      }
                      onChange={handleChange}
                      placeholder="Enter school name"
                    />
                  </div>
                </div>

                <div className="settings-field">
                  <label htmlFor="principalName">
                    Principal Name
                  </label>

                  <div className="settings-input">
                    <FiUser />

                    <input
                      id="principalName"
                      type="text"
                      name="principalName"
                      value={
                        settings.principalName
                      }
                      onChange={handleChange}
                      placeholder="Enter principal name"
                    />
                  </div>
                </div>

                <div className="settings-field settings-field-full">
                  <label htmlFor="schoolAddress">
                    School Address
                  </label>

                  <div className="settings-input">
                    <FiMapPin />

                    <input
                      id="schoolAddress"
                      type="text"
                      name="schoolAddress"
                      value={
                        settings.schoolAddress
                      }
                      onChange={handleChange}
                      placeholder="Enter complete school address"
                    />
                  </div>
                </div>

                <div className="settings-field">
                  <label htmlFor="schoolPhone">
                    School Phone
                  </label>

                  <div className="settings-input">
                    <FiPhone />

                    <input
                      id="schoolPhone"
                      type="text"
                      name="schoolPhone"
                      value={
                        settings.schoolPhone
                      }
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="settings-field">
                  <label htmlFor="schoolEmail">
                    School Email
                  </label>

                  <div className="settings-input">
                    <FiMail />

                    <input
                      id="schoolEmail"
                      type="email"
                      name="schoolEmail"
                      value={
                        settings.schoolEmail
                      }
                      onChange={handleChange}
                      placeholder="Enter school email"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <FiSettingsIcon />
                </div>

                <div>
                  <h2>
                    System Preferences
                  </h2>

                  <p>
                    Configure general system
                    preferences.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-field">
                  <label htmlFor="currency">
                    Currency
                  </label>

                  <div className="settings-input settings-disabled">
                    <span className="settings-currency-symbol">
                      ₨
                    </span>

                    <input
                      id="currency"
                      type="text"
                      value="₨ PKR"
                      disabled
                    />
                  </div>

                  <small>
                    School fees are displayed in
                    Pakistani Rupees.
                  </small>
                </div>

                <div className="settings-field">
                  <label htmlFor="dateFormat">
                    Date Format
                  </label>

                  <div className="settings-input">
                    <FiCalendar />

                    <select
                      id="dateFormat"
                      name="dateFormat"
                      value={
                        settings.dateFormat
                      }
                      onChange={handleChange}
                    >
                      <option value="DD/MM/YYYY">
                        DD/MM/YYYY
                      </option>

                      <option value="MM/DD/YYYY">
                        MM/DD/YYYY
                      </option>

                      <option value="YYYY-MM-DD">
                        YYYY-MM-DD
                      </option>
                    </select>
                  </div>
                </div>

                <div className="settings-field settings-field-full">
                  <label htmlFor="timezone">
                    Timezone
                  </label>

                  <div className="settings-input">
                    <FiClock />

                    <select
                      id="timezone"
                      name="timezone"
                      value={
                        settings.timezone
                      }
                      onChange={handleChange}
                    >
                      <option value="Asia/Karachi">
                        Pakistan Standard Time
                        (Asia/Karachi)
                      </option>

                      <option value="UTC">
                        Coordinated Universal Time
                        (UTC)
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <FiShield />
                </div>

                <div>
                  <h2>
                    Attendance Settings
                  </h2>

                  <p>
                    Configure attendance behavior.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-field">
                  <label htmlFor="attendanceLateAfterMinutes">
                    Mark Late After
                  </label>

                  <div className="settings-input">
                    <FiClock />

                    <input
                      id="attendanceLateAfterMinutes"
                      type="number"
                      min="0"
                      name="attendanceLateAfterMinutes"
                      value={
                        settings.attendanceLateAfterMinutes
                      }
                      onChange={handleChange}
                    />

                    <span className="settings-input-suffix">
                      minutes
                    </span>
                  </div>

                  <small>
                    Students arriving after this
                    time can be marked Late.
                  </small>
                </div>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <FiDollarSign />
                </div>

                <div>
                  <h2>Fee Settings</h2>

                  <p>
                    Configure your monthly fee
                    preferences.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-field">
                  <label htmlFor="feeDueDay">
                    Monthly Fee Due Day
                  </label>

                  <div className="settings-input">
                    <FiCalendar />

                    <input
                      id="feeDueDay"
                      type="number"
                      min="1"
                      max="31"
                      name="feeDueDay"
                      value={
                        settings.feeDueDay
                      }
                      onChange={handleChange}
                    />

                    <span className="settings-input-suffix">
                      day
                    </span>
                  </div>

                  <small>
                    Example: 10 means fees are due
                    on the 10th of each month.
                  </small>
                </div>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <FiBell />
                </div>

                <div>
                  <h2>
                    Notification Preferences
                  </h2>

                  <p>
                    Choose which notifications
                    should be enabled.
                  </p>
                </div>
              </div>

              <div className="settings-toggle-list">
                <label className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-icon">
                      <FiMail />
                    </div>

                    <div>
                      <strong>
                        Email Notifications
                      </strong>

                      <span>
                        Receive system notifications
                        by email.
                      </span>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={
                      settings.emailNotifications
                    }
                    onChange={handleChange}
                  />

                  <span className="settings-switch"></span>
                </label>

                <label className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-icon">
                      <FiFileText />
                    </div>

                    <div>
                      <strong>
                        Notice Notifications
                      </strong>

                      <span>
                        Enable notifications for
                        school notices.
                      </span>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    name="noticeNotifications"
                    checked={
                      settings.noticeNotifications
                    }
                    onChange={handleChange}
                  />

                  <span className="settings-switch"></span>
                </label>

                <label className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-icon">
                      <FiDollarSign />
                    </div>

                    <div>
                      <strong>
                        Fee Notifications
                      </strong>

                      <span>
                        Enable fee-related
                        notifications.
                      </span>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    name="feeNotifications"
                    checked={
                      settings.feeNotifications
                    }
                    onChange={handleChange}
                  />

                  <span className="settings-switch"></span>
                </label>

                <label className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-icon">
                      <FiShield />
                    </div>

                    <div>
                      <strong>
                        Attendance Notifications
                      </strong>

                      <span>
                        Enable attendance-related
                        notifications.
                      </span>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    name="attendanceNotifications"
                    checked={
                      settings.attendanceNotifications
                    }
                    onChange={handleChange}
                  />

                  <span className="settings-switch"></span>
                </label>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <FiFileText />
                </div>

                <div>
                  <h2>
                    Print & PDF Settings
                  </h2>

                  <p>
                    Choose what information appears
                    on printed reports.
                  </p>
                </div>
              </div>

              <div className="settings-toggle-list">
                <label className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-icon">
                      <FiBookOpen />
                    </div>

                    <div>
                      <strong>
                        Show School Name
                      </strong>

                      <span>
                        Display school name on
                        printed documents.
                      </span>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    name="printSchoolName"
                    checked={
                      settings.printSchoolName
                    }
                    onChange={handleChange}
                  />

                  <span className="settings-switch"></span>
                </label>

                <label className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-icon">
                      <FiMapPin />
                    </div>

                    <div>
                      <strong>
                        Show School Address
                      </strong>

                      <span>
                        Display school address on
                        printed documents.
                      </span>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    name="printSchoolAddress"
                    checked={
                      settings.printSchoolAddress
                    }
                    onChange={handleChange}
                  />

                  <span className="settings-switch"></span>
                </label>

                <label className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <div className="settings-toggle-icon">
                      <FiPhone />
                    </div>

                    <div>
                      <strong>
                        Show School Phone
                      </strong>

                      <span>
                        Display school phone on
                        printed documents.
                      </span>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    name="printSchoolPhone"
                    checked={
                      settings.printSchoolPhone
                    }
                    onChange={handleChange}
                  />

                  <span className="settings-switch"></span>
                </label>
              </div>
            </section>

            <div className="settings-bottom-save">
              <button
                type="submit"
                className="settings-save-button"
                disabled={saving}
              >
                <FiSave />

                {saving
                  ? "Saving Settings..."
                  : "Save All Settings"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Settings;