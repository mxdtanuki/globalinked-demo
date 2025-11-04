import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

// auth pages
import Login from './pages/login';
import Register from './pages/register';
import ForgetPass from './pages/forgetPass';
import ResetPass from './pages/resetPass';

// context for notifications and audit logs
import { NotificationsProvider } from './pages/notificationContext';
import { AuditProvider } from "./pages/auditContext";

//public page
import PublicPage from './pages/public-page/public-page';

// MOUMOAPage
import MOUMOAPublicPage from './pages/public-page/components/MOUMOAPublicPage';

// templates
import TemplatesPage from './pages/public-page/components/TemplatesPage';
// admin login
import FacultyLoginPage from './pages/public-page/components/FacultyLoginPage';

// for audit logs
import AuditLogsPage from './pages/auditLogs';

// new active agreements
import ActiveAgreements from './pages/activeAgreement';

//sidebar pages
import Overview from './components/overviewDash';
import Analytics from './pages/analytics';
import PointPerson from './pages/pointPerson';
import ContactPerson from './pages/contactPerson';
import Mobility from './pages/mobility';
import DocumentVersion from './pages/docVer';
import Email from './pages/email';
import Notification from './pages/notification';
import Archive from './pages/archive';
import Profile from './pages/profile';
import UserManagement from './pages/userManagement'; 


// Upload Documents
import MOAUpload from './pages/upload/moa';
import MOUUpload from './pages/upload/mou';

//extracted entry
import ManualEntryMoa from './pages/upload/manualEntryMoa';
import ExtractedEntryMOA from './pages/upload/extractedEntryMoa';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* public page routes */}
        <Route path="/" element={<PublicPage />} />
        <Route path="/templates" element={<TemplatesPage />} />

        {/* auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        <Route path="/forgot-password" element={<ForgetPass />} />
        <Route path="/resetPass" element={<ResetPass />} />    

        {/* admin login */}
        <Route path="/faculty-login" element={<FacultyLoginPage />} />


        {/* admin routes */}
        <Route path="/overview" element={<Overview />} />
        <Route path="/active-agreements" element={<ActiveAgreements />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/docUpload" element={< MOAUpload />} />
        <Route path="/pointPerson" element={<PointPerson />} />
        <Route path="/contactPerson" element={<ContactPerson />} />
        <Route path="/mobility" element={<Mobility />} />
        <Route path="/docVer" element={<DocumentVersion />} />
        <Route path="/email" element={<Email />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/userManagement" element={<UserManagement />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />

        {/* Upload Document Routes */}
        <Route path="/document-upload/mou" element={<MOUUpload />} />
        <Route path="/document-upload/moa" element={<MOAUpload />} />
        <Route path="/upload/manualEntryMOA" element={<ManualEntryMoa />} />
        <Route path="/upload/extractedEntryMOA" element={<ExtractedEntryMOA />} />

        {/* Existing MOUMOAPage route */}
        <Route path="/mou-moa" element={<MOUMOAPublicPage />} />

      </Routes>
    </>
  );
}

function App() {
  const queryClient = new QueryClient();  // Add this

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsProvider>
        <AuditProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuditProvider>
      </NotificationsProvider>
    </QueryClientProvider>
  );
}

export default App;