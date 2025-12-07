import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import {
  FiCamera,
  FiTrash2,
  FiX,
  FiUpload,
  FiSave,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  updateUserProfile,
} from "../services/registrationService";
import "../components/layout.css";
import "./profile.css";

const Profile = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPhotoActions, setShowPhotoActions] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [tempPhoto, setTempPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getCurrentUser();
        setCurrentUser(data);
        setProfilePic(
          data.user_profile_img
            ? `data:image/png;base64,${data.user_profile_img}`
            : null
        );
        localStorage.setItem("user", JSON.stringify(data));
      } catch (err) {
        console.error("Failed to load user from API:", err);
        const cached = localStorage.getItem("user");
        if (cached) setCurrentUser(JSON.parse(cached));
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF)");
      return;
    }

    if (file.size > maxSize) {
      alert("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPhoto(reader.result);
      setTempPhoto(reader.result);
      setShowPhotoActions(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!tempPhoto || !currentUser) return;

    const base64Str = tempPhoto.split(",")[1];
    setIsSaving(true);

    try {
      const updated = await updateUserProfile(currentUser.user_id, {
        ...currentUser,
        user_profile_img: base64Str,
      });

      setCurrentUser(updated);
      setProfilePic(tempPhoto);
      localStorage.setItem("user", JSON.stringify(updated));

      setTempPhoto(null);
      setPreviewPhoto(null);
      setShowPhotoActions(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      alert("Profile photo updated successfully!");
    } catch (err) {
      alert("Failed to update profile photo: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsSaving(true);
    try {
      const updated = await updateUserProfile(currentUser.user_id, {
        ...currentUser,
        user_profile_img: null,
      });

      setCurrentUser(updated);
      setProfilePic(null);
      localStorage.setItem("user", JSON.stringify(updated));

      setShowRemoveConfirm(false);
      setShowPhotoActions(false);
      setPreviewPhoto(null);

      alert("Profile photo removed successfully!");
    } catch (err) {
      alert("Failed to remove profile photo: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPhotoChange = () => {
    setPreviewPhoto(null);
    setTempPhoto(null);
    setShowPhotoActions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePhotoClick = () => {
    setShowPhotoActions(true);
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
      {mobileShow && (
        <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />
      )}

      <div className="content-body">
        <Sidebar
          collapsed={collapsed}
          toggleCollapse={() => setCollapsed(!collapsed)}
          mobileShow={mobileShow}
        />
        <div
          className="main-content"
          onClick={() => mobileShow && setMobileShow(false)}
        >
          {loading ? (
            <div className="profile-loading-container">
              <div className="profile-spinner"></div>
              <p>Loading Profile...</p>
            </div>
          ) : (
            <div className="profile-container">
              <div className="profile-card">
                <h3 className="profile-title">Profile</h3>

                <div className="profile-pic-wrapper">
                  <div
                    className={`profile-pic-container ${
                      showPhotoActions ? "profile-active" : ""
                    }`}
                    onClick={handlePhotoClick}
                  >
                    <img
                      src={
                        previewPhoto ||
                        profilePic ||
                        "/blank-profile-picture-973460_1920.png"
                      }
                      alt="Profile"
                      className="profile-pic"
                    />

                    <div className="profile-photo-overlay">
                      <FiCamera className="profile-camera-icon-large" />
                      <span className="profile-overlay-text">Update Photo</span>
                    </div>
                  </div>

                  {showPhotoActions && (
                    <div className="profile-photo-action-panel">
                      <div className="profile-action-buttons">
                        <button
                          className="profile-action-btn profile-upload-btn"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSaving}
                        >
                          <FiUpload className="upload-icon" />
                          <span>Upload Photo</span>
                        </button>

                        {currentUser?.user_profile_img && (
                          <button
                            className="profile-action-btn profile-remove-btn"
                            onClick={() => setShowRemoveConfirm(true)}
                            disabled={isSaving}
                          >
                            <FiTrash2 />
                            <span>Remove Photo</span>
                          </button>
                        )}
                        <button
                          className="profile-action-btn profile-cancel-panel-btn"
                          onClick={handleCancelPhotoChange}
                          disabled={isSaving}
                        >
                          <FiX />
                          <span>Cancel</span>
                        </button>
                        {previewPhoto && (
                          <button
                            className="profile-action-btn profile-save-btn"
                            onClick={handleSavePhoto}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <div className="profile-mini-spinner"></div>
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <FiSave className="save-icon" />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    id="profilePicInput"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleProfilePicChange}
                  />
                </div>

                {showRemoveConfirm && (
                  <div className="profile-confirm-dialog-overlay">
                    <div className="profile-confirm-dialog">
                      <h4>Remove Profile Photo?</h4>
                      <p>Are you sure you want to remove your profile photo?</p>
                      <div className="profile-dialog-buttons">
                        <button
                          className="profile-dialog-btn profile-cancel-dialog-btn"
                          onClick={() => setShowRemoveConfirm(false)}
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          className="profile-dialog-btn profile-confirm-dialog-btn"
                          onClick={handleRemovePhoto}
                          disabled={isSaving}
                        >
                          {isSaving ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="profile-form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={currentUser?.user_name || ""}
                    onChange={(e) =>
                      setCurrentUser({
                        ...currentUser,
                        user_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="profile-form-group">
                  <label>Email</label>
                  <input
                    type="text"
                    value={currentUser?.user_email || ""}
                    onChange={(e) =>
                      setCurrentUser({
                        ...currentUser,
                        user_email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="profile-form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    value={currentUser?.user_position || ""}
                    onChange={(e) =>
                      setCurrentUser({
                        ...currentUser,
                        user_position: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="profile-actions">
                  <button
                    className="profile-btn-save"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    className="profile-btn-cancel"
                    onClick={() => window.location.reload()}
                  >
                    Cancel
                  </button>
                </div>

                {currentUser?.user_role?.toLowerCase() === "admin" && (
                  <div className="profile-manage-user-requests">
                    <button
                      className="profile-btn-manage"
                      onClick={() => navigate("/userManagement")}
                    >
                      Manage User Requests
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
