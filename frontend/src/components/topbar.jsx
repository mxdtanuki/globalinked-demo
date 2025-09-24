import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../pages/notificationContext';
import { useAuditLogs } from '../pages/auditContext'; 
import './layout.css';
import { MdOutlineManageHistory } from 'react-icons/md';

const TopBar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { notifications, markAsRead, refresh } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuditDropdown, setShowAuditDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { logs, refresh: refreshAudit } = useAuditLogs();

  const unreadNotifications = notifications.filter((n) => !n.read);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.clear();
    navigate('/');
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
    setShowAuditDropdown(false); // Close audit dropdown 
  };

  const toggleAuditDropdown = () => {
    setShowAuditDropdown((prev) => !prev);
    setShowDropdown(false); // Close notifications
  };

    useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setCurrentUser(parsedUser);
      }
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
    }
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="hamburger" onClick={toggleSidebar}>☰</span>
        <img src="/globalMap.png" alt="Globe" className="logo-globe" />
        <span className="topbar-title">Globalinked</span>
      </div>

      <div className="topbar-right">
        {/* Audit Log Icon (Admins only) */}
        {currentUser?.user_role?.toLowerCase() === "admin" && (
          <div className="auditlog-wrapper">
            <span className="topbar-icon" title="Audit Logs" onClick={toggleAuditDropdown}>
              <MdOutlineManageHistory className="audit-icon" size={24} color="#ffffffff" /> 
            </span>
            {showAuditDropdown && (
              <div className="auditlog-dropdown">
                <div className="auditlog-refresh">
                  <button onClick={refreshAudit}>Refresh</button>
                </div>
                {logs.length > 0 ? (
                  logs.slice(0, 5).map((log) => (
                    <div key={log.audit_id} className="auditlog-item">
                      <p className="auditlog-desc">{log.audit_description}</p>
                      <span className="auditlog-time">{new Date(log.audit_timestamp).toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-auditlogs">No audit logs</p>
                )}
                <div
                    className="auditlog-link"
                    onClick={() => {
                      setShowAuditDropdown(false);
                      navigate("/audit-logs");
                    }}
                  >
                    See more →
                  </div>
              </div>
            )}
          </div>
        )}
        
        <div className="notification-wrapper">
          <span className="topbar-icon" onClick={toggleDropdown} title="Show notifications">
            🔔
            {unreadNotifications.length > 0 && (
              <span className="notif-badge">{unreadNotifications.length}</span>
            )}
          </span>

          {/* Dropdown for Notifications */}
          {showDropdown && (
            <div className="notif-dropdown">
                <div className="notif-refresh">
                  <button onClick={() => refresh()} className="notif-refresh">
                    Refresh
                  </button>
                </div>
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

        {/* Settings Icon (Navigate to Profile) */}
        <span
          className="topbar-icon"
          onClick={() => navigate('/profile')}
          style={{ cursor: 'pointer' }}
          title="Profile Settings"
        >
          ⚙️
        </span>

        {/* Logout */}
        <span className="topbar-logout" title="Logout" onClick={handleLogout}>
          LOG OUT
        </span>
      </div>
    </div>
  );
};

export default TopBar;
