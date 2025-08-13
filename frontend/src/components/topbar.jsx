import React from 'react';
import { useNavigate } from 'react-router-dom';
import './layout.css';

const TopBar = ({ toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication/session
    localStorage.removeItem('token'); 
    sessionStorage.clear();

    // Redirect to public page
    navigate('/');
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="hamburger" onClick={toggleSidebar}>☰</span>
        <img src="/globalMap.png" alt="Globe" className="logo-globe" />
        <span className="topbar-title">Globalinked</span>
      </div>
      <div className="topbar-right">
        <span className="topbar-icon">🔔</span>
        <span className="topbar-icon">⚙️</span>
        <span
          className="topbar-logout"
          title="Logout"
          onClick={handleLogout}
        >
          LOG OUT
        </span>
      </div>
    </div>
  );
};

export default TopBar;
