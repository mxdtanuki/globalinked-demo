import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import './notification.css';
import { useNotifications } from '../pages/notificationContext';
import { notificationService } from '../services/notifService';
import { FiTrash2, FiCheck } from 'react-icons/fi';

const Notification = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [selected, setSelected] = useState([]);

  const { notifications, setNotifications, markAsRead, markAllAsRead } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [activeNotif, setActiveNotif] = useState(null);

  const pageSize = 8;
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userRole = storedUser?.user_role || "staff";

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

  const selectAllRef = useRef(null);

  useEffect(() => {
    if (!selectAllRef.current) return;
    const total = paginatedNotifications.length;
    selectAllRef.current.indeterminate = selected.length > 0 && selected.length < total;
  }, [selected, paginatedNotifications]);

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

  const handleDelete = async (ids) => {
    try {
      for (const id of ids) {
        await notificationService.deleteNotification(id);
      }
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setSelected([]);
    } catch (err) {
      console.error('Failed to delete notifications', err);
    }
  };

  const handleMarkSelectedAsRead = async (ids) => {
    try {
      for (const id of ids) {
        await markAsRead(id);
      }
      setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
      setSelected([]);
    } catch (err) {
      console.error('Failed to mark selected as read', err);
    }
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleOpenModal = async (notif) => {
    setActiveNotif(notif);
    setShowModal(true);

    if (!notif.read && userRole === "admin") {
      await markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />

      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}

      <div className="content-body">
        <Sidebar collapsed={collapsed} toggleCollapse={toggleCollapse} mobileShow={mobileShow} />

        <div className="main-content" onClick={() => mobileShow && setMobileShow(false)}>

          <h2 className="notif-title">Notifications</h2>

          <div className="notif-container">

            <div className="notif-header">
              <div className="notif-tabs">
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
              <button
                className="notif-mark-all-btn"
                onClick={handleMarkAllAsRead}
                disabled={userRole !== "admin"}
              >
                Mark all as read
              </button>
            </div>

            <div className="notif-select-all">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={paginatedNotifications.length > 0 && selected.length === paginatedNotifications.length}
                onChange={handleSelectAll}
                title="Select all notifications"
                aria-label="Select all notifications"
                disabled={paginatedNotifications.length === 0}
              />
              <span className="select-all-label">Select all</span>
            </div>

            {selected.length > 0 && (
              <div className="notif-bulk-action-bar">
                <span>{selected.length} selected</span>
                <button
                  className="notif-bulk-mark-read-btn"
                  onClick={() => handleMarkSelectedAsRead(selected)}
                  title="Mark selected as read"
                  disabled={userRole !== "admin"}
                >
                  <FiCheck /> Mark as read
                </button>
                <button
                  className="notif-bulk-delete-btn"
                  onClick={() => handleDelete(selected)}
                  title="Delete selected"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            )}

            <ul className="notif-list">
              {paginatedNotifications.length === 0 && (
                <li className="empty">No notifications</li>
              )}
              {paginatedNotifications.map(n => (
                <li
                  key={n.id}
                  className={`notif-row ${n.read ? 'read' : 'unread'}`}
                >
                  <input
                    type="checkbox"
                    className="notif-checkbox"
                    checked={selected.includes(n.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => handleSelect(n.id)}
                  />

                  <div
                    className={`notif-card ${n.read ? 'read' : 'unread'}`}
                    onClick={() => handleOpenModal(n)}
                  >
                    <div className="notif-top">
                      <span className="notif-text">{n.title}</span>
                      <div className="notif-actions">
                        <span className="notif-time">
                          {new Date(new Date(n.time).getTime() + 8 * 60 * 60 * 1000).toLocaleString("en-US", { hour12: true })}
                        </span>
                        {!n.read && (
                          <button
                            className="notif-mark-btn"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleMarkAsRead(n.id);
                            }}
                            disabled={userRole !== "admin"}
                            aria-label="Mark as read"
                            title="Mark as read"
                          >
                            <FiCheck />
                          </button>
                        )}
                        <button
                          className="notif-delete-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDelete([n.id]);
                          }}
                          title="Delete notification"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                    <div className="notif-recommend">
                      Recommended action: {n.action}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="notif-pagination">
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

      {showModal && activeNotif && (
        <div className="notif-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="notif-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{activeNotif.title}</h3>
            <p>{activeNotif.message}</p>
            <p><b>Recommended Action:</b> {activeNotif.action}</p>
            <p>
              <i>
                {new Date(new Date(activeNotif.time).getTime() + 8 * 60 * 60 * 1000).toLocaleString("en-US", { hour12: true })}
              </i>
            </p>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;