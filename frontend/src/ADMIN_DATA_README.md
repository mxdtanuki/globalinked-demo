# Admin Dummy Data Documentation

This document describes the comprehensive dummy data available for the admin side of the partnership management system.

## Data Location

**Primary File:** `/frontend/src/adminDummyData.js`

## Available Data Collections

### 1. Users (`ADMIN_USERS`)
**5 users** with different roles:
- **Admin:** Dr. Maria Santos (Director)
- **Staff:** Prof. John Reyes, Dr. Sarah Chen
- **Viewer:** James Rodriguez, Lisa Tan (inactive)

**Fields:**
- `user_id`, `name`, `email`, `password`, `role`, `position`, `department`
- `profile_img`, `phone`, `status`, `created_at`, `last_login`

**Login Credentials:**
- Admin: `maria.santos@university.edu` / `admin123`
- Staff: `john.reyes@university.edu` / `staff123`
- Viewer: `james.rodriguez@university.edu` / `viewer123`

### 2. Registration Requests (`ADMIN_REGISTRATIONS`)
**4 registration requests** with various statuses:
- **Pending:** David Kim, Angela Martinez
- **Approved:** Michael Wong
- **Rejected:** Rachel Lee

**Fields:**
- `id`, `user_name`, `user_email`, `user_position`, `user_department`
- `user_phone`, `status`, `requested_at`, `approved_at`, `reviewed_at`
- `approved_by`, `reviewed_by`, `notes`

### 3. Agreements (`ADMIN_AGREEMENTS`)
**10 comprehensive agreements** across different statuses:
- **Active (4):** Tokyo Univ, MIT, UP Diliman, Univ of Sydney, Seoul Nat'l Univ
- **Nearing Expiration (2):** NUS (30 days), TU Munich (15 days)
- **Expired (2):** Peking Univ, Univ of Toronto
- **Withdrawn (1):** Oxford

**Fields:**
- `agreement_id`, `dts_number`, `document_type` (MOU/MOA), `title`
- `partner_name`, `institution_name`, `country`, `region`
- `partnership_type`, `scope_of_partnership` (array)
- `date_signed`, `date_expiry`, `validity_period`, `entry_date`
- `status`, `agreement_status`, `description`
- `point_person_name/email/phone`, `contact_person_name/email/phone`
- `university_logo`, `logo`, `file_path`
- `created_at`, `updated_at`, `created_by`, `updated_by`
- Special for withdrawn: `withdrawal_reason`, `withdrawal_date`, `withdrawn_by`

### 4. Document Versions (`ADMIN_DOCUMENT_VERSIONS`)
**6 document versions** for various agreements:
- DTS-2024-001: 3 versions (v1-v2 archived, v3 active)
- DTS-2023-045: 1 version
- DTS-2024-032: 2 versions

**Fields:**
- `id`, `agreement_id`, `dtsNumber`, `version_number`
- `uploaded_by`, `upload_date`, `status` (Active/Archived)
- `file_name`, `file_size`, `comments`, `created_at`

### 5. Audit Logs (`ADMIN_AUDIT_LOGS`)
**10 audit log entries** tracking various actions:
- Login/Login Failed
- Agreement Created/Updated/Archived/Withdrawn
- Document Uploaded
- User Registration Approved
- Email Sent
- Report Generated

**Fields:**
- `id`, `action`, `user`, `user_id`, `timestamp`
- `ip_address`, `details`
- `entity_type`, `entity_id` (for tracking related entities)

### 6. Notifications (`ADMIN_NOTIFICATIONS`)
**8 notifications** for users:
- Expiration warnings (30 days, 15 days)
- Registration requests
- Document uploads
- Partner additions
- System maintenance
- Agreement withdrawals

**Fields:**
- `id`, `user_id`, `title`, `message`
- `type` (warning/info/success/error)
- `category` (expiration/registration/document/partner/system/withdrawal)
- `date`, `read`, `link`

### 7. Email Templates (`ADMIN_EMAIL_TEMPLATES`)
**7 email templates** for automation:
- Agreement expiration reminders (90 days, 30 days)
- Welcome email for new users
- Registration approved/rejected
- Document upload notification
- Monthly partnership report

