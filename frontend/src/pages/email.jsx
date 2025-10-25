import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "../components/layout.css";
import "./email.css";
import { emailService } from "../services/emailService";
import { agreementService } from '../services/agreementService';

const STATUS_CODES = [
  'InitialReview',
  'Endorse',
  'Revert',
  'Consultation',
  'Replication',
  'SignituresPUP',
  'SignedPUP',
  'SignituresPartner',
  'SignedPartner',
  'Complete',
  'Notary',
  'FFUPCopy',
];

// Synonyms/keywords to match various label formats to our canonical codes
const STATUS_KEYWORDS = {
  InitialReview: ['initialreview', 'initial review', 'initial'],
  Endorse: ['endorse', 'endorsed', 'ulco', 'reviewandapproval', 'review approval', 'for review', 'for approval', 'for review and approval'],
  Revert: ['revert', 'returned', 'return with comments', 'with comments'],
  Consultation: ['consultation', 'for consultation'],
  Replication: ['replication', '8sets', 'copies', '8 sets', 'copy replication'],
  SignituresPUP: ['signiturespup', 'signaturespup', 'pupofficials', 'pup officials', 'pup'],
  SignedPUP: ['signedpup', 'signed by pup', 'signed-by-pup'],
  SignituresPartner: ['signiturespartner', 'signaturespartner', 'partner signatures', 'partner'],
  SignedPartner: ['signedpartner', 'signed by partner', 'signed-by-partner'],
  Complete: ['completelysigned', 'complete', 'completely signed'],
  Notary: ['notary', 'for notary'],
  FFUPCopy: ['ffupcopy', 'ffup', 'copy from college', 'from college', 'from campus', 'college campus', 'ffup copy'],
};

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const mapToCanonicalStatus = (labelOrCode) => {
  const n = norm(labelOrCode);

  // 1) Direct code match (ignores case/punct)
  const direct = STATUS_CODES.find(code => norm(code) === n);
  if (direct) return direct;

  // 2) Match by defined keywords/synonyms
  for (const code of STATUS_CODES) {
    const keys = STATUS_KEYWORDS[code] || [];
    if (keys.some(k => n.includes(k))) return code;
  }

  // 3) Fallback: contains the raw code characters
  const fuzzy = STATUS_CODES.find(code => n.includes(norm(code)));
  if (fuzzy) return fuzzy;

  // No match
  return '';
};

