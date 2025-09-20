import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa"; 
import "./login.css"; 
import { registerUser } from '../services/registrationService'; 

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
  const [loading, setLoading] = useState(false);

  const getPositionRole = (role) => {
    const adminRoles = [
      "Director", 
      "Partnership and Linkages Section"
    ];
    
    return adminRoles.includes(role) ? "admin" : "staff";
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Prepare data for backend
      const userData = {
        user_name: `${formData.firstName} ${formData.lastName}`.trim(),
        user_email: formData.email,  
        user_pass: formData.password,
        user_position: formData.position 
      };

      await registerUser(userData);

      alert("Registered successfully. Please wait for account approval.");
      navigate("/login");
      
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || "Registration failed. Please try again.");
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
                  disabled={loading}
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
                  disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select Position</option>
              <option value="Director">
                Director {getPositionRole("Director") === "admin" && "(Admin Access)"}
              </option>
              <option value="Partnership and Linkages Section">
                Partnership and Linkages Section {getPositionRole("Partnership and Linkages Section") === "admin" && "(Admin Access)"}
              </option>
              <option value="Mobility">Mobility</option>
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

            {/* Show selected role preview */}
            {formData.position && (
              <div style={{ 
                padding: '10px', 
                marginTop: '10px', 
                backgroundColor: getPositionRole(formData.position) === 'admin' ? '#e3f2fd' : '#f3e5f5',
                borderRadius: '5px',
                fontSize: '14px'
              }}>
                <strong>Role Assignment:</strong> {getPositionRole(formData.position)} access
              </div>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
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