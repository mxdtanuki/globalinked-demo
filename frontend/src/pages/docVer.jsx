import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "./docVer.css";
import { useSearchParams } from "react-router-dom";

const DocumentVersion = () => {
  const [searchParams] = useSearchParams();
  const prefilledDts = searchParams.get("dts_number") || "";
  const [searchQuery, setSearchQuery] = useState(prefilledDts);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDocType, setFilterDocType] = useState("");
  const [filterPartnershipType, setFilterPartnershipType] = useState("");
  const [filterVersion, setFilterVersion] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [editingDoc, setEditingDoc] = useState(null);
  const [editComment, setEditComment] = useState("");
  const [editFile, setEditFile] = useState(null);
  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);
  const itemsPerPage = 10;

  useEffect(() => {
    if (prefilledDts) {
      setSearchQuery(prefilledDts);
      setCurrentPage(1);
    }
  }, [prefilledDts]);

  // Fetch versions/all
  useEffect(() => {
    setLoading(true); 
    fetch("/documents/versions/all")
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch((err) => console.error("Failed to fetch versions:", err))
      .finally(() => setLoading(false)); 
  }, []);

  const partnershipTypes = [...new Set(documents.map((d) => d.partnership_type))];
  const versions = [...new Set(documents.map((d) => String(d.version_number)))];
  const statuses = [...new Set(documents.map((d) => d.status_at_upload))];

  const filteredDocuments = documents.filter((doc) => {
    const query = (searchQuery || "").toLowerCase();
    const matchesSearch =
      (doc.uploaded_at && new Date(doc.uploaded_at).toLocaleDateString().toLowerCase().includes(query)) ||
      (doc.partner_name && doc.partner_name.toLowerCase().includes(query)) ||
      (doc.document_type && doc.document_type.toLowerCase().includes(query)) ||
      (doc.partnership_type && doc.partnership_type.toLowerCase().includes(query)) ||
      (doc.version_number && String(doc.version_number).includes(query)) ||
      (doc.dts_number && doc.dts_number.toLowerCase().includes(query));

    const matchesDocType = filterDocType ? doc.document_type === filterDocType : true;
    const matchesPartnershipType = filterPartnershipType ? doc.partnership_type === filterPartnershipType : true;
    const matchesVersion = filterVersion ? String(doc.version_number) === filterVersion : true;
    const matchesStatus = filterStatus ? doc.status_at_upload === filterStatus : true;

    return matchesSearch && matchesDocType && matchesPartnershipType && matchesVersion && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const currentData = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Editing 
  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setEditComment(doc.version_comment || "");
    setEditFile(null);
  };

const handleSave = async () => {
  if (!editingDoc) return;

  setDocuments((prev) =>
    prev.map((d) =>
      d.version_id === editingDoc.version_id
        ? { ...d, version_comment: editComment }
        : d
    )
  );

  setEditingDoc(null);
  setEditFile(null);

  const formData = new FormData();
  formData.append("version_comment", editComment);
  if (editFile) {
    formData.append("file", editFile);
  }

  try {
    const res = await fetch(`/documents/versions/${editingDoc.version_id}`, {
      method: "PUT",
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to update");
    const data = await res.json();

    if (data.version) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.version_id === editingDoc.version_id
            ? { ...d, ...data.version }
            : d
        )
      );
    }
  } catch (err) {
    console.error("Background update failed:", err);
    alert("File upload failed, but comment was saved locally.");
  }
};

  const handleDelete = async (versionId) => {
  if (!window.confirm("Are you sure you want to delete this version?")) return;

    try {
      const res = await fetch(`/documents/versions/${versionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Delete failed: ${err.detail}`);
        return;
      }

      setDocuments((prev) => prev.filter((d) => d.version_id !== versionId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // { dts_number: max_version_number }
  const latestByDts = documents.reduce((acc, doc) => {
    if (!acc[doc.dts_number] || doc.version_number > acc[doc.dts_number]) {
      acc[doc.dts_number] = doc.version_number;
    }
    return acc;
  }, {});


  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}
      <div className="content-body">
        <Sidebar collapsed={collapsed} toggleCollapse={toggleCollapse} mobileShow={mobileShow} />
        <div className="main-content" onClick={() => mobileShow && setMobileShow(false)}>
          <h2 className="doc-ver-title">Document Version Control</h2>

          <div className="contact-person-wrapper">
            {/* Search + Filter toggle button */}
            <div className="search-filter-bar">
              <input
                type="text"
                placeholder="Search here"
                className="search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <button
                className="filter-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? " Filters" : " Filters"}
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="filter-section">
                <select
                  value={filterDocType}
                  onChange={(e) => {
                    setFilterDocType(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Document Types</option>
                  <option value="MOA">MOA</option>
                  <option value="MOU">MOU</option>
                </select>

                <select
                  value={filterPartnershipType}
                  onChange={(e) => {
                    setFilterPartnershipType(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Partnership Types</option>
                  {partnershipTypes.map((type, i) => (
                    <option key={i} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <select
                  value={filterVersion}
                  onChange={(e) => {
                    setFilterVersion(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Versions</option>
                  {versions.map((v, i) => (
                    <option key={i} value={v}>
                      {v}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Status</option>
                  {statuses.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Table */}
            <div className="table-container">
              <table className="contact-person-table">
                <thead>
                  <tr>
                    <th>UPLOAD DATE</th>
                    <th>DTS NUMBER</th>
                    <th>PARTNER NAME</th>
                    <th>DOCUMENT TYPE</th>
                    <th>PARTNERSHIP TYPE</th>
                    <th>VERSION</th>
                    <th>COMMENTS</th>
                    <th>STATUS AT UPLOAD</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                    {loading ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>
                        Loading records...
                      </td>
                    </tr>
                  ) : currentData.length > 0 ? (
                    currentData.map((doc) => (
                      <React.Fragment key={doc.version_id}>
                        <tr>
                          <td>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                          <td>{doc.dts_number}</td>
                          <td>{doc.partner_name}</td>
                          <td>{doc.document_type}</td>
                          <td>{doc.partnership_type}</td>
                          <td>{doc.version_number}</td>
                          <td>{doc.version_comment || "-"}</td>
                          <td>{doc.status_at_upload || "-"}</td>
                          <td>
                            <div className="docu-action-buttons">
                              <div className="docu-top-actions">
                                <button className="docu-edit-btn" onClick={() => handleEdit(doc)}>
                                  Edit
                                </button>
                                <button
                                  className="docu-delete-btn"
                                  disabled={doc.version_number !== latestByDts[doc.dts_number]}
                                  onClick={() => handleDelete(doc.version_id)}
                                >
                                  Delete
                                </button>
                              </div>
                              <div className="docu-bottom-action">
                                <button
                                  className="docu-view-btn"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(doc.download_url, {
                                        headers: { Accept: "application/pdf" },
                                      });
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      window.open(url, "_blank");
                                    } catch (err) {
                                      console.error("View failed:", err);
                                    }
                                  }}
                                >
                                  View
                                </button>
                                <button
                                  className="docu-download-btn"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(doc.download_url, {
                                        headers: { Accept: "application/pdf" },
                                      });
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement("a");
                                      link.href = url;
                                      link.download = `${doc.dts_number}_v${doc.version_number}.pdf`;
                                      document.body.appendChild(link);
                                      link.click();
                                      link.remove();
                                      window.URL.revokeObjectURL(url);
                                    } catch (err) {
                                      console.error("Download failed:", err);
                                    }
                                  }}
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {editingDoc?.version_id === doc.version_id && (
                          <tr className="edit-row">
                            <td colSpan="9">
                              <div className="edit-form-expanded">
                                <textarea
                                  value={editComment}
                                  onChange={(e) => setEditComment(e.target.value)}
                                  placeholder="Edit comment"
                                />
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => setEditFile(e.target.files[0])}
                                />
                                <div className="inline-edit-actions">
                                  <button className="save-btn" onClick={handleSave}>Save</button>
                                  <button className="cancel-btn" onClick={() => setEditingDoc(null)}>Cancel</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center" }}>
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
                </table>
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
        </div>
      </div>
    </div>
  );
};

export default DocumentVersion;
