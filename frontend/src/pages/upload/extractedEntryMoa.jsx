// ...existing code...
import React, { useState, useEffect } from "react";
import TopbarSidebar from "../../components/topbarSidebar";
import Select from "react-select";
import "./globalUpload.css";
import { useLocation } from "react-router-dom";
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiHome,
  FiTag,
  FiGlobe,
  FiEdit,
  FiUser,
  FiMessageCircle,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiAlertCircle,
  FiMapPin,
  FiImage,
  FiLink,
  FiCalendar,
  FiAward,
} from "react-icons/fi";

const partnershipTypeOptions = [
  { value: "Agreement", label: "Agreement" },
  // ...existing array values...
  {
    value: "MOA on Faculty and Student Exchange",
    label: "MOA on Faculty and Student Exchange",
  },
];

const countryOptions = [
  { value: "Afghanistan", label: "Afghanistan", region: "Southern Asia" },
  // ...existing array values...
  { value: "Zimbabwe", label: "Zimbabwe", region: "Eastern Africa" },
  { value: "HongKong", label: "HongKong", region: "Eastern Asia" },
  { value: "Macao", label: "Macao", region: "Eastern Asia" },
];

const docTypeOptions = [
  { value: "MOA", label: "MOA" },
  { value: "MOU", label: "MOU" },
];

const statusOptions = [
  { value: "InitialReview", label: "Initial Review" },
  { value: "Endorse", label: "Endorse to ULCO for Review and Approval" },
  { value: "Revert", label: "Revert To Initiator with Comments" },
  { value: "Consultation", label: "For Consultation" },
  { value: "Replication", label: "Replication of Copies (8 sets)" },
  { value: "SignituresPUP", label: "For Signatures of PUP Officials" },
  { value: "SignedPUP", label: "Signed by PUP Officials" },
  { value: "SignituresPartner", label: "For Signatures of Partner" },
  { value: "SignedPartner", label: "Signed by Partner Institution" },
  { value: "Complete", label: "Completely Signed" },
  { value: "Notary", label: "For Notary" },
  { value: "FFUPCopy", label: "FFUP Copy From College/Campus" },
  { value: "Active", label: "Active" },
  { value: "Withdrawn", label: "Withdrawn" },
];

const entryTypeOptions = [
  { value: "Renewal", label: "Renewal" },
  { value: "New", label: "New" },
  { value: "Other", label: "Other" },
];

const validityOptions = [
  { value: "5", label: "5" },
  { value: "4", label: "4" },
  { value: "3", label: "3" },
  { value: "2", label: "2" },
  { value: "1", label: "1" },
];

