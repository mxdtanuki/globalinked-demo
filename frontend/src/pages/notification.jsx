import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './notification.css';
import { useNotifications } from '../pages/notificationContext';
import { notificationService } from '../services/notifService';

const Notification = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [selected, setSelected] = useState([]);

  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const userRole = localStorage.getItem("user_role") || "staff";

  useEffect(() => {
    const handleResize = () => {
      const isNowDesktop = window.innerWidth >= 768;
      setIsDesktop(isNowDesktop);
      if (isNowDesktop) setMobileShow(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : notifications.filter(n => !n.read);

  const totalPages = Math.ceil(filteredNotifications.length / pageSize);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === paginatedNotifications.length) {
      setSelected([]);
    } else {
      setSelected(paginatedNotifications.map(n => n.id));
    }
  };

  const handleDelete = async () => {
    for (const id of selected) {
      try {
        await notificationService.deleteNotification(id);
      } catch (err) {
        console.error('Failed to delete notification', id, err);
      }
    }
    setSelected([]);
    window.location.reload();
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />

      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}

      <div className="content-body">
        <Sidebar collapsed={collapsed} toggleCollapse={toggleCollapse} mobileShow={mobileShow} />

        <div className="main-content" onClick={() => mobileShow && setMobileShow(false)}>
          {isDesktop && (
            <div className={`floating-toggle-btn ${collapsed ? 'collapsed' : ''}`} onClick={toggleCollapse}>
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </div>
          )}

          <h2 className="notification-title">
           Notifications
           </h2>
           
          <div className="notification-container">


            <div className="notification-header">
              <div className="notification-tabs">
                <button
                  className={activeTab === 'all' ? 'active' : ''}
                  onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                >
                  All
                </button>
                <button
                  className={activeTab === 'unread' ? 'active' : ''}
                  onClick={() => { setActiveTab('unread'); setCurrentPage(1); }}
                >
                  Unread
                </button>
              </div>
              <button className="mark-all-btn" onClick={markAllAsRead} disabled={userRole !== "admin"}>
                Mark all as read
              </button>
             </div>

            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={selected.length === paginatedNotifications.length && paginatedNotifications.length > 0}
                onChange={handleSelectAll}
                style={{ marginRight: 4 }}
              />
              <span>Select All</span>
              <button onClick={handleDelete} disabled={selected.length === 0}>
                Delete Selected
              </button>
            </div>

            <ul className="notification-list">
              {paginatedNotifications.length === 0 && (
                <li className="empty">No notifications</li>
              )}
              {paginatedNotifications.map(n => (
                <li key={n.id} className={`notification-card ${n.read ? 'read' : 'unread'}`}>
                  <input
                    type="checkbox"
                    checked={selected.includes(n.id)}
                    onChange={() => handleSelect(n.id)}
                    style={{ marginRight: 8 }}
                  />
                  <div className="notification-top">
                    <span className="notification-text">{n.title}</span>
                    <div className="notification-actions">
                      <span className="notification-time">{n.time}</span>
                      {!n.read && (
                        <button className="mark-btn" onClick={() => markAsRead(n.id)} disabled={localStorage.getItem("user_role") !== "admin"}>
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="notification-recommend">
                    Recommended action: {n.action}
                  </div>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="notification-pagination">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                  Prev
                </button>
                <span>{currentPage} / {totalPages}</span>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notification;