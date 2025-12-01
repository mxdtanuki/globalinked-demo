import React from 'react';
import ProtectedRoute from './ProtectedRoute';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';


// new test manual entry and extracted entry pages
import ManualExtract from './pages/upload/manualExtract';

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

        {/* protected routes */}
        <Route path="/overview" element={
          <ProtectedRoute><Overview /></ProtectedRoute>
        } />
        <Route path="/active-agreements" element={
          <ProtectedRoute><ActiveAgreements /></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute><Analytics /></ProtectedRoute>
        } />
        <Route path="/docUpload" element={
          <ProtectedRoute><MOAUpload /></ProtectedRoute>
        } />
        <Route path="/pointPerson" element={
          <ProtectedRoute><PointPerson /></ProtectedRoute>
        } />
        <Route path="/contactPerson" element={
          <ProtectedRoute><ContactPerson /></ProtectedRoute>
        } />
        <Route path="/mobility" element={
          <ProtectedRoute><Mobility /></ProtectedRoute>
        } />
        <Route path="/docVer" element={
          <ProtectedRoute><DocumentVersion /></ProtectedRoute>
        } />
        <Route path="/email" element={
          <ProtectedRoute><Email /></ProtectedRoute>
        } />
        <Route path="/notification" element={
          <ProtectedRoute><Notification /></ProtectedRoute>
        } />
        <Route path="/archive" element={
          <ProtectedRoute><Archive /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/userManagement" element={
          <ProtectedRoute><UserManagement /></ProtectedRoute>
        } />
        <Route path="/audit-logs" element={
          <ProtectedRoute><AuditLogsPage /></ProtectedRoute>
        } />

        

        {/* Upload Document Routes */}
        <Route path="/document-upload/mou" element={
          <ProtectedRoute><MOUUpload /></ProtectedRoute>
        } />
        <Route path="/document-upload/moa" element={
          <ProtectedRoute><MOAUpload /></ProtectedRoute>
        } />
        <Route path="/upload/manualEntryMOA" element={
          <ProtectedRoute><ManualEntryMoa /></ProtectedRoute>
        } />
        <Route path="/upload/extractedEntryMOA" element={
          <ProtectedRoute><ExtractedEntryMOA /></ProtectedRoute>
        } />

        {/* Existing MOUMOAPage route */}
        <Route path="/mou-moa" element={<MOUMOAPublicPage />} />
        <Route path="/upload/manualExtract" element={
          <ProtectedRoute><ManualExtract /></ProtectedRoute>
        } />
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