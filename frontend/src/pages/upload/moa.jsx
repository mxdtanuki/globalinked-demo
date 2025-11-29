import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopbarSidebar from '../../components/topbarSidebar';
import { agreementService } from '../../services/agreementService';
import './moa.css';

const MOAUpload = () => {
  const navigate = useNavigate();

  const [pointPersons, setPointPersons] = useState([{ position: "", name: "", email: "" }]);
  const [uploadedFile, setUploadedFile] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStatus, setExtractionStatus] = useState("");


  // Form state
  const [formData, setFormData] = useState({
    source: "",
    ulcoApprovalDate: "",
    dtsNo: "",
    pupSignedDate: "",
    remarks: ""
  });

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }; 

  // Point person functions
  const addPointPerson = () => setPointPersons([...pointPersons, { position: "", name: "", email: "" }]);
  const handlePointPersonChange = (i, field, val) => {
    const updated = [...pointPersons];
    updated[i][field] = val;
    setPointPersons(updated);
  };
  const removePointPerson = (i) => setPointPersons(pointPersons.filter((_, idx) => idx !== i));

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
    setUploadedFile(file);
    document.getElementById("fileName").textContent = file ? file.name : "No file chosen";
  };

  // Handle submit: Extract metadata then navigate
  const handleSubmit = async () => {
    if (!uploadedFile) {
      alert("Please select a file first");
      return;
    }

    setLoading(true);
    setExtractionProgress(0);
    setExtractionStatus("Initializing extraction...");

    try {
      // Call NLP extraction with progress
      setExtractionStatus("Extracting text from document...");
      const result = await agreementService.extractAgreementMetadataWithProgress(uploadedFile, (percent) => {
        setExtractionProgress(percent);
        if (percent < 30) {
          setExtractionStatus("Reading document...");
        } else if (percent < 60) {
          setExtractionStatus("Analyzing with Legal-BERT...");
        } else if (percent < 90) {
          setExtractionStatus("Extracting metadata fields...");
        } else {
          setExtractionStatus("Finalizing extraction...");
        }
      });
      const extractedMetadata = result.metadata;
      setExtractionProgress(100);
      setExtractionStatus("Extraction complete!");


      setTimeout(() => {
        // Navigate with extracted metadata
        navigate('/upload/extractedEntryMOA', { 
          state: { 
            uploadedFile,
            formData,
            pointPersons: pointPersonsData,
            extractedMetadata
          } 
        });
      }, 500);

    } catch (error) {
      console.error("Extraction failed:", error);
      setExtractionStatus("Extraction failed");
      
      // Show error message but still allow manual entry
      const proceed = window.confirm(
        "Failed to extract metadata from the document. Would you like to proceed with manual entry?"
      );
      
      if (proceed) {
        navigate('/upload/extractedEntryMOA', { 
          state: { 
            uploadedFile,
            formData,
            pointPersons: pointPersonsData,
            extractedMetadata: null
          } 
        });
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        setExtractionProgress(0);
        setExtractionStatus("");
      }, 1000);
    }
  };

  return (
    <TopbarSidebar>
      <div className="mou-upload-container">
        <form className="initial-form">
          <h3 className="form-title">Initial Form</h3>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="source">Source (Campus/College Dept):*</label>
              <input 
                id="source" 
                name="source" 
                type="text" 
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label>Date (ULCO Approval)</label>
              <input 
                type="date" 
                value={formData.ulcoApprovalDate}
                onChange={(e) => handleInputChange('ulcoApprovalDate', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>DTS No.</label>
              <input 
                type="text" 
                value={formData.dtsNo}
                onChange={(e) => handleInputChange('dtsNo', e.target.value)}
                required 
                placeholder='DT2025123456' 
              />
            </div>

            <div className="form-group">
              <label>Date (PUP Official Signed)</label>
              <input 
                type="date" 
                value={formData.pupSignedDate}
                onChange={(e) => handleInputChange('pupSignedDate', e.target.value)}
              />
            </div>

            {/* POINT PERSON */}
            <div className="form-section">
              <label>Point Persons</label>
              {pointPersons.map((pp, index) => (
                <div key={index} className="contact-row">
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

            <div className="form-group full-width">
              <label>Remarks:</label>
              <textarea 
                rows="3" 
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
              />
            </div>
          </div>

          <p
            className="manual-entry-note"
            onClick={() => navigate('/upload/manualEntryMOA')}
          >
            Manual Entry
          </p>
        </form>

        {/* Upload Box */}
        <div className="upload-box">
          <h3>Upload File</h3>
          <p>Select file</p>

          <div className="file-drop-area">
            <p>Select a file</p>
            <small>DOCX, PDF or Scanned PDF, file size no more than 20MB</small>

            <label htmlFor="mouFile" className="select-file-btn">
              Choose File
            </label>
            <input type="file" id="mouFile" hidden onChange={handleFileChange} />
            <p id="fileName" className="file-name">No file chosen</p>
          </div>

          {/* Enhanced Progress Bar with Status */}
          {loading && (
            <div className="extraction-progress">
              <p className="extraction-status">{extractionStatus}</p>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${extractionProgress}%` }}
                >
                  <span className="progress-bar-text">{extractionProgress}%</span>
                </div>
              </div>
              <div className="extraction-steps">
                <div className={`step ${extractionProgress >= 25 ? 'complete' : 'active'}`}>
                  📄 Reading Document
                </div>
                <div className={`step ${extractionProgress >= 50 ? 'complete' : extractionProgress >= 25 ? 'active' : ''}`}>
                  🤖 AI Analysis
                </div>
                <div className={`step ${extractionProgress >= 75 ? 'complete' : extractionProgress >= 50 ? 'active' : ''}`}>
                  📋 Extracting Fields
                </div>
                <div className={`step ${extractionProgress === 100 ? 'complete' : extractionProgress >= 75 ? 'active' : ''}`}>
                  ✅ Complete
                </div>
              </div>
            </div>
          )}

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading || !uploadedFile}
          >
            {loading ? "Extracting..." : "Submit"}
          </button>
        </div>
      </div>
    </TopbarSidebar>
  );
};

export default MOAUpload;