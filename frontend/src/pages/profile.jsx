import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiCamera } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';   
import '../components/layout.css';
import './profile.css'; 

const Profile = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);  
  const [profilePic, setProfilePic] = useState(null);
  const navigate = useNavigate();  

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  // Load user data from localStorage on mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setCurrentUser(parsedUser);
        setProfilePic(parsedUser.profile_pic || null);
      }
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
    }
  }, []);

  // local storage pa lng yung picture, hindi pa sha connected to database or backend
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
        const updatedUser = { ...currentUser, profile_pic: reader.result };
        setCurrentUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      };
      reader.readAsDataURL(file); 
    }
  };

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
          <div className="profile-container">
            <div className="profile-card">
              <h3 className="profile-title">Profile</h3>

              <div className="profile-pic-wrapper">
                <img
                  src={profilePic || "/default-avatar.png"}
                  alt="Profile"
                  className="profile-pic"
                />
                <div
                  className="camera-icon"
                  onClick={() => document.getElementById("profilePicInput").click()}
                >
                  <FiCamera />
                </div>
                <input
                  id="profilePicInput"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleProfilePicChange}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value="********"   // always show as dots
                  readOnly 
                />
              </div>

            <div className="form-group">
              <label>User Email</label>
              <input 
                type="text" 
                value={currentUser?.user_email || ""}  
                readOnly 
              />
            </div>

              <div className="form-group">
                <label>Position</label>
                <input 
                  type="text" 
                  value={currentUser?.user_position || currentUser?.user_role?.toUpperCase() || ""} 
                  readOnly 
                />
              </div>

              <div className="profile-actions">
                <button className="btn-save">Save</button>
                <button className="btn-cancel">Cancel</button>
              </div>

              {/* Manage User Request Button */}
              {currentUser?.user_role?.toLowerCase() === "admin" && (
                <div className="manage-user-requests">
                  <button 
                    className="btn-manage" 
                    onClick={() => navigate('/userManagement')}
                  >
                    Manage User Requests
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
