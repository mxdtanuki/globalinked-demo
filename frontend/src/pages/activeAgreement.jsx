import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "../components/layout.css";
import "./activeAgreement.css";
import { FiEye, FiLink, FiArrowRight } from "react-icons/fi";
import { agreementService } from '../services/agreementService';
import axios from 'axios';
 
const ActiveAgreement = () => {
  const [mobileShow, setMobileShow] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [reportType, setReportType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [agreements, setAgreements] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const createAuditLog = async (description) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_BASE_URL}/audit/logs`,
        { audit_description: description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to create audit log:", err);
    }
  };

  const fetchAgreements = async () => {
  try {
    const data = await agreementService.getActiveAgreements();
    console.log("ActiveAgreement fetched agreements:", data);
    const arr = Array.isArray(data) ? data.slice() : [];
    const timeOf = (item) => {
      const cand = item?.updated_at || item?.date_signed || item?.date || item?.created_at || item?.dateOfSigning || item?.date_expiry;
      const t = new Date(cand).getTime();
      return isNaN(t) ? 0 : t;
    };
    arr.sort((a, b) => timeOf(b) - timeOf(a));
    setAgreements(arr);
  } catch (err) {
    console.error("Failed to fetch active agreements:", err);
    setError("Failed to fetch agreements: " + (err.message || err));
    setAgreements([]); 
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, agreements]);

  useEffect(() => {
    fetchAgreements();
    const onActivated = (e) => {
      const mapped = e?.detail;
      if (mapped && (mapped.agreement_id || mapped.id)) {
        setAgreements((prev) => {
          const key = String(mapped.agreement_id ?? mapped.id);
          const filtered = Array.isArray(prev) ? prev.filter((a) => String(a.agreement_id ?? a.id) !== key) : [];
          return [mapped, ...filtered];
        });
        fetchAgreements();
        return;
      }
      fetchAgreements();
    };
    window.addEventListener('agreementActivated', onActivated);
    return () => window.removeEventListener('agreementActivated', onActivated);
  }, []);
  
  const [editingField, setEditingField] = useState(null); 
  const [editValue, setEditValue] = useState("");

  const [isModalEdit, setIsModalEdit] = useState(false);
  const [editForm, setEditForm] = useState({ hardcopy_location: "", remarks: [] });

  useEffect(() => {
    if (selectedAgreement) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setEditingField(null);
      setEditValue("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedAgreement]);

  useEffect(() => {
    if (selectedAgreement) {
      setIsModalEdit(false);
      setEditForm({
        hardcopy_location: selectedAgreement.hardcopy_location || selectedAgreement.hardcopyLocator || "",
        remarks: normalizeRemarks(selectedAgreement.remarks),
      });
    } else {
      setIsModalEdit(false);
      setEditForm({ hardcopy_location: "", remarks: [] });
    }
  }, [selectedAgreement]);

  const toggleMobileSidebar = () => setMobileShow(!mobileShow);
  const closeModal = () => setSelectedAgreement(null);

  const startModalEdit = () => {
    setIsModalEdit(true);
    setEditForm({
      hardcopy_location: selectedAgreement?.hardcopy_location || selectedAgreement?.hardcopyLocator || "",
      remarks: normalizeRemarks(selectedAgreement?.remarks),
    });
  };

  const cancelModalEdit = () => {
    setIsModalEdit(false);
    setEditForm({
      hardcopy_location: selectedAgreement?.hardcopy_location || selectedAgreement?.hardcopyLocator || "",
      remarks: normalizeRemarks(selectedAgreement?.remarks),
    });
  };

  const saveModalEdits = () => {
    if (!selectedAgreement) return;
    const updated = agreements.map((a) =>
      (a.agreement_id === selectedAgreement.agreement_id || a.id === selectedAgreement.id)
        ? { ...a, hardcopy_location: editForm.hardcopy_location, remarks: editForm.remarks }
        : a
    );
    setAgreements(updated);
    setSelectedAgreement({
      ...selectedAgreement,
      hardcopy_location: editForm.hardcopy_location,
      remarks: editForm.remarks,
    });
    setIsModalEdit(false);
  };

  const activeAgreements = agreements.filter(
    (a) => a.agreement_status === "Active" || a.status === "active" || a.status === "expiring-soon" || (!a.date_expiry || new Date(a.date_expiry) > new Date())
  );
  const activeMOAs = activeAgreements.filter((a) => String(a.document_type).toUpperCase() === "MOA");
  const activeMOUs = activeAgreements.filter((a) => String(a.document_type).toUpperCase() === "MOU");
  const expiringSoon = activeAgreements.filter((a) => {
    if (!a.date_expiry) return false;
    const daysDiff = (new Date(a.date_expiry) - new Date()) / (1000 * 60 * 60 * 24);
    return daysDiff > 0 && daysDiff <= 90;
  });

  const filteredAgreements = activeAgreements
    .filter((a) => {
      if (filter === "moa") return String(a.document_type).toUpperCase() === "MOA";
      if (filter === "mou") return String(a.document_type).toUpperCase() === "MOU";
      if (filter === "linked") {
        return Boolean(a.related_mou || a.MOU_to_MOA_id || a.mou_number || a.linked_mou || a.linkedMouId);
      }
      return true;
    })
    .filter((a) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const fields = [
        a.dts_number,
        a.event_title,
        a.name,
        a.source_unit || a.source || a.initiating_unit,
        a.country,
        a.document_type,
        a.partnership_type,
        a.brief_profile,
        Array.isArray(a.remarks) ? a.remarks.join(' ') : a.remarks,
      ];
      return fields.some((f) => f && f.toString().toLowerCase().includes(q));
    });

  const totalPages = Math.max(1, Math.ceil(filteredAgreements.length / itemsPerPage));
  const paginatedAgreements = filteredAgreements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const gotoPage = (p) => {
    const page = Math.max(1, Math.min(totalPages, p));
    setCurrentPage(page);
  };
  const prevPage = () => gotoPage(currentPage - 1);
  const nextPage = () => gotoPage(currentPage + 1);

  const calculateDaysLeft = (expiryDate) => {
    const today = new Date();
    const exp = new Date(expiryDate);
    const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const LogoSrc = (lp) => {
    if (!lp) return null;
    try {
      if (typeof lp === "string") {
        if (lp.startsWith("data:image")) return lp;
        if (lp.startsWith("iVBORw0")) return `data:image/png;base64,${lp}`;
        if (lp.startsWith("/9j/")) return `data:image/jpeg;base64,${lp}`;
        if (lp.startsWith("http://") || lp.startsWith("https://")) return lp;
        // otherwise treat as a server-relative path
        return `${API_BASE_URL.replace(/\/$/, "")}/${lp.replace(/^\/+/, "")}`;
      }
    } catch (err) {
      console.warn("LogoSrc error:", err, lp);
    }
    return null;
  };

  // normalize remarks into an array of plain strings
  const normalizeRemarks = (r) => {
    if (!r) return [];
    if (Array.isArray(r))
      return r.map((item) => (typeof item === "object" ? item.remark_text || item.text || item.remark || "" : String(item)));
    if (typeof r === "string") return r.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    return [];
  };

  const addEditRemark = () => setEditForm((prev) => ({ ...prev, remarks: [...(prev.remarks || []), ""] }));
  const updateEditRemark = (idx, val) =>
    setEditForm((prev) => {
      const arr = Array.isArray(prev.remarks) ? [...prev.remarks] : [];
      arr[idx] = val;
      return { ...prev, remarks: arr };
    });
  const removeEditRemark = (idx) =>
    setEditForm((prev) => {
      const arr = Array.isArray(prev.remarks) ? [...prev.remarks] : [];
      arr.splice(idx, 1);
      return { ...prev, remarks: arr };
    });

  const linkedAgreement = (() => {
    if (!selectedAgreement) return null;
    const lid = getLinkedId(selectedAgreement) || selectedAgreement.linkedMouId;
    if (!lid) return null;
    return agreements.find((a) => a.id === lid || a.agreement_id === lid || a.linkedMouId === lid) || null;
  })();

  const reportLabelMap = {
    all: "Complete Agreements Report",
    mou: "MOU Only Report",
    moa: "MOA Only Report",
    linked: "Linked MOU → MOA Report",
  };

  // helper: find the linked MOU id/key on an agreement object
  function getLinkedId(a) {
    if (!a) return undefined;
    return (
      a.related_mou ||
      a.MOU_to_MOA_id ||
      a.mou_number ||
      a.linked_mou ||
      a.linked_mou_id ||
      a.linkedMouId
    );
  }

  const reportItems = (() => {
    if (reportType === "mou") return agreements.filter((a) => String(a.document_type).toUpperCase() === "MOU");
    if (reportType === "moa") return agreements.filter((a) => String(a.document_type).toUpperCase() === "MOA");
    if (reportType === "linked") return agreements.filter((a) => Boolean(getLinkedId(a)));
    return agreements.slice();
  })();

  const escapeHtml = (str = "") =>
    String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const safeCsv = (v = "") => {
    const s = String(v ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const generatePrintableReport = () => {
    const rows = reportItems
      .map((r) => {
        const parentId = getLinkedId(r);
        const parent = parentId ? agreements.find((x) => x.id === parentId || x.agreement_id === parentId) : null;
        return `<tr>
            <td>${escapeHtml(r.document_type)}</td>
            <td>${escapeHtml(r.dts_number)}</td>
            <td>${escapeHtml(r.event_title || r.event || r.title || "")}</td>
            <td>${escapeHtml(r.name || r.partnerName || "")}</td>
            <td>${escapeHtml(r.source_unit || r.source || r.initiating_unit || "")}</td>
            <td>${escapeHtml(r.date_signed ? new Date(r.date_signed).toLocaleDateString() : "")}</td>
            <td>${escapeHtml(r.date_expiry ? new Date(r.date_expiry).toLocaleDateString() : "")}</td>
            <td>${parent ? escapeHtml(parent.event_title || parent.eventTitle || "") : ""}</td>
          </tr>`;
      })
      .join("");

    const html = `
      <html>
        <head>
          <title>${reportLabelMap[reportType]}</title>
          <style>
            body{font-family: Arial, Helvetica, sans-serif; padding:20px; color:#111}
            h1{font-size:20px; margin-bottom:6px}
            table{width:100%;border-collapse:collapse;margin-top:12px}
            th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
            th{background:#f7f7f7}
          </style>
        </head>
        <body>
          <h1>${reportLabelMap[reportType]}</h1>
          <div>Total records: ${reportItems.length}</div>
          <table>
            <thead>
              <tr>
                <th>Type</th><th>DTS</th><th>Title</th><th>Partner</th><th>Source</th><th>Signing</th><th>Expiry</th><th>Linked MOU</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>`;

    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
  };

  const downloadCSV = () => {
    const headers = ['Type','DTS Number','Title','Partner','Country','Source','DateOfSigning','ExpiryDate','LinkedMouId','Remarks'];
    const csvRows = [headers.join(",")];

    reportItems.forEach((r) => {
      const row = [
        safeCsv(r.document_type),
        safeCsv(r.dts_number),
        safeCsv(r.event_title || r.event || r.title || ""),
        safeCsv(r.name || r.partnerName || ""),
        safeCsv(r.country),
        safeCsv(r.source_unit || r.source || r.initiating_unit),
        safeCsv(r.date_signed || ""),
        safeCsv(r.date_expiry || ""),
        safeCsv(getLinkedId(r) || ""),
        safeCsv(Array.isArray(r.remarks) ? r.remarks.join(" | ") : r.remarks || ""),
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-agreements-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-container active-agreements-page">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}

      <div className="content-body">
        <Sidebar mobileShow={mobileShow} />

        <div className="main-content" onClick={() => mobileShow && setMobileShow(false)}>
          <div className="activeAgreement-main">
            {/* === Summary Cards === */}
            <div className="activeAgreement-summary">
              <div className="activeAgreement-card total">
                <h4>Total Active Agreements</h4>
                <p className="count">{activeAgreements.length}</p>
                <span>Currently in effect</span>
              </div>
              <div className="activeAgreement-card moa">
                <h4>Active MOAs</h4>
                <p className="count">{activeMOAs.length}</p>
                <span>Memorandum of Agreement</span>
              </div>
              <div className="activeAgreement-card mou">
                <h4>Active MOUs</h4>
                <p className="count">{activeMOUs.length}</p>
                <span>Memorandum of Understanding</span>
              </div>
              <div className="activeAgreement-card expiring">
                <h4>Expiring Soon</h4>
                <p className="count">{expiringSoon.length}</p>
                <span>Within 90 days</span>
              </div>
            </div>

            {/* === Agreement Table Section === */}
            <div className="activeAgreement-table-section">
              <div className="table-controls">
                <div className="activeAgreement-tabs">
                  <button
                    className={filter === "all" ? "active" : ""}
                    onClick={() => setFilter("all")}
                  >
                    All Active Agreements
                  </button>
                  <button
                    className={filter === "moa" ? "active" : ""}
                    onClick={() => setFilter("moa")}
                  >
                    MOA Only
                  </button>
                  <button
                    className={filter === "mou" ? "active" : ""}
                    onClick={() => setFilter("mou")}
                  >
                    MOU Only
                  </button>
                  <button
                    className={filter === "linked" ? "active" : ""}
                    onClick={() => setFilter("linked")}
                  >
                    Linked Agreements
                  </button>
                </div>

                <div className="table-search">
                  <input
                    type="search"
                    placeholder="Search DTS, title, partner, source..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search agreements"
                  />
                  {searchQuery && (
                    <button
                      className="clear-search"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <h3 className="section-title">Agreements ({filteredAgreements.length})</h3>
              {filter === "linked" ? (
                (() => {
                  const mouList = activeAgreements.filter((a) => String(a.document_type || a.documentType).toUpperCase() === "MOU");

                  const mouWithChildren = mouList
                    .map((mou) => {
                      const mid = mou.id || mou.agreement_id;
                      const children = activeAgreements.filter((c) => getLinkedId(c) === mid || c.linkedMouId === mid);
                      return { mou, children };
                    })
                    .filter((item) => item.children.length > 0);

                  if (mouWithChildren.length === 0) {
                    return <div className="no-linked">No linked agreements found.</div>;
                  }

                  return (
                    <div className="mou-relationships">
                      {mouWithChildren.map(({ mou, children }) => (
                        <div className="mou-relationship" key={mou.id}>
                          <div className="mou-relationship-header">
                            <span className="mou-dot" />
                            <span className={`badge mou`}>MOU</span>
                            <div className="mou-meta">
                              <strong className="mou-title">{mou.event_title || mou.eventTitle}</strong>
                              <div className="mou-sub">
                                Partner: {mou.name || mou.partnerName} ({mou.country})
                              </div>
                              <div className="mou-sub small">
                                Valid: {new Date(mou.date_signed || mou.dateOfSigning).toLocaleDateString()} →{" "}
                                {new Date(mou.date_expiry || mou.expiryDate).toLocaleDateString()}
                              </div>
                              <div className="mou-dts small">{mou.dts_number || mou.dtsNumber}</div>
                            </div>
                          </div>

                          <div className="mou-based">
                            <div className="mou-based-title">
                              <FiLink className="link-inline" /> Agreements based on this MOU ({children.length})
                            </div>

                            <div className="mou-children">
                              {children.map((c) => (
                                <div className="moa-child-card" key={c.id}>
                                  <div className="moa-left">
                                    <FiArrowRight className="arrow-icon" />
                                    <span className="badge moa">MOA</span>
                                  </div>
                                  <div className="moa-body">
                                    <strong className="moa-title">{c.event_title || c.eventTitle}</strong>
                                    <div className="moa-sub small">
                                      Partner: {c.name || c.partnerName} ({c.country})
                                    </div>
                                    <div className="moa-sub small">
                                      Source: {c.source_unit || c.source || c.initiating_unit}
                                    </div>
                                    <div className="moa-valid small">
                                      Valid: {new Date(c.date_signed || c.dateOfSigning).toLocaleDateString()} →{" "}
                                      {new Date(c.date_expiry || c.expiryDate).toLocaleDateString()}
                                    </div>
                                    <div className="moa-dts small">{c.dts_number || c.dtsNumber}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="activeAgreement-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>DTS Number</th>
                        <th>Title</th>
                        <th>Partner</th>
                        <th>Source</th>
                        <th>Expiration Date</th>
                        <th>Days Left</th>
                        <th>Connection</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAgreements.map((a, i) => (
                        <tr key={a.id || i}>
                              <td>
                                <span className={`badge ${String(a.document_type || a.documentType || "").toLowerCase()}`}>
                                  {a.document_type || a.documentType}
                                </span>
                              </td>

                              <td className="dts-number">{a.dts_number || a.dtsNumber}</td>

                              <td>
                                <div>
                                  <b>{a.event_title || a.eventTitle}</b>
                                  <div className="small">{a.partnership_type || a.partnershipClassification}</div>
                                </div>
                              </td>

                              <td>
                                <div>
                                  <b>{a.name || a.partnerName}</b>
                                  <div className="small">{a.country}</div>
                                </div>
                              </td>

                              <td>{a.source_unit || a.source || a.initiating_unit}</td>

                              <td>{new Date(a.date_expiry || a.expiryDate).toDateString()}</td>

                              <td>
                                <span className="days-pill">{calculateDaysLeft(a.date_expiry || a.expiryDate)} days</span>
                              </td>

                          {/* Connection column */}
                          <td className="connection">
                            {getLinkedId(a) ? (
                              <a href={`#${getLinkedId(a)}`} className="linked">
                                <FiLink className="link-icon" />
                                Linked to MOU
                              </a>
                            ) : String(a.document_type || a.documentType).toUpperCase() === "MOA" ? (
                              <span className="independent">Independent</span>
                            ) : (
                              <span className="dash">—</span>
                            )}
                          </td>

                          <td>
                            <button
                              className="icon-btn"
                              onClick={() => setSelectedAgreement(a)}
                              aria-label="View details"
                            >
                              <FiEye className="icon" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button className="page-btn" onClick={prevPage} disabled={currentPage === 1}>
                        Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => {
                        const page = idx + 1;
                        return (
                          <button
                            key={page}
                            className={`page-btn ${page === currentPage ? "active" : ""}`}
                            onClick={() => gotoPage(page)}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        className="page-btn"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nearing Expiration Section */}
            <div className="activeAgreement-expiring">
               <h3>⚠️ Nearing Expiration</h3>
              <p className="subtext">
                These agreements will expire within the next 90 days
              </p>

              {expiringSoon.map((a, i) => (
                <div key={i} className="activeAgreement-expiring-card">
                  <div className="activeAgreement-expiring-header">
                    <span className={`badge ${String(a.document_type || a.documentType || "").toLowerCase()}`}>
                      {a.document_type || a.documentType}
                    </span>
                    <h4>{a.event_title || a.eventTitle}</h4>
                    <div className="days-left">
                      <button
                        className="eye-btn"
                        onClick={() => setSelectedAgreement(a)}
                        aria-label="View details"
                      >
                        <FiEye className="icon" />
                      </button>
                      <span>{calculateDaysLeft(a.date_expiry || a.expiryDate)} days left</span>
                    </div>
                  </div>
                  <p>
                    <b>Partner:</b> {a.name || a.partnerName}
                    <br />
                    <b>Expires:</b> {new Date(a.date_expiry || a.expiryDate).toDateString()}
                    <br />
                    <b>Source:</b> {a.source_unit || a.source || a.initiating_unit} • <span>{a.dts_number || a.dtsNumber}</span>
                  </p>

                  {getLinkedId(a) && (
                    <p className="linked">
                      🔗 Requires MOU:{" "}
                      <span>Business education partnership framework</span>
                      <br />
                      <small>MOU expires: Jan 15, 2028 (814 days)</small>
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Report Generator */}
            <div className="report-generator-card">
              <div className="report-header">
                <div className="report-icon">📄</div>
                <div>
                  <h4>Report Generator</h4>
                  <div className="report-sub">Generate comprehensive reports for agreements in various formats</div>
                </div>
              </div>

              <div className="report-controls">
                <div className="report-select">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    aria-label="Select report type"
                  >
                    <option value="all">All Agreements</option>
                    <option value="mou">MOU</option>
                    <option value="moa">MOA</option>
                    <option value="linked">Linked MOU to MOA</option>
                  </select>
                </div>

                <div className="report-actions">
                  <button
                    className="btn btn-primary btn-print"
                    onClick={generatePrintableReport}
                    aria-label="Generate printable report"
                  >
                    <span className="btn-icon">🖨️</span>
                    <span>Generate Report</span>
                  </button>

                  <button
                    className="btn btn-outline btn-csv"
                    onClick={downloadCSV}
                    aria-label="Download CSV"
                  >
                    <span className="btn-icon">⬇️</span>
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              <div className="report-meta">
                <div>
                  <strong>Selected:</strong> <span className="muted">{reportLabelMap[reportType]}</span>
                </div>
                <div>
                  <strong>Total records:</strong> <span className="muted">{reportItems.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details modal */}
      {selectedAgreement && (
        <div className="agreement-modal-backdrop" onClick={closeModal}>
          <div className="agreement-modal" onClick={(e) => e.stopPropagation()}>
            <header className="agreement-modal-header">
              <div className="modal-badge-row">
                <span className={`badge ${String(selectedAgreement.document_type || selectedAgreement.documentType || "").toLowerCase()}`}>
                  {selectedAgreement.document_type || selectedAgreement.documentType}
                </span>
                <h2 className="modal-title">{selectedAgreement.event_title || selectedAgreement.eventTitle}</h2>
              </div>
              <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </header>

            <div className="agreement-modal-body">

              {/* Document Information */}
              <section className="modal-section docinfo">
                <h4>Document Information</h4>
                <div className="row two-col">
                  <div>
                    <div className="label">DTS Number</div>
                    <div className="value mono">{selectedAgreement.dts_number || selectedAgreement.dtsNumber}</div>
                  </div>

                  <div>
                    <div className="label">Hardcopy Locator</div>
                    <div className="value">{selectedAgreement.hardcopy_location || selectedAgreement.hardcopyLocator || "—"}</div>
                  </div>

                  <div>
                    <div className="label">Entry Date</div>
                    <div className="value">{new Date(selectedAgreement.date || selectedAgreement.date_signed || selectedAgreement.dateOfSigning).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="label">Brief Profile</div>
                <div className="brief">{selectedAgreement.brief_profile || selectedAgreement.briefProfile}</div>
              </section>

              <section className="modal-section partner">
                <h4>Partner Information</h4>

                  <div className="partner-top">
                  <div className="partner-logo">
                    {LogoSrc(selectedAgreement.logo_path || selectedAgreement.logo) ? (
                      <img
                        src={LogoSrc(selectedAgreement.logo_path || selectedAgreement.logo)}
                        alt={`${selectedAgreement.name || selectedAgreement.partnerName} logo`}
                        onError={(e) => {
                          console.warn("Logo failed to load:", e.target.src);
                          e.target.onerror = null;
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="partner-fallback">{getInitials(selectedAgreement.name || selectedAgreement.partnerName)}</div>
                    )}
                  </div>

                  <div className="partner-details">
                    <div className="row two-col">
                      <div>
                        <div className="label">Organization</div>
                        <div className="value">{selectedAgreement.name || selectedAgreement.partnerName}</div>
                      </div>
                      <div>
                        <div className="label">Country</div>
                        <div className="value">{selectedAgreement.country}</div>
                      </div>
                      <div>
                        <div className="label">Region</div>
                        <div className="value">{selectedAgreement.region}</div>
                      </div>
                      <div>
                        <div className="label">Address</div>
                        <div className="value">{selectedAgreement.address}</div>
                      </div>
                      <div>
                        <div className="label">Website</div>
                        <div className="value"><a href={selectedAgreement.website_link || selectedAgreement.websiteLink} target="_blank" rel="noreferrer">{selectedAgreement.website_link || selectedAgreement.websiteLink}</a></div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="modal-section contacts">
                <h4>Contact Persons</h4>
                <div className="contacts-grid">
                  <div className="contact-card">
                    <div className="contact-role">PUP Point Person</div>
                    <div className="contact-name">{selectedAgreement.point_persons_display || selectedAgreement.pointPerson || selectedAgreement.point_persons || "N/A"}</div>
                    <div className="contact-org">{selectedAgreement.source_unit || selectedAgreement.source || selectedAgreement.initiating_unit}</div>
                    {(selectedAgreement.point_persons_email || selectedAgreement.pointPersonEmail) ? (
                      <a className="contact-email" href={`mailto:${selectedAgreement.point_persons_email || selectedAgreement.pointPersonEmail}`}>{selectedAgreement.point_persons_email || selectedAgreement.pointPersonEmail}</a>
                    ) : null}
                  </div>

                  <div className="contact-card alt">
                    <div className="contact-role">Partner Contact Person</div>
                    <div className="contact-name">{selectedAgreement.contact_persons_display || selectedAgreement.contactPerson || selectedAgreement.contact_persons || "N/A"}</div>
                    <div className="contact-org">{selectedAgreement.name || selectedAgreement.partnerName}</div>
                    {(selectedAgreement.contact_persons_email || selectedAgreement.contactPersonEmail) ? (
                      <a className="contact-email" href={`mailto:${selectedAgreement.contact_persons_email || selectedAgreement.contactPersonEmail}`}>{selectedAgreement.contact_persons_email || selectedAgreement.contactPersonEmail}</a>
                    ) : null}
                  </div>
                </div>
              </section>

              {/* ===== Linked MOU ===== */}
              {linkedAgreement && (
                <section className="modal-section linked-mou">
                  <h4>
                    <span style={{ marginRight: 8 }}>🔗</span> Linked MOU
                  </h4>

                  <div className="linked-mou-card">
                    <div className="linked-mou-left">
                      <span className="badge mou">MOU</span>
                    </div>

                    <div className="linked-mou-body">
                      <strong className="linked-mou-title">{linkedAgreement.event_title || linkedAgreement.eventTitle}</strong>
                      <div className="small linked-mou-sub">{linkedAgreement.partnership_type || linkedAgreement.partnershipClassification}</div>
                      <div className="small linked-mou-valid">
                        Valid until: {new Date(linkedAgreement.date_expiry || linkedAgreement.expiryDate).toLocaleDateString()}
                      </div>
                      <div className="linked-mou-dts small">{linkedAgreement.dts_number || linkedAgreement.dtsNumber}</div>
                    </div>
                  </div>
                </section>
              )}

              {/* Agreement Timeline */}
              <section className="modal-section timeline">
                <h4>Agreement Timeline</h4>
                <div className="row two-col">
                  <div>
                    <div className="label">Date of Signing</div>
                    <div className="value">{new Date(selectedAgreement.date_signed || selectedAgreement.dateOfSigning).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="label">Expiry Date</div>
                    <div className="value">{new Date(selectedAgreement.date_expiry || selectedAgreement.expiryDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="label">Validity Period</div>
                    <div className="value">{selectedAgreement.validity_period || selectedAgreement.validityPeriod} years</div>
                  </div>
                  <div>
                    <div className="label">Status</div>
                    <div className="value status-pill">{(selectedAgreement.agreement_status || selectedAgreement.status) === "expiring-soon" ? "Expiring soon" : "Active"}</div>
                  </div>
                </div>
              </section>

              <section className="modal-section remarks">
                <div className="label">Remarks</div>
                <div className="brief">
                  {Array.isArray(selectedAgreement.remarks) ? (
                    selectedAgreement.remarks.map((r, idx) => (
                      <div key={idx}>{typeof r === "object" ? r.remark_text || r.text || r.remark || "" : r}</div>
                    ))
                  ) : selectedAgreement.remarks ? (
                    <div>{selectedAgreement.remarks}</div>
                  ) : (
                    "—"
                  )}
                </div>
              </section>
            </div>

            <footer className="agreement-modal-footer">
              {!isModalEdit ? (
                <>
                  <button className="btn edit" onClick={startModalEdit}>✎ Edit</button>
                </>
              ) : (
                <div style={{ width: "100%" }} className="modal-edit-panel">
                    <div className="row two-col" style={{ gap: 12, alignItems: "flex-start" }}>
                      <div>
                        <div className="label">Hardcopy Locator</div>
                        <input
                          className="edit-input"
                          value={editForm.hardcopy_location}
                          onChange={(e) => setEditForm({ ...editForm, hardcopy_location: e.target.value })}
                          placeholder="Enter hardcopy locator"
                        />
                      </div>

                      <div>
                        <div className="label">Remarks</div>
                        <div style={{ background: "#fff8dc", padding: "5px" }}>
                          {Array.isArray(editForm.remarks) && editForm.remarks.length > 0 ? (
                            editForm.remarks.map((rm, idx) => (
                              <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                                <input
                                  type="text"
                                  value={rm}
                                  onChange={(e) => updateEditRemark(idx, e.target.value)}
                                  style={{ flex: 1 }}
                                />
                                <button onClick={() => removeEditRemark(idx)} style={{ marginLeft: 8 }}>x</button>
                              </div>
                            ))
                          ) : (
                            <div style={{ color: "#666", fontStyle: "italic" }}>No remarks</div>
                          )}
                          <div>
                            <button onClick={addEditRemark}>+ Add</button>
                          </div>
                        </div>
                      </div>
                    </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
                    <button className="btn save" onClick={saveModalEdits}>Save</button>
                    <button className="btn cancel" onClick={cancelModalEdit}>Cancel</button>
                  </div>
                </div>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveAgreement;
