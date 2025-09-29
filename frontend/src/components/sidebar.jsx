import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiBarChart2,
  FiUpload,
  FiUser,
  FiUsers,
  FiMap,
  FiFileText,
  FiMail,
  FiBell,
  FiArchive,
  FiSettings,
} from 'react-icons/fi';
import './layout.css';

const Sidebar = ({ mobileShow }) => {
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setUserRole(parsedUser.user_role?.toLowerCase() || null);
      }
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
    }
  }, []);

  const menuItems = [
    { label: 'Overview', path: '/overview', icon: <FiHome /> },
    { label: 'Analytics', path: '/analytics', icon: <FiBarChart2 /> },
    { label: 'Document Entry', path: '/docUpload', icon: <FiUpload />, roles: ['admin'] },
    { label: 'Point Person', path: '/pointPerson', icon: <FiUser /> },
    { label: 'Contact Person', path: '/contactPerson', icon: <FiUsers /> },
    { label: 'Mobility', path: '/mobility', icon: <FiMap /> },
    { label: 'Document Version', path: '/docVer', icon: <FiFileText /> },
    { label: 'Email', path: '/email', icon: <FiMail /> },
    { label: 'Notification', path: '/notification', icon: <FiBell /> },
    { label: 'Archive', path: '/archive', icon: <FiArchive /> },
    { label: 'Profile', path: '/profile', icon: <FiSettings /> },
  ];

  // filter by role
  const visibleMenuItems = menuItems.filter(item => {
    if (item.roles && !item.roles.includes(userRole)) return false;
    return true;
  });

  return (
    <aside className={`sidebar ${mobileShow ? 'show' : ''}`}>
      <ul className="sidebar-menu">
        {visibleMenuItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <li
              key={idx}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Link to={item.path} className="sidebar-link">
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;
