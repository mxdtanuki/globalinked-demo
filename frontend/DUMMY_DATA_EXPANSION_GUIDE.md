# Dummy Data Expansion Guide
## Completed ✅
1. **Profile**: Updated to "Ryland Grace" (ryland.grace@globalinked.edu, Senior Partnership Director)
2. **agreementService**: Added `getMobilityAgreements()` method  
3. **ADMIN_AUDIT_LOGS**: Expanded from 10 → 42 entries

## In Progress 🔄

### NOTIFICATIONS (8 → 25+)
**Status:** Ready to implement
**Location:** adminDummyData.js line ~2850

### EMAIL_TEMPLATES (7 → 12+)
**Status:** Ready to implement  
**New templates to add:**
- Agreement Expiration Reminder - 7 Days
- New Agreement Notification
- Document Approval Notification
- Partner Contact Update
- System Backup Notification

### CONTACT_PERSONS (3 → 40+)
**Status:** One contact needed per agreement (50 agreements)
**Pattern:** Match agreement_id, include name, email, phone, position, institution, country, primary flag

### POINT_PERSONS (3 → 10)
**Status:** Match ADMIN_USERS staff members (15 total)
**Pattern:** name, email, phone, position, department, active_agreements_count

### AGREEMENT STATUSES
**Current:** 4 EXPIRED, 1 WITHDRAWN  
**Target:** 12 EXPIRED, 7 WITHDRAWN

**Change to EXPIRED:**
1. Agreement 3: DTS-2024-033 (UP Diliman)
2. Agreement 12: DTS-2024-167 (Aga Khan)
3. Agreement 18: DTS-2024-203 (EHL Switzerland)
4. Agreement 24: DTS-2024-259 (KTH Sweden)
5. Agreement 28: DTS-2024-287 (University of Warsaw)
6. Agreement 32: DTS-2024-318 (USP Brazil)
7. Agreement 37: DTS-2025-096 (Cairo University)
8. Agreement 40: DTS-2024-358 (UAEU)

**Change to WITHDRAWN:**
1. Agreement 5: DTS-2023-098 (Seoul National)
2. Agreement 14: DTS-2024-176 (University of Colombo)
3. Agreement 19: DTS-2024-215 (Sapienza Rome)
4. Agreement 21: DTS-2024-227 (University of Vienna)
5. Agreement 27: DTS-2024-278 (Semmelweis University)
6. Agreement 35: DTS-2024-344 (University of Nairobi)

## Overview Dashboard Data

The overview dashboard needs aggregated statistics data:

```javascript
export const ADMIN_OVERVIEW_STATS = {
  totalAgreements: 50,
  activeAgreements: 31, // After status changes
  expiredAgreements: 12,
  withdrawnAgreements: 7,
  nearingExpiration: 3,
  totalPartners: 50,
  totalCountries: 45,
  totalRegions: 9,
  studentExchangePrograms: 35,
  researchCollaborations: 28,
  dualDegreePrograms: 15,
  monthlyTrends: [
    { month: 'Nov 2025', count: 41 },
    { month: 'Dec 2025', count: 42 },
    { month: 'Jan 2026', count: 45 },
    { month: 'Feb 2026', count: 47 },
    { month: 'Mar 2026', count: 48 },
    { month: 'Apr 2026', count: 50 },
    { month: 'May 2026', count: 50 },
  ],
  regionalDistribution: [
    { region: 'Eastern Asia', count: 5 },
    { region: 'South-Eastern Asia', count: 8 },
    { region: 'Southern Asia', count: 4 },
    { region: 'Western Europe', count: 10 },
    { region: 'Northern Europe', count: 5 },
    { region: 'Eastern Europe', count: 3 },
    { region: 'North America', count: 4 },
    { region: 'South America', count: 4 },
    { region: 'Oceania', count: 2 },
    { region: 'Africa', count: 4 },
    { region: 'Middle East', count: 4 },
  ],
};
```

## Next Steps

1. Complete NOTIFICATIONS expansion
2. Complete EMAIL_TEMPLATES expansion  
3. Complete CONTACT_PERSONS expansion (40 entries)
4. Complete POINT_PERSONS expansion (10 entries)
5. Apply agreement status changes (14 agreements total)
6. Add ADMIN_OVERVIEW_STATS export
7. Test all pages to ensure data displays correctly

## Testing Checklist

- [ ] Overview page shows correct statistics
- [ ] Point Person page lists 10 internal coordinators
- [ ] Contact Person page shows 40+ partner contacts
- [ ] Document Version page displays 30 versions
- [ ] Email Templates page shows 12+ templates
- [ ] Mobility page filters properly
- [ ] Archive page shows 12 expired + 7 withdrawn = 19 total
- [ ] Profile displays "Ryland Grace"
