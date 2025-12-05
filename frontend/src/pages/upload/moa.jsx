import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopbarSidebar from "../../components/topbarSidebar";
import { agreementService } from "../../services/agreementService";
import {
  FiHome,
  FiHash,
  FiEdit,
  FiUser,
  FiMessageCircle,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiUpload,
  FiFileText,
  FiInfo,
  FiAlertCircle,
  FiFile,
  FiSend,
  FiX,
} from "react-icons/fi";
import "./moa.css";

// Configurable file name truncate limit. Can be overridden with
// `REACT_APP_FILENAME_TRUNCATE_LIMIT` in environment.
const FILE_NAME_DISPLAY_LIMIT =
  parseInt(process.env.REACT_APP_FILENAME_TRUNCATE_LIMIT, 10) || 40;

function truncateFileName(name, limit) {
  if (!name) return "";
  if (name.length <= limit) return name;

  const lastDot = name.lastIndexOf(".");
  const ext = lastDot !== -1 ? name.slice(lastDot) : "";
  const nameWithoutExt = lastDot !== -1 ? name.slice(0, lastDot) : name;

  // Reserve space for ellipsis and extension
  const reserved = ext.length + 3; // '...'
  const keep = Math.max(1, limit - reserved);

  const start = nameWithoutExt.slice(0, keep);
  return `${start}...${ext}`;
}

