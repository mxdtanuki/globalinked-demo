import React from 'react';
import './layout.css';

const TopBar = ({ toggleSidebar }) => {
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
      </div>
    </div>
  );
};

export default TopBar;
