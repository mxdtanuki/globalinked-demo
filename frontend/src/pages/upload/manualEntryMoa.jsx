import React, { useState } from 'react';
import TopbarSidebar from '../../components/topbarSidebar';
import Select from 'react-select';
import { agreementService } from '../../services/agreementService';
import './globalUpload.css';
//import axios from "axios";


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
  { value: 'Western Africa', label: 'Western Africa' },
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
  { value: 'MOA on Faculty and Student Exchange', label: 'MOA on Faculty and Student Exchange' },
];

const ManualEntryMOA = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [dtsNumber, setDtsNumber] = useState("");
  const [documentType, setDocumentType] = useState("MOA"); // or whatever your default is
  const [partnershipType, setPartnershipType] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    const duplicate = await agreementService.checkDuplicate({
    dts_number: dtsNumber,
    document_type: documentType,
    partnership_type: partnershipType
  });

if (duplicate) {
  setMessage(
    `Duplicate found:
    Partner: ${duplicate.name}
    DTS No.: ${duplicate.dts_number}
    Document Type: ${duplicate.document_type}
    Partnership Type: ${duplicate.partnership_type}`
  );
  setLoading(false);
  return; // Stop submission
  }

    const form = new FormData(e.target);
    const data = Object.fromEntries(form);

    const agreementData = {
      partner_data: {
        name: data.partnerName,
        entity_type: data.entityType,
        country: selectedCountry?.value || "",
        region: selectedRegion?.value || "",
        address: data.address,
        website_url: data.website || "",
        description: data.description || "",
        status: "active",
        contact_persons: data.contactPersonName
          ? [
              {
                contact_person_name: data.contactPersonName,
                contact_person_position: data.contactPersonPosition || "",
                contact_person_email: data.contactPersonEmail || ""
              }
            ]
          : []
      },
      source_unit_id: parseInt(data.source),
      dts_number: dtsNumber,
      dts_status: data.dtsStatus,
      document_type: documentType,
      partnership_type: partnershipType,
      agreement_status: data.status,
      entry_type: data.entryType,
      entry_date: data.entryDate || null,
      date_received: data.dateReceived || null,
      date_endorsed_to_ulco: data.dateEndorsed || null,
      date_ulco_approved: data.dateUlcoApproved || null,
      date_signed_by_pup: data.datePupSigned || null,
      date_signed: data.dateSigned || null,
      date_expiry: data.dateExpiry || null,
      validity_period: data.validity || null,
      event_info: data.eventInfo || null,
      signatories_list: data.signatories || null,
      point_persons: data.pointPerson
        ? [
            {
              point_person_name: data.pointPerson,
              point_person_position: data.pointPersonPosition || "",
              point_person_email: data.pointPersonEmail || ""
            }
          ]
        : [],
      hardcopy_location: data.locator || null,
      renewed_from_agreement_id: data.renewedFrom
        ? parseInt(data.renewedFrom)
        : null,
      initial_remarks: data.remarks
        ? [
            {
              remark_text: data.remarks
            }
          ]
        : []
    };

    await agreementService.createAgreement(agreementData);
    setMessage("MOA created successfully!");

    // Reset form
    e.target.reset();
    setSelectedCountry(null);
    setSelectedRegion(null);
    setDtsNumber("");
    setDocumentType("MOA");
    setPartnershipType("");

  } catch (error) {
    console.error("Full error:", error);
    setMessage("Error: " + error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <TopbarSidebar>
      <div className="manual-entry-wrapper">
        <div className="manual-entry-container">
          <h2 className="form-title">Manual Entry Form</h2>
          {message && <div style={{padding: '10px', margin: '10px 0', backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8'}}>{message}</div>}
          <form className="manual-entry-form" onSubmit={handleSubmit}>
            <label htmlFor="entryDate">Date:</label>
            <input id="entryDate" name="entryDate" type="date" />

             <label htmlFor="docType">Document Type:*</label>
            <select id="docType" name="docType" required defaultValue="MOA">
              <option value="MOA">MOA</option>
            </select>

            <label htmlFor="status">Agreement Status:*</label>
            <select id="status" name="status" required>
              <option value="">Select Agreement Status</option>
              <option value="Endorse">Endorse to ULCO for review and approval</option>
              <option value="Revert">Revert to Initiator with comments</option>
              <option value="Replication">For Replication of Copies (6 set)</option>
              <option value="SignituresPUP">For Signitures of PUP Officials</option>
              <option value="SignedPUP">Signed By PUP Officials</option>
              <option value="SignituresPartner">For Signiture of Partner</option>
              <option value="Complete">Completly Signed</option>
              <option value="Notary">For Notary</option>
              <option value="FFUPCopy">For FFUP Copy from college/campus</option>
              <option value="Renewal">Renewal</option>
            </select>

            <label htmlFor="entryType">Agreement Entry Type:*</label>
            <select id="entryType" name="entryType" required>
              <option value="">Select Entry Type</option>
              <option value="Renewal">Renewal</option>
              <option value="New">New</option>
              <option value="Other">Other</option>
            </select>

            <label htmlFor="renewedFrom">Renewed Agreement from:</label>
            <input id="renewedFrom" name="renewedFrom" type="text" />

            <label htmlFor="relatedMOU">Related MOU:</label>
            <input id="relatedMOU" type="file" />

            <label htmlFor="source">Source (Campus/College Dept):*</label>
            <select id="source" name="source" required>
              <option value="">Select Source</option>
              <option value="1">College of Engineering</option>
              <option value="2">College of Business</option>
              <option value="3">International Affairs Office</option>
              <option value="4">CHTTM</option>
            </select>

             <label htmlFor="signatories">Signatories:</label>
            <input id="signatories" name="signatories" type="text" />

            <label htmlFor="dateReceived">Date Received:*</label>
            <input id="dateReceived" name="dateReceived" type="date" required />
            
            <label htmlFor="validity">Validity Period:</label>
            <select id="validity" name="validity">
              <option value="">Select Period</option>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>

            <label htmlFor="dateExpiry">Date Expiry:</label>
            <input id="dateExpiry" name="dateExpiry" type="date" />

            <label htmlFor="datePupSigned">Date PUP Signed:</label>
            <input id="datePupSigned" name="datePupSigned" type="date" />

            <label htmlFor="partnerName">Partner Name:*</label>
            <input id="partnerName" name="partnerName" type="text" required />

            <label htmlFor="contactPersonName">Contact Person Name:</label>
            <input id="contactPersonName" name="contactPersonName" type="text" placeholder="Enter contact person's full name" />

            <label htmlFor="contactPersonPosition">Contact Person Position:</label>
            <input id="contactPersonPosition" name="contactPersonPosition" type="text" placeholder="Enter their position/title" />

            <label htmlFor="contactPersonEmail">Contact Person Email:</label>
            <input id="contactPersonEmail" name="contactPersonEmail" type="email" placeholder="Enter their email address" />

            <label htmlFor="country">Country:*</label>
            <Select
              value={selectedCountry}
              onChange={setSelectedCountry}
              options={countryOptions}
              name="country"
              id="country"
              required
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select Country"
            />

            <label htmlFor="region">Region:*</label>
            <Select
              value={selectedRegion}
              onChange={setSelectedRegion}
              options={regionOptions}
              name="region"
              id="region"
              required
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select Region"
            />

            <label htmlFor="address">Address:*</label>
            <input id="address" name="address" type="text" required />

            <label htmlFor="logo">Logo:</label>
            <input id="logo" type="file" />

            {/* DTS No. */}
            <label htmlFor="dtsNo">DTS No.:*</label>
            <input
              id="dtsNo"
              name="dtsNo"
              type="text"
              required
              value={dtsNumber}
              onChange={(e) => setDtsNumber(e.target.value)}
            />

            {/* Document Type */}
            <label htmlFor="docType">Document Type:*</label>
            <select
              id="docType"
              name="docType"
              required
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="MOA">MOA</option>
            </select>

            {/* Partnership Type */}
            <label htmlFor="partnershipType">Partnership Type:*</label>
            <Select
              value={
                partnershipType
                  ? { value: partnershipType, label: partnershipType }
                  : null
              }
              onChange={(opt) => setPartnershipType(opt?.value || "")}
              options={partnershipTypeOptions}
              name="partnershipType"
              id="partnershipType"
              required
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select Partnership Type"
            />


            <label htmlFor="pointPerson">Point Person Position:</label>
            <input id="pointPerson" name="pointPerson" type="text" />

            <label htmlFor="locator">Hardcopy Locator:</label>
            <input id="locator" name="locator" type="text" />

            <label htmlFor="dateSigned">Date Signed:</label>
            <input id="dateSigned" name="dateSigned" type="date" />

            <label htmlFor="dateEndorsed">Date Endorsed to ULCO:</label>
            <input id="dateEndorsed" name="dateEndorsed" type="date" />

            <label htmlFor="dateUlcoApproved">Date ULCO Approved:</label>
            <input id="dateUlcoApproved" name="dateUlcoApproved" type="date" />

            <label htmlFor="entityType">Entity Type (Univ/Company/Agency):*</label>
            <input id="entityType" name="entityType" type="text" required />

            <label htmlFor="website">Website Link:</label>
            <input id="website" name="website" type="url" />

            <label htmlFor="eventInfo">Event Info:</label>
            <textarea id="eventInfo" name="eventInfo" />

            <label htmlFor="description">Brief Description about the partner:</label>
            <textarea id="description" name="description" />

            <label htmlFor="remarks">Remarks:</label>
            <textarea id="remarks" name="remarks" />

            <div className="form-actions">
              <button type="submit" className="publish-button" disabled={loading}>
                {loading ? 'Creating...' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </TopbarSidebar>
  );
};

export default ManualEntryMOA;