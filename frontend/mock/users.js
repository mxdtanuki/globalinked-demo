// Example mock data for users
// For comprehensive admin data, see: /frontend/src/adminDummyData.js

import { ADMIN_USERS, ADMIN_REGISTRATIONS } from '../src/adminDummyData';

// Re-export admin data for backward compatibility
export const mockUsers = ADMIN_USERS;
export const mockRegistrations = ADMIN_REGISTRATIONS.filter(r => r.status === 'pending');
