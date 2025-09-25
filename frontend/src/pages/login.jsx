import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { FaUser, FaLock } from 'react-icons/fa';
import './login.css'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError(
        'Cannot connect to backend. Make sure the server is running on http://localhost:8000'
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

          <h2>Log in</h2>
          <p>Enter your username and password to log in.</p>

          {error && <p className="error">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="username"
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
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-footer">
              <a href="/forgot-password">Forgot Password?</a>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="switch-text">
            Don’t have an account?{' '}
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
