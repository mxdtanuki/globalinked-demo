import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../pages/notificationContext'; 
import './layout.css';

const TopBar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.read);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    navigate('/');
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="hamburger" onClick={toggleSidebar}>☰</span>
        <img src="/globalMap.png" alt="Globe" className="logo-globe" />
        <span className="topbar-title">Globalinked</span>
      </div>

      <div className="topbar-right">
      
        <div className="notification-wrapper">
          <span className="topbar-icon" onClick={toggleDropdown}>
            🔔
            {unreadNotifications.length > 0 && (
              <span className="notif-badge">{unreadNotifications.length}</span>
            )}
          </span>

          {/* Dropdown for Notif*/}
          {showDropdown && (
            <div className="notif-dropdown">
              {unreadNotifications.length > 0 ? (
                unreadNotifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className="notif-item">
                    <p className="notif-title">{notif.title}</p>
                    <p className="notif-recommend">{notif.recommendation}</p>
                    <div className="notif-footer">
                      <span className="notif-time">{notif.time}</span>
                      <button onClick={() => markAsRead(notif.id)} className="notif-action">
                        Mark as read
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-notifs">No new notifications</p>
              )}
              <div className="notif-footer-link" onClick={() => navigate('/notification')}>
                See more →
              </div>
            </div>
          )}
        </div>

        {/* Settings Icon */}
        <span className="topbar-icon">⚙️</span>

        {/* Logout */}
        <span className="topbar-logout" title="Logout" onClick={handleLogout}>
          LOG OUT
        </span>
      </div>
    </div>
  );
};

export default TopBar;
