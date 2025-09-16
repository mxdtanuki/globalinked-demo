import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import { NotificationsProvider } from './pages/notificationContext';

//public page
import PublicPage from './pages/public-page/public-page';
// MOUMOAPage
import MOUMOAPage from './pages/public-page/components/MOUMOAPage';
// templates
import TemplatesPage from './pages/public-page/components/TemplatesPage';

//sidebar pages
import Overview from './pages/overview';
import Analytics from './pages/analytics';
import DocumentUpload from './pages/docUpload';
import PointPerson from './pages/pointPerson';
import ContactPerson from './pages/contactPerson';
import Mobility from './pages/mobility';
import DocumentVersion from './pages/docVer';
import Email from './pages/email';
import Notification from './pages/notification';
import Archive from './pages/archive';
import Profile from './pages/profile';
import UserManagement from './pages/userManagement'; 

// Stat Pages
import ActiveAgreement from './pages/stat/activeAgreement';
import TotalAgreement from './pages/stat/totalAgreement';
import ExpiredAgreement from './pages/stat/expiredAgreements';
import NearExpirationAgreement from './pages/stat/nearExpAgreement';

// Lifecycle Pages
import EndorseULCO from './pages/lifecycle/ulco';
import RevertInitiator from './pages/lifecycle/revertIni';
import Replication from './pages/lifecycle/replication';
import ForSignPup from './pages/lifecycle/forSignPup';
import SignedPup from './pages/lifecycle/signedPup';
import ForSignPartner from './pages/lifecycle/forSignPartner';
import SignedPartners from './pages/lifecycle/signedPartners';
import CompletelySigned from './pages/lifecycle/completelySigned';
import Notary from './pages/lifecycle/notary';
import FFUPCopy from './pages/lifecycle/FFUPCopy';
import Renewals from './pages/lifecycle/renewals';

// Upload Documents
import MOAUpload from './pages/upload/moa';
import MOUUpload from './pages/upload/mou';

//extracted entry
import ExtractedEntry from './pages/upload/extractedEntry';
import ManualEntry from './pages/upload/manualEntry';
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

          {/* admin routes */}
          <Route path="/overview" element={<Overview />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/docUpload" element={<DocumentUpload />} />
          <Route path="/pointPerson" element={<PointPerson />} />
          <Route path="/contactPerson" element={<ContactPerson />} />
          <Route path="/mobility" element={<Mobility />} />
          <Route path="/docVer" element={<DocumentVersion />} />
          <Route path="/email" element={<Email />} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/userManagement" element={<UserManagement />} />

          {/* Stat routes */}
          <Route path="/stat/activeAgreement" element={<ActiveAgreement />} />
          <Route path="/stat/totalAgreement" element={<TotalAgreement />} />
          <Route path="/stat/expiredAgreement" element={<ExpiredAgreement />} />
          <Route path="/stat/nearExpAgreement" element={<NearExpirationAgreement />} />

          {/* Lifecycle Routes */}
          <Route path="/lifecycle/ulco" element={<EndorseULCO />} />
          <Route path="/lifecycle/revertIni" element={<RevertInitiator />} />
          <Route path="/lifecycle/replication" element={<Replication />} />
          <Route path="/lifecycle/forSignPup" element={<ForSignPup />} />
          <Route path="/lifecycle/signedPup" element={<SignedPup />} />
          <Route path="/lifecycle/forSignPartner" element={<ForSignPartner />} />
          <Route path="/lifecycle/signedPartners" element={<SignedPartners />} />
          <Route path="/lifecycle/completelySigned" element={<CompletelySigned />} />
          <Route path="/lifecycle/notary" element={<Notary />} />
          <Route path="/lifecycle/FFUPCopy" element={<FFUPCopy />} />
          <Route path="/lifecycle/renewals" element={<Renewals />} />

          {/* Upload Document Routes */}
          <Route path="/document-upload/mou" element={<MOUUpload />} />
          <Route path="/document-upload/moa" element={<MOAUpload />} />
          <Route path="/upload/extractedEntry" element={<ExtractedEntry />} />
          <Route path="/upload/manualEntry" element={<ManualEntry />} />
          <Route path="/upload/manualEntryMOA" element={<ManualEntryMoa />} />
          <Route path="/upload/extractedEntryMOA" element={<ExtractedEntryMOA />} />

          {/* Existing MOUMOAPage route */}
          <Route path="/mou-moa" element={<MOUMOAPage />} />
        </Routes>
      </Router>
    </NotificationsProvider>
  );
}

export default App;
