# GlobalInked System - Complete API Documentation

**System**: Monitoring System for the Office of International Affairs (OIA)  
**Framework**: FastAPI (Python 3.10+)  
**Database**: PostgreSQL with Supabase  
**Version**: 1.0.0  
**Last Updated**: March 2026  

---

## Quick Navigation

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL & Headers](#base-url--headers)
- [Authentication APIs](#authentication-apis)
- [User Registration APIs](#user-registration-apis)
- [Agreement APIs](#agreement-apis)
- [Partner APIs](#partner-apis)
- [Document APIs](#document-apis)
- [Email Template APIs](#email-template-apis)
- [Notification APIs](#notification-apis)
- [Audit Logging APIs](#audit-logging-apis)
- [NLP Extraction APIs](#nlp-extraction-apis)
- [Admin & Diagnostics APIs](#admin--diagnostics-apis)
- [Error Handling](#error-handling)

---

## Overview

GlobalInked is a comprehensive monitoring and management system for bilateral and multilateral agreements (MOUs/MOAs) handled by the Office of International Affairs. The system provides:

- **Agreement Management**: Create, update, and track MOUs and MOAs
- **Document Processing**: Upload and version control for agreement documents
- **NLP Extraction**: Intelligent field extraction from PDF documents using spaCy and Legal-BERT
- **Partner Management**: Maintain partner institutions and contact information
- **User Management**: Role-based access control and registration workflows
- **Email Notifications**: Automated agreement status notifications
- **Audit Logging**: Complete audit trail of all system activities

---

## Authentication

All protected endpoints require JWT Bearer token authentication.

**Token Acquisition**:  
Authenticate with `POST /auth/token` to receive JWT access token

**Token Usage**:  
Include in all authenticated requests:
```
Authorization: Bearer <access_token>
```

**Token Details**:
- **Expiration**: 30 days
- **Type**: JWT (JSON Web Token)
- **Refresh**: Re-login to obtain new token
- **Role-based access**: Different endpoints available to admin vs staff

---

## Base URL & Headers

### Development
```
http://localhost:8000
```

### Production
```
https://api.globalinked.systems
```

### Required Headers
```
Content-Type: application/json
Authorization: Bearer <access_token>  (required for protected endpoints)
```

### CORS Configuration
Allowed origins:
- `https://globalinked.systems`
- `https://www.globalinked.systems`
- `https://api.globalinked.systems`
- `http://localhost:3000` (development)
- Pattern: `https://*.globalinked.systems`

---

# Authentication APIs

## 1. Login / Generate Access Token

**POST** `/auth/token`

Authenticate with username and password, receive JWT access token.

### Request

**Content-Type**: `application/x-www-form-urlencoded`

```
username=<username>&password=<password>
```

### Response (200 OK)

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "user_id": 1,
    "user_name": "admin",
    "user_email": "admin@pup.edu.ph",
    "user_role": "admin"
  }
}
```

### Error Responses

- **401 Unauthorized**: Incorrect username or password
- **403 Forbidden**: User account not approved

---

## 2. Forgot Password

**POST** `/auth/forgot-password`

Request password reset link via email.

### Request

```json
{
  "email": "user@pup.edu.ph"
}
```

### Response (200 OK)

```json
{
  "message": "If an account exists with that email, reset instructions have been sent"
}
```

---

## 3. Reset Password

**POST** `/auth/reset-password`

Reset password using token from email.

### Request

```json
{
  "token": "token_from_email",
  "new_password": "newpassword123"
}
```

### Response (200 OK)

```json
{
  "message": "Password reset successfully"
}
```

### Error Responses

- **400 Bad Request**: Invalid or expired token
- **422 Unprocessable Entity**: Password validation error

---

# User Registration APIs

## 1. Register New User

**POST** `/registration/`

Create new user account (starts as pending, requires admin approval).

### Request

```json
{
  "user_name": "jsmith",
  "user_password": "securepassword123",
  "user_position": "Partnership Specialist",
  "user_email": "jsmith@pup.edu.ph"
}
```

### Response (200 OK)

```json
{
  "user_id": 5,
  "user_name": "jsmith",
  "user_email": "jsmith@pup.edu.ph",
  "user_position": "Partnership Specialist",
  "user_role": "staff",
  "user_status": "pending"
}
```

### Notes

- Role determined by position:
  - "Director" or "Partnership and Linkages Section" → admin
  - Others → staff
- Default status: "pending" (requires admin approval)
- Admins notified of new registration

---

## 2. Get All Users

**GET** `/registration/`

List all users in system.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Response (200 OK)

```json
[
  {
    "user_id": 1,
    "user_name": "admin",
    "user_email": "admin@pup.edu.ph",
    "user_position": "Director",
    "user_role": "admin",
    "user_status": "approved"
  },
  {
    "user_id": 2,
    "user_name": "jdoe",
    "user_email": "jdoe@pup.edu.ph",
    "user_position": "Coordinator",
    "user_role": "staff",
    "user_status": "pending"
  }
]
```

---

## 3. Get Current User Profile

**GET** `/registration/me`

Get authenticated user's own profile.

**Authentication**: Required (Bearer Token)

### Response (200 OK)

```json
{
  "user_id": 1,
  "user_name": "jsmith",
  "user_email": "jsmith@pup.edu.ph",
  "user_position": "Partnership Specialist",
  "user_role": "staff",
  "user_status": "approved"
}
```

---

## 4. Get Pending Users

**GET** `/registration/pending`

List users awaiting admin approval.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Response (200 OK)

```json
[
  {
    "user_id": 5,
    "user_name": "jsmith",
    "user_email": "jsmith@pup.edu.ph",
    "user_position": "Partnership Specialist",
    "user_role": "staff",
    "user_status": "pending"
  }
]
```

---

## 5. Update User

**PUT** `/registration/{user_id}`

Update user profile information.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin or self

### Path Parameters

- `user_id` (required): User ID to update

### Request (partial update)

```json
{
  "user_name": "jsmith_updated",
  "user_email": "newjsmith@pup.edu.ph",
  "user_position": "Senior Partnership Specialist"
}
```

### Response (200 OK)

```json
{
  "user_id": 5,
  "user_name": "jsmith_updated",
  "user_email": "newjsmith@pup.edu.ph",
  "user_position": "Senior Partnership Specialist",
  "user_role": "staff",
  "user_status": "approved"
}
```

---

## 6. Approve User

**PUT** `/registration/{user_id}/approve`

Approve pending user registration. Sends approval email to user.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Path Parameters

- `user_id` (required): User ID to approve

### Response (200 OK)

```json
{
  "user_id": 5,
  "user_name": "jsmith",
  "user_status": "approved",
  "message": "User approved. Email notification sent."
}
```

---

## 7. Reject User

**PUT** `/registration/{user_id}/reject`

Reject pending user registration.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Path Parameters

- `user_id` (required): User ID to reject

### Response (200 OK)

```json
{
  "user_id": 5,
  "user_name": "jsmith",
  "user_status": "rejected"
}
```

---

## 8. Delete User

**DELETE** `/registration/{user_id}`

Delete user account and all associated data.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Path Parameters

- `user_id` (required): User ID to delete

### Response (200 OK)

```json
{
  "message": "User deleted successfully"
}
```

---

# Agreement APIs

## 1. Get All Agreements

**GET** `/agreements/`

List all agreements with optional filters.

**Authentication**: Required (Bearer Token)

### Query Parameters (optional)

- `status`: Filter by status (Active, Pending, Withdrawn)
- `partner_id`: Filter by partner
- `document_type`: Filter by type (MOU, MOA)

### Response (200 OK)

```json
[
  {
    "agreement_id": 1,
    "dts_number": "DTS-2024-001",
    "partner_id": 3,
    "partner_name": "Universiti Malaya",
    "document_type": "MOU",
    "partnership_type": "Academic",
    "agreement_status": "Active",
    "date_signed": "2024-01-15",
    "date_expiry": "2027-01-14",
    "validity_period": "3 years",
    "source_unit_id": 2,
    "remarks": "Long-term academic partnership",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## 2. Create Agreement

**POST** `/agreements/`

Create new MOA/MOU agreement record.

**Authentication**: Required (Bearer Token)

### Request

```json
{
  "dts_number": "DTS-2024-002",
  "partner_id": 3,
  "document_type": "MOA",
  "partnership_type": "Research",
  "agreement_status": "Under Review",
  "date_signed": "2024-03-01",
  "date_expiry": "2026-02-28",
  "validity_period": 2,
  "source_unit_id": 1,
  "remarks": "Research collaboration",
  "contact_persons": [
    {
      "contact_person_name": "Dr. Maria Santos",
      "contact_person_position": "Research Director",
      "contact_person_email": "maria@partner.edu"
    }
  ],
  "point_persons": [
    {
      "point_person_name": "John Reyes",
      "point_person_position": "Coordinator",
      "point_person_email": "john@pup.edu.ph"
    }
  ]
}
```

### Response (200 OK)

```json
{
  "status": "success",
  "agreement": {
    "agreement_id": 2,
    "dts_number": "DTS-2024-002",
    "partner_id": 3,
    "document_type": "MOA",
    "agreement_status": "Under Review",
    "created_at": "2024-03-15T14:20:00Z"
  }
}
```

---

## 3. Get Agreement Details

**GET** `/agreements/{agreement_id}`

Get full details of specific agreement.

**Authentication**: Required (Bearer Token)

### Path Parameters

- `agreement_id` (required): Agreement ID

### Response (200 OK)

```json
{
  "agreement_id": 1,
  "dts_number": "DTS-2024-001",
  "partner": {
    "partner_id": 3,
    "name": "Universiti Malaya",
    "country": "Malaysia",
    "entity_type": "Educational Institution"
  },
  "document_type": "MOU",
  "partnership_type": "Academic",
  "agreement_status": "Active",
  "date_signed": "2024-01-15",
  "date_expiry": "2027-01-14",
  "contact_persons": [],
  "point_persons": [],
  "documents": []
}
```

---

## 4. Update Agreement

**PUT** `/agreements/{agreement_id}`

Update agreement information.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Path Parameters

- `agreement_id` (required): Agreement ID

### Request (partial update)

```json
{
  "agreement_status": "Active",
  "remarks": "Updated partnership details",
  "date_expiry": "2027-01-14"
}
```

### Response (200 OK)

```json
{
  "agreement_id": 1,
  "dts_number": "DTS-2024-001",
  "agreement_status": "Active",
  "remarks": "Updated partnership details"
}
```

---

## 5. Check for Duplicate

**GET** `/agreements/check-duplicate`

Check if agreement with same DTS, type, and partnership already exists.

**Authentication**: Required (Bearer Token)

### Query Parameters

- `dts_number` (required): DTS number
- `document_type` (required): Document type
- `partnership_type` (required): Partnership type

### Response (200 OK)

```json
{
  "exists": false,
  "message": "Agreement does not already exist"
}
```

---

## 6. Delete Agreement

**DELETE** `/agreements/{agreement_id}`

Delete agreement and all related data (cascade deletion).

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Path Parameters

- `agreement_id` (required): Agreement ID

### Response

- **204 No Content**: Success

---

# Partner APIs

## 1. Get All Partners

**GET** `/partners/`

List all partners in system.

### Response (200 OK)

```json
[
  {
    "partner_id": 1,
    "name": "Universiti Malaya",
    "country": "Malaysia",
    "region": "Southeast Asia",
    "entity_type": "Educational Institution",
    "address": "Kuala Lumpur, Malaysia",
    "website_url": "https://www.um.edu.my",
    "description": "Premier university in Malaysia"
  }
]
```

---

## 2. Get Active Partners

**GET** `/partners/active`

Get partners with active MOUs.

### Response (200 OK)

```json
[
  {
    "partner_id": 1,
    "name": "Universiti Malaya",
    "country": "Malaysia",
    "entity_type": "Educational Institution",
    "dts_number": "DTS-2024-001",
    "date_expiry": "2027-01-14"
  }
]
```

---

## 3. Get Partner Details

**GET** `/partners/{partner_id}`

Get full details of specific partner.

### Path Parameters

- `partner_id` (required): Partner ID

### Response (200 OK)

```json
{
  "partner_id": 1,
  "name": "Universiti Malaya",
  "country": "Malaysia",
  "region": "Southeast Asia",
  "entity_type": "Educational Institution",
  "address": "Kuala Lumpur, Malaysia",
  "website_url": "https://www.um.edu.my",
  "description": "Premier university in Malaysia",
  "logo_path": "partners/um/logo.png"
}
```

---

## 4. Get Partner Agreements

**GET** `/partners/{partner_id}/agreements`

Get all agreements for specific partner.

### Path Parameters

- `partner_id` (required): Partner ID

### Response (200 OK)

```json
{
  "partner": {
    "partner_id": 1,
    "name": "Universiti Malaya"
  },
  "agreements": [
    {
      "dts_number": "DTS-2024-001",
      "agreement_status": "Active",
      "date_expiry": "2027-01-14"
    }
  ],
  "total": 1
}
```

---

## 5. Search Partners

**GET** `/partners/search/{query}`

Search partners by name or country.

### Path Parameters

- `query` (required): Search term

### Response (200 OK)

```json
[
  {
    "partner_id": 1,
    "name": "Universiti Malaya",
    "country": "Malaysia"
  }
]
```

---

## 6. Create Partner

**POST** `/partners/`

Create new partner.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Request

```json
{
  "name": "University of Tokyo",
  "country": "Japan",
  "region": "East Asia",
  "entity_type": "Educational Institution",
  "address": "Tokyo, Japan",
  "website_url": "https://www.u-tokyo.ac.jp",
  "description": "Leading university in Japan"
}
```

### Response (200 OK)

```json
{
  "partner_id": 10,
  "name": "University of Tokyo",
  "country": "Japan"
}
```

---

## 7. Update Partner

**PUT** `/partners/{partner_id}`

Update partner information.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Path Parameters

- `partner_id` (required): Partner ID

### Request (partial update)

```json
{
  "description": "Updated partner description",
  "website_url": "https://updated-url.edu"
}
```

### Response (200 OK)

```json
{
  "partner_id": 1,
  "name": "Universiti Malaya",
  "description": "Updated partner description"
}
```

---

## 8. Delete Partner

**DELETE** `/partners/{partner_id}`

Delete partner.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Path Parameters

- `partner_id` (required): Partner ID

### Response (200 OK)

```json
{
  "message": "Partner deleted successfully"
}
```

---

# Document APIs

## 1. Upload Document Version

**POST** `/documents/{dts_number}/versions`

Upload new version of agreement document.

**Authentication**: Required (Bearer Token)  
**Content-Type**: `multipart/form-data`

### Path Parameters

- `dts_number` (required): DTS number

### Form Parameters

- `file` (required): Document file (PDF, DOCX, TXT, etc.)
- `version_comment` (optional): Comment about this version
- `status_at_upload` (optional): Agreement status

### Response (200 OK)

```json
{
  "status": "uploaded",
  "version": {
    "version_id": 5,
    "dts_number": "DTS-2024-001",
    "version_number": 2,
    "file_path": "dts-2024-001/v2/agreement.pdf",
    "download_url": "https://signed-url-with-token...",
    "uploaded_at": "2024-03-15T15:45:00Z",
    "version_comment": "Final signed version"
  }
}
```

---

## 2. List Document Versions

**GET** `/documents/{dts_number}/versions`

Get all versions of document.

### Path Parameters

- `dts_number` (required): DTS number

### Response (200 OK)

```json
[
  {
    "version_id": 5,
    "dts_number": "DTS-2024-001",
    "version_number": 2,
    "file_path": "dts-2024-001/v2/agreement.pdf",
    "download_url": "https://signed-url...",
    "uploaded_at": "2024-03-15T15:45:00Z"
  }
]
```

---

## 3. Get Download URL

**GET** `/documents/versions/{version_id}/download`

Get signed download URL for document.

### Path Parameters

- `version_id` (required): Document version ID

### Response (200 OK)

```json
{
  "download_url": "https://signed-url-with-token..."
}
```

---

## 4. List All Versions

**GET** `/documents/versions/all`

Get all document versions across all agreements.

### Response (200 OK)

```json
[
  {
    "version_id": 5,
    "dts_number": "DTS-2024-001",
    "version_number": 2,
    "uploaded_at": "2024-03-15T15:45:00Z",
    "document_type": "MOU",
    "partnership_type": "Academic",
    "partner_name": "Universiti Malaya",
    "download_url": "https://signed-url..."
  }
]
```

---

# Email Template APIs

## 1. Get All Templates

**GET** `/emails/templates`

List all email templates.

### Response (200 OK)

```json
[
  {
    "template_id": 1,
    "template_name": "Agreement Status Update",
    "subject": "Your Agreement Status: {{STATUS}}",
    "body_html": "<h2>Status Update</h2>..."
  }
]
```

---

## 2. Get Template by ID

**GET** `/emails/templates/{template_id}`

Get specific email template.

### Path Parameters

- `template_id` (required): Template ID

### Response (200 OK)

```json
{
  "template_id": 1,
  "template_name": "Agreement Status Update",
  "subject": "Your Agreement Status: {{STATUS}}",
  "body_html": "<h2>Status Update</h2>..."
}
```

---

## 3. Create Template

**POST** `/emails/templates`

Create new email template.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Request

```json
{
  "template_name": "New Template",
  "subject": "Subject {{VARIABLE}}",
  "body_html": "<h2>Template Body</h2><p>{{CONTENT}}</p>"
}
```

### Response (200 OK)

```json
{
  "template_id": 5,
  "template_name": "New Template"
}
```

---

## 4. Update Template

**PUT** `/emails/templates/{template_id}`

Update existing template.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Path Parameters

- `template_id` (required): Template ID

### Request

```json
{
  "template_name": "Updated Name",
  "subject": "Updated Subject",
  "body_html": "<h2>Updated</h2>"
}
```

### Response (200 OK)

```json
{
  "template_id": 5,
  "template_name": "Updated Name"
}
```

---

## 5. Delete Template

**DELETE** `/emails/templates/{template_id}`

Delete template.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Path Parameters

- `template_id` (required): Template ID

### Response (200 OK)

```json
{
  "message": "Template deleted successfully"
}
```

---

## 6. Send Email

**POST** `/emails/send`

Send email using template or custom content.

**Authentication**: Required (Bearer Token)

### Request (Template-based)

```json
{
  "recipient_email": "partner@university.edu",
  "template_id": 1,
  "agreement_id": 1
}
```

### Request (Custom)

```json
{
  "recipient_email": "partner@university.edu",
  "custom_subject": "Custom subject",
  "custom_body": "<p>Custom content</p>"
}
```

### Response (200 OK)

```json
{
  "status": "sent",
  "message_id": "uuid-message-id"
}
```

---

# Notification APIs

## 1. Get Notifications

**GET** `/notifications/`

Get notifications for current user.

**Authentication**: Required (Bearer Token)

### Response (200 OK)

```json
[
  {
    "notification_id": 1,
    "user_id": 1,
    "notification_type": "agreement_expiring",
    "title": "Agreement Expiring Soon",
    "description": "DTS-2024-001 expires in 30 days",
    "is_read": false,
    "created_at": "2024-03-15T10:30:00Z"
  }
]
```

---

## 2. Mark as Read

**POST** `/notifications/{notification_id}/read`

Mark notification as read.

**Authentication**: Required (Bearer Token)

### Path Parameters

- `notification_id` (required): Notification ID

### Response (200 OK)

```json
{
  "notification_id": 1,
  "is_read": true
}
```

---

# Audit Logging APIs

## 1. Get Audit Logs

**GET** `/audit/logs`

Get audit logs of system activities.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin only

### Query Parameters (optional)

- `skip`: Pagination offset (default: 0)
- `limit`: Number of records (default: 50)

### Response (200 OK)

```json
[
  {
    "audit_id": 1,
    "user_name": "admin",
    "audit_timestamp": "2024-03-15T10:30:00Z",
    "audit_description": "Agreement DTS-2024-001 created"
  }
]
```

---

# NLP Extraction APIs

## 1. Extract Agreement Data

**POST** `/documents/{dts_number}/extract`

Use NLP to extract fields from uploaded document.

**Authentication**: Required (Bearer Token)  
**Content-Type**: `multipart/form-data`

### Path Parameters

- `dts_number` (required): DTS number

### Form Parameters

- `file` (required): Agreement document (PDF, DOCX, TXT)

### Response (200 OK)

```json
{
  "status": "success",
  "extraction_method": "nlp_with_fallback",
  "extracted_data": {
    "partner_name": "Universiti Malaya",
    "partner_entity_type": "Educational Institution",
    "partner_country": "Malaysia",
    "partner_address": "Kuala Lumpur, Malaysia",
    "date_signed": "2024-01-15",
    "date_expiry": "2027-01-14",
    "validity_period": "3 years",
    "partnership_type": "Academic Collaboration",
    "signatories": ["Dr. Maria Santos", "Prof. John Smith"],
    "contact_persons": ["Dr. Maria Santos"],
    "keywords": ["research", "academic", "collaboration"]
  },
  "confidence_scores": {
    "partner_name": 0.95,
    "date_signed": 0.88,
    "validity_period": 0.92
  }
}
```

---

# Admin & Diagnostics APIs

## 1. Check Pool Status

**GET** `/admin/pool-status`

Check database connection pool health.

**Authentication**: Required (Bearer Token) - Admin only

### Response (200 OK)

```json
{
  "pool_size": 20,
  "checked_in": 18,
  "checked_out": 2,
  "overflow": 0,
  "configured": {
    "pool_size": 20,
    "max_overflow": 2
  }
}
```

---

## 2. Reset Pool

**POST** `/admin/reset-pool`

Emergency reset of database connection pool.

**Authentication**: Required (Bearer Token) - Admin only

### Response (200 OK)

```json
{
  "status": "success",
  "message": "Connection pool reset"
}
```

---

## 3. Database Health Check

**GET** `/admin/db-health`

Test database connectivity.

**Authentication**: Required (Bearer Token) - Admin only

### Response (200 OK)

```json
{
  "status": "healthy"
}
```

---

## 4. Performance Test

**GET** `/admin/performance-test`

Run database performance diagnostics.

**Authentication**: Required (Bearer Token) - Admin only

### Response (200 OK)

```json
{
  "count_query": {
    "time": 0.045,
    "count": 250
  },
  "pool_status": {
    "pool_size": 20
  }
}
```

---

## 5. Models Health

**GET** `/health/models`

Check availability of NLP models.

### Response (200 OK)

```json
{
  "timestamp": 1710499200.123,
  "models": {
    "spacy": {
      "available": true,
      "version": "3.5.0"
    },
    "legal_bert": {
      "available": true,
      "model": "nlpaueb/legal-bert-base-uncased"
    },
    "ocr": {
      "available": true,
      "disabled": false
    },
    "document_processing": {
      "available": true
    }
  },
  "all_ready": true
}
```

---

## 6. QA Model Readiness

**GET** `/health/qa`

Check Legal-BERT QA model status.

### Response (200 OK)

```json
{
  "ready": true,
  "info": {
    "model_name": "nlpaueb/legal-bert-base-uncased",
    "loaded": true
  }
}
```

---

# Error Handling

All errors follow HTTP status codes:

### 400 Bad Request
```json
{
  "detail": "Invalid request"
}
```

### 401 Unauthorized
```json
{
  "detail": "Missing or invalid token"
}
```

### 403 Forbidden
```json
{
  "detail": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Unprocessable Entity
```json
{
  "detail": [
    {
      "loc": ["body", "field"],
      "msg": "Validation error",
      "type": "value_error"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

### 503 Service Unavailable
```json
{
  "detail": "Database unreachable"
}
```

---

## Document Information

**System Version**: 1.0.0  
**Last Updated**: March 30, 2026  
**Maintained by**: Office of International Affairs, PUP

For questions or additional documentation, see:
- Technical Manual: `TECHNICAL_MANUAL.md`
- Database Schema: `DATABASE_SCHEMA.md`
- System Architecture: `ARCHITECTURE.md`