const MOAUpload = () => {
  const navigate = useNavigate();

  const [pointPersons, setPointPersons] = useState([
    { position: "", name: "", email: "" },
  ]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    source: "",
    ulcoApprovalDate: "",
    dtsNo: "",
    dtsStatus: "",
    pupSignedDate: "",
    remarks: "",
  });

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Point person functions
  const addPointPerson = () =>
    setPointPersons([...pointPersons, { position: "", name: "", email: "" }]);
  const handlePointPersonChange = (i, field, val) => {
    const updated = [...pointPersons];
    updated[i][field] = val;
    setPointPersons(updated);
  };
  const removePointPerson = (i) =>
    setPointPersons(pointPersons.filter((_, idx) => idx !== i));

  // Point persons array from state
  const pointPersonsData = pointPersons
    .filter((pp) => pp.name)
    .map((pp) => ({
      point_person_name: pp.name,
      point_person_position: pp.position || "",
      point_person_email: pp.email || "",
    }));

  // handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  // clear uploaded file
  const handleClearFile = () => {
    setUploadedFile(null);
    // Also clear the input value so user can re-upload the same file if needed
    const input = document.getElementById("moaFile");
    if (input) input.value = "";
  };

  // Handle submit: Extract metadata then navigate
  const handleSubmit = async () => {
    if (!uploadedFile) {
      alert("Please select a file first");
      return;
    }

    setLoading(true);
    setExtractionProgress(0);

    try {
      // Call NLP extraction with progress
      const result =
        await agreementService.extractAgreementMetadataWithProgress(
          uploadedFile,
          (percent) => {
            setExtractionProgress(percent);
          }
        );
        const extractedMetadata = result.metadata;

      console.log("=== EXTRACTION RESULT ===");
      console.log("Full result:", result);
      console.log("Metadata:", result?.metadata);
      console.log("=========================");

      setExtractionProgress(100);

      setTimeout(() => {
        // Navigate with extracted metadata
        // Pass file info separately since File objects don't serialize well
        navigate("/upload/extractedEntryMOA", {
          state: {
            uploadedFile: uploadedFile,
            uploadedFileName: uploadedFile.name,
            uploadedFileSize: uploadedFile.size,
            formData,
            pointPersons: pointPersonsData,
            extractedMetadata,
          },
        });
      }, 500);
    } catch (error) {
      console.error("Extraction failed:", error);
      alert(
        "Failed to extract metadata from the document. Please proceed with manual entry."
      );

      // Navigate without extracted metadata
      navigate("/upload/extractedEntryMOA", {
        state: {
          uploadedFile: uploadedFile,
          uploadedFileName: uploadedFile.name,
          uploadedFileSize: uploadedFile.size,
          formData,
          pointPersons: pointPersonsData,
          extractedMetadata: null,
        },
      });
    } finally {
      setLoading(false);
      setExtractionProgress(0);
    }
  };

  return (
    <TopbarSidebar>
      <div className="moa-upload-wrapper">
        <form className="moa-initial-form">
          <h3 className="moa-form-title">Initial Form</h3>

          <div className="moa-form-grid">
            <div className="moa-form-group">
              <label htmlFor="moaSource">
                <FiHome className="moa-label-icon" />
                Source (Campus/College Dept):*
              </label>
              <input
                id="moaSource"
                name="source"
                type="text"
                value={formData.source}
                onChange={(e) => handleInputChange("source", e.target.value)}
                required
              />
            </div>

            <div className="moa-form-group">
              <label>
                <FiCheck className="moa-label-icon" />
                Date (ULCO Approval)
              </label>
              <input
                type="date"
                value={formData.ulcoApprovalDate}
                onChange={(e) =>
                  handleInputChange("ulcoApprovalDate", e.target.value)
                }
              />
            </div>

            <div className="moa-form-group">
              <label>
                <FiHash className="moa-label-icon" />
                DTS No.
              </label>
              <input
                type="text"
                value={formData.dtsNo}
                onChange={(e) => handleInputChange("dtsNo", e.target.value)}
                required
                placeholder="DT2025123456"
              />
            </div>
            {/*
            <div className="moa-form-group">
              <label htmlFor="dtsStatus">DTS Status:*</label>
              <select 
                id="dtsStatus" 
                name="dtsStatus" 
                value={formData.dtsStatus}
                onChange={(e) => handleInputChange('dtsStatus', e.target.value)}
                required
              >
                <option value="">Select Status</option>
              <option value="Open - OIA">OPEN</option>
              <option value="Open - Other Office">CLOSE</option>
              </select>
            </div> */}

            <div className="moa-form-group">
              <label>
                <FiEdit className="moa-label-icon" />
                Date (PUP Official Signed)
              </label>
              <input
                type="date"
                value={formData.pupSignedDate}
                onChange={(e) =>
                  handleInputChange("pupSignedDate", e.target.value)
                }
              />
            </div>

            {/* POINT PERSON */}
            <div className="moa-form-section">
              <label>
                <FiUser className="moa-label-icon" />
                Point Persons
              </label>
              {pointPersons.map((pp, index) => (
                <div key={index} className="moa-contact-row">
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
                    className="moa-btn-icon moa-add-btn"
                    onClick={addPointPerson}
                    title="Add Point Person"
                  >
                    <FiPlus />
                  </button>
                  <button
                    type="button"
                    className="moa-btn-icon moa-remove-btn"
                    onClick={() => removePointPerson(index)}
                    title="Remove Point Person"
                    disabled={pointPersons.length === 1}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>

            <div className="moa-form-group moa-full-width">
              <label>
                <FiMessageCircle className="moa-label-icon" />
                Remarks:
              </label>
              <textarea
                rows="3"
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
              />
            </div>
          </div>

          <p
            className="moa-manual-entry-note"
            onClick={() => navigate("/upload/manualEntryMOA")}
          >
            Manual Entry
          </p>
        </form>

        {/* Upload Box */}
        <div className="moa-upload-card">
          <div className="moa-upload-header">
            <h3 className="moa-upload-title">Upload File</h3>
            <p className="moa-upload-subtitle">Select a file to upload</p>
          </div>

          <div className="moa-file-upload-area">
            <div className="moa-file-upload-content">
              <FiFileText className="moa-file-main-icon" />
              <div className="moa-file-upload-text">
                <p>DOCX, PDF or Scanned PDF</p>
                <span>File size no more than 20MB</span>
              </div>
              <label
                htmlFor="moaFile"
                className="moa-file-browse-btn"
                style={{ display: uploadedFile ? "none" : "inline-flex" }}
              >
                <FiUpload className="btn-icon" />
                Select File
              </label>
              <input
                type="file"
                id="moaFile"
                hidden
                onChange={handleFileChange}
                accept=".docx,.pdf"
                multiple={false}
              />
            </div>

            {uploadedFile && (
              <div className="moa-file-selected">
                <FiFile className="moa-file-success-icon" />
                <div className="moa-file-details">
                  <span
                    className="moa-file-name"
                    title={uploadedFile.name}
                    aria-label={uploadedFile.name}
                  >
                    {truncateFileName(
                      uploadedFile.name,
                      FILE_NAME_DISPLAY_LIMIT
                    )}
                  </span>
                  <span className="moa-file-size">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <button
                  type="button"
                  className="moa-file-clear-btn"
                  onClick={handleClearFile}
                  title="Remove file"
                  aria-label="Remove file"
                  disabled={loading}
                >
                  <FiX />
                </button>
              </div>
            )}
          </div>

          {loading && (
            <div className="moa-extraction-progress">
              <div className="moa-progress-header">
                <span>Extracting metadata...</span>
                <span className="moa-progress-percent">
                  {extractionProgress}%
                </span>
              </div>
              <div className="moa-progress-bar-container">
                <div
                  className="moa-progress-bar-fill"
                  style={{ width: `${extractionProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <button
            className={`moa-submit-btn${
              !uploadedFile ? " moa-submit-disabled" : ""
            }`}
            onClick={handleSubmit}
            disabled={loading || !uploadedFile}
          >
            {loading ? (
              <>
                <div className="moa-loading-spinner"></div>
                Processing...
              </>
            ) : (
              <>Submit Document</>
            )}
          </button>
        </div>
      </div>
    </TopbarSidebar>
  );
};

export default MOAUpload;
