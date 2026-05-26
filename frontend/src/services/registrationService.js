import { ADMIN_REGISTRATIONS, ADMIN_USERS } from '../adminDummyData';

export async function registerUser(userData) {
  try {
    console.log('📝 Registering user:', userData);
    // Simulate registration with a delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, user: userData };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function approveUser(userId) {
  // Simulate user approval
  await new Promise(resolve => setTimeout(resolve, 600));
  return { success: true, status: 'approved' };
}

export async function getPendingUsers() {
  // Return admin pending users (registrations with pending status)
  await new Promise(resolve => setTimeout(resolve, 500));
  return ADMIN_REGISTRATIONS.filter(r => r.status === 'pending');
}

export async function getAllRegistrations() {
  // Return all admin registration requests
  await new Promise(resolve => setTimeout(resolve, 500));
  return ADMIN_REGISTRATIONS;
}

export async function getAllUsers() {
  // Return all admin users
  await new Promise(resolve => setTimeout(resolve, 500));
  return ADMIN_USERS;
}

export async function getUsersByRole(role) {
  // Return users by role
  await new Promise(resolve => setTimeout(resolve, 500));
  return ADMIN_USERS.filter(u => u.role === role);
}

export async function getActiveUsers() {
  // Return active users only
  await new Promise(resolve => setTimeout(resolve, 500));
  return ADMIN_USERS.filter(u => u.status === 'active');
}

export async function rejectUser(userId) {
  // Simulate user rejection
  await new Promise(resolve => setTimeout(resolve, 600));
  return { success: true, status: 'rejected' };
}

export async function deleteUser(userId) {
  // Simulate user deletion
  await new Promise(resolve => setTimeout(resolve, 600));
  return { success: true, deleted: true };
}

export async function getCurrentUser() {
  // Return the current demo user from localStorage
  const user = localStorage.getItem('user');
  if (user) {
    return JSON.parse(user);
  }
  throw new Error('No user logged in');
}

export async function updateUserProfile(userId, updateData) {
  // Simulate profile update
  await new Promise(resolve => setTimeout(resolve, 700));
  return { success: true, user: { id: userId, ...updateData } };
}
