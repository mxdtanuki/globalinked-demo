import React, { useEffect, useState } from "react";
import { agreementService } from "../services/agreementService";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "./archive.css";
import { documentService } from "../services/documentService";
import { useNavigate } from "react-router-dom";

const Archive = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDocType, setFilterDocType] = useState("");
  const [filterClassification, setFilterClassification] = useState("");
  const [allArchiveData, setAllArchiveData] = useState([]);
  const [withdrawnData, setWithdrawnData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [activeTab, setActiveTab] = useState("Expired");
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [savingRows, setSavingRows] = useState(new Set());
  const [deletingRows, setDeletingRows] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const itemsPerPage = 10;

  // Fetch Expired + Withdrawn stats and data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Expired archive
        const archiveRes = await agreementService.getArchivedAgreements();
        const expiredOnly = archiveRes.filter(
          (d) =>
            d.status?.toLowerCase() === "expired" ||
            (d.date_expiry && new Date(d.date_expiry) < new Date())
        );

        // Withdrawn agreements
        const allAgreements = await agreementService.getAgreements();
        const withdrawnOnly = allAgreements.filter(
          (a) => a.agreement_status?.toLowerCase() === "withdrawn"
        );
        console.log("All agreements:", allAgreements);
        console.log("Withdrawn found:", withdrawnOnly);

        setAllArchiveData(expiredOnly);
        setWithdrawnData(withdrawnOnly);
        setDisplayData(expiredOnly);

        // Compute stats
        setStats([
          { label: "Expired", count: expiredOnly.length },
          { label: "Withdrawn", count: withdrawnOnly.length },
        ]);
      } catch (err) {
        console.error("Failed to load archive data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Switch view (Expired / Withdrawn)
  const filterByStat = (label) => {
    setActiveTab(label);
    setCurrentPage(1);
    setSearchTerm("");
    setFilterDocType("");
    setFilterClassification("");

    if (label === "Expired") {
      setDisplayData(allArchiveData);
    } else if (label === "Withdrawn") {
      setDisplayData(withdrawnData);
    }
  };

  // Filtering + Search logic
  const filteredData = displayData.filter((item) => {
    const searchMatch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const docTypeMatch = filterDocType
      ? item.document_type === filterDocType
      : true;
    const classificationMatch = filterClassification
      ? item.partnership_type === filterClassification
      : true;

    return searchMatch && docTypeMatch && classificationMatch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleViewLatestFile = async (dtsNumber) => {
    try {
      const latest = await documentService.getLatestVersion(dtsNumber);
      if (!latest) {
        alert("No document versions found for this DTS number.");
        return;
      }
      const resp = await fetch(latest.download_url, {
        headers: { Accept: "application/pdf" },
      });
      if (!resp.ok) throw new Error(`Failed to fetch file (${resp.status})`);
      const blob = await resp.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error("View failed:", err);
      alert("Failed to open file: " + (err.message || err));
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

      // Edit handlers
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

    // Update Withdrawn data and display data
    setWithdrawnData((prev) =>
      prev
        .map((a) => (a.agreement_id === agreementId ? editedData : a))
        .filter((a) => a.agreement_status?.toLowerCase() === "withdrawn")
    );
    setDisplayData((prev) =>
      prev
        .map((a) => (a.agreement_id === agreementId ? editedData : a))
        .filter((a) => a.agreement_status?.toLowerCase() === "withdrawn")
    );

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
      setWithdrawnData((prev) =>
        prev.filter((a) => a.agreement_id !== agreementId)
      );
      setDisplayData((prev) =>
        prev.filter((a) => a.agreement_id !== agreementId)
      );
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

const renderEditableCell = (item, field, value) => {
  const isEditing = editingRow === item.agreement_id;
  const editableFields = [
    "source_unit", "dts_number", "dts_status", "name", "entity_type", "country", "region", "address",
    "document_type", "partnership_type", "event_info", "validity_period", "date_signed", "date_expiry",
    "date_received", "date_endorsed_to_ulco", "date_ulco_approved", "date_signed_by_pup", "agreement_status",
    "website_url", "description", "hardcopy_location"
  ];

  if (!isEditing || !editableFields.includes(field)) return value || "—";

  // Dropdowns for specific fields
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
  if (field === "document_type") {
    return (
      <select
        value={editedData[field] || ""}
        onChange={(e) => handleInputChange(field, e.target.value)}
        style={{ width: "120px" }}
      >
        <option value="">Select Type</option>
        <option value="MOA">MOA</option>
        <option value="MOU">MOU</option>
      </select>
    );
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
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <span className="loader" /> {/* Optional: add a spinner CSS class */}
              <p>Loading archive data...</p>
            </div>
          ) : (
            <>
          <h2 className="archive-title">Archives</h2>
        
          {/* Stats Row */}
          <div className="stats-row">
            {stats.map((s, i) => (
              <button
                key={i}
                className={`stat-card ${
                  activeTab === s.label ? "active-tab" : ""
                }`}
                onClick={() => filterByStat(s.label)}
              >
                <div className="stat-number">{s.count}</div>
                <div className="stat-label">{s.label}</div>
              </button>
            ))}
          </div>

          <div className="contact-person-wrapper">
            {/* Search & Filter Bar */}
            <div className="search-filter-bar">
              <input
                type="text"
                placeholder="Search here"
                className="search-input"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <button
                className="filter-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                Filter
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="filter-options">
                <select
                  value={filterDocType}
                  onChange={(e) => {
                    setFilterDocType(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Document Types</option>
                  {[...new Set(displayData.map((d) => d.document_type))].map(
                    (doc, i) => (
                      <option key={i} value={doc}>
                        {doc}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filterClassification}
                  onChange={(e) => {
                    setFilterClassification(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Classifications</option>
                  {[...new Set(displayData.map((d) => d.partnership_type))].map(
                    (cls, i) => (
                      <option key={i} value={cls}>
                        {cls}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* TABLES */}
            <div className="table-container">
              {activeTab === "Expired" ? (
                <table className="contact-person-table">
                  <thead>
                    <tr>
                      <th>PARTNER NAME</th>
                      <th>DOCUMENT TYPE</th>
                      <th>PARTNERSHIP CLASSIFICATION</th>
                      <th>EXPIRE DATE</th>
                      <th>POINT PERSON</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.length > 0 ? (
                      currentData.map((item, index) => (
                        <tr key={index}>
                          <td>{item.partner_name}</td>
                          <td>{item.document_type}</td>
                          <td>{item.partnership_type}</td>
                          <td>{item.date_expiry}</td>
                          <td>{item.point_persons_display}</td>
                          <td>
                            <button
                              className="view-btn"
                              onClick={() =>
                                handleViewLatestFile(item.dts_number)
                              }
                            >
                              View File
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center" }}>
                          No results found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="contact-person-table">
                  <thead>
                    <tr>
                      <th>SOURCE</th>
                      <th>POINT PERSON / POSITION</th>
                      <th>DTS NO.</th>
                      <th>DTS LOCATION</th>
                      <th>PARTNER'S NAME</th>
                      <th>ENTITY TYPE</th>
                      <th>COUNTRY</th>
                      <th>REGION</th>
                      <th>ADDRESS</th>
                      <th>SIGNATORIES / POSITION</th>
                      <th>CONTACT PERSON / DETAILS</th>
                      <th>DOCUMENT TYPE</th>
                      <th>PARTNERSHIP CLASSIFICATION</th>
                      <th>EVENT TITLE / OTHER IMPT INFO</th>
                      <th>VALIDITY PERIOD</th>
                      <th>DATE OF SIGNING</th>
                      <th>EXPIRY DATE</th>
                      <th>DATE RECEIVED</th>
                      <th>DATE ENDORSED TO ULCO</th>
                      <th>ULCO APPROVAL</th>
                      <th>PUP OFFICIAL SIGNATURES</th>
                      <th>STATUS</th>
                      <th>WEBSITE LINK</th>
                      <th>BRIEF PROFILE</th>
                      <th>LOGO</th>
                      <th>HARDCOPY LOCATOR</th>
                      <th>REMARKS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.length > 0 ? (
                      currentData.map((item, index) => (
                        <tr key={index}>
                          <td>{renderEditableCell(item, "source_unit", item.source_unit)}</td>
                          <td>
                            {Array.isArray(item.point_persons)
                              ? item.point_persons.map((pp, i) => (
                                  <div key={i}>
                                    {pp.point_person_position}: {pp.point_person_name} ({pp.point_person_email})
                                  </div>
                                ))
                              : "—"}
                          </td>
                          <td>{renderEditableCell(item, "dts_number", item.dts_number)}</td>
                          <td>{renderEditableCell(item, "dts_status", item.dts_status)}</td>
                          <td>{renderEditableCell(item, "name", item.name)}</td>
                          <td>{renderEditableCell(item, "entity_type", item.entity_type)}</td>
                          <td>{renderEditableCell(item, "country", item.country)}</td>
                          <td>{renderEditableCell(item, "region", item.region)}</td>
                          <td>{renderEditableCell(item, "address", item.address)}</td>
                          <td>
                            {Array.isArray(item.signatories_list) && item.signatories_list.length > 0
                              ? item.signatories_list.map((s, i) => (
                                  <div key={i}>
                                    {(s.signatory_position || s.position || "—")}: {(s.signatory_name || s.name || "—")}
                                  </div>
                                ))
                              : Array.isArray(item.signatories) && item.signatories.length > 0
                                ? item.signatories.map((s, i) => (
                                    <div key={i}>
                                      {(s.signatory_position || s.position || "—")}: {(s.signatory_name || s.name || "—")}
                                    </div>
                                  ))
                                : "—"}
                          </td>
                          <td>
                            {Array.isArray(item.contact_persons)
                              ? item.contact_persons.map((cp, i) => (
                                  <div key={i}>
                                    {cp.contact_person_position}: {cp.contact_person_name} ({cp.contact_person_email})
                                  </div>
                                ))
                              : "—"}
                          </td>
                          <td>{renderEditableCell(item, "document_type", item.document_type)}</td>
                          <td>{renderEditableCell(item, "partnership_type", item.partnership_type)}</td>
                          <td>{renderEditableCell(item, "event_info", item.event_info)}</td>
                          <td>{renderEditableCell(item, "validity_period", item.validity_period)}</td>
                          <td>{renderEditableCell(item, "date_signed", item.date_signed)}</td>
                          <td>{renderEditableCell(item, "date_expiry", item.date_expiry)}</td>
                          <td>{renderEditableCell(item, "date_received", item.date_received)}</td>
                          <td>{renderEditableCell(item, "date_endorsed_to_ulco", item.date_endorsed_to_ulco)}</td>
                          <td>{renderEditableCell(item, "date_ulco_approved", item.date_ulco_approved)}</td>
                          <td>{renderEditableCell(item, "date_signed_by_pup", item.date_signed_by_pup)}</td>
                          <td>{renderEditableCell(item, "agreement_status", item.agreement_status)}</td>
                          <td>
                            {editingRow === item.agreement_id
                              ? renderEditableCell(item, "website_url", item.website_url)
                              : item.website_url ? (
                                <a href={item.website_url} target="_blank" rel="noopener noreferrer">Link</a>
                              ) : "—"}
                          </td>
                          <td>{renderEditableCell(item, "description", item.description)}</td>
                          <td>
                            {item.logo_url ? (
                              <img src={`data:image/png;base64,${item.logo_url}`} alt="Logo" width="50" />
                            ) : "—"}
                          </td>
                          <td>{renderEditableCell(item, "hardcopy_location", item.hardcopy_location)}</td>
                          <td>
                            {Array.isArray(item.remarks)
                              ? item.remarks.map((r, i) => <div key={i}>{r.remark_text}</div>)
                              : "—"}
                          </td>
                              <td>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {editingRow === item.agreement_id ? (
                                <>
                                  {currentUser?.user_role?.toLowerCase() === "admin" && (
                                    <>
                                      <button
                                        className="view-btn"
                                        onClick={() => saveRow(item.agreement_id)}
                                        disabled={savingRows.has(item.agreement_id)}
                                      >
                                        {savingRows.has(item.agreement_id) ? "Saving..." : "Save"}
                                      </button>
                                      <button className="view-btn" onClick={cancelEditing}>Cancel</button>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  {currentUser?.user_role?.toLowerCase() === "admin" && (
                                    <>
                                      <button className="view-btn" onClick={() => startEditing(item)}>Edit</button>
                                      <button
                                        className="view-btn"
                                        onClick={() => deleteRow(item.agreement_id)}
                                        disabled={deletingRows.has(item.agreement_id)}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                  <button
                                    className="view-btn"
                                    onClick={() => handleViewLatestFile(item.dts_number)}
                                  >
                                    View File
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="27" style={{ textAlign: "center" }}>
                          No withdrawn agreements found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={currentPage === index + 1 ? "active" : ""}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);
};

export default Archive;
