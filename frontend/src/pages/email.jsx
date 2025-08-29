import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "../components/layout.css";
import "./email.css";

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

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    const handleResize = () => {
      const isNowDesktop = window.innerWidth >= 768;
      setIsDesktop(isNowDesktop);
      if (isNowDesktop) setMobileShow(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

// Example templates
const templates = [
  {
    id: 1,
    status: "Endorse To ULCO for Review and Approval",
    text: `DEAR (POINT PERSON),\n\nWE WOULD LIKE TO INFORM YOU THAT THE (DOCUMENT TYPE) WITH (PARTNER NAME) HAS BEEN ENDORSED TO ULCO FOR REVIEW AND APPROVAL.\n\nCURRENT STATUS: ENDORSE TO ULCO FOR REVIEW AND APPROVAL\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
  {
    id: 2,
    status: "Revert To Initiator with Comments",
    text: `DEAR (POINT PERSON),\n\nTHE (DOCUMENT TYPE) WITH (PARTNER NAME) HAS BEEN REVERTED TO THE INITIATOR WITH COMMENTS FOR REVISION.\n\nCURRENT STATUS: REVERT TO INITIATOR WITH COMMENTS\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
  {
    id: 3,
    status: "Replication of Copies (6 sets)",
    text: `DEAR (POINT PERSON),\n\nTHE (DOCUMENT TYPE) WITH (PARTNER NAME) IS NOW FOR REPLICATION OF COPIES (6 SETS).\n\nCURRENT STATUS: FOR REPLICATION OF COPIES (6 SETS)\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
  {
    id: 4,
    status: "For Signitures of PUP Officials",
    text: `DEAR (POINT PERSON),\n\nTHE (DOCUMENT TYPE) WITH (PARTNER NAME) IS NOW AWAITING SIGNATURES FROM PUP OFFICIALS.\n\nCURRENT STATUS: FOR SIGNATURES OF PUP OFFICIALS\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
  {
    id: 5,
    status: "Signed by PUP Officials",
    text: `DEAR (POINT PERSON),\n\nTHE (DOCUMENT TYPE) WITH (PARTNER NAME) HAS BEEN SIGNED BY PUP OFFICIALS.\n\nCURRENT STATUS: SIGNED BY PUP OFFICIALS\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
  {
    id: 6,
    status: "For Signitures of Partner",
    text: `DEAR (POINT PERSON),\n\nTHE (DOCUMENT TYPE) WITH (PARTNER NAME) IS NOW FOR SIGNATURE OF THE PARTNER.\n\nCURRENT STATUS: FOR SIGNATURE OF PARTNER\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
  {
    id: 7,
    status: "SignedPartnerInstitution",
    text: `DEAR (POINT PERSON),\n\nTHE (DOCUMENT TYPE) WITH (PARTNER NAME) HAS BEEN SIGNED BY THE PARTNER INSTITUTION.\n\nCURRENT STATUS: SIGNED BY PARTNER INSTITUTION\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
    {
    id: 8,
    status: "Completely Signed",
    text: `DEAR (POINT PERSON),\n\nTHE (DOCUMENT TYPE) WITH (PARTNER NAME) HAS BEEN COMPLETELY SIGNED AND FINALIZED.\n\nCURRENT STATUS: COMPLETELY SIGNED\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
  {
    id: 9,
    status: "For Notary",
    text: `DEAR (POINT PERSON),\n\nWE WOULD LIKE TO INFORM YOU THAT THE (DOCUMENT TYPE) WITH (PARTNER NAME) HAS NOW REACHED THE NOTARIZATION STAGE.\n\nCURRENT STATUS: FOR NOTARY\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
  {
    id: 10,
    status: "FFUP Copy From College/Campus",
    text: `DEAR (POINT PERSON),\n\nTHE (DOCUMENT TYPE) WITH (PARTNER NAME) IS NOW FOR FORWARDING OF FFUP COPY FROM THE COLLEGE/CAMPUS.\n\nCURRENT STATUS: FOR FFUP COPY FROM COLLEGE/CAMPUS\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
  {
    id: 11,
    status: "Renewal",
    text: `DEAR (POINT PERSON),\n\nTHE (DOCUMENT TYPE) WITH (PARTNER NAME) IS NOW DUE FOR RENEWAL.\n\nCURRENT STATUS: RENEWAL\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
  {
    id: 12,
    status: "Expired",
    text: `DEAR (POINT PERSON),\n\nTHE (DOCUMENT TYPE) WITH (PARTNER NAME) HAS EXPIRED AND IS NO LONGER VALID.\n\nCURRENT STATUS: EXPIRED\n\nPLEASE INITIATE ACTIONS FOR RENEWAL IF NECESSARY.\n\nTHANK YOU.\n\nBEST REGARDS,\nOFFICE OF INTERNATIONAL AFFAIRS, PUP`,
  },
];

  // Open template
  const handleOpenTemplate = (tpl) => {
    setSelectedEmail({ type: "template", data: tpl });
    setEditorContent(tpl.text);
    setSubject(tpl.status); 
    setTo("");
    setEditingDraftId(null);
    setCurrentTemplate(tpl);
  };

  // Open draft
  const handleOpenDraft = (draft) => {
    setSelectedEmail({ type: "draft", data: draft });
    setEditorContent(draft.text);
    setTo(draft.to || "");
    setSubject(draft.subject || "");
    setEditingDraftId(draft.id);
    setCurrentTemplate(null);
  };

  const handleSend = () => {
    console.log("Sending email:", { to, subject, body: editorContent });
    alert("Email Sent! (Check console for content)");
    setSelectedEmail(null);
    setEditingDraftId(null);
    setTo("");
    setSubject("");
    setEditorContent("");
    setCurrentTemplate(null);
  };

  const handleSaveDraft = () => {
    if (!editorContent.trim()) {
      alert("Cannot save empty draft.");
      return;
    }

    if (editingDraftId) {
      // Update existing draft
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === editingDraftId
            ? { ...d, text: editorContent, to, subject }
            : d
        )
      );
      alert("Draft Updated!");
    } else {
      // Create new draft
      const newDraft = {
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        partnerName: "PAUL BAKERY MALAYSIA", // these should be later changed to dynamic inputs
        status: currentTemplate?.status || "Unknown Status", // comes from template, or kasama din dapat to? dapat dynamic  sha every time may update na change ng status tatanong yung user if want nya mag send ng email?
        text: editorContent,
        to,
        subject,
      };
      setDrafts((prev) => [...prev, newDraft]);
      alert("Draft Saved!");
    }

    setSelectedEmail(null);
    setEditingDraftId(null);
    setTo("");
    setSubject("");
    setEditorContent("");
    setCurrentTemplate(null);
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
                  {templates.map((tpl, idx) => (
                    <tr key={tpl.id}>
                      <td>{idx + 1}</td>
                      <td>{tpl.status}</td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => handleOpenTemplate(tpl)}
                        >
                          View Template
                        </button>
                      </td>
                    </tr>
                  ))}
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
