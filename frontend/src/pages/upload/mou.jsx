import React from "react";
import { useNavigate } from "react-router-dom";
import TopbarSidebar from "../../components/topbarSidebar";
import {
  FiHome,
  FiCheck,
  FiUser,
  FiEdit,
  FiHash,
  FiMessageCircle,
} from "react-icons/fi";
import "./mou.css";

const MOUUpload = () => {
  const navigate = useNavigate();

  // handle file change
  const handleFileChange = (e) => {
    const fileName = e.target.files[0]?.name || "No file chosen";
    document.getElementById("mouFileName").textContent = fileName;
  };

  return (
    <TopbarSidebar>
      <div className="mou-upload-wrapper">
        {/* Initial Form */}
        <form className="mou-initial-form">
          <h3 className="mou-form-title">MOU Initial Form</h3>

          <div className="mou-form-grid">
            <div className="mou-form-group">
              <label>
                <FiHome className="mou-label-icon" />
                Source (Campus/College Dept)
              </label>
              <select defaultValue="" required>
                <option value="" disabled>
                  Select source
                </option>
                <option value="CTHTM">CTHTM</option>
                <option value="COC">COC</option>
                <option value="COE">COE</option>
              </select>
            </div>

            <div className="mou-form-group">
              <label>
                <FiCheck className="mou-label-icon" />
                Date (ULCO Approval)
              </label>
              <input type="date" />
            </div>

            <div className="mou-form-group">
              <label>
                <FiUser className="mou-label-icon" />
                Point Person Position
              </label>
              <input type="text" />
            </div>

            <div className="mou-form-group">
              <label>
                <FiEdit className="mou-label-icon" />
                Date (PUP Official Signed)
              </label>
              <input type="date" />
            </div>

            <div className="mou-form-group">
              <label>
                <FiHash className="mou-label-icon" />
                DTS No.
              </label>
              <input type="text" className="dts-number" required />
            </div>

            <div className="mou-form-group">
              <label>
                <FiHash className="mou-label-icon" />
                DTS Status
              </label>
              <input type="text" required />
            </div>

            <div className="mou-form-group mou-full-width">
              <label>
                <FiMessageCircle className="mou-label-icon" />
                Remarks:
              </label>
              <textarea rows="3" />
            </div>
          </div>

          <p
            className="mou-manual-entry-note"
            onClick={() => navigate("/upload/manualEntry")}
          >
            Manual Entry
          </p>
        </form>

        {/* Upload Box */}
        <div className="mou-upload-box">
          <h3>Upload File</h3>
          <p>Select MOU file</p>

          <div className="mou-file-drop-area">
            <p>Select a file</p>
            <small>DOCX, PDF or Scanned PDF, file size no more than 20MB</small>

            <label htmlFor="mouFileInput" className="mou-select-file-btn">
              Choose File
            </label>
            <input
              type="file"
              id="mouFileInput"
              hidden
              onChange={handleFileChange}
            />
            <p id="mouFileName" className="mou-file-name">
              No file chosen
            </p>
          </div>

          <button
            className="mou-submit-btn"
            onClick={() => navigate("/upload/extractedEntry")}
          >
            Submit
          </button>
        </div>
      </div>
    </TopbarSidebar>
  );
};

export default MOUUpload;