const Email = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [filteredAgreements, setFilteredAgreements] = useState([]);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [currentTemplate, setCurrentTemplate] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState(null);

  // State for person selection
  const [selectedPersonType, setSelectedPersonType] = useState(''); // 'contact' or 'point'
  const [selectedPersons, setSelectedPersons] = useState([]);

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    fetchTemplates();
    fetchAgreements();
  }, []);

  // Recompute filtered agreements to match template's status
  useEffect(() => {
    if (!agreements?.length) {
      setFilteredAgreements([]);
      return;
    }

    if (!currentTemplate) {
      setFilteredAgreements(agreements);
      return;
    }

    const tplCode = mapToCanonicalStatus(currentTemplate.template_name || currentTemplate.status || '');
    if (!tplCode) {
      // If template name can't be mapped, show none to avoid wrong matches
      setFilteredAgreements([]);
      return;
    }

    const next = agreements.filter(a => {
      // Prefer agreement.agreement_status, fallback to status or label
      const agreementCode = mapToCanonicalStatus(a.agreement_status || a.status || a.status_label);
      return agreementCode === tplCode;
    });

    setFilteredAgreements(next);

    // If the currently selected agreement no longer matches, clear it and recipient selections
    if (selectedAgreement && !next.some(x => String(x.agreement_id) === String(selectedAgreement.agreement_id))) {
      setSelectedAgreement(null);
      setSelectedPersonType('');
      setSelectedPersons([]);
      setTo('');
    }
  }, [agreements, currentTemplate]);  

  const fetchTemplates = async () => {
    try {
      const data = await emailService.getTemplates();
      setTemplates(data || []);
    } catch (err) {
      setError('Failed to fetch templates: ' + err.message);
    }
  };

  const fetchAgreements = async () => {
    try {
      const data = await agreementService.getAgreements();
      setAgreements(Array.isArray(data) ? data : (data?.items || []));
    } catch (err) {
      setError('Failed to fetch agreements: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open template
  const handleOpenTemplate = (template) => {
    setCurrentTemplate(template);
    setSelectedEmail(template);
    setEditorContent(template.body_html);
    setSubject(template.subject || `Status Update: ${template.template_name}`);
    setTo("");
    setEditingDraftId(null);
    // Reset person selection
    setSelectedAgreement(null);
    setSelectedPersonType('');
    setSelectedPersons([]);
  };

  // Open draft
  const handleOpenDraft = (draft) => {
    setSelectedEmail({ type: "draft", data: draft });
    setEditorContent(draft.content);
    setTo(draft.to || "");
    setSubject(draft.subject || "");
    setEditingDraftId(draft.id);
    setCurrentTemplate(null);
    // Reset person selection
    setSelectedAgreement(null);
    setSelectedPersonType('');
    setSelectedPersons([]);
  };

  const handleDeleteDraft = (draftId) => {
    if (window.confirm("Are you sure you want to delete this draft?")) {
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      setDrafts(updatedDrafts);
      localStorage.setItem('emailDrafts', JSON.stringify(updatedDrafts));
      alert("Draft deleted!");
    }
  };

  // Handle agreement selection
  const handleAgreementChange = (agreementId) => {
    const byNum = agreements.find(a => Number(a.agreement_id) === Number(agreementId));
    const byStr = byNum || agreements.find(a => String(a.agreement_id) === String(agreementId));
    const agreement = byStr || null;

    setSelectedAgreement(agreement);
    // Reset person selection when agreement changes
    setSelectedPersonType('');
    setSelectedPersons([]);
    setTo('');

    if (agreement && currentTemplate) {
      setEditorContent(previewTemplateWithAgreement(currentTemplate, agreement));
    }
  };

  // Handle person type selection (contact or point person)
  const handlePersonTypeChange = (personType) => {
    setSelectedPersonType(personType);
    setSelectedPersons([]);
    setTo('');
  };

  // Handle person selection (can select multiple addresses)
  const handlePersonSelection = (personEmail, isSelected) => {
    let updatedPersons;
    if (isSelected) {
      updatedPersons = [...selectedPersons, personEmail];
    } else {
      updatedPersons = selectedPersons.filter(email => email !== personEmail);
    }

    setSelectedPersons(updatedPersons);
    setTo(updatedPersons.join(', ')); // Join multiple emails with comma
  };

  // Get available persons based on selected type
  const getAvailablePersons = () => {
    if (!selectedAgreement || !selectedPersonType) return [];

    if (selectedPersonType === 'contact') {
      return selectedAgreement.contact_persons || [];
    } else if (selectedPersonType === 'point') {
      return selectedAgreement.point_persons || [];
    }

    return [];
  };

  const handleSend = async () => {
    if (!to || !subject || !editorContent.trim()) {
      alert("Please fill in all fields");
      return;
    }

    const emailData = {
      recipient_email: to,
      custom_subject: subject,        
      custom_body: editorContent,
      template_id: currentTemplate?.template_id || null,
      agreement_id: selectedAgreement?.agreement_id || null
    };

    try {
      await emailService.sendEmail(emailData);
      alert("Email sent successfully!");

      // Remove draft from list if it's being edited
      if (editingDraftId) {
        const updatedDrafts = drafts.filter(d => d.id !== editingDraftId);
        setDrafts(updatedDrafts);
        localStorage.setItem('emailDrafts', JSON.stringify(updatedDrafts));
      }

      // Reset all fields
      setSelectedEmail(null);
      setEditorContent("");
      setSubject("");
      setTo("");
      setCurrentTemplate(null);
      setSelectedAgreement(null);
      setSelectedPersonType('');
      setSelectedPersons([]);
      setEditingDraftId(null);

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
      partnerName: selectedAgreement?.name || "Unknown Partner",
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

    localStorage.setItem('emailDrafts', JSON.stringify(updatedDrafts));
    alert(editingDraftId ? "Draft updated!" : "Draft saved!");

    // Reset all fields
    setSelectedEmail(null);
    setEditorContent("");
    setSubject("");
    setTo("");
    setCurrentTemplate(null);
    setEditingDraftId(null);
    setSelectedAgreement(null);
    setSelectedPersonType('');
    setSelectedPersons([]);
  };

  // Preview template with agreement data
  const previewTemplateWithAgreement = (template, agreement) => {
    if (!agreement) return template.body_html;

    let preview = template.body_html;
    preview = preview.replace(/\{\{PARTNER_NAME\}\}/g, agreement.name || '');
    preview = preview.replace(/\{\{DOCUMENT_TYPE\}\}/g, agreement.document_type || '');
    preview = preview.replace(/\{\{DTS_NUMBER\}\}/g, agreement.dts_number || '');
    preview = preview.replace(/\{\{AGREEMENT_STATUS\}\}/g, agreement.agreement_status || '');
    preview = preview.replace(/\{\{EXPIRY_DATE\}\}/g, agreement.date_expiry || '');

    return preview;
  };

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
          {loading ? (
            <div className="lloading-container">
              <div className="spinner"></div>
              <p>Loading Email...</p>
            </div>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : (
            <>
              <div className="email-dashboard">
                <h2 className="email-title">Email Dashboard</h2>

                {error && (
                  <div style={{ color: 'red', padding: '10px', marginBottom: '20px' }}>
                    {error}
                  </div>
                )}

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

              {selectedEmail && (
                <div className="modal-backdrop" onClick={() => setSelectedEmail(null)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <span>{editingDraftId ? "Edit Draft" : "New Message"}</span>
                      <button
                        className="email-close-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmail(null);
                        }}
                      >
                        ✖
                      </button>
                    </div>

                    <div className="modal-body">
                      {/* Agreement Selection */}
                      {currentTemplate && (
                        <div className="field">
                          <label>Related Agreement:</label>
                          <select
                            value={selectedAgreement?.agreement_id || ''}
                            onChange={(e) => handleAgreementChange(e.target.value)}
                          >
                            <option value="">
                              {filteredAgreements.length
                                ? 'Select Agreement (matching this status)'
                                : 'No agreements found for this status'}
                            </option>
                            {filteredAgreements.map((agreement) => (
                              <option key={agreement.agreement_id} value={agreement.agreement_id}>
                                {agreement.dts_number} - {agreement.name || 'Unknown Partner'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Person Type Selection */}
                      {selectedAgreement && (
                        <div className="field">
                          <label>Select Recipient Type:</label>
                          <select
                            value={selectedPersonType}
                            onChange={(e) => handlePersonTypeChange(e.target.value)}
                          >
                            <option value="">Choose recipient type...</option>
                            <option value="contact">Contact Persons</option>
                            <option value="point">Point Persons</option>
                          </select>
                        </div>
                      )}

                      {/* Person Selection */}
                      {selectedPersonType && getAvailablePersons().length > 0 && (
                        <div className="field">
                          <label>
                            Select {selectedPersonType === 'contact' ? 'Contact' : 'Point'} Person(s):
                          </label>
                          <div className="person-selection-container">
                            {getAvailablePersons().map((person, idx) => {
                              const email =
                                selectedPersonType === 'contact'
                                  ? person.contact_person_email
                                  : person.point_person_email;
                              const name =
                                selectedPersonType === 'contact'
                                  ? person.contact_person_name
                                  : person.point_person_name;
                              const position =
                                selectedPersonType === 'contact'
                                  ? person.contact_person_position
                                  : person.point_person_position;

                              return (
                                <label key={idx}>
                                  <input
                                    type="checkbox"
                                    checked={selectedPersons.includes(email)}
                                    onChange={(e) => handlePersonSelection(email, e.target.checked)}
                                  />
                                  <div>
                                    <strong>{name}</strong>
                                    {position && <span> - {position}</span>}
                                    <br />
                                    <span>{email}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* To Field - auto-populated or manually editable */}
                      <div className="field">
                        <label>To:</label>
                        <input
                          type="email"
                          value={to}
                          onChange={(e) => setTo(e.target.value)}
                          placeholder="Enter recipient email(s) or select from agreement persons above"
                        />
                        <small style={{ color: '#666' }}>
                          Tip: Multiple emails can be separated by commas
                        </small>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Email;