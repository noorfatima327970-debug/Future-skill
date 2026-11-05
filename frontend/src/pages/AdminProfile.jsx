import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiCheck,
  FiEdit3,
  FiLock,
  FiMail,
  FiSave,
  FiShield,
  FiUser,
} from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";

import "../styles/AdminProfile.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const AdminProfile = () => {
  const { admin, login } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "admin",
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] =
    useState(false);
  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState({
      type: "",
      text: "",
    });

  const [passwordMessage, setPasswordMessage] =
    useState({
      type: "",
      text: "",
    });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        "/api/admin/profile"
      );

      if (response.data.success) {
        const adminData =
          response.data.admin;

        setProfile({
          name: adminData.name || "",
          email: adminData.email || "",
          role: adminData.role || "admin",
        });

        setProfileForm({
          name: adminData.name || "",
        });
      }
    } catch (error) {
      console.error(
        "Admin Profile Error:",
        error
      );

      setProfileMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (event) => {
    setProfileForm({
      ...profileForm,
      [event.target.name]:
        event.target.value,
    });

    setProfileMessage({
      type: "",
      text: "",
    });
  };

  const handlePasswordChange = (event) => {
    setPasswordForm({
      ...passwordForm,
      [event.target.name]:
        event.target.value,
    });

    setPasswordMessage({
      type: "",
      text: "",
    });
  };

  const handleProfileSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!profileForm.name.trim()) {
      setProfileMessage({
        type: "error",
        text: "Admin name is required",
      });

      return;
    }

    try {
      setProfileSaving(true);

      const response = await api.put(
        "/api/admin/profile",
        {
          name: profileForm.name.trim(),
        }
      );

      if (response.data.success) {
        const updatedAdmin =
          response.data.admin;

        setProfile({
          name: updatedAdmin.name,
          email: updatedAdmin.email,
          role: updatedAdmin.role,
        });

        login(updatedAdmin);

        setProfileMessage({
          type: "success",
          text:
            "Profile updated successfully",
        });
      }
    } catch (error) {
      console.error(
        "Update Profile Error:",
        error
      );

      setProfileMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to update profile",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (
    event
  ) => {
    event.preventDefault();

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordForm;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordMessage({
        type: "error",
        text:
          "All password fields are required",
      });

      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text:
          "New password must be at least 8 characters",
      });

      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text:
          "New passwords do not match",
      });

      return;
    }

    try {
      setPasswordSaving(true);

      const response = await api.put(
        "/api/admin/change-password",
        passwordForm
      );

      if (response.data.success) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setPasswordMessage({
          type: "success",
          text:
            "Password changed successfully",
        });
      }
    } catch (error) {
      console.error(
        "Change Password Error:",
        error
      );

      setPasswordMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to change password",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const firstLetter =
    (
      profile.name ||
      admin?.name ||
      "A"
    )
      .charAt(0)
      .toUpperCase();

  if (loading) {
    return (
      <div className="admin-profile-loading">
        Loading profile...
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

        <main className="admin-profile-page">
          <div className="admin-profile-header">
            <div>
              <span className="admin-profile-eyebrow">
                ACCOUNT
              </span>

              <h1>Admin Profile</h1>

              <p>
                Manage your administrator
                account information and
                security.
              </p>
            </div>
          </div>

          <div className="admin-profile-grid">
            <section className="profile-card profile-overview-card">
              <div className="profile-avatar-large">
                {firstLetter}
              </div>

              <h2>
                {profile.name || "Admin"}
              </h2>

              <p className="profile-email">
                {profile.email}
              </p>

              <div className="profile-role">
                <FiShield />
                <span>Administrator</span>
              </div>

              <div className="profile-info-list">
                <div className="profile-info-item">
                  <span>
                    <FiUser />
                    Account
                  </span>

                  <strong>Admin</strong>
                </div>

                <div className="profile-info-item">
                  <span>
                    <FiMail />
                    Email
                  </span>

                  <strong>
                    {profile.email}
                  </strong>
                </div>

                <div className="profile-info-item">
                  <span>
                    <FiShield />
                    Access
                  </span>

                  <strong>
                    Full Admin
                  </strong>
                </div>
              </div>
            </section>

            <div className="profile-settings-column">
              <section className="profile-card">
                <div className="profile-card-header">
                  <div className="profile-card-icon">
                    <FiEdit3 />
                  </div>

                  <div>
                    <h2>
                      Personal Information
                    </h2>

                    <p>
                      Update your administrator
                      name.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={
                    handleProfileSubmit
                  }
                  className="profile-form"
                >
                  <div className="profile-form-group">
                    <label htmlFor="adminName">
                      Full Name
                    </label>

                    <div className="profile-input-wrapper">
                      <FiUser />

                      <input
                        id="adminName"
                        type="text"
                        name="name"
                        value={
                          profileForm.name
                        }
                        onChange={
                          handleProfileChange
                        }
                        placeholder="Enter admin name"
                      />
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="adminEmail">
                      Email Address
                    </label>

                    <div className="profile-input-wrapper disabled">
                      <FiMail />

                      <input
                        id="adminEmail"
                        type="email"
                        value={
                          profile.email
                        }
                        disabled
                      />
                    </div>

                    <small>
                      Email cannot be changed
                      from this page.
                    </small>
                  </div>

                  {profileMessage.text && (
                    <div
                      className={`profile-message ${profileMessage.type}`}
                    >
                      {profileMessage.type ===
                        "success" && (
                        <FiCheck />
                      )}

                      <span>
                        {
                          profileMessage.text
                        }
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="profile-save-button"
                    disabled={
                      profileSaving
                    }
                  >
                    <FiSave />

                    {profileSaving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </form>
              </section>

              <section className="profile-card">
                <div className="profile-card-header">
                  <div className="profile-card-icon">
                    <FiLock />
                  </div>

                  <div>
                    <h2>
                      Change Password
                    </h2>

                    <p>
                      Keep your administrator
                      account secure.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={
                    handlePasswordSubmit
                  }
                  className="profile-form"
                >
                  <div className="profile-form-group">
                    <label htmlFor="currentPassword">
                      Current Password
                    </label>

                    <div className="profile-input-wrapper">
                      <FiLock />

                      <input
                        id="currentPassword"
                        type="password"
                        name="currentPassword"
                        value={
                          passwordForm.currentPassword
                        }
                        onChange={
                          handlePasswordChange
                        }
                        placeholder="Enter current password"
                      />
                    </div>
                  </div>

                  <div className="profile-form-row">
                    <div className="profile-form-group">
                      <label htmlFor="newPassword">
                        New Password
                      </label>

                      <div className="profile-input-wrapper">
                        <FiLock />

                        <input
                          id="newPassword"
                          type="password"
                          name="newPassword"
                          value={
                            passwordForm.newPassword
                          }
                          onChange={
                            handlePasswordChange
                          }
                          placeholder="Minimum 8 characters"
                        />
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label htmlFor="confirmPassword">
                        Confirm Password
                      </label>

                      <div className="profile-input-wrapper">
                        <FiLock />

                        <input
                          id="confirmPassword"
                          type="password"
                          name="confirmPassword"
                          value={
                            passwordForm.confirmPassword
                          }
                          onChange={
                            handlePasswordChange
                          }
                          placeholder="Repeat new password"
                        />
                      </div>
                    </div>
                  </div>

                  {passwordMessage.text && (
                    <div
                      className={`profile-message ${passwordMessage.type}`}
                    >
                      {passwordMessage.type ===
                        "success" && (
                        <FiCheck />
                      )}

                      <span>
                        {
                          passwordMessage.text
                        }
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="profile-save-button"
                    disabled={
                      passwordSaving
                    }
                  >
                    <FiLock />

                    {passwordSaving
                      ? "Updating..."
                      : "Update Password"}
                  </button>
                </form>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProfile;