
import React, { useState } from "react";
import TopbarSidebar from '../../components/topbarSidebar';
import Select from 'react-select';
import './globalUpload.css';

const countryOptions = [
  { value: 'Kazakhstan', label: 'Kazakhstan' },
  { value: 'Kyrgzstan', label: 'Kyrgzstan' },
  { value: 'Tajikistan', label: 'Tajikistan' },
  { value: 'Turkmenistan', label: 'Turkmenistan' },
  { value: 'Uzbekistan', label: 'Uzbekistan' },
  { value: 'Taiwan', label: 'Taiwan' },
  { value: 'China', label: 'China' },
  { value: 'HongKong', label: 'HongKong' },
  { value: 'China, Macao', label: 'China, Macao' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Mongolia', label: 'Mongolia' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'North Korea', label: 'North Korea' },
  { value: 'Afghanistan', label: 'Afghanistan' },
  { value: 'Bangladesh', label: 'Bangladesh' },
  { value: 'Bhutan', label: 'Bhutan' },
  { value: 'India', label: 'India' },
  { value: 'Iran', label: 'Iran' },
  { value: 'Maldives', label: 'Maldives' },
  { value: 'Nepal', label: 'Nepal' },
  { value: 'Pakistan', label: 'Pakistan' },
  { value: 'Sri Lanka', label: 'Sri Lanka' },
  { value: 'Brunei', label: 'Brunei' },
  { value: 'Cambodia', label: 'Cambodia' },
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'Laos', label: 'Laos' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Myanmar', label: 'Myanmar' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Thailand', label: 'Thailand' },
  { value: 'Timor-Leste', label: 'Timor-Leste' },
  { value: 'Vietnam', label: 'Vietnam' },
  { value: 'Finland', label: 'Finland' },
];

const regionOptions = [
  { value: 'Central Asia', label: 'Central Asia' },
  { value: 'Eastern Asia', label: 'Eastern Asia' },
  { value: 'Southern Asia', label: 'Southern Asia' },
  { value: 'South-Eastern Asia', label: 'South-Eastern Asia' },
  { value: 'Western Asia', label: 'Western Asia' },
  { value: 'Northern Europe', label: 'Northern Europe' },
  { value: 'Western Europe', label: 'Western Europe' },
  { value: 'Eastern Europe', label: 'Eastern Europe' },
  { value: 'Southern Europe', label: 'Southern Europe' },
  { value: 'North America', label: 'North America' },
  { value: 'Caribbean', label: 'Caribbean' },
  { value: 'Central America', label: 'Central America' },
  { value: 'South America', label: 'South America' },
  { value: 'Oceania', label: 'Oceania' },
  { value: 'Eastern Africa', label: 'Eastern Africa' },
  { value: 'Middle Africa', label: 'Middle Africa' },
  { value: 'Northern Africa', label: 'Northern Africa' },
  { value: 'Southern Africa', label: 'Southern Africa' },
  { value: 'Western Africa', label: 'Western Africa' }
];

