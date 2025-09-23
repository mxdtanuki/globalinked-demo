import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import ForgetPass from './pages/forgetPass';
import ResetPass from './pages/resetPass';

// context for notifications
import { NotificationsProvider } from './pages/notificationContext';

//public page
import PublicPage from './pages/public-page/public-page';

// templates
import TemplatesPage from './pages/public-page/components/TemplatesPage';
// admin login
import FacultyLoginPage from './pages/public-page/components/FacultyLoginPage';

//sidebar pages
import Overview from './pages/overview';
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

import './App.css';

function App() {
  return (
    <NotificationsProvider>
      <Router>
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

          {/* Upload Document Routes */}
          <Route path="/document-upload/mou" element={<MOUUpload />} />
          <Route path="/document-upload/moa" element={<MOAUpload />} />
          <Route path="/upload/manualEntryMOA" element={<ManualEntryMoa />} />
          <Route path="/upload/extractedEntryMOA" element={<ExtractedEntryMOA />} />

        </Routes>
      </Router>
    </NotificationsProvider>
  );
}

export default App;