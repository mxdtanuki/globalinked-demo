# GlobalLinked System

A comprehensive full-stack application for managing agreements, partnerships, and document workflows with real-time analytics and notifications.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## Overview

GlobalLinked System is an enterprise-grade application designed to streamline agreement management, document processing, and partnership tracking. It provides real-time notifications, analytics dashboards, and intelligent document extraction capabilities.

## Features

- **Agreement Management**: Create, track, and manage MOUs (Memoranda of Understanding) and MOAs (Memoranda of Agreement)
- **Document Processing**: Automated document version control and NLP-based information extraction
- **User Management**: Role-based access control with admin capabilities
- **Email Integration**: Templated email notifications and communications
- **Analytics Dashboard**: Real-time metrics and visualizations
- **Audit Logging**: Comprehensive activity tracking and audit trails
- **Task Scheduling**: Background job processing and notifications
- **Supabase Integration**: Secure database and storage solutions

## Tech Stack

### Backend
- **Framework**: Python Flask
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage
- **ORM**: SQLAlchemy
- **Authentication**: JWT-based
- **Database Migrations**: Alembic
- **Task Scheduling**: APScheduler

### Frontend
- **Library**: React
- **Styling**: CSS
- **State Management**: React Hooks
- **Build Tool**: Create React App

## Project Structure

```
globalinked-system/
├── backend/                    # Python Flask API
│   ├── app/
│   │   ├── controllers/       # API endpoints
│   │   ├── models/            # Database models
│   │   ├── schemas/           # Data validation schemas
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   ├── main.py            # Flask app initialization
│   │   ├── database.py        # Database configuration
│   │   └── scheduler.py       # Task scheduling
│   ├── alembic/               # Database migrations
│   └── requirements.txt        # Python dependencies
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API services
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── package.json           # Node dependencies
├── API_DOCUMENTATION.md        # API reference
├── guide.txt                   # Additional documentation
└── README.md                   # This file
```

## Prerequisites

### Backend
- Python 3.8 or higher
- PostgreSQL database (or Supabase)
- pip (Python package manager)

### Frontend
- Node.js 14.0 or higher
- npm or yarn

### Environment Variables
You'll need a `.env` file in the backend directory with:
- Supabase credentials (URL, API key, service role key)
- Database connection string
- Email service credentials
- JWT secret key
- CORS settings

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. Initialize the database:
   ```bash
   python app/init_db.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with API configuration:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

## Configuration

### Backend Configuration

- **Database**: Update `app/database.py` with your Supabase credentials
- **Email Templates**: Seed templates using `app/seed_email_templates.py`
- **Authentication**: JWT tokens configured in auth controller
- **Supabase Client**: Initialize in `app/supabase_client.py`

### Frontend Configuration

- **API Base URL**: Set in environment variables
- **Protected Routes**: Configured in `ProtectedRoute.js`
- **Supabase Integration**: Set up in `components/supabase.jsx`

## Running the Application

### Backend

1. Activate virtual environment:
   ```bash
   cd backend
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   ```

2. Run the Flask application:
   ```bash
   python app/main.py
   ```

The API will be available at `http://localhost:5000`

### Frontend

1. Start the development server:
   ```bash
   cd frontend
   npm start
   ```

The application will open at `http://localhost:3000`

### Database Migrations

Run pending migrations:
```bash
cd backend
alembic upgrade head
```

Create a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

## API Documentation

Detailed API endpoints and usage examples are available in [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

Key API modules:
- **Authentication** (`auth_controller.py`)
- **Agreements** (`agreement_controller.py`)
- **Documents** (`document_controller.py`)
- **Notifications** (`notification_controller.py`)
- **Partners** (`partners_controller.py`)
- **Audit Logging** (`audit_controller.py`)

## Database Models

- **Users**: User accounts and roles
- **Partners**: Organization partnership information
- **Agreements**: MOUs and MOAs documents
- **Documents**: Document versions and metadata
- **AgreementRemarks**: Comments and notes on agreements
- **ContactPersons**: Partner contact information
- **PointPersons**: Key representatives
- **EmailTemplates**: Notification email templates
- **Notifications**: User notifications
- **AuditLogging**: System audit trail
- **AnalyticsSnapshots**: Analytics data snapshots

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request with detailed description

## Support

For issues, questions, or suggestions, please refer to the API documentation or contact the development team.

---

**Last Updated**: May 2026