const ExtractedEntryMOA = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [dtsNumber, setDtsNumber] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [partnershipType, setPartnershipType] = useState("");
  const [source, setSource] = useState("");
  const [dtsStatus, setDtsStatus] = useState("");
  const [agreementStatus, setAgreementStatus] = useState("");
  const [entryType, setEntryType] = useState("");
  const [dateUlcoApproved, setDateUlcoApproved] = useState("");
  const [remarks, setRemarks] = useState("");

  // --- Missing states and stubs to satisfy references ---
  const [extractedMetadata, setExtractedMetadata] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dateSigned, setDateSigned] = useState("");
  const [validityPeriod, setValidityPeriod] = useState("");
  const [dateExpiry, setDateExpiry] = useState("");
  const [datePupSigned, setDatePupSigned] = useState("");
  const [contacts, setContacts] = useState([
    { position: "", name: "", email: "" },
  ]);
  const [pointPersons, setPointPersons] = useState([
    { position: "", name: "", email: "" },
  ]);

  // Form-related small state stubs
  const [versionComment, setVersionComment] = useState("");
  const [selectedRelatedAgreement, setSelectedRelatedAgreement] =
    useState(null);
  const [relatedAgreements] = useState([]);
  const [partnerEntryType, setPartnerEntryType] = useState("New");
  const [partnerData, setPartnerData] = useState({
    name: "",
    entityType: "",
    address: "",
    logo: null,
    website: "",
    description: "",
  });
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [existingPartners] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionOptions] = useState([]);

  // Read navigation state (file + extracted metadata) when arriving from upload page
  const location = useLocation();
  useEffect(() => {
    if (location && location.state) {
      const { uploadedFile: navFile, extractedMetadata: navMetadata } =
        location.state;
      if (navFile) setUploadedFile(navFile);
      // Debug logs to help determine why empty uploads appear populated
      // eslint-disable-next-line no-console
      console.debug("extractedEntryMOA: navMetadata:", navMetadata);
      // Only set extracted metadata if it contains meaningful fields.
      const meaningful = hasMeaningfulExtractedMetadata(navMetadata);
      // eslint-disable-next-line no-console
      console.debug("extractedEntryMOA: meaningful metadata?", meaningful);
      if (navMetadata && meaningful) {
        setExtractedMetadata(navMetadata);
      } else {
        // Clear or leave as null so downstream logic treats this as "no metadata"
        setExtractedMetadata(null);
      }
    }
    // only run on mount/navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No-op handlers (replace with real implementations as needed)
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      // placeholder: add your submit logic here
      setMessage((m) => (m ? m : ""));
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerEntryTypeChange = (val) => setPartnerEntryType(val);
  const handleExistingPartnerChange = (opt) => setSelectedPartner(opt);
  const handleCountryChange = (opt) => setSelectedCountry(opt);

  const addPointPerson = () =>
    setPointPersons((p) => [...p, { position: "", name: "", email: "" }]);
  const removePointPerson = (idx) =>
    setPointPersons((p) => p.filter((_, i) => i !== idx));
  const handlePointPersonChange = (idx, field, value) =>
    setPointPersons((p) =>
      p.map((pp, i) => (i === idx ? { ...pp, [field]: value } : pp))
    );

  const addContact = () =>
    setContacts((c) => [...c, { position: "", name: "", email: "" }]);
  const removeContact = (idx) =>
    setContacts((c) => c.filter((_, i) => i !== idx));
  const handleContactChange = (idx, field, value) =>
    setContacts((c) =>
      c.map((ct, i) => (i === idx ? { ...ct, [field]: value } : ct))
    );

  const toBase64 = (file) => new Promise((resolve) => resolve(""));

  // Helper: detect whether extracted metadata actually contains meaningful data
  // Uses a recursive check: a value is "meaningful" when it's a non-empty string,
  // a number, a boolean, or an array/object containing at least one meaningful value.
  const hasMeaningfulExtractedMetadata = (meta) => {
    const isMeaningful = (val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === "string") return val.trim() !== "";
      if (typeof val === "number") return true;
      if (typeof val === "boolean") return true;
      if (Array.isArray(val)) {
        return val.some((item) => isMeaningful(item));
      }
      if (typeof val === "object") {
        return Object.keys(val).some((k) => isMeaningful(val[k]));
      }
      return false;
    };

    return isMeaningful(meta);
  };

  useEffect(() => {
    if (extractedMetadata) {
      setDocumentType(extractedMetadata.document_type || "");
      setPartnershipType(extractedMetadata.partnership_type || "");
      setDateSigned(extractedMetadata.date_signed || "");
      setValidityPeriod(extractedMetadata.validity_period || "");
      setDateExpiry(extractedMetadata.date_expiry || "");
      setDatePupSigned(extractedMetadata.date_pup_signed || "");
      setDateUlcoApproved(extractedMetadata.date_ulco_approved || "");
      setDtsNumber(extractedMetadata.dts_number || "");
      //setDtsStatus(extractedMetadata.dts_status || dtsStatus);
      if (
        extractedMetadata.contact_persons &&
        extractedMetadata.contact_persons.length > 0
      ) {
        setContacts(
          extractedMetadata.contact_persons.map((c) => ({
            position: c.contact_person_position || "",
            name: c.contact_person_name || "",
            email: c.contact_person_email || "",
          }))
        );
      }
      if (
        extractedMetadata.point_persons &&
        extractedMetadata.point_persons.length > 0
      ) {
        setPointPersons(
          extractedMetadata.point_persons.map((p) => ({
            position: p.point_person_position || "",
            name: p.point_person_name || "",
            email: p.point_person_email || "",
          }))
        );
      }
      setRemarks(
        extractedMetadata.initial_remarks?.[0]?.remark_text || remarks
      );
      setMessage("extracted");
    } else if (uploadedFile) {
      setMessage("manual");
    } else {
      setMessage("");
    }
  }, [extractedMetadata, uploadedFile, dateUlcoApproved, dtsNumber, remarks]);

  return (
    <TopbarSidebar>
      <div className="moa-manual-container">
        <div className="moa-manual-content">
          <h1 className="moa-manual-form-title">Extracted Entry Form</h1>
          {message === "manual" && (
            <div
              className="moa-manual-form-group moa-manual-full-width"
              style={{
                background: "#fffbe8",
                border: "1px solid #eee",
                borderRadius: "10px",
                padding: "18px",
                marginBottom: "18px",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 600,
                  color: "#b8860b",
                  fontSize: "16px",
                  marginBottom: "8px",
                }}
              >
                <FiAlertCircle style={{ marginRight: "8px" }} />
                No extracted metadata available. Please fill the form manually.
              </span>
            </div>
          )}

          {/* Populated Metadata Message moved inside the form below */}

          <form className="manual-entry-form" onSubmit={handleSubmit}>
            {/* Populated Metadata Message (inside form) */}
            {hasMeaningfulExtractedMetadata(extractedMetadata) && (
              <div
                className="moa-manual-form-group moa-manual-full-width"
                style={{
                  background: "#fafafa",
                  border: "1px solid #eee",
                  borderRadius: "10px",
                  padding: "18px",
                  marginBottom: "18px",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 600,
                    color: "#07ca4fff",
                    fontSize: "16px",
                    marginBottom: "8px",
                  }}
                >
                  <FiCheckCircle style={{ marginRight: "8px" }} />
                  Form populated with extracted metadata!
                </span>
                <span style={{ color: "#444", fontSize: "14px" }}>
                  Please review and edit any fields below as needed.
                </span>
              </div>
            )}
            {/* DISPLAY UPLOADED FILE */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="uploadedFile" className="moa-manual-form-title">
                <FiFileText className="moa-manual-label-icon" /> Uploaded File:
              </label>
              <input
                id="uploadedFile"
                type="text"
                value={uploadedFile ? uploadedFile.name : "No file uploaded"}
                readOnly
              />
            </div>

            {/* VERSION COMMENTS */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="versionComment">
                <FiMessageCircle className="moa-manual-label-icon" /> File
                Comments:
              </label>
              <textarea
                id="versionComment"
                value={versionComment}
                onChange={(e) => setVersionComment(e.target.value)}
              />
            </div>

            {/* Document Type */}
            <div className="moa-manual-form-group">
              <label htmlFor="docType">
                <FiFileText className="moa-manual-label-icon" /> Document Type:*
              </label>
              <Select
                inputId="docType"
                name="docType_select"
                options={docTypeOptions}
                value={
                  documentType
                    ? { value: documentType, label: documentType }
                    : null
                }
                onChange={(opt) => setDocumentType(opt ? opt.value : "")}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Document Type"
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
              <input type="hidden" name="docType" value={documentType} />
            </div>

            {/* Related MOU/MOA */}
            <div className="moa-manual-form-group">
              <label htmlFor="relatedAgreement">
                {documentType === "MOA"
                  ? "Related MOU"
                  : documentType === "MOU"
                  ? "Related MOA"
                  : "Related MOU/MOA"}
                :
              </label>
              <Select
                inputId="relatedAgreement"
                name="relatedAgreement_select"
                options={relatedAgreements}
                value={selectedRelatedAgreement}
                onChange={setSelectedRelatedAgreement}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Related Agreement"
                isDisabled={!documentType}
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
              <input
                type="hidden"
                name="relatedAgreement"
                value={selectedRelatedAgreement?.value || ""}
              />
            </div>

            {/* AGREEMENT STATUS */}
            <div className="moa-manual-form-group">
              <label htmlFor="status">
                <FiCheckCircle className="moa-manual-label-icon" /> Agreement
                Status:*
              </label>
              <Select
                inputId="status"
                name="status_select"
                options={statusOptions}
                value={
                  agreementStatus
                    ? {
                        value: agreementStatus,
                        label: statusOptions.find(
                          (s) => s.value === agreementStatus
                        )?.label,
                      }
                    : null
                }
                onChange={(opt) => setAgreementStatus(opt ? opt.value : "")}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Status"
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
              <input type="hidden" name="status" value={agreementStatus} />
            </div>

            {/* AGREEMENT ENTRY TYPE */}
            <div className="moa-manual-form-group">
              <label htmlFor="entryType">
                <FiTag className="moa-manual-label-icon" /> Agreement Entry
                Type:*
              </label>
              <Select
                inputId="entryType"
                name="entryType_select"
                options={entryTypeOptions}
                value={
                  entryType ? { value: entryType, label: entryType } : null
                }
                onChange={(opt) => setEntryType(opt ? opt.value : "")}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Entry Type"
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
              <input type="hidden" name="entryType" value={entryType} />
            </div>

            {/* RENEWED AGREEMENT */}
            <div className="moa-manual-form-group">
              <label htmlFor="renewedFrom">
                Renewed Agreement from (DTS Number Format):
              </label>
              <input
                id="renewedFrom"
                name="renewedFrom"
                type="text"
                placeholder="DT2025123456"
              />
            </div>

            {/* VALIDITY PERIOD*/}
            <div className="moa-manual-form-group">
              <label htmlFor="validity">
                <FiClock className="moa-manual-label-icon" /> Validity Period:
              </label>
              <Select
                inputId="validity"
                name="validity_select"
                options={validityOptions}
                value={
                  validityPeriod
                    ? { value: validityPeriod, label: validityPeriod }
                    : null
                }
                onChange={(opt) => setValidityPeriod(opt ? opt.value : "")}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Period"
                isClearable
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
              <input type="hidden" name="validity" value={validityPeriod} />
            </div>

            {/* DTS No. */}
            <div className="moa-manual-form-group">
              <label htmlFor="dtsNo">
                <FiHash className="moa-manual-label-icon" /> DTS No.:*
              </label>
              <input
                id="dtsNo"
                name="dtsNo"
                type="text"
                required
                value={dtsNumber}
                onChange={(e) => setDtsNumber(e.target.value)}
                placeholder="DT2025123456"
              />
            </div>

            {/* DTS STATUS */}
            <div className="moa-manual-form-group">
              <label htmlFor="dtsStatus">DTS Status:*</label>
              <select
                id="dtsStatus"
                name="dtsStatus"
                value={dtsStatus}
                onChange={(e) => setDtsStatus(e.target.value)}
                required
              >
                <option value="">Select Status</option>
                <option value="Open - OIA">OPEN</option>
                <option value="Open - Other Office">CLOSE</option>
              </select>
            </div>

            {/* SOURCE UNIT */}
            <div className="moa-manual-form-group">
              <label htmlFor="source">
                <FiHome className="moa-manual-label-icon" /> Source
                (Campus/College Dept):*
              </label>
              <input
                id="source"
                name="source"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
              />
            </div>

            {/* PARTNERSHIP TYPE */}
            <div className="moa-manual-form-group">
              <label htmlFor="partnershipType">Partnership Type:*</label>
              <Select
                options={partnershipTypeOptions}
                name="partnershipType"
                id="partnershipType"
                required
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Partnership Type"
                value={
                  partnershipTypeOptions.find(
                    (o) => o.value === partnershipType
                  ) || null
                }
                onChange={(opt) => setPartnershipType(opt?.value || "")}
                isSearchable={partnershipTypeOptions.length > 5}
              />
            </div>

            {/* Partner Entry Type */}
            <div className="moa-manual-form-group">
              <label htmlFor="partnerEntryType">
                <FiTag className="moa-manual-label-icon" /> Partner Entry Type:*
              </label>
              <select
                id="partnerEntryType"
                value={partnerEntryType}
                onChange={(e) => handlePartnerEntryTypeChange(e.target.value)}
                className="moa-manual-select"
              >
                <option value="New">New</option>
                <option value="Existing">Existing</option>
              </select>
            </div>

            {/* Partner Fields */}
            <div className="moa-manual-form-group">
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

            <div className="moa-manual-form-group">
              <label>
                <FiTag className="moa-manual-label-icon" />
                Entity Type:*
              </label>
              <input
                type="text"
                value={partnerData.entityType}
                onChange={(e) =>
                  setPartnerData({ ...partnerData, entityType: e.target.value })
                }
                required
                readOnly={partnerEntryType === "Existing"}
                placeholder="e.g., University, Company, NGO"
              />
            </div>

            <div className="moa-manual-form-group">
              <label>
                <FiGlobe className="moa-manual-label-icon" />
                Country:*
              </label>
              {partnerEntryType === "New" ? (
                <Select
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  options={countryOptions}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Select Country"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={selectedCountry?.label || ""}
                  readOnly
                />
              )}
            </div>

            <div className="moa-manual-form-group">
              <label>
                <FiGlobe className="moa-manual-label-icon" />
                Region:*
              </label>
              {partnerEntryType === "New" ? (
                <Select
                  value={selectedRegion}
                  onChange={setSelectedRegion}
                  options={regionOptions}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Select Region"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={selectedRegion?.label || ""}
                  readOnly
                />
              )}
            </div>

            <div className="moa-manual-form-group">
              <label>
                <FiMapPin className="moa-manual-label-icon" />
                Address:
              </label>
              <input
                type="text"
                value={partnerData.address}
                onChange={(e) =>
                  setPartnerData({ ...partnerData, address: e.target.value })
                }
                readOnly={partnerEntryType === "Existing"}
              />
            </div>

            <div className="moa-manual-form-group moa-manual-logo-field">
              <label>
                <FiImage className="moa-manual-label-icon" />
                Logo:
              </label>
              <div className="moa-manual-logo-preview-container">
                {partnerData.logo && typeof partnerData.logo === "string" && (
                  <img
                    src={`data:image/png;base64,${partnerData.logo}`}
                    alt="Partner Logo"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      alert("Logo too large. Maximum size is 2MB.");
                      return;
                    }

                    try {
                      const base64 = await toBase64(file);
                      setPartnerData({ ...partnerData, logo: base64 });
                    } catch (err) {
                      console.error("Base64 conversion failed:", err);
                      alert("Failed to process image.");
                    }
                  }}
                  disabled={partnerEntryType === "Existing"}
                />
              </div>
            </div>

            <div className="moa-manual-form-group">
              <label>
                <FiLink className="moa-manual-label-icon" />
                Website:
              </label>
              <input
                type="url"
                value={partnerData.website}
                onChange={(e) =>
                  setPartnerData({ ...partnerData, website: e.target.value })
                }
                readOnly={partnerEntryType === "Existing"}
              />
            </div>

            <div className="moa-manual-form-group moa-manual-full-width">
              <label>
                <FiFileText className="moa-manual-label-icon" />
                Partner Description:
              </label>
              <textarea
                value={partnerData.description}
                onChange={(e) =>
                  setPartnerData({
                    ...partnerData,
                    description: e.target.value,
                  })
                }
                readOnly={partnerEntryType === "Existing"}
              />
            </div>

            {/* SIGNATORIES */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="signatories">
                <FiEdit className="moa-manual-label-icon" /> Signatories:
              </label>
              <input id="signatories" name="signatories" type="text" />
            </div>

            {/* POINT PERSON */}
            <div className="moa-manual-form-section compact-section">
              <label>
                <FiUser className="moa-manual-label-icon moa-point-icon" />{" "}
                Point Persons
              </label>
              {pointPersons.map((pp, index) => (
                <div key={index} className="moa-manual-contact-row">
                  <input
                    type="text"
                    placeholder="Position"
                    value={pp.position}
                    onChange={(e) =>
                      handlePointPersonChange(index, "position", e.target.value)
                    }
                  />
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
                    type="email"
                    placeholder="Email"
                    value={pp.email}
                    onChange={(e) =>
                      handlePointPersonChange(index, "email", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="moa-manual-btn-icon add"
                    onClick={addPointPerson}
                    title="Add Point Person"
                  >
                    <FiPlus />
                  </button>
                  <button
                    type="button"
                    className="moa-manual-btn-icon remove"
                    onClick={() => removePointPerson(index)}
                    disabled={pointPersons.length === 1}
                    title="Remove this Point Person"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>

            {/* CONTACT PERSON */}
            <div className="moa-manual-form-section compact-section">
              <label>
                <FiUser className="moa-manual-label-icon moa-contact-icon" />{" "}
                Contact Person
              </label>
              {contacts.map((contact, index) => (
                <div key={index} className="moa-manual-contact-row">
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
                    className="moa-manual-btn-icon add"
                    onClick={addContact}
                    title="Add Contact Person"
                  >
                    <FiPlus />
                  </button>
                  <button
                    type="button"
                    className="moa-manual-btn-icon remove"
                    onClick={() => removeContact(index)}
                    disabled={contacts.length === 1}
                    title="Remove this Contact Person"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>

            {/* DATE RECEIVED */}
            <div className="moa-manual-form-group">
              <label htmlFor="dateReceived">
                <FiCalendar className="moa-manual-label-icon" /> Date Received:*
              </label>
              <input
                id="dateReceived"
                name="dateReceived"
                type="date"
                required
              />
            </div>

            {/* DATE EXPIRY */}
            <div className="moa-manual-form-group">
              <label htmlFor="dateExpiry">
                <FiClock className="moa-manual-label-icon" /> Date Expiry:
              </label>
              <input
                id="dateExpiry"
                name="dateExpiry"
                type="date"
                value={dateExpiry}
                onChange={(e) => setDateExpiry(e.target.value)}
              />
            </div>

            {/* DATE PUP SIGNED */}
            <div className="moa-manual-form-group">
              <label htmlFor="datePupSigned">
                <FiEdit className="moa-manual-label-icon" /> Date PUP Signed:
              </label>
              <input
                id="datePupSigned"
                name="datePupSigned"
                type="date"
                value={datePupSigned}
                onChange={(e) => setDatePupSigned(e.target.value)}
              />
            </div>

            {/* DATE SIGNED */}
            <div className="moa-manual-form-group">
              <label htmlFor="dateSigned">
                <FiCalendar className="moa-manual-label-icon" /> Date/Year of
                Signing:
              </label>
              <input
                id="dateSigned"
                name="dateSigned"
                type="date"
                value={dateSigned}
                onChange={(e) => setDateSigned(e.target.value)}
              />
            </div>

            {/* DATE ENDORSED */}
            <div className="moa-manual-form-group">
              <label htmlFor="dateEndorsed">
                <FiCalendar className="moa-manual-label-icon" /> Date Endorsed
                to ULCO:
              </label>
              <input id="dateEndorsed" name="dateEndorsed" type="date" />
            </div>

            {/* DATE ULCO APPROVED */}
            <div className="moa-manual-form-group">
              <label htmlFor="dateUlcoApproved">
                <FiCheck className="moa-manual-label-icon" /> Date ULCO
                Approved:
              </label>
              <input
                id="dateUlcoApproved"
                name="dateUlcoApproved"
                type="date"
                value={dateUlcoApproved}
                onChange={(e) => setDateUlcoApproved(e.target.value)}
              />
            </div>

            {/* HARDCOPY LOCATOR */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="locator">
                <FiMapPin className="moa-manual-label-icon" /> Hardcopy Locator:
              </label>
              <input id="locator" name="locator" type="text" />
            </div>

            {/* EVENT INFO */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="eventInfo">
                <FiAward className="moa-manual-label-icon" /> Event Info:
              </label>
              <textarea id="eventInfo" name="eventInfo" />
            </div>

            {/* REMARKS */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="remarks">
                <FiMessageCircle className="moa-manual-label-icon" /> Remarks:
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="moa-manual-form-actions">
              <button
                type="submit"
                className="moa-manual-publish-button"
                disabled={loading}
              >
                {loading ? "Creating..." : "Publish"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </TopbarSidebar>
  );
};

export default ExtractedEntryMOA;
