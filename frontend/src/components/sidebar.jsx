import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "react-icons/fi";
import "./layout.css";

const Sidebar = ({ mobileShow, closeMobile }) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (mobileShow && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [mobileShow]);
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
    { label: "Overview", path: "/overview", icon: <FiHome /> },
    { label: "Agreements", path: "/active-agreements", icon: <FiFileText /> },
    { label: "Analytics", path: "/analytics", icon: <FiBarChart2 /> },
    {
      label: "Document Entry",
      path: "/upload/manualExtract",
      icon: <FiUpload />,
      roles: ["admin"],
    },
    { label: "Point Person", path: "/pointPerson", icon: <FiUser /> },
    { label: "Contact Person", path: "/contactPerson", icon: <FiUsers /> },
    { label: "Mobility", path: "/mobility", icon: <FiMap /> },
    { label: "Document Version", path: "/docVer", icon: <FiFileText /> },
    { label: "Email", path: "/email", icon: <FiMail /> },
    { label: "Notification", path: "/notification", icon: <FiBell /> },
    { label: "Archive", path: "/archive", icon: <FiArchive /> },
    { label: "Profile", path: "/profile", icon: <FiSettings /> },
  ];

  // filter by role
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.roles && !item.roles.includes(userRole)) return false;
    return true;
  });

  return (
    <aside className={`sidebar ${mobileShow ? "show" : ""}`} id="main-sidebar">
      {/* Mobile-only header with close button */}
      <div className="sidebar-mobile-header">
        <span className="sidebar-mobile-title">Globalinked</span>
        <button
          ref={closeButtonRef}
          className="sidebar-close-btn"
          onClick={closeMobile}
          aria-label="Close navigation menu"
        >
          ✕
        </button>
      </div>
      <ul className="sidebar-menu">
        {visibleMenuItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <li
              key={idx}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              <Link
                to={item.path}
                className="sidebar-link"
                onClick={closeMobile}
              >
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
