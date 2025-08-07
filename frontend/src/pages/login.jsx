import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import './login.css';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  // Connect to backend API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', form.username);
      
      // Create FormData for your backend's OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', form.username);
      formData.append('password', form.password);

      // Call backend auth endpoint
      const response = await fetch('http://localhost:8000/auth/token', {
        method: 'POST',
        body: formData,
      });

      console.log('Login response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful, token received');
        
        alert(`Welcome ${form.username}! Login successful!`);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('token_type', data.token_type);
        
        // Redirect to overview page
        navigate('/overview');
                
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        setError(errorData.detail || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Cannot connect to backend. Make sure the server is running on http://localhost:8000');
    } finally {
      setLoading(false);
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
