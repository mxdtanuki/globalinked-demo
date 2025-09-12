import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "../components/layout.css";
import "./email.css";
import { emailService } from "../services/emailService";
import { agreementService } from '../services/agreementService';

const Email = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [currentTemplate, setCurrentTemplate] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState(null);

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  //Fetch templates and agreements on mount
  useEffect(() => {
    fetchTemplates();
    fetchAgreements();
  }, []);

  useEffect(() => {
    const savedDrafts = localStorage.getItem('emailDrafts');
    if (savedDrafts) {
      try {
        const parsedDrafts = JSON.parse(savedDrafts);
        setDrafts(parsedDrafts);
        console.log('Loaded drafts from localStorage:', parsedDrafts);
      } catch (error) {
        console.error('Failed to load drafts:', error);
      }
    }
  }, []);

  //Fetch templates from backend
  const fetchTemplates = async () => {
    try {
      const data = await emailService.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError('Failed to fetch templates: ' + err.message);
    }
  };

  //Fetch agreements for email context
  const fetchAgreements = async () => {
    try {
      const data = await agreementService.getAgreements();
      setAgreements(data);
    } catch (err) {
      setError('Failed to fetch agreements: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const isNowDesktop = window.innerWidth >= 768;
      setIsDesktop(isNowDesktop);
      if (isNowDesktop) setMobileShow(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Open template
  const handleOpenTemplate = (template) => {
    setCurrentTemplate(template);
    setSelectedEmail(template);
    setEditorContent(template.body_html); 
    setSubject(template.subject || `Status Update: ${template.template_name}`); // Use template subject
    setTo("");
    setEditingDraftId(null);
  };

  // Open draft
  const handleOpenDraft = (draft) => {
    setSelectedEmail({ type: "draft", data: draft });
    setEditorContent(draft.content);
    setTo(draft.to || "");
    setSubject(draft.subject || "");
    setEditingDraftId(draft.id);
    setCurrentTemplate(null);
  };

  const handleDeleteDraft = (draftId) => {
    if (window.confirm("Are you sure you want to delete this draft?")) { // Changed from confirm to window.confirm
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      setDrafts(updatedDrafts);
      localStorage.setItem('emailDrafts', JSON.stringify(updatedDrafts));
      alert("Draft deleted!");
    }
  };

  const handleSend = async () => {
    if (!to || !subject || !editorContent.trim()) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const emailData = {
        recipient_email: to,
        custom_subject: subject,        
        custom_body: editorContent,
        template_id: currentTemplate?.template_id || null,
        agreement_id: selectedAgreement?.agreement_id || null
      };

      await emailService.sendEmail(emailData);
      alert("Email sent successfully!");
      
      setSelectedEmail(null);
      setEditorContent("");
      setSubject("");
      setTo("");
      setCurrentTemplate(null);
      setSelectedAgreement(null);
      
    } catch (error) {
      alert("Failed to send email: " + error.message);
    }
  };

  const handleSaveDraft = () => {
    if (!to || !subject || !editorContent.trim()) {
      alert("Please fill in required fields to save draft");
      return;
    }

    const draftData = {
      id: editingDraftId || Date.now(),
      to,
      subject,
      content: editorContent,
      date: new Date().toLocaleDateString(),
      partnerName: selectedAgreement?.partner_name || selectedAgreement?.name || "Unknown Partner", // Fixed this line
      status: currentTemplate?.template_name || "Custom Email"
    };

    let updatedDrafts;
    if (editingDraftId) {
      updatedDrafts = drafts.map(d => d.id === editingDraftId ? draftData : d);
      setDrafts(updatedDrafts);
    } else {
      updatedDrafts = [...drafts, draftData];
      setDrafts(updatedDrafts);
    }

    // Save to localStorage
    localStorage.setItem('emailDrafts', JSON.stringify(updatedDrafts));
    console.log('Saved draft to localStorage:', draftData);

    alert(editingDraftId ? "Draft updated!" : "Draft saved!");
    setSelectedEmail(null);
    setEditorContent("");
    setSubject("");
    setTo("");
    setCurrentTemplate(null);
    setEditingDraftId(null);
  };

  // Function to preview template with agreement data
  const previewTemplateWithAgreement = (template, agreement) => {
    if (!agreement) return template.body_html;
    
    let preview = template.body_html;
    preview = preview.replace(/\{\{PARTNER_NAME\}\}/g, agreement.partner_name || '');
    preview = preview.replace(/\{\{DOCUMENT_TYPE\}\}/g, agreement.document_type || '');
    preview = preview.replace(/\{\{DTS_NUMBER\}\}/g, agreement.dts_number || '');
    preview = preview.replace(/\{\{AGREEMENT_STATUS\}\}/g, agreement.agreement_status || '');
    preview = preview.replace(/\{\{EXPIRY_DATE\}\}/g, agreement.date_expiry || '');
    
    return preview;
  };

  // Loading state
  if (loading) return <div className="dashboard-container">Loading email data...</div>;

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />

      {mobileShow && (
        <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />
      )}

      <div className="content-body">
        <Sidebar
          collapsed={collapsed}
          toggleCollapse={toggleCollapse}
          mobileShow={mobileShow}
        />

        <div
          className="main-content"
          onClick={() => mobileShow && setMobileShow(false)}
        >
          {isDesktop && (
            <div
              className={`floating-toggle-btn ${collapsed ? "collapsed" : ""}`}
              onClick={toggleCollapse}
            >
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </div>
          )}

          <div className="email-dashboard">
            <h2 className="email-title">
              Email Dashboard
            </h2>

            {/* Error display can be changed */}
            {error && (
              <div style={{ color: 'red', padding: '10px', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            {/* Drafts Section */}
            <div className="email-section">
              <h2>Drafts</h2>
              <table className="email-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>PARTNER NAME</th>
                    <th>STATUS CHANGE TO</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center" }}>
                        No Drafts Available
                      </td>
                    </tr>
                  ) : (
                    drafts.map((draft) => (
                      <tr key={draft.id}>
                        <td>{draft.date}</td>
                        <td>{draft.partnerName}</td>
                        <td>{draft.status}</td>
                        <td>
                          <button
                            className="view-btn"
                            onClick={() => handleOpenDraft(draft)}
                          >
                            View Draft
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteDraft(draft.id)}
                            style={{ marginLeft: '5px', backgroundColor: '#800000', color: 'white' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Templates Section */}
            <div className="email-section">
              <h2>Templates</h2>
              <table className="email-table">
                <thead>
                  <tr>
                    <th>NO.</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
                        No Templates Available
                      </td>
                    </tr>
                  ) : (
                    templates.map((tpl, idx) => (
                      <tr key={tpl.template_id}>
                        <td>{idx + 1}</td>
                        <td>{tpl.template_name}</td>
                        <td>
                          <button
                            className="view-btn"
                            onClick={() => handleOpenTemplate(tpl)}
                          >
                            View Template
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* kunwari Gmail */}
          {selectedEmail && (
            <div
              className="modal-backdrop"
              onClick={() => setSelectedEmail(null)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <span>{editingDraftId ? "Edit Draft" : "New Message"}</span>
                  <button
                    className="close-btn"
                    onClick={() => setSelectedEmail(null)}
                  >
                    ✖
                  </button>
                </div>

                <div className="modal-body">
                  {/* Agreement Selection */}
                  {currentTemplate && (
                    <div className="field">
                      <label>Related Agreement (optional):</label>
                      <select
                        value={selectedAgreement?.agreement_id || ''}
                        onChange={(e) => {
                          const agreement = agreements.find(a => a.agreement_id === parseInt(e.target.value));
                          setSelectedAgreement(agreement);
                          if (agreement && currentTemplate) {
                            setEditorContent(previewTemplateWithAgreement(currentTemplate, agreement));
                          }
                        }}
                      >
                        <option value="">Select Agreement (for auto-fill)</option>
                        {agreements.map(agreement => (
                          <option key={agreement.agreement_id} value={agreement.agreement_id}>
                            {agreement.dts_number} - {agreement.partner_name || agreement.name || 'Unknown Partner'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* To */}
                  <div className="field">
                    <label>To:</label>
                    <input
                      type="email"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="Enter recipient email"
                    />
                  </div>

                  {/* Subject */}
                  <div className="field">
                    <label>Subject:</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter subject"
                    />
                  </div>

                  {/* Body */}
                  <ReactQuill
                    value={editorContent}
                    onChange={setEditorContent}
                    theme="snow"
                    style={{ height: "250px", marginTop: "10px" }}
                  />
                </div>

                <div className="modal-footer">
                  <button className="send-btn" onClick={handleSend}>
                    Send
                  </button>
                  <button className="save-btn" onClick={handleSaveDraft}>
                    {editingDraftId ? "Update Draft" : "Save as Draft"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Email;
