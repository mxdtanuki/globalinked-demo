import React, { useState,useEffect } from 'react';
import TopbarSidebar from '../../components/topbarSidebar';
import Select from 'react-select';
import { agreementService } from '../../services/agreementService';
import './globalUpload.css';
import axios from "axios";


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
  const [message, setMessage] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [dtsNumber, setDtsNumber] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [partnershipType, setPartnershipType] = useState("");

  // Partner state
  const [partnerEntryType, setPartnerEntryType] = useState("New"); 
  const [existingPartners, setExistingPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerData, setPartnerData] = useState({
    name: "",
    entityType: "",
    address: "",
    website: "",
    description: "",
    logo: null,
  });

  // Contacts & point persons
  const [contacts, setContacts] = useState([{ position: "", name: "", email: "" }]);
  const [pointPersons, setPointPersons] = useState([{ position: "", name: "", email: "" }]);

  // Contact functions
  const addContact = () => setContacts([...contacts, { position: "", name: "", email: "" }]);
  const handleContactChange = (i, field, val) => {
    const updated = [...contacts];
    updated[i][field] = val;
    setContacts(updated);
  };
  const removeContact = (i) => setContacts(contacts.filter((_, idx) => idx !== i));

  // Point person functions
  const addPointPerson = () => setPointPersons([...pointPersons, { position: "", name: "", email: "" }]);
  const handlePointPersonChange = (i, field, val) => {
    const updated = [...pointPersons];
    updated[i][field] = val;
    setPointPersons(updated);
  };
  const removePointPerson = (i) => setPointPersons(pointPersons.filter((_, idx) => idx !== i));

  // Fetch existing partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await agreementService.getPartners();
        const options = response.map(p => ({
          value: p.partner_id,
          label: p.name,
          ...p
        }));
        setExistingPartners(options);
      } catch (error) {
        console.error("Failed to load partners", error);
      }
    };
    fetchPartners();
  }, []);

  // Handle selecting an existing partner
  const handleExistingPartnerChange = (opt) => {
    setSelectedPartner(opt);
    if (opt) {
      setPartnerData({
        name: opt.name,
        entityType: opt.entity_type,
        address: opt.address,
        website: opt.website_url,
        description: opt.description,
        logo: opt.logo || null,
      });
      setSelectedCountry({ value: opt.country, label: opt.country });
      setSelectedRegion({ value: opt.region, label: opt.region });
    }
  };

  // Submit handler
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);

    let agreementData = {
      source_unit: data.source,
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

      // Point persons array from state
      point_persons: pointPersons
        .filter((pp) => pp.name)
        .map((pp) => ({
          point_person_name: pp.name,
          point_person_position: pp.position || "",
          point_person_email: pp.email || "",
        })),

      // Timer data
      timer: {
        deadline: data.deadlineDate || null,
        days: parseInt(data.days) || 0,
        hours: parseInt(data.hours) || 0,
        minutes: parseInt(data.minutes) || 0,
      },

      hardcopy_location: data.locator || null,
      renewed_from_agreement_id: data.renewedFrom
        ? String(data.renewedFrom)
        : null,
      initial_remarks: data.remarks
        ? [{ remark_text: data.remarks }]
        : [],
    };

    // 🔑 Handle partner differently for existing vs new
    if (partnerEntryType === "Existing") {
      agreementData.partner_id = selectedPartner?.value || null;
    } else {
      agreementData.partner_data = {
        name: partnerData.name,
        entity_type: partnerData.entityType,
        country: selectedCountry?.value || "",
        region: selectedRegion?.value || "",
        address: partnerData.address,
        website_url: partnerData.website || "",
        description: partnerData.description || "",
        status: "active",
        contact_persons: contacts
          .filter((c) => c.name)
          .map((c) => ({
            contact_person_name: c.name,
            contact_person_position: c.position || "",
            contact_person_email: c.email || "",
          })),
      };
    }

    // Send request
    const response = await agreementService.createAgreement(agreementData);

    if (response.status === "duplicate") {
      setMessage(
        `Duplicate found:
         Partner: ${response.agreement.name}
         DTS No.: ${response.agreement.dts_number}
         Document Type: ${response.agreement.document_type}
         Partnership Type: ${response.agreement.partnership_type}`
      );
      return;
    }

    if (response.status === "created") {
      setMessage("MOA created successfully!");
      e.target.reset();
      setSelectedCountry(null);
      setSelectedRegion(null);
      setDtsNumber("");
      setDocumentType("MOA");
      setPartnershipType("");
      setPointPersons([{ name: "", position: "", email: "" }]);
      setContacts([{ name: "", position: "", email: "" }]);
    }
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
        {message && (
          <div
            style={{
              padding: "10px",
              margin: "10px 0",
              backgroundColor: message.includes("Error")
                ? "#ffebee"
                : "#e8f5e8"
            }}
          >
            {message}
          </div>
        )}
        <form className="manual-entry-form" onSubmit={handleSubmit}>

          {/* DATE */}
          <div className="form-group" onSubmit={handleSubmit}>
            <label htmlFor="entryDate">Date:</label>
            <input id="entryDate" name="entryDate" type="date" required />
          </div>

          {/* Document Type */}
          <div className="form-group">
          <label htmlFor="docType">Document Type:*</label>
          <select
            id="docType"
            name="docType"
            required
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            <option value="" disabled>
              Select Document Type
            </option>
            <option value="MOA">MOA</option>
            <option value="MOU">MOU</option>
          </select>
          </div>

          {/* AGREEMENT STATUS */}
          <div className="form-group">
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
          </div>

          {/* AGREEMENT ENTRY TYPE */}
          <div className="form-group">
          <label htmlFor="entryType">Agreement Entry Type:*</label>
          <select id="entryType" name="entryType" required>
            <option value="">Select Entry Type</option>
            <option value="Renewal">Renewal</option>
            <option value="New">New</option>
            <option value="Other">Other</option>
          </select>
          </div>

          {/* RENEWED AGREEMENT */}
          <div className="form-group">
            <label htmlFor="renewedFrom">Renewed Agreement from (DTS Number Format):</label>
            <input id="renewedFrom" name="renewedFrom" type="text" />
          </div>
            
          {/* VALIDITY PERIOD*/}
          <div className="form-group">
          <label htmlFor="validity">Validity Period:</label>
          <select id="validity" name="validity">
            <option value="">Select Period</option>
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
          </div>

          {/* DTS No. */}
          <div className="form-group">
          <label htmlFor="dtsNo">DTS No.:*</label>
          <input
            id="dtsNo"
            name="dtsNo"
            type="text"
            required
            value={dtsNumber}
            onChange={(e) => setDtsNumber(e.target.value)}
          />
          </div>

          {/* DTS STATUS */}
          <div className="form-group">
            <label htmlFor="dtsStatus">DTS Status:*</label>
            <select id="dtsStatus" name="dtsStatus" required>
              <option value="">Select Status</option>
              <option value="Open - OIA">OPEN - OIA</option>
              <option value="Closed - OIA">Closed - OIA</option>
              <option value="Open - Other Office">Open - Other Office</option>
              <option value="Closed - Other Office">Closed - Other Office</option>
            </select>
          </div>

          {/* SOURCE UNIT */}
          <div className="form-group">
            <label htmlFor="source">Source (Campus/College Dept):*</label>
            <input id="source" name="source" type="text" required />
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
              onChange={(opt) => setPartnershipType(opt?.value || "")}
            />
          </div>

          {/* Partner Entry Type */}
          <div className="form-group">
            <label htmlFor="partnerEntryType">Partner Entry Type:*</label>
            <select
              id="partnerEntryType"
              value={partnerEntryType}
              onChange={(e) => setPartnerEntryType(e.target.value)}
            >
              <option value="New">New</option>
              <option value="Existing">Existing</option>
            </select>
          </div>

          {/* Partner Fields */}
          <div className="form-group">
            <label>Partner Name:*</label>
            {partnerEntryType === "New" ? (
              <input
                type="text"
                value={partnerData.name}
                onChange={(e) =>
                  setPartnerData({ ...partnerData, name: e.target.value })
                }
                required
              />
            ) : (
              <Select
                value={selectedPartner}
                onChange={handleExistingPartnerChange}
                options={existingPartners}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Existing Partner"
              />
            )}
          </div>

          <div className="form-group">
            <label>Entity Type:*</label>
            <input
              type="text"
              value={partnerData.entityType}
              onChange={(e) =>
                setPartnerData({ ...partnerData, entityType: e.target.value })
              }
              required
              readOnly={partnerEntryType === "Existing"}
            />
          </div>

          <div className="form-group">
            <label>Country:*</label>
            {partnerEntryType === "New" ? (
              <Select
                value={selectedCountry}
                onChange={setSelectedCountry}
                options={countryOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Country"
              />
            ) : (
              <input type="text" value={selectedCountry?.label || ""} readOnly />
            )}
          </div>

          <div className="form-group">
            <label>Region:*</label>
            {partnerEntryType === "New" ? (
              <Select
                value={selectedRegion}
                onChange={setSelectedRegion}
                options={regionOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Region"
              />
            ) : (
              <input type="text" value={selectedRegion?.label || ""} readOnly />
            )}
          </div>

          <div className="form-group">
            <label>Address:</label>
            <input
              type="text"
              value={partnerData.address}
              onChange={(e) =>
                setPartnerData({ ...partnerData, address: e.target.value })
              }
              readOnly={partnerEntryType === "Existing"}
            />
          </div>

          <div className="form-group">
            <label>Logo:</label>
            <input
              type="file"
              onChange={(e) =>
                setPartnerData({ ...partnerData, logo: e.target.files[0] })
              }
              disabled={partnerEntryType === "Existing"}
            />
          </div>

          <div className="form-group">
            <label>Website:</label>
            <input
              type="url"
              value={partnerData.website}
              onChange={(e) =>
                setPartnerData({ ...partnerData, website: e.target.value })
              }
              readOnly={partnerEntryType === "Existing"}
            />
          </div>

          <div className="form-group full-width">
            <label>Partner Description:</label>
            <textarea
              value={partnerData.description}
              onChange={(e) =>
                setPartnerData({ ...partnerData, description: e.target.value })
              }
              readOnly={partnerEntryType === "Existing"}
            />
          </div>

          {/* SIGNATORIES */}
          <div className="form-group full-width">
          <label htmlFor="signatories">Signatories:</label>
          <input id="signatories" name="signatories" type="text" />
          </div>

          {/* POINT PERSON */}
          <div className="form-section">
            <label>Point Persons</label>
            {pointPersons.map((pp, index) => (
              <div key={index} className="contact-row">
                <input
                  type="text"
                  placeholder="Name"
                  value={pp.name}
                  onChange={(e) =>
                    handlePointPersonChange(index, "name", e.target.value)
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Position"
                  value={pp.position}
                  onChange={(e) =>
                    handlePointPersonChange(index, "position", e.target.value)
                  }
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={pp.email}
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

          
          {/* DATE RECEIVED */}
          <div className="form-group">
          <label htmlFor="dateReceived">Date Received:*</label>
          <input id="dateReceived" name="dateReceived" type="date" required />
          </div>

          {/* DATE EXPIRY */}
          <div className="form-group">
          <label htmlFor="dateExpiry">Date Expiry:</label>
          <input id="dateExpiry" name="dateExpiry" type="date" required/>
          </div>

          {/* DATE PUP SIGNED */}
          <div className="form-group">
          <label htmlFor="datePupSigned">Date PUP Signed:</label>
          <input id="datePupSigned" name="datePupSigned" type="date" />
          </div>

           {/* DATE SIGNED */}
          <div className="form-group">
          <label htmlFor="dateSigned">Date/Year of Signing:</label>
          <input id="dateSigned" name="dateSigned" type="date" />
          </div>

          {/* DATE ENDORSED */}
          <div className="form-group">
          <label htmlFor="dateEndorsed">Date Endorsed to ULCO:</label>
          <input id="dateEndorsed" name="dateEndorsed" type="date" />
          </div>

          {/* DATE ULCO APPROVED */}
          <div className="form-group">
          <label htmlFor="dateUlcoApproved">Date ULCO Approved:</label>
          <input id="dateUlcoApproved" name="dateUlcoApproved" type="date" />
          </div>

            {/* DEADLINE DATE */}
            <div className="form-group full-width">
              <label htmlFor="deadlineDate">Deadline Date:</label>
              <input id="deadlineDate" name="deadlineDate" type="date" />
            </div>

            {/* REMINDER INTERVAL*/}
            <div className="form-group full-width">
              <label>Reminder Interval:</label>
              <div className="deadline-selects">
                <select name="days">
                  {[...Array(31).keys()].map((d) => (
                    <option key={d} value={d}>{d} days</option>
                  ))}
                </select>
                <select name="hours">
                  {[...Array(24).keys()].map((h) => (
                    <option key={h} value={h}>{h} hours</option>
                  ))}
                </select>
                <select name="minutes">
                  {[...Array(60).keys()].map((m) => (
                    <option key={m} value={m}>{m} minutes</option>
                  ))}
                </select>
              </div>
            </div>

          {/* HARDCOPY LOCATOR */}
          <div className="form-group full-width">
          <label htmlFor="locator">Hardcopy Locator:</label>
          <input id="locator" name="locator" type="text" />
          </div>

          {/* EVENT INFO */}
          <div className="form-group full-width">
          <label htmlFor="eventInfo">Event Info:</label>
          <textarea id="eventInfo" name="eventInfo" />
          </div>  

          {/* REMARKS */}
          <div className="form-group full-width">
          <label htmlFor="remarks">Remarks:</label>
          <textarea id="remarks" name="remarks" />
          </div>

          <div className="form-actions">
            <button type="submit" className="publish-button" disabled={loading}>
              {loading ? "Creating..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </TopbarSidebar>
);
};

export default ManualEntryMOA;