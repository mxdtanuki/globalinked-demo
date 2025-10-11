import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiCamera } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateUserProfile } from '../services/registrationService';
import '../components/layout.css';
import './profile.css';

const Profile = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getCurrentUser();
        console.log("getCurrentUser() response:", data); 
        setProfilePic(
          data.user_profile_img
            ? `data:image/png;base64,${data.user_profile_img}`
            : null
        );
      } catch (err) {
        console.error("Failed to load user from API:", err);

        // fallback to cached localStorage
        const cached = localStorage.getItem("user");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setCurrentUser(parsed);
            setProfilePic(
              parsed.user_profile_img
                ? `data:image/png;base64,${parsed.user_profile_img}`
                : null
            );
          } catch (e) {
            console.error("Failed to parse cached user:", e);
          }
        }
      }
    };
    loadProfile();
  }, []);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Str = reader.result.split(",")[1]; // only keep base64 data
      setProfilePic(reader.result);
      setCurrentUser(prev => ({
        ...prev,
        user_profile_img: base64Str,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const updated = await updateUserProfile(currentUser.user_id, {
        user_name: currentUser.user_name,
        user_email: currentUser.user_email,
        user_position: currentUser.user_position,
        user_profile_img: currentUser.user_profile_img,
      });

      setCurrentUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={() => setMobileShow(!mobileShow)} />
      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}

      <div className="content-body">
        <Sidebar collapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} mobileShow={mobileShow} />
        <div className="main-content" onClick={() => mobileShow && setMobileShow(false)}>
          <div className="profile-container">
            <div className="profile-card">
              <h3 className="profile-title">Profile</h3>

              <div className="profile-pic-wrapper">
                <img
                  src={profilePic || "/default-profile.png"}
                  alt="Profile"
                  className="profile-pic"
                />
                <div className="camera-icon" onClick={() => document.getElementById("profilePicInput").click()}>
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
                <label>Name</label>
                <input
                  type="text"
                  value={currentUser?.user_name || ""}
                  onChange={(e) => setCurrentUser({ ...currentUser, user_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="text"
                  value={currentUser?.user_email || ""}
                  onChange={(e) => setCurrentUser({ ...currentUser, user_email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  value={currentUser?.user_position || ""}
                  onChange={(e) => setCurrentUser({ ...currentUser, user_position: e.target.value })}
                />
              </div>

              <div className="profile-actions">
                <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button className="btn-cancel" onClick={() => window.location.reload()}>
                  Cancel
                </button>
              </div>

              {currentUser?.user_role?.toLowerCase() === "admin" && (
                <div className="manage-user-requests">
                  <button className="btn-manage" onClick={() => navigate('/userManagement')}>
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
