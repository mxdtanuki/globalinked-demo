import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import '../components/layout.css';
import './userManagement.css'; 
import { getAllUsers, approveUser, rejectUser, deleteUser } from '../services/registrationService';

const UserManagement = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected

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

  // Fetch all users on component mount
  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('📋 Fetching all users...');
      
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      console.log(' Fetched', allUsers.length, 'users');
      
    } catch (err) {
      console.error(' Error fetching users:', err);
      setError('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on status
  const filteredUsers = users.filter(user => {
    if (statusFilter === 'all') return true;
    return (user.user_status || 'pending') === statusFilter;
  });

  // Count users by status
  const userCounts = {
    total: users.length,
    pending: users.filter(u => (u.user_status || 'pending') === 'pending').length,
    approved: users.filter(u => u.user_status === 'approved').length,
    rejected: users.filter(u => u.user_status === 'rejected').length
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
      console.log(` Approving user ${userId}...`);
      
      await approveUser(userId);
      
      // Update user status in state instead of removing
      setUsers(prev => prev.map(user => 
        user.user_id === userId 
          ? { ...user, user_status: 'approved' }
          : user
      ));
      
      showSuccess(` ${userName} approved successfully! Activation email sent to ${userEmail}`);
      
    } catch (err) {
      console.error(' Error approving user:', err);
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
      console.log(` Rejecting user ${userId}...`);
      
      await rejectUser(userId);
      
      // Update user status in state instead of removing
      setUsers(prev => prev.map(user => 
        user.user_id === userId 
          ? { ...user, user_status: 'rejected' }
          : user
      ));
      
      showSuccess(` ${userName} rejected. Notification email sent to ${userEmail}`);
      
    } catch (err) {
      console.error(' Error rejecting user:', err);
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
      console.error(' Error deleting user:', err);
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
                <div>📋 Loading user management...</div>
                <div className="loading-subtitle">
                  Fetching all user accounts...
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

            {/* Filter and Stats */}
            <div className="management-controls">
              <div className="filter-section">
                <label htmlFor="statusFilter">Filter by Status:</label>
                <select 
                  id="statusFilter" 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="status-filter"
                >
                  <option value="all">All Users ({userCounts.total})</option>
                  <option value="pending">Pending ({userCounts.pending})</option>
                  <option value="approved">Approved ({userCounts.approved})</option>
                  <option value="rejected">Rejected ({userCounts.rejected})</option>
                </select>
              </div>
              
              <div className="stats-section">
                <span className="stat-item">
                  Total: <strong>{userCounts.total}</strong>
                </span>
                <span className="stat-item pending">
                  Pending: <strong>{userCounts.pending}</strong>
                </span>
                <span className="stat-item approved">
                  Approved: <strong>{userCounts.approved}</strong>
                </span>
                <span className="stat-item rejected">
                  Rejected: <strong>{userCounts.rejected}</strong>
                </span>
              </div>
            </div>

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
                  <th>Position (Job Title)</th>
                  <th>Role (Access Level)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    return (
                      <tr key={user.user_id}>
                        <td>{user.user_name}</td>
                        <td>{user.user_email}</td>
                        <td>{user.user_position}</td>
                        <td>
                          <span className={`role-badge ${(user.user_role || 'staff').toLowerCase()}`}>
                            {(user.user_role || 'staff').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${(user.user_status || 'pending').toLowerCase()}`}>
                            {(user.user_status || 'pending').toUpperCase()}
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="no-requests-message">
                      No {statusFilter === 'all' ? 'users' : statusFilter} found.
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