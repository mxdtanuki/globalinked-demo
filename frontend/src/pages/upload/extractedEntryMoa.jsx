
import React, { useState } from "react";
import TopbarSidebar from '../../components/topbarSidebar';
import Select from 'react-select';
import './globalUpload.css';

const countryOptions = [
  { value: 'Afghanistan', label: 'Afghanistan' },
  { value: 'Albania', label: 'Albania' },
  { value: 'Algeria', label: 'Algeria' },
  { value: 'Andorra', label: 'Andorra' },
  { value: 'Angola', label: 'Angola' },
  { value: 'Antigua and Barbuda', label: 'Antigua and Barbuda' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Armenia', label: 'Armenia' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Austria', label: 'Austria' },
  { value: 'Azerbaijan', label: 'Azerbaijan' },
  { value: 'Bahamas', label: 'Bahamas' },
  { value: 'Bahrain', label: 'Bahrain' },
  { value: 'Bangladesh', label: 'Bangladesh' },
  { value: 'Barbados', label: 'Barbados' },
  { value: 'Belarus', label: 'Belarus' },
  { value: 'Belgium', label: 'Belgium' },
  { value: 'Belize', label: 'Belize' },
  { value: 'Benin', label: 'Benin' },
  { value: 'Bhutan', label: 'Bhutan' },
  { value: 'Bolivia', label: 'Bolivia' },
  { value: 'Bosnia and Herzegovina', label: 'Bosnia and Herzegovina' },
  { value: 'Botswana', label: 'Botswana' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Brunei', label: 'Brunei' },
  { value: 'Bulgaria', label: 'Bulgaria' },
  { value: 'Burkina Faso', label: 'Burkina Faso' },
  { value: 'Burundi', label: 'Burundi' },
  { value: 'Cabo Verde', label: 'Cabo Verde' },
  { value: 'Cambodia', label: 'Cambodia' },
  { value: 'Cameroon', label: 'Cameroon' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Central African Republic', label: 'Central African Republic' },
  { value: 'Chad', label: 'Chad' },
  { value: 'Chile', label: 'Chile' },
  { value: 'China', label: 'China' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Comoros', label: 'Comoros' },
  { value: 'Congo', label: 'Congo' },
  { value: 'Costa Rica', label: 'Costa Rica' },
  { value: 'Croatia', label: 'Croatia' },
  { value: 'Cuba', label: 'Cuba' },
  { value: 'Cyprus', label: 'Cyprus' },
  { value: 'Czech Republic', label: 'Czech Republic' },
  { value: 'Denmark', label: 'Denmark' },
  { value: 'Djibouti', label: 'Djibouti' },
  { value: 'Dominica', label: 'Dominica' },
  { value: 'Dominican Republic', label: 'Dominican Republic' },
  { value: 'Ecuador', label: 'Ecuador' },
  { value: 'Egypt', label: 'Egypt' },
  { value: 'El Salvador', label: 'El Salvador' },
  { value: 'Equatorial Guinea', label: 'Equatorial Guinea' },
  { value: 'Eritrea', label: 'Eritrea' },
  { value: 'Estonia', label: 'Estonia' },
  { value: 'Eswatini', label: 'Eswatini' },
  { value: 'Ethiopia', label: 'Ethiopia' },
  { value: 'Fiji', label: 'Fiji' },
  { value: 'Finland', label: 'Finland' },
  { value: 'France', label: 'France' },
  { value: 'Gabon', label: 'Gabon' },
  { value: 'Gambia', label: 'Gambia' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Ghana', label: 'Ghana' },
  { value: 'Greece', label: 'Greece' },
  { value: 'Grenada', label: 'Grenada' },
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'Guinea', label: 'Guinea' },
  { value: 'Guinea-Bissau', label: 'Guinea-Bissau' },
  { value: 'Guyana', label: 'Guyana' },
  { value: 'Haiti', label: 'Haiti' },
  { value: 'Honduras', label: 'Honduras' },
  { value: 'Hungary', label: 'Hungary' },
  { value: 'Iceland', label: 'Iceland' },
  { value: 'India', label: 'India' },
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'Iran', label: 'Iran' },
  { value: 'Iraq', label: 'Iraq' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Israel', label: 'Israel' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Jamaica', label: 'Jamaica' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Jordan', label: 'Jordan' },
  { value: 'Kazakhstan', label: 'Kazakhstan' },
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Kiribati', label: 'Kiribati' },
  { value: 'Kuwait', label: 'Kuwait' },
  { value: 'Kyrgyzstan', label: 'Kyrgyzstan' },
  { value: 'Laos', label: 'Laos' },
  { value: 'Latvia', label: 'Latvia' },
  { value: 'Lebanon', label: 'Lebanon' },
  { value: 'Lesotho', label: 'Lesotho' },
  { value: 'Liberia', label: 'Liberia' },
  { value: 'Libya', label: 'Libya' },
  { value: 'Liechtenstein', label: 'Liechtenstein' },
  { value: 'Lithuania', label: 'Lithuania' },
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'Madagascar', label: 'Madagascar' },
  { value: 'Malawi', label: 'Malawi' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Maldives', label: 'Maldives' },
  { value: 'Mali', label: 'Mali' },
  { value: 'Malta', label: 'Malta' },
  { value: 'Marshall Islands', label: 'Marshall Islands' },
  { value: 'Mauritania', label: 'Mauritania' },
  { value: 'Mauritius', label: 'Mauritius' },
  { value: 'Mexico', label: 'Mexico' },
  { value: 'Micronesia', label: 'Micronesia' },
  { value: 'Moldova', label: 'Moldova' },
  { value: 'Monaco', label: 'Monaco' },
  { value: 'Mongolia', label: 'Mongolia' },
  { value: 'Montenegro', label: 'Montenegro' },
  { value: 'Morocco', label: 'Morocco' },
  { value: 'Mozambique', label: 'Mozambique' },
  { value: 'Myanmar', label: 'Myanmar' },
  { value: 'Namibia', label: 'Namibia' },
  { value: 'Nauru', label: 'Nauru' },
  { value: 'Nepal', label: 'Nepal' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'New Zealand', label: 'New Zealand' },
  { value: 'Nicaragua', label: 'Nicaragua' },
  { value: 'Niger', label: 'Niger' },
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'North Korea', label: 'North Korea' },
  { value: 'North Macedonia', label: 'North Macedonia' },
  { value: 'Norway', label: 'Norway' },
  { value: 'Oman', label: 'Oman' },
  { value: 'Pakistan', label: 'Pakistan' },
  { value: 'Palau', label: 'Palau' },
  { value: 'Palestine', label: 'Palestine' },
  { value: 'Panama', label: 'Panama' },
  { value: 'Papua New Guinea', label: 'Papua New Guinea' },
  { value: 'Paraguay', label: 'Paraguay' },
  { value: 'Peru', label: 'Peru' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Poland', label: 'Poland' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Qatar', label: 'Qatar' },
  { value: 'Romania', label: 'Romania' },
  { value: 'Russia', label: 'Russia' },
  { value: 'Rwanda', label: 'Rwanda' },
  { value: 'Saint Kitts and Nevis', label: 'Saint Kitts and Nevis' },
  { value: 'Saint Lucia', label: 'Saint Lucia' },
  { value: 'Saint Vincent and the Grenadines', label: 'Saint Vincent and the Grenadines' },
  { value: 'Samoa', label: 'Samoa' },
  { value: 'San Marino', label: 'San Marino' },
  { value: 'Sao Tome and Principe', label: 'Sao Tome and Principe' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'Senegal', label: 'Senegal' },
  { value: 'Serbia', label: 'Serbia' },
  { value: 'Seychelles', label: 'Seychelles' },
  { value: 'Sierra Leone', label: 'Sierra Leone' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Slovakia', label: 'Slovakia' },
  { value: 'Slovenia', label: 'Slovenia' },
  { value: 'Solomon Islands', label: 'Solomon Islands' },
  { value: 'Somalia', label: 'Somalia' },
  { value: 'South Africa', label: 'South Africa' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'South Sudan', label: 'South Sudan' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Sri Lanka', label: 'Sri Lanka' },
  { value: 'Sudan', label: 'Sudan' },
  { value: 'Suriname', label: 'Suriname' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Syria', label: 'Syria' },
  { value: 'Taiwan', label: 'Taiwan' },
  { value: 'Tajikistan', label: 'Tajikistan' },
  { value: 'Tanzania', label: 'Tanzania' },
  { value: 'Thailand', label: 'Thailand' },
  { value: 'Timor-Leste', label: 'Timor-Leste' },
  { value: 'Togo', label: 'Togo' },
  { value: 'Tonga', label: 'Tonga' },
  { value: 'Trinidad and Tobago', label: 'Trinidad and Tobago' },
  { value: 'Tunisia', label: 'Tunisia' },
  { value: 'Turkey', label: 'Turkey' },
  { value: 'Turkmenistan', label: 'Turkmenistan' },
  { value: 'Tuvalu', label: 'Tuvalu' },
  { value: 'Uganda', label: 'Uganda' },
  { value: 'Ukraine', label: 'Ukraine' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'United States', label: 'United States' },
  { value: 'Uruguay', label: 'Uruguay' },
  { value: 'Uzbekistan', label: 'Uzbekistan' },
  { value: 'Vanuatu', label: 'Vanuatu' },
  { value: 'Vatican City', label: 'Vatican City' },
  { value: 'Venezuela', label: 'Venezuela' },
  { value: 'Vietnam', label: 'Vietnam' },
  { value: 'Yemen', label: 'Yemen' },
  { value: 'Zambia', label: 'Zambia' },
  { value: 'Zimbabwe', label: 'Zimbabwe' }
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

const ExtractedEntryMOA = () => {
  const [contacts, setContacts] = useState([{ position: "", name: "", email: "" }]);
  const [pointPersons, setPointPersons] = useState([{ position: "", name: "", email: "" }]);

  // Add new contact row
  const addContact = () => {
    setContacts([...contacts, { position: "", name: "", email: "" }]);
  };

  // Add new point person row
  const addPointPerson = () => {
    setPointPersons([...pointPersons, { position: "", name: "", email: "" }]);
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

  // Remove contact row
  const removeContact = (index) => {
    const updated = [...contacts];
    updated.splice(index, 1);
    setContacts(updated);
  };

  // Remove point person row
  const removePointPerson = (index) => {
    const updated = [...pointPersons];
    updated.splice(index, 1);
    setPointPersons(updated);
  };

  return (
    <TopbarSidebar>
      <div className="manual-entry-wrapper">
        <div className="manual-entry-container">
          <h2 className="form-title"> MOA Extracted Entry Form</h2>
          <form className="manual-entry-form">

            {/* DATE */}
            <div className="form-group">
              <label htmlFor="entryDate">Date:</label>
              <input id="entryDate" type="date" />
            </div>

            {/* DOC TYPE */}
            <div className="form-group">
              <label htmlFor="docType">Document Type:*</label>
              <select id="docType" name="docType" required value="MOA" disabled>
                <option value="MOU">MOA</option>
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

            {/* RELATED MOU */}
            <div className="form-group">
              <label htmlFor="relatedMOU">Related MOU:</label>
              <input id="relatedMOU" type="file" />
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
            <div className="form-group full-width">
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

            {/* POINT PERSON */}
            <div className="form-section">
              <label>Point Person</label>
              {pointPersons.map((pointPerson, index) => (
                <div key={index} className="contact-row">
                  <input
                    type="text"
                    placeholder="Name"
                    value={pointPerson.name}
                    onChange={(e) =>
                      handlePointPersonChange(index, "name", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    value={pointPerson.position}
                    onChange={(e) =>
                      handlePointPersonChange(index, "position", e.target.value)
                    }
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={pointPerson.email}
                    onChange={(e) =>
                      handlePointPersonChange(index, "email", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removePointPerson(index)}
                  >
                    ❌
                  </button>
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

            {/* CONTACT PERSON */}
            <div className="form-section">
              <label>Contact Person</label>
              {contacts.map((contact, index) => (
                <div key={index} className="contact-row">
                  <input
                    type="text"
                    placeholder="Name"
                    value={contact.name}
                    onChange={(e) =>
                      handleContactChange(index, "name", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    value={contact.position}
                    onChange={(e) =>
                      handleContactChange(index, "position", e.target.value)
                    }
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={contact.email}
                    onChange={(e) =>
                      handleContactChange(index, "email", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeContact(index)}
                  >
                    ❌
                  </button>
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

export default ExtractedEntryMOA;
