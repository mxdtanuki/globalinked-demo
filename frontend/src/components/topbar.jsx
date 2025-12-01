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
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    sessionStorage.clear();
    navigate('/');
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
    setShowAuditDropdown(false);
  };

  const toggleAuditDropdown = () => {
    setShowAuditDropdown((prev) => !prev);
    setShowDropdown(false);
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
                      <p className="auditlog-title">{log.audit_description}</p>
                      <div className="auditlog-footer">
                        <span className="auditlog-timestamp">
                          {new Date(new Date(log.audit_timestamp).getTime() + 8 * 60 * 60 * 1000).toLocaleString("en-US", { hour12: true })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="auditlog-empty">No audit logs</p>
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

          {showDropdown && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">
                <span className="notif-dropdown-title">Notifications</span>
                <button className="notif-dropdown-refresh" onClick={() => refresh()}>
                  Refresh
                </button>
              </div>

              {unreadNotifications.length > 0 ? (
                unreadNotifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className={`notif-dropdown-item ${notif.read ? 'read' : 'unread'}`}>
                    <div className="notif-dropdown-content" onClick={() => {
                      markAsRead(notif.id);
                      setShowDropdown(false);
                      navigate('/notification');
                    }}>
                      <p className="notif-dropdown-title-text">{notif.title}</p>
                      {notif.raw?.message && notif.raw.message !== notif.title ? (
                        <p className="notif-dropdown-recommend">{notif.raw.message}</p>
                      ) : null}
                      <div className="notif-dropdown-footer">
                        <span className="notif-dropdown-time">
                          {new Date(new Date(notif.time).getTime() + 8 * 60 * 60 * 1000).toLocaleString("en-US", { hour12: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="notif-dropdown-empty">
                  <p>No new notifications</p>
                </div>
              )}

              <div className="notif-dropdown-footer-link" onClick={() => {
                setShowDropdown(false);
                navigate('/notification');
              }}>
                View All Notifications →
              </div>
            </div>
          )}
        </div>

        <span
          className="topbar-icon"
          onClick={() => navigate('/profile')}
          style={{ cursor: 'pointer' }}
          title="Profile Settings"
        >
          ⚙️
        </span>

        <span className="topbar-logout" title="Logout" onClick={handleLogout}>
          LOG OUT
        </span>
      </div>
    </div>
  );
};

export default TopBar;