**Fields:**
- `id`, `name`, `subject`, `body`
- `category`, `updated_at`, `updated_by`, `active`

**Template Variables:** Use `{{variable}}` syntax (e.g., `{{dts_number}}`, `{{partner_name}}`)

### 8. Contact Persons (`ADMIN_CONTACT_PERSONS`)
**3 partner contact persons** from external institutions

**Fields:**
- `id`, `agreement_id`, `name`, `email`, `phone`
- `position`, `institution`, `country`, `primary`, `created_at`

### 9. Point Persons (`ADMIN_POINT_PERSONS`)
**3 internal point persons** managing agreements

**Fields:**
- `id`, `name`, `email`, `phone`
- `position`, `department`, `active_agreements_count`

## Usage Examples

### Import All Data
```javascript
import adminData from './adminDummyData';

const users = adminData.users;
const agreements = adminData.agreements;
// etc.
```

### Import Specific Collections
```javascript
import {
  ADMIN_USERS,
  ADMIN_AGREEMENTS,
  ADMIN_NOTIFICATIONS
} from './adminDummyData';
```

### Filter Examples
```javascript
// Get active agreements
const activeAgreements = ADMIN_AGREEMENTS.filter(
  a => a.status === 'ACTIVE'
);

// Get expiring soon
const expiringSoon = ADMIN_AGREEMENTS.filter(
  a => a.status === 'NEARING_EXPIRATION'
);

// Get pending registrations
const pendingRegs = ADMIN_REGISTRATIONS.filter(
  r => r.status === 'pending'
);

// Get unread notifications for a user
const unreadNotifs = ADMIN_NOTIFICATIONS.filter(
  n => n.user_id === 1 && !n.read
);
```

## Data Relationships

### Agreement → Document Versions
```javascript
const agreement = ADMIN_AGREEMENTS.find(a => a.agreement_id === 1);
const versions = ADMIN_DOCUMENT_VERSIONS.filter(
  v => v.agreement_id === 1
);
```

### User → Audit Logs
```javascript
const userActions = ADMIN_AUDIT_LOGS.filter(
  log => log.user_id === 1
);
```

### Agreement → Contact Person
```javascript
const contactPerson = ADMIN_CONTACT_PERSONS.find(
  c => c.agreement_id === 1
);
```

## Date Helpers

The data uses dynamic date generation:
- `getDate(offset)` - Returns date string (YYYY-MM-DD)
- `getDateTime(daysOffset, hoursOffset)` - Returns ISO datetime

Examples:
- `getDate(0)` = today
- `getDate(-30)` = 30 days ago
- `getDate(90)` = 90 days from now

## Agreement Statuses

- **ACTIVE** - Valid and in effect
- **NEARING_EXPIRATION** - Expires within 90 days
- **EXPIRED** - Past expiration date
- **WITHDRAWN** - Manually withdrawn/cancelled

## User Roles

- **admin** - Full system access
- **staff** - Can manage agreements and documents
- **viewer** - Read-only access

## Integration Tips

1. **Replace API calls** with direct imports during development
2. **Mock services** can return this data instead of hitting backend
3. **Test different scenarios** by filtering/modifying the data
4. **Pagination** - Slice the arrays as needed
5. **Search/Filter** - Use array methods on the collections

## Sample Service Implementation

```javascript
// agreementService.js
import { ADMIN_AGREEMENTS } from './adminDummyData';

export const agreementService = {
  getActiveAgreements: async () => {
    return ADMIN_AGREEMENTS.filter(a => 
      ['ACTIVE', 'NEARING_EXPIRATION'].includes(a.status)
    );
  },
  
  getArchivedAgreements: async () => {
    return ADMIN_AGREEMENTS.filter(a => 
      ['EXPIRED', 'WITHDRAWN'].includes(a.status)
    );
  },
  
  getAgreementById: async (id) => {
    return ADMIN_AGREEMENTS.find(a => a.agreement_id === id);
  }
};
```

## Notes

- All phone numbers are formatted examples
- All email addresses use example domains
- Profile images use ui-avatars.com for consistent avatars
- Dates are relative to today for realistic expiration scenarios
- DTS numbers follow the format: `DTS-YYYY-###`
