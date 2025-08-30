import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa"; 
import "./login.css"; 

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    position: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    console.log("Registration Data:", formData);
    alert("Registered successfully. Please wait for account approval.");
    navigate("/login");
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

          <h2>Register</h2>
          <p>Create your account below.</p>

          {error && <p className="error">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="input-group">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
            >
              <option value="">Select Position</option>
              <option value="Director">Director</option>
              <option value="Mobility">Mobility</option>
              <option value="Partnership and Linkages Section">
                Partnership and Linkages Section
              </option>
              <option value="Special Internationalization Projects">
                Special Internationalization Projects
              </option>
              <option value="Study and Exchange Program">
                Study and Exchange Program
              </option>
              <option value="Administrative Aide VI">
                Administrative Aide VI
              </option>
              <option value="Emergency Administrative Aide III">
                Emergency Administrative Aide III
              </option>
            </select>

            <button type="submit">Register</button>
          </form>

          <p className="switch-text">
            Already have an account?{" "}
            <span className="link" onClick={() => navigate("/login")}>
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
