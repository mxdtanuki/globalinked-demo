import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiChevronLeft, FiChevronRight, FiCamera } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';   
import '../components/layout.css';
import './profile.css'; 

const Profile = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();  

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    const handleResize = () => {
      const isNowDesktop = window.innerWidth >= 768;
      setIsDesktop(isNowDesktop);
      if (isNowDesktop) setMobileShow(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />

      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}

      <div className="content-body">
        <Sidebar
          collapsed={collapsed}
          toggleCollapse={toggleCollapse}
          mobileShow={mobileShow}
        />

        <div
          className="main-content"
          onClick={() => mobileShow && setMobileShow(false)}
        >
          {isDesktop && (
            <div
              className={`floating-toggle-btn ${collapsed ? 'collapsed' : ''}`}
              onClick={toggleCollapse}
            >
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </div>
          )}

          <div className="profile-container">
            <div className="profile-card">
              <h3 className="profile-title">Profile</h3>

              <div className="profile-pic-wrapper">
                <img
                  src=""
                  alt="Profile"
                  className="profile-pic"
                />
                <div className="camera-icon">
                  <FiCamera />
                </div>
              </div>

              <div className="form-group">
                <label>User name</label>
                <input type="text" placeholder="username@username" />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input type="password" value="password123" readOnly />
              </div>

              <div className="form-group">
                <label>Position</label>
                <input type="text" value="ADMIN" readOnly />
              </div>

              <div className="profile-actions">
                <button className="btn-save">Save</button>
                <button className="btn-cancel">Cancel</button>
              </div>

              {/* Manage User Request Button */}
              <div className="manage-user-requests">
                <button 
                  className="btn-manage" 
                  onClick={() => navigate('/userManagement')}
                >
                  Manage User Requests
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
