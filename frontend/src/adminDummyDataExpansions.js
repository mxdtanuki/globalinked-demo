// COMPREHENSIVE DUMMY DATA EXPANSIONS
// Use this file as reference for copying sections into adminDummyData.js

import { getDate, getDateTime, mkAvatar } from './adminDummyData';

// ===============================================
// NOTIFICATIONS - EXPANDED TO 25+ ENTRIES
// ===============================================
export const EXPANDED_NOTIFICATIONS = [
  {
    id: 1,
    user_id: 1,
    title: "Agreement Expiring Soon",
    message: "DTS-2024-015 with National University of Singapore will expire in 30 days",
    type: "warning",
    category: "expiration",
    date: getDateTime(-1),
    read: false,
    link: "/active-agreements?highlight=6",
  },
  {
    id: 2,
    title: "New Registration Request",
    message: "David Kim has requested access to the system",
    type: "info",
    category: "registration",
    date: getDateTime(-2),
    read: false,
    link: "/user-management?tab=registrations",
  },
  {
    id: 3,
    user_id: 2,
    title: "Document Uploaded",
    message: "Version 3 of DTS-2024-001 has been uploaded successfully",
    type: "success",
    category: "document",
    date: getDateTime(-3),
    read: true,
    link: "/document-versions?dts=DTS-2024-001",
  },
  {
    id: 4,
    user_id: 1,
    title: "Agreement Nearing Expiration",
    message: "DTS-2024-022 with Technical University of Munich will expire in 15 days",
    type: "warning",
    category: "expiration",
    date: getDateTime(-4),
    read: false,
    link: "/active-agreements?highlight=7",
  },
  {
    id: 5,
    title: "New Partner Added",
    message: "University of Sydney has been added as a new partner institution",
    type: "success",
    category: "partner",
    date: getDateTime(-5),
    read: true,
    link: "/active-agreements?highlight=4",
  },
  {
    id: 6,
    user_id: 3,
    title: "Registration Request Approved",
    message: "Michael Wong's registration has been approved",
    type: "success",
    category: "registration",
    date: getDateTime(-7),
    read: true,
    link: "/user-management",
  },
  {
    id: 7,
    title: "System Maintenance",
    message: "Scheduled maintenance on June 1, 2026 from 2:00 AM to 4:00 AM",
    type: "info",
    category: "system",
    date: getDateTime(-10),
    read: true,
  },
  {
    id: 8,
    user_id: 1,
    title: "Agreement Withdrawn",
    message: "DTS-2024-007 with Oxford University has been withdrawn",
    type: "error",
    category: "withdrawal",
    date: getDateTime(-30),
    read: true,
    link: "/archive?highlight=10",
  },
  {
    id: 9,
    user_id: 9,
    title: "New Agreement Created",
    message: "DTS-2024-145 with IIT Delhi has been successfully created",
    type: "success",
    category: "agreement",
    date: getDateTime(-65),
    read: true,
    link: "/active-agreements?highlight=11",
  },
  {
    id: 10,
    title: "Document Approval Pending",
    message: "DTS-2024-188 version 2 is pending review and approval",
    type: "warning",
    category: "document",
    date: getDateTime(-68),
    read: false,
    link: "/document-versions?dts=DTS-2024-188",
  },
  {
    id: 11,
    user_id: 7,
    title: "Partner Contact Updated",
    message: "Contact person for Sorbonne University has been updated",
    type: "info",
    category: "partner",
    date: getDateTime(-13),
    read: true,
  },
  {
    id: 12,
    title: "Multiple Agreements Expiring",
    message: "3 agreements will expire in the next 60 days - action required",
    type: "error",
    category: "expiration",
    date: getDateTime(-6),
    read: false,
    link: "/active-agreements?filter=expiring",
  },
  {
    id: 13,
    user_id: 10,
    title: "Regional Report Generated",
    message: "Middle East & Africa partnership report is ready for download",
    type: "success",
    category: "report",
    date: getDateTime(-7),
    read: true,
    link: "/analytics",
  },
  {
    id: 14,
    user_id: 2,
    title: "Agreement Renewal Reminder",
    message: "DTS-2022-089 (U of T) requires renewal decision within 30 days",
    type: "warning",
    category: "renewal",
    date: getDateTime(-40),
    read: false,
  },
  {
    id: 15,
    title: "New User Added",
    message: "Ana Garcia has joined as European Regional Coordinator",
    type: "info",
    category: "user",
    date: getDateTime(-90),
    read: true,
    link: "/user-management",
  },
  {
    id: 16,
    user_id: 11,
    title: "Document Version Archived",
    message: "Old version of DTS-2024-358 has been archived",
    type: "info",
    category: "document",
    date: getDateTime(-14),
    read: true,
  },
  {
    id: 17,
    title: "System Backup Completed",
    message: "Daily backup completed successfully at 3:00 AM",
    type: "success",
    category: "system",
    date: getDateTime(0, -3),
    read: true,
  },
  {
    id: 18,
    user_id: 8,
    title: "Agreement Signed",
    message: "DTS-2025-027 with University of Dhaka has been signed",
    type: "success",
    category: "agreement",
    date: getDateTime(-20),
    read: true,
    link: "/active-agreements?highlight=13",
  },
  {
    id: 19,
    title: "Registration Request Rejected",
    message: "Registration request has been rejected due to incomplete information",
    type: "error",
    category: "registration",
    date: getDateTime(-5),
    read: false,
    link: "/user-management?tab=registrations",
  },
  {
    id: 20,
    user_id: 13,
    title: "Contact Person Updated",
    message: "Updated contact information for University of Colombo partnership",
    type: "info",
    category: "partner",
    date: getDateTime(-16),
    read: true,
  },
  {
    id: 21,
    title: "Quarterly Review Due",
    message: "Q2 2026 partnership review is due for submission by June 15",
    type: "warning",
    category: "report",
    date: getDateTime(-8),
    read: false,
    link: "/analytics",
  },
  {
    id: 22,
    user_id: 1,
    title: "Bulk Email Sent",
    message: "Expiration reminders sent to 5 partner institutions",
    type: "info",
    category: "email",
    date: getDateTime(-35),
    read: true,
  },
  {
    id: 23,
    title: "New Document Uploaded",
    message: "Signed agreement for DTS-2025-110 (Leiden University) uploaded",
    type: "success",
    category: "document",
    date: getDateTime(-1),
    read: false,
    link: "/document-versions?dts=DTS-2025-110",
  },
  {
    id: 24,
    user_id: 9,
    title: "Agreement Amendment",
    message: "DTS-2024-395 with NTU Singapore has been amended",
    type: "info",
    category: "agreement",
    date: getDateTime(-5),
    read: true,
    link: "/active-agreements?highlight=45",
  },
  {
    id: 25,
    title: "Storage Limit Warning",
    message: "Document storage is at 75% capacity - archival recommended",
    type: "warning",
    category: "system",
    date: getDateTime(-11),
    read: false,
  },
];

