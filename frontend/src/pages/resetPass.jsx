import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import "./login.css"; // reuse 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const ResetPass = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token"); // get token from ?

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password: password,
        }),
      });

      if (response.ok) {
        setMessage("Password reset successful! You can now log in.");
        setTimeout(() => navigate("/login"), 2000); // redirect after 2s
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Reset failed");
      }
    } catch (err) {
      setError(
        "Cannot connect to backend. Make sure the server is running on http://localhost:8000"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* LEFT PANEL */}
        <div className="auth-left">
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

          <h2>Reset Password</h2>
          <p>Enter your new password below.</p>

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <p className="switch-text">
            Back to{" "}
            <span className="link" onClick={() => navigate("/login")}>
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPass;
