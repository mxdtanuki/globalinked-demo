// Example mock data for agreements - Demo/Static Version
// For comprehensive admin data, see: /frontend/src/adminDummyData.js

import { ADMIN_AGREEMENTS } from '../src/adminDummyData';

// Re-export admin agreements as mockAgreements for backward compatibility
export const mockAgreements = ADMIN_AGREEMENTS.filter(a => 
  ['ACTIVE', 'NEARING_EXPIRATION'].includes(a.status)
);
