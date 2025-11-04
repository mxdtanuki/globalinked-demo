import React, { useEffect, useState } from "react";
import { agreementService } from "../services/agreementService";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "./archive.css";
import { documentService } from "../services/documentService";
import { useNavigate } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";
import { renderDocumentTypeBadge } from '../utils/documentTypeUtils';
import { FiEye, FiLink, FiDownload, FiArchive, FiAlertCircle, FiFilter, FiX, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { TbFileText, TbLink, TbClockHour4 } from "react-icons/tb";

const Archive = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [filterDocType, setFilterDocType] = useState("");
  const [filterClassification, setFilterClassification] = useState("");
  const [allArchiveData, setAllArchiveData] = useState([]);
  const [withdrawnData, setWithdrawnData] = useState([]);
  const [selectedTab, setSelectedTab] = useState("expired");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  


  const handleMassDownload = async () => {
    if (selectedIds.size === 0) {
      alert("Please select agreements to download.");
      return;
    }
    
    setIsDownloading(true);
    try {
      for (const id of selectedIds) {
        const item = filteredData.find(a => a.agreement_id === id);
        if (item && item.dts_number) {
          await handleViewLatestFile(item.dts_number, true);
          // small delay between downloads to prevent browser blocking
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error("Error downloading documents:", error);
      alert("Error downloading some documents. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const [displayData, setDisplayData] = useState([]);
  const [activeTab, setActiveTab] = useState("Expired");
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [savingRows, setSavingRows] = useState(new Set());
  const [deletingRows, setDeletingRows] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [reportType, setReportType] = useState("all");
  const navigate = useNavigate();
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const expiredData = await agreementService.getArchivedAgreements();
        
        const withdrawnAgreements = await agreementService.getAgreements({ 
          status_filter: 'WITHDRAWN'
        });

        console.log("Expired agreements:", expiredData);
        console.log("Withdrawn agreements:", withdrawnAgreements);

        setAllArchiveData(expiredData);
        setWithdrawnData(withdrawnAgreements);
        setDisplayData(expiredData);

        setStats([
          { label: "Expired", count: expiredData.length },
          { label: "Withdrawn", count: withdrawnAgreements.length },
        ]);
      } catch (err) {
        console.error("Failed to load archive data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filterByStat = (label) => {
    setActiveTab(label);
    setCurrentPage(1);
    setSearchTerm("");
    setFilterDocType("");
    setFilterClassification("");
    setSelectedIds(new Set());

    if (label === "Expired") {
      setDisplayData(allArchiveData);
    } else if (label === "Withdrawn") {
      setDisplayData(withdrawnData);
    }
  };

  const filteredData = displayData.filter((item) => {
    // Search filter
    const searchMatch = searchTerm ? 
      [item.agreement_title, item.partner_name, item.name, item.dts_number]
        .filter(Boolean)
        .some(field => field.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;

    // Agreement type filter
    let typeMatch = true;
    switch (selectedFilter) {
      case 'moa':
        typeMatch = String(item.document_type).toUpperCase() === 'MOA';
        break;
      case 'mou':
        typeMatch = String(item.document_type).toUpperCase() === 'MOU';
        break;
      case 'linked':
        typeMatch = Boolean(item.linked_mou_id || item.parent_agreement_id);
        break;
      default:
        typeMatch = true;
    }

    return searchMatch && typeMatch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleViewLatestFile = async (dtsNumber, isDownload = false) => {
    try {
      const latest = await documentService.getLatestVersion(dtsNumber);
      if (!latest) {
        alert(`No document versions found for DTS number: ${dtsNumber}`);
        return;
      }

      const resp = await fetch(latest.download_url);
      if (!resp.ok) throw new Error(`Failed to fetch file (${resp.status})`);
      
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      
      if (isDownload) {
        // Force download the file
        const a = document.createElement('a');
        a.href = url;
        a.download = latest.filename || `${dtsNumber}.pdf`; // Use original filename if available
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // View file in new tab
        const newWindow = window.open(url, '_blank');
        window.open(url, "_blank");
        setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      }
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to " + (isDownload ? "download" : "open") + " file: " + (err.message || err));
    }
  };

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) setCurrentUser(JSON.parse(userStr));
    } catch (err) {
      console.error("Error parsing user:", err);
    }
  }, []);

  const startEditing = (row) => {
    setEditingRow(row.agreement_id);
    setEditedData({ ...row });
  };
  
  const cancelEditing = () => {
    setEditingRow(null);
    setEditedData({});
  };
  
  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const saveRow = async (agreementId) => {
    try {
      setSavingRows((prev) => new Set(prev).add(agreementId));
      await agreementService.updateAgreement(agreementId, editedData);

      const updateData = (data) =>
        data.map((a) => (a.agreement_id === agreementId ? editedData : a));

      if (activeTab === "Withdrawn") {
        setWithdrawnData(updateData);
        setDisplayData(updateData);
      } else {
        setAllArchiveData(updateData);
        setDisplayData(updateData);
      }

      setEditingRow(null);
      setEditedData({});
      alert("Agreement updated successfully!");
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSavingRows((prev) => {
        const s = new Set(prev);
        s.delete(agreementId);
        return s;
      });
    }
  };

  const deleteRow = async (agreementId) => {
    if (!window.confirm("Delete this agreement?")) return;
    try {
      setDeletingRows((prev) => new Set(prev).add(agreementId));
      await agreementService.deleteAgreement(agreementId);
      
      const removeData = (data) => data.filter((a) => a.agreement_id !== agreementId);
      
      if (activeTab === "Withdrawn") {
        setWithdrawnData(removeData);
        setDisplayData(removeData);
      } else {
        setAllArchiveData(removeData);
        setDisplayData(removeData);
      }
      
      if (editingRow === agreementId) cancelEditing();
      alert("Deleted successfully.");
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally {
      setDeletingRows((prev) => {
        const s = new Set(prev);
        s.delete(agreementId);
        return s;
      });
    }
  };

  const handleMassDelete = async () => {
    if (selectedIds.size === 0) {
      alert("Please select agreements to delete.");
      return;
    }
    if (!window.confirm(`WARNING: This action cannot be undone!\n\nAre you sure you want to permanently delete ${selectedIds.size} selected agreement(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedIds).map(id => 
        agreementService.deleteAgreement(id)
      );
      await Promise.all(deletePromises);

      const removeData = (data) => data.filter((a) => !selectedIds.has(a.agreement_id));
      
      if (activeTab === "Withdrawn") {
        setWithdrawnData(removeData);
        setDisplayData(removeData);
      } else {
        setAllArchiveData(removeData);
        setDisplayData(removeData);
      }

      setSelectedIds(new Set());
      alert(`${selectedIds.size} agreement(s) deleted successfully.`);
    } catch (err) {
      alert("Mass delete failed: " + err.message);
    }
  };

  const handleReactivate = async (agreementId) => {
    if (activeTab !== "Withdrawn") {
      alert("Only withdrawn agreements can be reactivated.");
      return;
    }

    if (!window.confirm("Reactivate this agreement?")) return;
    try {
      await agreementService.updateAgreement(agreementId, { 
        agreement_status: "Initial Review"  // Change status to Initial Review instead of Active
      });
      
      const removeData = (data) => data.filter((a) => a.agreement_id !== agreementId);
      setWithdrawnData(removeData(withdrawnData));
      setDisplayData(removeData(displayData));
      
      alert("Agreement reactivated successfully!");
    } catch (err) {
      alert("Reactivate failed: " + err.message);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentData.map(item => item.agreement_id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const closeModal = () => setSelectedAgreement(null);

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  const LogoSrc = (lp) => {
    if (!lp) return null;
    try {
      if (typeof lp === "string") {
        if (lp.startsWith("data:image")) return lp;
        if (lp.startsWith("iVBORw0")) return `data:image/png;base64,${lp}`;
        if (lp.startsWith("/9j/")) return `data:image/jpeg;base64,${lp}`;
        if (lp.startsWith("http://") || lp.startsWith("https://")) return lp;
        return `${API_BASE_URL.replace(/\/$/, "")}/${lp.replace(/^\/+/, "")}`;
      }
    } catch (err) {
      console.warn("LogoSrc error:", err, lp);
    }
    return null;
  };

  const reportLabelMap = {
    all: "Complete Archives Report",
    expired: "Expired Agreements Report",
    withdrawn: "Withdrawn Agreements Report",
  };

  const reportItems = (() => {
    if (reportType === "expired") return allArchiveData;
    if (reportType === "withdrawn") return withdrawnData;
    return [...allArchiveData, ...withdrawnData];
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
        return `<tr>
            <td>${escapeHtml(r.document_type)}</td>
            <td>${escapeHtml(r.dts_number)}</td>
            <td>${escapeHtml(r.partner_name || r.name || "")}</td>
            <td>${escapeHtml(r.partnership_type)}</td>
            <td>${escapeHtml(r.date_expiry ? new Date(r.date_expiry).toLocaleDateString() : "")}</td>
            <td>${escapeHtml(r.agreement_status)}</td>
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
                <th>Type</th><th>DTS</th><th>Partner</th><th>Classification</th><th>Expiry</th><th>Status</th>
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
    const headers = ['Type','DTS Number','Partner','Country','Classification','ExpiryDate','Status'];
    const csvRows = [headers.join(",")];

    reportItems.forEach((r) => {
      const row = [
        safeCsv(r.document_type),
        safeCsv(r.dts_number),
        safeCsv(r.partner_name || r.name || ""),
        safeCsv(r.country),
        safeCsv(r.partnership_type),
        safeCsv(r.date_expiry || ""),
        safeCsv(r.agreement_status),
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-archive-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

const renderEditableCell = (item, field, value) => {
  const isEditing = editingRow === item.agreement_id;
  const editableFields = [
    "source_unit", "dts_number", "dts_status", "name", "entity_type", "country", "region", "address",
    "document_type", "partnership_type", "event_info", "validity_period", "date_signed", "date_expiry",
    "date_received", "date_endorsed_to_ulco", "date_ulco_approved", "date_signed_by_pup", "agreement_status",
    "website_url", "description", "hardcopy_location"
  ];

  if (field === 'document_type' && !isEditing) {
    return renderDocumentTypeBadge(value);
  }

  if (!isEditing || !editableFields.includes(field)) return value || "—";

  if (field === "agreement_status") {
    return (
      <select
        value={editedData[field] || ""}
        onChange={(e) => handleInputChange(field, e.target.value)}
        style={{ width: "160px" }}
      >
      <option value="">Select Status</option>
      <option value="InitialReview">Initial Review</option>
      <option value="Endorse">Endorse to ULCO for Review and Approval</option>
      <option value="Revert">Revert To Initiator with Comments</option>
      <option value="Consultation">For Consultation </option>
      <option value="Replication">Replication of Copies (8 sets)</option>
      <option value="SignituresPUP">For Signatures of PUP Officials</option>
      <option value="SignedPUP">Signed by PUP Officials</option>
      <option value="SignituresPartner">For Signatures of Partner</option>
      <option value="SignedPartner">Signed by Partner Institution</option>
      <option value="Complete">Completely Signed</option>
      <option value="Notary">For Notary</option>
      <option value="FFUPCopy">FFUP Copy From College/Campus</option>
      <option value="Active">Active</option>
      <option value="Withdrawn">Withdrawn</option>
      </select>
    );
  }
  if (field === "dts_status") {
    return (
      <select
        value={editedData[field] || ""}
        onChange={(e) => handleInputChange(field, e.target.value)}
        style={{ width: "160px" }}
      >
        <option value="">Select Status</option>
        <option value="Open - OIA">Open - OIA</option>
        <option value="Closed - OIA">Closed - OIA</option>
        <option value="Open - Other Office">Open - Other Office</option>
        <option value="Closed - Other Office">Closed - Other Office</option>
      </select>
    );
  }

  

  if (field === 'document_type' && !isEditing) {
    return renderDocumentTypeBadge(value);
  }

  if (field.includes("date")) {
    return (
      <input
        type="date"
        value={editedData[field] || ""}
        onChange={(e) => handleInputChange(field, e.target.value)}
        style={{ width: "120px" }}
      />
    );
  }
  return (
    <input
      type="text"
      value={editedData[field] || ""}
      onChange={(e) => handleInputChange(field, e.target.value)}
      style={{ width: "120px" }}
    />
  );
};

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={() => setMobileShow(!mobileShow)} />
      {mobileShow && (
        <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />
      )}
      <div className="content-body">
        <Sidebar
          collapsed={collapsed}
          toggleCollapse={() => setCollapsed(!collapsed)}
          mobileShow={mobileShow}
        />
        <div
          className="main-content"
          onClick={() => mobileShow && setMobileShow(false)}
        >
          {loading ? (
            <div className="lloading-container">
              <div className="spinner"></div>
              <p>Loading Archives...</p>
            </div>
          ) : (
            <>
          <div className="archive-main">
            <h2 className="archive-title">Archives</h2>
        
          <div className="stats-row">
            {stats.map((s, i) => (
              <button
                key={i}
                className={`stat-card-row ${
                  activeTab === s.label ? "active" : ""
                }`}
                onClick={() => filterByStat(s.label)}
              >
                <div className="stat-icon-row">
                  {s.label === "Expired" ? <FiArchive size={24} /> : <FiAlertCircle size={24} />}
                </div>
                <div className="stat-content">
                  <span className="stat-number-row">{s.count}</span>
                  <span className="stat-label-row">
                    Total {s.label} Agreements
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="archive-table-section">
            <div className="table-controls">
              <div className="table-search-wrapper">
                <div className="table-search">
                  <input
                    type="search"
                    placeholder="Search DTS, partner, type..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  {searchTerm && (
                    <button
                      className="clear-search"
                      onClick={() => setSearchTerm("")}
                    >
                      <FiX />
                    </button>
                  )}
                </div>

                <div className="filter-tabs">
                  <button 
                    className={selectedFilter === "all" ? "active" : ""}
                    onClick={() => setSelectedFilter("all")}
                  >
                    All {activeTab} Agreements
                  </button>
                  <button 
                    className={selectedFilter === "moa" ? "active" : ""}
                    onClick={() => setSelectedFilter("moa")}
                  >
                    MOA
                  </button>
                  <button 
                    className={selectedFilter === "mou" ? "active" : ""}
                    onClick={() => setSelectedFilter("mou")}
                  >
                    MOU
                  </button>
                  <button 
                    className={selectedFilter === "linked" ? "active" : ""}
                    onClick={() => setSelectedFilter("linked")}
                  >
                    Linked Agreements
                  </button>
                </div>
              </div>

              <div className="table-actions">
                {selectedIds.size > 0 && (
                  <>
                    <button 
                      className="mass-download-btn"
                      onClick={handleMassDownload}
                      disabled={isDownloading}
                    >
                      <FiDownload />
                      Download Selected ({selectedIds.size})
                    </button>

                      {currentUser?.user_role?.toLowerCase() === "admin" && (
                        <button className="mass-delete-btn clean-btn" onClick={handleMassDelete}>
                          <FiTrash2 style={{marginRight:6, verticalAlign:'middle'}} />
                          <span style={{verticalAlign:'middle'}}>Delete Selected ({selectedIds.size})</span>
                        </button>
                      )}
                  </>
                )}
              </div>
            </div>



            <div className="archive-table">
              <table>
                <thead>
                  <tr>
                    {currentUser?.user_role?.toLowerCase() === "admin" && (
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedIds.size === currentData.length && currentData.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th>TYPE</th>
                    <th>DTS NUMBER</th>
                    <th>PARTNER NAME</th>
                    <th>CLASSIFICATION</th>
                    <th>EXPIRE DATE</th>
                    <th>POINT PERSON</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <tr key={index}>
                        {currentUser?.user_role?.toLowerCase() === "admin" && (
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(item.agreement_id)}
                              onChange={() => toggleSelect(item.agreement_id)}
                            />
                          </td>
                        )}
                        <td>
                          <span className={`badge ${String(item.document_type || "").toLowerCase()}`}>
                            {item.document_type}
                          </span>
                        </td>
                        <td className="dts-number">{item.dts_number}</td>
                        <td><b>{item.partner_name || item.name}</b></td>
                        <td>{item.partnership_type}</td>
                        <td>{item.date_expiry}</td>
                        <td>{item.point_persons_display}</td>
                        <td>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              className="icon-btn view"
                              onClick={() => setSelectedAgreement(item)}
                              title="View details"
                            >
                              <FiEye className="icon" />
                            </button>
                            <button
                              className="icon-btn download"
                              onClick={() => handleViewLatestFile(item.dts_number, true)}
                              title="Download file"
                            >
                              <FiDownload className="icon" />
                            </button>
                            {currentUser?.user_role?.toLowerCase() === "admin" && (
                              <>
                                {activeTab === "Withdrawn" && (
                                  <button
                                    className="icon-btn reactivate"
                                    onClick={() => handleReactivate(item.agreement_id)}
                                    title="Reactivate to Initial Review"
                                  >
                                    <FiRefreshCw className="icon" />
                                  </button>
                                )}
                                <button
                                  className="icon-btn delete"
                                  onClick={() => deleteRow(item.agreement_id)}
                                  disabled={deletingRows.has(item.agreement_id)}
                                  title="Delete permanently"
                                >
                                  <FiTrash2 className="icon" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={currentUser?.user_role?.toLowerCase() === "admin" ? "8" : "7"} style={{ textAlign: "center" }}>
                        No results found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    className={`page-btn ${currentPage === index + 1 ? "active" : ""}`}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className="report-generator-card">
            <div className="report-header">
              <div className="report-icon">📄</div>
              <div>
                <h4>Report Generator</h4>
                <div className="report-sub">Generate comprehensive reports for archived agreements</div>
              </div>
            </div>

            <div className="report-controls">
              <div className="report-select">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="all">All Archive</option>
                  <option value="expired">Expired Only</option>
                  <option value="withdrawn">Withdrawn Only</option>
                </select>
              </div>

              <div className="report-actions">
                <button
                  className="btn btn-primary btn-print"
                  onClick={generatePrintableReport}
                >
                  <span className="btn-icon">🖨️</span>
                  <span>Generate Report</span>
                </button>

                <button
                  className="btn btn-outline btn-csv"
                  onClick={downloadCSV}
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
          </>
        )}
      </div>
    </div>

      {selectedAgreement && (
        <div className="agreement-modal-backdrop" onClick={closeModal}>
          <div className="agreement-modal" onClick={(e) => e.stopPropagation()}>
            <header className="agreement-modal-header">
              <div className="modal-badge-row">
                <span className={`badge ${String(selectedAgreement.document_type || "").toLowerCase()}`}>
                  {selectedAgreement.document_type}
                </span>
                <h2 className="modal-title">{selectedAgreement.event_title || selectedAgreement.partner_name || selectedAgreement.name}</h2>
              </div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </header>

            <div className="agreement-modal-body">
              <section className="modal-section docinfo">
                <h4>Document Information</h4>
                <div className="row two-col">
                  <div>
                    <div className="label">DTS Number</div>
                    <div className="value mono">{selectedAgreement?.dts_number || "—"}</div>
                  </div>

                  <div>
                    <div className="label">Hardcopy Locator</div>
                    <div className="value">{selectedAgreement?.hardcopy_location || "—"}</div>
                  </div>

                  <div>
                    <div className="label">Date Signed</div>
                    <div className="value">{selectedAgreement?.date_signed ? new Date(selectedAgreement.date_signed).toLocaleDateString() : "—"}</div>
                  </div>

                  <div>
                    <div className="label">Expiry Date</div>
                    <div className="value">{selectedAgreement?.date_expiry ? new Date(selectedAgreement.date_expiry).toLocaleDateString() : "—"}</div>
                  </div>
                </div>

                <div className="label">Brief Profile</div>
                <div className="brief">{selectedAgreement?.brief_profile || selectedAgreement?.description || "—"}</div>
              </section>

              <section className="modal-section partner">
                <h4>Partner Information</h4>

                <div className="partner-top">
                  <div className="partner-logo">
                    {LogoSrc(selectedAgreement?.logo_path || selectedAgreement?.logo_url) ? (
                      <img
                        src={LogoSrc(selectedAgreement?.logo_path || selectedAgreement?.logo_url)}
                        alt={`${selectedAgreement?.partner_name || selectedAgreement?.name || 'Partner'} logo`}
                        onError={(e) => {
                          console.warn("Logo failed to load:", e.target.src);
                          e.target.onerror = null;
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="partner-fallback">{getInitials(selectedAgreement?.partner_name || selectedAgreement?.name)}</div>
                    )}
                  </div>

                  <div className="partner-details">
                    <div className="row two-col">
                      <div>
                        <div className="label">Organization</div>
                        <div className="value">{selectedAgreement?.partner_name || selectedAgreement?.name || "—"}</div>
                      </div>
                      <div>
                        <div className="label">Country</div>
                        <div className="value">{selectedAgreement?.country || "—"}</div>
                      </div>
                      <div>
                        <div className="label">Region</div>
                        <div className="value">{selectedAgreement?.region || "—"}</div>
                      </div>
                      <div>
                        <div className="label">Address</div>
                        <div className="value">{selectedAgreement?.address || "—"}</div>
                      </div>
                      <div>
                        <div className="label">Website</div>
                        <div className="value">
                          {selectedAgreement?.website_url ? (
                            <a href={selectedAgreement.website_url} target="_blank" rel="noreferrer">{selectedAgreement.website_url}</a>
                          ) : "—"}
                        </div>
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
                    <div className="contact-name">{selectedAgreement?.point_persons_display || "N/A"}</div>
                    <div className="contact-org">{selectedAgreement?.source_unit || selectedAgreement?.source || "—"}</div>
                  </div>

                  <div className="contact-card alt">
                    <div className="contact-role">Partner Contact Person</div>
                    <div className="contact-name">{selectedAgreement?.contact_persons_display || "N/A"}</div>
                    <div className="contact-org">{selectedAgreement?.partner_name || selectedAgreement?.name || "—"}</div>
                  </div>
                </div>
              </section>

              <section className="modal-section timeline">
                <h4>Agreement Timeline</h4>
                <div className="row two-col">
                  <div>
                    <div className="label">Date of Signing</div>
                    <div className="value">{selectedAgreement.date_signed ? new Date(selectedAgreement.date_signed).toLocaleDateString() : "—"}</div>
                  </div>
                  <div>
                    <div className="label">Expiry Date</div>
                    <div className="value">{selectedAgreement.date_expiry ? new Date(selectedAgreement.date_expiry).toLocaleDateString() : "—"}</div>
                  </div>
                  <div>
                    <div className="label">Validity Period</div>
                    <div className="value">{selectedAgreement.validity_period || "—"} {selectedAgreement.validity_period ? "years" : ""}</div>
                  </div>
                  <div>
                    <div className="label">Status</div>
                    <div className="value status-pill archived">{selectedAgreement.agreement_status || activeTab}</div>
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
              <button className="btn view" onClick={() => handleViewLatestFile(selectedAgreement.dts_number)}>
                <FiDownload className="icon" /> Download File
              </button>
              {currentUser?.user_role?.toLowerCase() === "admin" && activeTab === "Withdrawn" && (
                <button className="btn reactivate" onClick={() => {
                  handleReactivate(selectedAgreement.agreement_id);
                  closeModal();
                }}>
                  <FiRefreshCw /> Reactivate Agreement
                </button>
              )}
            </footer>
          </div>
        </div>
      )}
  </div>
);
};

export default Archive;