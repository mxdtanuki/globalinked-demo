import React, { useState } from 'react';
import './login.css';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = (e) => { // Temporary logic (not connected to backend yet)
    e.preventDefault();
    if (form.username === 'admin' && form.password === '123') {
      alert('Login successful!');
    } else {
      alert('Invalid login');
    }
  };

  return (
    <div className="login-container">
      {/* LEFT PANEL */}
      <div className="login-left">
        <div className="brand-row">
          <img src="/globalMap.png" alt="Globe" className="logo-globe" />
          <span className="brand-text">GLOBALINKED</span>
        </div>
        <img src="/world-map.png" alt="Map" className="map" />
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="header-row">
          <img src="/pup-logo.png" alt="PUP logo" className="seal" />
          <span className="header-text">OFFICE OF INTERNATIONAL AFFAIRS</span>
        </div>

        <h2>Log in</h2>
        <p>Enter your username and password to log in.</p>

        <form onSubmit={handleSubmit}>
         <input
        type="text"
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        aria-label="Username"
        autoComplete="username"
        required
        />

        <input
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        aria-label="Password"
        autoComplete="current-password"
        required
        />


          <div className="form-footer">
            <a href="#">Forgot Password?</a> {/* placeholder # for the actual path of the forgot word */}
          </div>

          <button type="submit">Log in</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
