import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import '../components/layout.css';
import './userManagement.css'; 
import { getPendingUsers, approveUser, rejectUser, deleteUser } from '../services/registrationService';

const UserManagement = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processingUserId, setProcessingUserId] = useState(null);

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

  // Fetch pending users on component mount
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📋 Fetching pending users...');
      
      const pendingUsers = await getPendingUsers();
      setUsers(pendingUsers);
      console.log('✅ Fetched', pendingUsers.length, 'pending users');
      
    } catch (err) {
      console.error('❌ Error fetching pending users:', err);
      setError('Failed to load pending users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };
  
  // Approve request
  const handleApprove = async(userId, userName, userEmail) => {
    try {
      setError('');
      setProcessingUserId(userId);
      console.log(`✅ Approving user ${userId}...`);
      
      await approveUser(userId);
      
      // Remove from pending list
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      
      showSuccess(`✅ ${userName} approved successfully! Activation email sent to ${userEmail}`);
      
    } catch (err) {
      console.error('❌ Error approving user:', err);
      setError('Failed to approve user: ' + err.message);
    } finally {
      setProcessingUserId(null);
    }
  };

  // Reject user
  const handleReject = async (userId, userName, userEmail) => {
    const confirmed = window.confirm(
      `Are you sure you want to reject ${userName}'s registration?\n\nThey will receive a rejection email at ${userEmail}.`
    );
    
    if (!confirmed) return;

    try {
      setError('');
      setProcessingUserId(userId);
      console.log(`❌ Rejecting user ${userId}...`);
      
      await rejectUser(userId);
      
      // Remove from pending list
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      
      showSuccess(`❌ ${userName} rejected. Notification email sent to ${userEmail}`);
      
    } catch (err) {
      console.error('❌ Error rejecting user:', err);
      setError('Failed to reject user: ' + err.message);
    } finally {
      setProcessingUserId(null);
    }
  };

  // Delete user permanently
  const handleDelete = async (userId, userName) => {
    const confirmed = window.confirm(
      `⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to permanently delete ${userName}'s registration?\n\nThis action CANNOT be undone!`
    );
    
    if (!confirmed) return;

    try {
      setError('');
      setProcessingUserId(userId);
      console.log(`🗑️ Deleting user ${userId}...`);
      
      await deleteUser(userId);
      
      // Remove from list
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      
      showSuccess(`🗑️ ${userName} deleted permanently`);
      
    } catch (err) {
      console.error('❌ Error deleting user:', err);
      setError('Failed to delete user: ' + err.message);
    } finally {
      setProcessingUserId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <TopBar toggleSidebar={toggleMobileSidebar} />
        <div className="content-body">
          <Sidebar collapsed={collapsed} toggleCollapse={toggleCollapse} mobileShow={mobileShow} />
          <div className="main-content">
            <div className="loading-container">
              <div className="loading-content">
                <div>📋 Loading user registrations...</div>
                <div className="loading-subtitle">
                  Fetching pending approval requests...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="user-management-container">
            <h1>User Management</h1>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.user_id}>
                      <td>{user.user_name}</td>
                      <td>{user.user_email}</td>
                      <td>
                        <span className={`access-badge ${user.user_position?.toLowerCase()}`}>
                          {user.user_position} {/* Now directly shows "admin" or "staff" */}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.user_status?.toLowerCase() || 'pending'}`}>
                          {user.user_status || 'pending'}
                        </span>
                      </td>
                      <td>
                        {(user.user_status || 'pending').toLowerCase() === 'pending' ? (
                          <>
                            <button
                              className="approve-btn"
                              onClick={() => handleApprove(user.user_id, user.user_name, user.user_email)}
                              disabled={processingUserId === user.user_id}
                            >
                              {processingUserId === user.user_id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => handleReject(user.user_id, user.user_name, user.user_email)}
                              disabled={processingUserId === user.user_id}
                            >
                              {processingUserId === user.user_id ? 'Processing...' : 'Reject'}
                            </button>
                          </>
                        ) : (
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(user.user_id, user.user_name)}
                            disabled={processingUserId === user.user_id}
                          >
                            {processingUserId === user.user_id ? 'Processing...' : 'Delete'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-requests-message">
                      No requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;