// ===============================================
// EMAIL TEMPLATES - EXPANDED TO 12+ TEMPLATES
// ===============================================
export const EXPANDED_EMAIL_TEMPLATES = [
  {
    id: 1,
    name: "Agreement Expiration Reminder - 90 Days",
    subject: "Agreement Expiring in 90 Days: {{dts_number}}",
    body: `Dear {{point_person_name}},

This is a courtesy reminder that the following agreement will expire in 90 days:

Agreement: {{title}}
DTS Number: {{dts_number}}
Partner Institution: {{partner_name}}
Expiration Date: {{date_expiry}}

Please review and take necessary action for renewal or extension.

Best regards,
Office of International Affairs`,
    category: "expiration_reminder",
    updated_at: getDateTime(-60),
    updated_by: "Dr. Maria Santos",
    active: true,
  },
  {
    id: 2,
    name: "Agreement Expiration Reminder - 30 Days",
    subject: "URGENT: Agreement Expiring in 30 Days: {{dts_number}}",
    body: `Dear {{point_person_name}},

URGENT NOTICE: The following agreement will expire in 30 days:

Agreement: {{title}}
DTS Number: {{dts_number}}
Partner Institution: {{partner_name}}
Expiration Date: {{date_expiry}}

Immediate action required for renewal processing.

Best regards,
Office of International Affairs`,
    category: "expiration_reminder",
    updated_at: getDateTime(-60),
    updated_by: "Dr. Maria Santos",
    active: true,
  },
  {
    id: 3,
    name: "Welcome Email - New User",
    subject: "Welcome to the Partnership Management System",
    body: `Dear {{user_name}},

Welcome to our Partnership Management System!

Your account has been created with the following details:
Email: {{user_email}}
Role: {{user_role}}

You can now log in and access the system features based on your role.

If you have any questions, please contact the Office of International Affairs.

Best regards,
Office of International Affairs`,
    category: "user_management",
    updated_at: getDateTime(-90),
    updated_by: "Prof. John Reyes",
    active: true,
  },
  {
    id: 4,
    name: "Registration Approved",
    subject: "Your Registration Request Has Been Approved",
    body: `Dear {{user_name}},

Your registration request has been approved!

You can now log in to the Partnership Management System using:
Email: {{user_email}}

Welcome aboard!

Best regards,
Office of International Affairs`,
    category: "user_management",
    updated_at: getDateTime(-90),
    updated_by: "Dr. Maria Santos",
    active: true,
  },
  {
    id: 5,
    name: "Registration Rejected",
    subject: "Registration Request Update",
    body: `Dear {{user_name}},

We have reviewed your registration request. Unfortunately, we are unable to approve your access at this time.

Reason: {{rejection_reason}}

If you have questions or would like to appeal this decision, please contact the Office of International Affairs.

Best regards,
Office of International Affairs`,
    category: "user_management",
    updated_at: getDateTime(-90),
    updated_by: "Dr. Maria Santos",
    active: false,
  },
  {
    id: 6,
    name: "Document Upload Notification",
    subject: "New Document Uploaded: {{dts_number}}",
    body: `Dear Team,

A new document has been uploaded:

Agreement: {{title}}
DTS Number: {{dts_number}}
Version: {{version_number}}
Uploaded by: {{uploaded_by}}
Upload Date: {{upload_date}}

Please review the document at your earliest convenience.

Best regards,
Office of International Affairs`,
    category: "document_management",
    updated_at: getDateTime(-120),
    updated_by: "Prof. John Reyes",
    active: true,
  },
  {
    id: 7,
    name: "Monthly Partnership Report",
    subject: "Monthly Partnership Report - {{month}} {{year}}",
    body: `Dear Stakeholders,

Please find attached the monthly partnership report for {{month}} {{year}}.

Summary:
- Active Agreements: {{active_count}}
- New Agreements: {{new_count}}
- Expiring Soon: {{expiring_count}}
- Total Partners: {{partner_count}}

For detailed information, please log in to the system.

Best regards,
Office of International Affairs`,
    category: "reports",
    updated_at: getDateTime(-30),
    updated_by: "Dr. Sarah Chen",
    active: true,
  },
  {
    id: 8,
    name: "Agreement Expiration Reminder - 7 Days",
    subject: "FINAL NOTICE: Agreement Expiring in 7 Days: {{dts_number}}",
    body: `Dear {{point_person_name}},

FINAL NOTICE: The following agreement will expire in 7 days:

Agreement: {{title}}
DTS Number: {{dts_number}}
Partner Institution: {{partner_name}}
Expiration Date: {{date_expiry}}

This is the final reminder. Please contact us immediately if you need assistance with renewal.

Best regards,
Office of International Affairs`,
    category: "expiration_reminder",
    updated_at: getDateTime(-60),
    updated_by: "Dr. Maria Santos",
    active: true,
  },
  {
    id: 9,
    name: "New Agreement Notification",
    subject: "New Partnership Agreement Created: {{dts_number}}",
    body: `Dear {{contact_person_name}},

We are pleased to inform you that a new partnership agreement has been created:

Agreement: {{title}}
DTS Number: {{dts_number}}
Partnership Type: {{partnership_type}}
Date Signed: {{date_signed}}
Expiration Date: {{date_expiry}}

The signed document will be shared with you shortly.

Best regards,
{{point_person_name}}
Office of International Affairs`,
    category: "agreements",
    updated_at: getDateTime(-45),
    updated_by: "Prof. John Reyes",
    active: true,
  },
  {
    id: 10,
    name: "Document Approval Required",
    subject: "Document Approval Required: {{dts_number}}",
    body: `Dear {{approver_name}},

A new document version requires your approval:

Agreement: {{title}}
DTS Number: {{dts_number}}
Version: {{version_number}}
Uploaded by: {{uploaded_by}}
Upload Date: {{upload_date}}

Please log in to the system to review and approve.

Best regards,
Office of International Affairs`,
    category: "document_management",
    updated_at: getDateTime(-75),
    updated_by: "Prof. John Reyes",
    active: true,
  },
  {
    id: 11,
    name: "Partner Contact Update",
    subject: "Contact Information Update Required: {{partner_name}}",
    body: `Dear {{point_person_name}},

Please update the contact information for:

Partner Institution: {{partner_name}}
Current Contact: {{contact_person_name}}
Agreement: {{dts_number}}

Log in to the system to make the necessary updates.

Best regards,
Office of International Affairs`,
    category: "partner_management",
    updated_at: getDateTime(-55),
    updated_by: "Dr. Sarah Chen",
    active: true,
  },
  {
    id: 12,
    name: "System Maintenance Notification",
    subject: "Scheduled System Maintenance: {{maintenance_date}}",
    body: `Dear User,

This is to inform you of scheduled system maintenance:

Date: {{maintenance_date}}
Time: {{maintenance_time}}
Duration: {{maintenance_duration}}

The Partnership Management System will be unavailable during this period.

We apologize for any inconvenience.

Best regards,
System Administration Team`,
    category: "system",
    updated_at: getDateTime(-20),
    updated_by: "Dr. Maria Santos",
    active: true,
  },
];

// Note: These are templates. Integrate into adminDummyData.js by replacing the corresponding sections
