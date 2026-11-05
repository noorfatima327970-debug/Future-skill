import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    axios
      .get(`${API_URL}/api/auth/config`)
      .then((response) => {
        if (
          active &&
          response.data.success &&
          response.data.adminEmail
        ) {
          setEmail(response.data.adminEmail);
        }
      })
      .catch((error) => {
        console.error(
          "Unable to load admin login config:",
          error.message
        );
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: email.trim(),
          password,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        login(response.data.admin);

        navigate("/dashboard", {
          replace: true,
        });
      } else {
        setError(response.data.message || "Login failed.");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Server error during login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          {/* Main Logo */}
          <div className="brand-logo">
            <div className="brand-logo-mark">
              <img src="/logo.png" alt="Future Skills Logo" />
            </div>

            <div>
              <span className="brand-name">
                Future Skill School <br /> & IT Institute
              </span>
            </div>
          </div>

          <div className="brand-message">
            <span className="brand-eyebrow">ADMIN PORTAL</span>

            <h1>
              Manage your school
              <span> smarter.</span>
            </h1>

            <p>
              A modern management platform designed to help you manage
              students, teachers, classes, attendance, fees and academics
              from one secure place.
            </p>
          </div>

          <div className="brand-footer">
            <span>Future Skill Management System</span>
            <span>Secure Admin Access</span>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          {/* Mobile Logo */}
          <div className="mobile-brand">
            <img
              src="/logo.png"
              alt="Future Skills School & IT Institute"
              className="mobile-brand-logo"
            />
          </div>

          <div className="login-heading">
            <span className="login-heading-label">WELCOME BACK</span>

            <h2>Admin Login</h2>

            <p>
              Sign in to access your Future Skill management dashboard.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>

              <div className="input-wrapper">
                <FiMail className="input-icon" />

                <input
                  id="email"
                  type="email"
                  placeholder="admin@futureskill.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="input-wrapper">
                <FiLock className="input-icon" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="login-security">
            <FiShield />

            <span>
              Your admin account is protected with secure authentication.
            </span>
          </div>

          <p className="login-copyright">
            © {new Date().getFullYear()} Future Skill. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;