const partnershipTypeOptions = [
  { value: 'Agreement', label: 'Agreement' },
  { value: 'Contract Agreement', label: 'Contract Agreement' },
  { value: 'Cooperation Agreement', label: 'Cooperation Agreement' },
  { value: 'Implementation Agreement', label: 'Implementation Agreement' },
  { value: 'Online Study Tour Agreement', label: 'Online Study Tour Agreement' },
  { value: 'License and Cooperation Agreement', label: 'License and Cooperation Agreement' },
  { value: 'Agreement of International Faculty Exchanges for Academic Training Program', label: 'Agreement of International Faculty Exchanges for Academic Training Program' },
  { value: 'Due Diligence', label: 'Due Diligence' },
  { value: 'Joint Education Programs and Training Cooperation', label: 'Joint Education Programs and Training Cooperation' },
  { value: 'MOA on Academic Exchange', label: 'MOA on Academic Exchange' },
  { value: 'MOA on Faculty Exchange', label: 'MOA on Faculty Exchange' },
  { value: 'MOA on Student Exchange', label: 'MOA on Student Exchange' },
  { value: 'MOA on Cultural Exchange', label: 'MOA on Cultural Exchange' },
  { value: 'MOA on Research', label: 'MOA on Research' },
  { value: 'MOA on Internship', label: 'MOA on Internship' },
  { value: 'MOA on Training and Research Collaboration', label: 'MOA on Training and Research Collaboration' },
  { value: 'MOA on Conferences', label: 'MOA on Conferences' },
  { value: 'MOA on International Competition', label: 'MOA on International Competition' },
  { value: 'MOA Global Leadership', label: 'MOA Global Leadership' },
  { value: 'MOA for Donation', label: 'MOA for Donation' },
  { value: 'MOA on English Class', label: 'MOA on English Class' },
  { value: 'MOA on English Camp', label: 'MOA on English Camp' },
  { value: 'MOA on Academic Partnership', label: 'MOA on Academic Partnership' },
  { value: 'MOA (RMO)', label: 'MOA (RMO)' },
  { value: 'MOA (VPRED)', label: 'MOA (VPRED)' },
  { value: 'MOA with PUP Sta.Rosa', label: 'MOA with PUP Sta.Rosa' },
  { value: 'MOA with PACA', label: 'MOA with PACA' },
  { value: 'MOA CITAA', label: 'MOA CITAA' },
  { value: 'MOA CAH', label: 'MOA CAH' },
  { value: 'MOA with College of Science', label: 'MOA with College of Science' },
  { value: 'MOA with College of Engineering', label: 'MOA with College of Engineering' },
  { value: 'MOA on Career Orientation Services', label: 'MOA on Career Orientation Services' },
  { value: 'MOA on International Educational Cooperation', label: 'MOA on International Educational Cooperation' },
  { value: 'MOA on Promotion and Collaboration on International Academic and Research', label: 'MOA on Promotion and Collaboration on International Academic and Research' },
  { value: 'MOA for Academic Exchange: Joint Development Agreement for Railway-Related Programs Academic Documents', label: 'MOA for Academic Exchange: Joint Development Agreement for Railway-Related Programs Academic Documents' },
  { value: 'MOA on Extension Project', label: 'MOA on Extension Project' },
  { value: 'MOA Tripartite', label: 'MOA Tripartite' },
  { value: 'MOA on English and Cultural Program', label: 'MOA on English and Cultural Program' },
  { value: 'MOA on Student Competition', label: 'MOA on Student Competition' },
  { value: 'MOA on Faculty and Student Exchange', label: 'MOA on Faculty and Student Exchange' }
];

