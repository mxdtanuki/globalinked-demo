import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './notification.css';
import { useNotifications } from '../pages/notificationContext';

const Notification = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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

          <div className="notification-container">
            <h1 className="notification-title">Notifications</h1>

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
              <button className="mark-all-btn" onClick={markAllAsRead}>
                Mark all as read
              </button>
            </div>

            <ul className="notification-list">
              {paginatedNotifications.length === 0 && (
                <li className="empty">No notifications</li>
              )}
              {paginatedNotifications.map(n => (
                <li key={n.id} className={`notification-card ${n.read ? 'read' : 'unread'}`}>
                  <div className="notification-top">
                    <span className="notification-text">{n.title}</span>
                    <div className="notification-actions">
                      <span className="notification-time">{n.time}</span>
                      {!n.read && (
                        <button className="mark-btn" onClick={() => markAsRead(n.id)}>
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
};

export default Notification;
