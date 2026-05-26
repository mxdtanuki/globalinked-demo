import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import "./login.css";
import LegalModals from "./LegalModals";

// Demo credentials for static demo
const DEMO_EMAIL = "demo@globalinked.com";
const DEMO_PASSWORD = "demo123";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulate authentication delay for realism
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Check credentials against demo account only
      if (
        form.username.toLowerCase() === DEMO_EMAIL.toLowerCase() &&
        form.password === DEMO_PASSWORD
      ) {
        // Fake login success - store demo token and user in localStorage
        localStorage.setItem("access_token", "demo-token-" + Date.now());
        localStorage.setItem("token_type", "Bearer");
        localStorage.setItem(
          "user",
          JSON.stringify({
            user_id: 1,
            id: 1,
            user_name: "Ryland Grace",
            name: "Ryland Grace",
            user_email: "ryland.grace@globalinked.edu",
            email: "ryland.grace@globalinked.edu",
            user_role: "admin",
            role: "admin",
            user_position: "Director of International Partnerships",
            position: "Director of International Partnerships",
          }),
        );
        sessionStorage.setItem("demo_session", "true");

        alert(`Welcome! You are now viewing the demo.`);
        navigate("/overview");
      } else {
        setError("Invalid credentials. Please use the demo account below.");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Auto-fill demo credentials
    setForm({ username: DEMO_EMAIL, password: DEMO_PASSWORD });
  };

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType("");
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* LEFT PANEL */}
        <div className="auth-left">
          {/* animation/gradient added */}
          <div className="floating-element floating-1"></div>
          <div className="floating-element floating-2"></div>
          <div className="floating-element floating-3"></div>
          <div className="floating-element floating-4"></div>
          <div className="floating-element floating-5"></div>
          <div className="floating-element floating-6"></div>
          <div className="floating-element floating-7"></div>
          <div className="floating-element floating-8"></div>
          <div className="floating-element floating-9"></div>
          <div className="floating-element floating-10"></div>

          <div className="brand-row">
            <img src="/globalMap.png" alt="Globe" className="logo-globe" />
            <span className="brand-text">GLOBALINKED</span>
          </div>
          <img src="/world-map.png" alt="Map" className="map" />
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="header-row">
            <img src="/pup-logo.png" alt="PUP logo" className="seal" />
            <span className="header-text">OFFICE OF INTERNATIONAL AFFAIRS</span>
          </div>

          <h2>Log in</h2>
          <p>Enter your username and password to log in.</p>

          {error && <p className="error">{error}</p>}

          {/* DEMO ACCOUNT SECTION */}
          <div
            className="demo-account-box"
            style={{
              backgroundColor: "#f0f7ff",
              border: "2px solid #3498db",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "16px",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                color: "#2c3e50",
              }}
            >
              📌 Demo Account
            </div>
            <div style={{ marginBottom: "4px" }}>
              <strong>Email:</strong> {DEMO_EMAIL}
            </div>
            <div style={{ marginBottom: "10px" }}>
              <strong>Password:</strong> {DEMO_PASSWORD}
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold",
                transition: "background 0.3s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#2980b9")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#3498db")}
            >
              Auto-Fill Demo Credentials
            </button>
          </div>

          {error && <p className="error">{error}</p>}

          <form onSubmit={handleSubmit} autoComplete="on">
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="username"
                id="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <span
                className="input-eye"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="form-footer">
              <span
                className="link-forgot"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="terms-notice">
            By using this service, you understand and agree to the
            <br />
            PUP Online Services{" "}
            <span className="terms-link" onClick={() => openModal("terms")}>
              Terms of Use
            </span>{" "}
            and{" "}
            <span className="terms-link" onClick={() => openModal("privacy")}>
              Privacy Statement
            </span>
            .
          </p>

          <p className="switch-text">
            Don't have an account?{" "}
            <span className="link" onClick={() => navigate("/register")}>
              Register here
            </span>
          </p>
        </div>
      </div>

      <LegalModals isOpen={modalOpen} onClose={closeModal} type={modalType} />
    </div>
  );
};

export default Login;
