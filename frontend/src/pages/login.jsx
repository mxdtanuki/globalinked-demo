import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './login.css'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', form.username);
      formData.append('password', form.password);

      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('token_type', data.token_type);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert(`Welcome ${form.username}! Login successful!`);
        navigate('/overview');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Login failed');
      }
    } catch (error) {
      setError('Cannot connect to backend');
    } finally {
      setLoading(false);
    }
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
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="form-footer">
              <span
                className="link-forgot"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password?
              </span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="terms-notice">
            By using this service, you understand and agree to the<br />
            PUP Online Services{' '}
            <a 
              href="https://www.pup.edu.ph/terms/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="terms-link"
            >
              Terms of Use
            </a>
            {' '}and{' '}
            <a 
              href="https://www.pup.edu.ph/privacy/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="terms-link"
            >
              Privacy Statement
            </a>.
          </p>

          <p className="switch-text">
            Don't have an account?{' '}
            <span className="link" onClick={() => navigate('/register')}>
              Register here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;