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


  // Form state
  const [formData, setFormData] = useState({
    source: "",
    ulcoApprovalDate: "",
    dtsNo: "",
    dtsStatus: "",
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
    setUploadedFile(file);  // Store the file
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

    try {
      // Call NLP extraction with progress
      const result = await agreementService.extractAgreementMetadataWithProgress(uploadedFile, (percent) => {
        setExtractionProgress(percent);
      });
      const extractedMetadata = result.metadata;

      setExtractionProgress(100);

      
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
      alert("Failed to extract metadata from the document. Please proceed with manual entry.");
      
      // Navigate without extracted metadata
      navigate('/upload/extractedEntryMOA', { 
        state: { 
          uploadedFile,
          formData,
          pointPersons: pointPersonsData,
          extractedMetadata: null
        } 
      });
    } finally {
      setLoading(false);
      setExtractionProgress(0);
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

          {/* Progress Bar */}
          {loading && (
            <div className="extraction-progress">
              <p>Extracting metadata from document...</p>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${extractionProgress}%` }}
                ></div>
              </div>
              <p className="progress-text">{extractionProgress}%</p>
            </div>
          )}

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Extracting..." : "Submit"}
          </button>
        </div>
      </div>
    </TopbarSidebar>
  );
};

export default MOAUpload;