const ExtractedEntry = () => {
  const [contacts, setContacts] = useState([{ position: "", name: "" }]);

  const [pointPersons, setPointPersons] = useState([{ position: "", name: ""}]);

  // Add new contact row
  const addContact = () => {
    setContacts([...contacts, { position: "", name: "" }]);
  };

  // Add new point person row
  const addPointPerson = () => {
    setPointPersons([...pointPersons, { position: "", name: ""}]);
  };

  // Update value in contact row
  const handleContactChange = (index, field, value) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };
  // Update value in point person row
  const handlePointPersonChange = (index, field, value) => {
    const updated = [...pointPersons];
    updated[index][field] = value;
    setPointPersons(updated);
  };

  return (
    <TopbarSidebar>
      <div className="manual-entry-wrapper">
        <div className="manual-entry-container">
          <h2 className="form-title">MOU Extracted Entry Form</h2>
          <form className="manual-entry-form">

            {/* DATE */}
            <div className="form-group">
              <label htmlFor="entryDate">Date:</label>
              <input id="entryDate" type="date" />
            </div>

            {/* DOC TYPE */}
            <div className="form-group">
              <label htmlFor="docType">Document Type:*</label>
              <select id="docType" name="docType" required value="MOU" disabled>
                <option value="MOU">MOU</option>
              </select>
            </div>

            {/* AGREEMENT STATUS */}
            <div className="form-group">
              <label htmlFor="status">Agreement Status:*</label>
              <select id="status" required>
                <option value="">Select Agreement Status</option>
                <option value="Endorse">Endorse to ULCO for review and approval</option>
                <option value="Revert">Revert to Initiator with comments</option>
                <option value="Replication">For Replication of Copies (6 set)</option>
                <option value="SignituresPUP">For Signatures of PUP Officials</option>
                <option value="SignedPUP">Signed By PUP Officials</option>
                <option value="SignituresPartner">For Signature of Partner</option>
                <option value="Complete">Completely Signed</option>
                <option value="Notary">For Notary</option>
                <option value="FFUPCopy">For FFUP Copy from college/campus</option>
                <option value="Renewal">Renewal</option>
              </select>
            </div>

            {/* AGREEMENT ENTRY TYPE */}
            <div className="form-group">
              <label htmlFor="entryType">Agreement Entry Type:*</label>
              <select id="entryType" required>
                <option value="">Select Entry Type</option>
                <option value="Renewal">Renewal</option>
                <option value="New">New</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* RENEWED AGREEMENT */}
            <div className="form-group">
              <label htmlFor="renewedFrom">Renewed Agreement from:</label>
              <input id="renewedFrom" type="text" />
            </div>

            {/* VALIDITY PERIOD */}
            <div className="form-group">
              <label htmlFor="validity">Validity Period:</label>
              <select id="validity">
                <option value="">Select Period</option>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </div>

            {/* SOURCE */}
            <div className="form-group">
              <label htmlFor="source">Source (Campus/College Dept):*</label>
              <select id="source" required>
                <option value="">Select Source</option>
                <option value="CHTTM">CHTTM</option>
              </select>
            </div>

            {/* PARTNERSHIP TYPE */}
            <div className="form-group">
              <label htmlFor="partnershipType">Partnership Type:*</label>
              <Select
                options={partnershipTypeOptions}
                name="partnershipType"
                id="partnershipType"
                required
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Partnership Type"
              />
            </div>

           {/* DTS NO */}
            <div className="form-group">
              <label htmlFor="dtsNo">DTS No.:*</label>
              <input id="dtsNo" type="text" required />
            </div>

            {/* DTS STATUS */}
            <div className="form-group">
              <label htmlFor="dtsStatus">DTS Status:*</label>
              <select id="dtsStatus" required>
                <option value="">Select Status</option>
                <option value="Open - OIA">OPEN - OIA</option>
                <option value="Closed - OIA">Closed - OIA</option>
                <option value="Open - Other Office">Open - Other Office</option>
                <option value="Closed - Other Office">Closed - Other Office</option>
              </select>
            </div>

            {/* DATE RECEIVED */}
            <div className="form-group">
              <label htmlFor="dateReceived">Date Received:*</label>
              <input id="dateReceived" type="date" required />
            </div>

            {/* DATE EXPIRY */}
            <div className="form-group">
              <label htmlFor="dateExpiry">Date Expiry:</label>
              <input id="dateExpiry" type="date" />
            </div>

            {/* DATE PUP SIGNED */}
            <div className="form-group">
              <label htmlFor="datePupSigned">Date PUP Signed:</label>
              <input id="datePupSigned" type="date" />
            </div>

            {/* DATE SIGNED */}
            <div className="form-group">
              <label htmlFor="dateSigned"> Date/Year of Signing :</label>
              <input id="dateSigned" type="date" />
            </div>

            {/* DATE ENDORSED */}
            <div className="form-group">
              <label htmlFor="dateEndorsed">Date Endorsed to ULCO:</label>
              <input id="dateEndorsed" type="date" />
            </div>

            {/* DATE ULCO APPROVED */}
            <div className="form-group">
              <label htmlFor="dateUlcoApproved">Date ULCO Approved:</label>
              <input id="dateUlcoApproved" type="date" />
            </div>

            {/* PARTNER NAME */}
            <div className="form-group">
              <label htmlFor="partnerName">Partner Name:*</label>
              <input id="partnerName" type="text" required />
            </div>

            {/* SIGNATORIES */}
            <div className="form-group">
              <label htmlFor="signatories">Signatories:</label>
              <input id="signatories" type="text" />
            </div>

            {/* PARTNER NAME */}
            <div className="form-group">
              <label htmlFor="partnerName">Partner Name:*</label>
              <input id="partnerName" type="text" required />
            </div>

            {/* ENTITY TYPE */}
            <div className="form-group">
              <label htmlFor="entityType">Entity Type (Univ/Company/Agency):*</label>
              <input id="entityType" type="text" required />
            </div>

            {/* COUNTRY */}
            <div className="form-group">
              <label htmlFor="country">Country:*</label>
              <Select
                options={countryOptions}
                name="country"
                id="country"
                required
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Country"
              />
            </div>

            {/* REGION */}
            <div className="form-group">
              <label htmlFor="region">Region:*</label>
              <Select
                options={regionOptions}
                name="region"
                id="region"
                required
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Region"
              />
            </div>

            {/* ADDRESS */}
            <div className="form-group full-width">
              <label htmlFor="address">Address:*</label>
              <input id="address" type="text" required />
            </div>

            {/* WEBSITE */}
            <div className="form-group">
              <label htmlFor="website">Website Link:</label>
              <input id="website" type="url" />
            </div>

            {/* LOGO */}
            <div className="form-group">
              <label htmlFor="logo">Logo:</label>
              <input id="logo" type="file" />
            </div>

            {/* POINT PERSON AND ADD POINT PERSON*/}
            <div className="form-section">
              <label>Point Person</label>
              {pointPersons.map((pointPerson, index) => (
                <div key={index} className="contact-row">
                  <input
                    type="text"
                    placeholder="Position"
                    value={pointPerson.position}
                    onChange={(e) =>
                      handlePointPersonChange(index, "position", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={pointPerson.name}
                    onChange={(e) =>
                      handlePointPersonChange(index, "name", e.target.value)
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                className="add-contact-btn"
                onClick={addPointPerson}
              >
                ➕ Add Point Person
              </button>
            </div>

            {/* CONTACT PERSON AND ADD CONTACT PERSON*/}
            <div className="form-section">
              <label>Contact Person</label>
              {contacts.map((contact, index) => (
                <div key={index} className="contact-row">
                  <input
                    type="text"
                    placeholder="Position"
                    value={contact.position}
                    onChange={(e) =>
                      handleContactChange(index, "position", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={contact.name}
                    onChange={(e) =>
                      handleContactChange(index, "name", e.target.value)
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                className="add-contact-btn"
                onClick={addContact}
              >
                ➕ Add Contact
              </button>
            </div>
    
            {/* POINT PERSON Email */}
            <div className="form-group">
              <label htmlFor="pointPersonEmail">Point Person Email:</label>
              <input id="pointPersonEmail" type="text" />
            </div>

           {/* CONTACT PERSON EMAIL */}
            <div className="form-group">
              <label htmlFor="contactPersonEmail">Contact Person Email:</label>
              <input id="contactPersonEmail" type="email" />
            </div>

            {/* LOCATOR */}
            <div className="form-group full-width">
              <label htmlFor="locator">Hardcopy Locator:</label>
              <input id="locator" type="text" />
            </div>

            {/* EVENT INFO */}
            <div className="form-group full-width">
              <label htmlFor="eventInfo">Event Info:</label>
              <textarea id="eventInfo" />
            </div>

            {/* DESCRIPTION */}
            <div className="form-group full-width">
              <label htmlFor="description">Brief Description about the partner:</label>
              <textarea id="description" />
            </div>

            {/* REMARKS */}
            <div className="form-group full-width">
              <label htmlFor="remarks">Remarks:</label>
              <textarea id="remarks" />
            </div>

            {/* SUBMIT BUTTON */}
            <div className="form-actions">
              <button type="submit" className="publish-button">Publish</button>
            </div>

          </form>
        </div>
      </div>
    </TopbarSidebar>
  );
};

export default ExtractedEntry;
