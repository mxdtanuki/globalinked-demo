import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "./docVer.css";
import { useSearchParams } from "react-router-dom";
import { renderDocumentTypeBadge } from "../utils/documentTypeUtils";
import { documentService } from "../services/documentService";
import {
  FiEye,
  FiDownload,
  FiFilter,
  FiX,
  FiTrash2,
  FiEdit,
  FiSave,
  FiXCircle,
  FiRefreshCw,
  FiFile,
  FiSettings,
  FiFileText,
  FiCalendar,
} from "react-icons/fi";

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
  const fileInputRef = useRef(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);
  const itemsPerPage = 10;
  const [tempDocType, setTempDocType] = useState("");
  const [tempPartnershipType, setTempPartnershipType] = useState("");
  const [tempVersion, setTempVersion] = useState("");
  const [tempStatus, setTempStatus] = useState("");

  const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    allowClear = false,
  }) => {
    const normalized = options.map((o) =>
      typeof o === "string" ? { value: o, label: o } : o
    );
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef();
    const panelRef = useRef(null);
    const searchInputRef = useRef(null);
    const [panelStyle, setPanelStyle] = useState(null);

    useEffect(() => {
      const onDocClick = (e) => {
        const clickInsideToggle = ref.current && ref.current.contains(e.target);
        const clickInsidePanel = panelRef.current && panelRef.current.contains(e.target);
        if (!clickInsideToggle && !clickInsidePanel) setOpen(false);
      };
      window.addEventListener("click", onDocClick);
      return () => window.removeEventListener("click", onDocClick);
    }, []);

    useEffect(() => {
      if (open && searchInputRef.current) {
        try {
          searchInputRef.current.focus({ preventScroll: true });
        } catch (e) {
          searchInputRef.current.focus();
        }
      }
    }, [open]);

    useEffect(() => {
      if (!open) {
        setPanelStyle(null);
        return;
      }
      const prevBodyOverflow = typeof document !== "undefined" ? document.body.style.overflow : undefined;
      const prevBodyPaddingRight = typeof document !== "undefined" ? document.body.style.paddingRight : undefined;
      try {
        if (typeof document !== "undefined") {
          // Prevent layout shift when hiding the scrollbar by compensating
          // with an equal right padding. This avoids a left-right flicker
          // when the panel opens/closes.
          const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
          if (scrollbarWidth > 0) {
            document.body.style.paddingRight = scrollbarWidth + "px";
          }
          document.body.style.overflow = "hidden";
        }
      } catch (e) {
      }

      const updatePosition = () => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const viewportPadding = 8;
        const maxAllowed = window.innerWidth - viewportPadding * 2;
        const desiredWidth = Math.min(Math.max(rect.width, 120), Math.min(320, maxAllowed));
        const left = Math.max(viewportPadding, rect.left);
        const top = rect.bottom;
        // Use fixed positioning so the panel is anchored to viewport coordinates
        setPanelStyle({ position: "fixed", left: left + "px", top: top + "px", width: desiredWidth + "px", zIndex: 9999 });
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
        try {
          if (typeof document !== "undefined") {
            document.body.style.overflow = prevBodyOverflow || "";
            document.body.style.paddingRight = prevBodyPaddingRight || "";
          }
        } catch (e) {
          // ignore
        }
      };
    }, [open]);

    const filtered = normalized.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );
    const selectedLabel =
      normalized.find((o) => String(o.value) === String(value))?.label || "";

    return (
      <div
        className="searchable-select"
        ref={ref}
        style={{ position: "relative" }}
      >
        <button
          type="button"
          className="ss-toggle"
          onClick={() => {
            if (!open && ref.current) {
              const rect = ref.current.getBoundingClientRect();
              const viewportPadding = 8;
              const maxAllowed = window.innerWidth - viewportPadding * 2;
              const desiredWidth = Math.min(
                Math.max(rect.width, 120),
                Math.min(320, maxAllowed)
              );
              const left = Math.max(viewportPadding, rect.left);
              const top = rect.bottom;
              // Set panel style immediately so the portal mounts at final coords
              setPanelStyle({
                position: "fixed",
                left: left + "px",
                top: top + "px",
                width: desiredWidth + "px",
                zIndex: 9999,
              });
            }
            setOpen((v) => !v);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          style={{ whiteSpace: "nowrap" }}
        >
          <span className={`ss-value ${selectedLabel ? "" : "placeholder"}`}>
            {selectedLabel || placeholder}
          </span>
          <span className="ss-caret">▾</span>
        </button>
        {allowClear && selectedLabel && (
          <button
            className="ss-clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
        {open &&
          createPortal(
            <div
              ref={panelRef}
              className="ss-panel"
              role="dialog"
              style={{
                ...panelStyle,
                background: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                marginTop: 6,
                maxHeight: 260,
                overflow: "auto",
              }}
            >
              <div style={{ padding: 8 }}>
                <input
                  ref={searchInputRef}
                  className="ss-search"
                  placeholder="Type to search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
              <ul
                className="ss-list"
                role="listbox"
                aria-label="options"
                style={{ listStyle: "none", margin: 0, padding: 0 }}
              >
                {filtered.length === 0 && (
                  <li style={{ padding: 8, color: "#666" }}>No results</li>
                )}
                {filtered.map((o) => (
                  <li
                    key={o.value}
                    className="ss-item"
                    style={{ padding: 8, cursor: "pointer" }}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {o.label}
                  </li>
                ))}
              </ul>
            </div>,
            document.body
          )}
      </div>
    );
  };

  useEffect(() => {
    if (prefilledDts) {
      setSearchQuery(prefilledDts);
      setCurrentPage(1);
    }
  }, [prefilledDts]);

  // Fetch versions/all
  useEffect(() => {
    setLoading(true);
    documentService
      .getAllVersions()
      .then((data) => setDocuments(data || []))
      .catch((err) => console.error("Failed to fetch versions:", err))
      .finally(() => setLoading(false));
  }, []);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setCurrentUser(parsedUser);

        if (
          parsedUser.user_role &&
          parsedUser.user_role.toLowerCase() === "admin"
        ) {
          setIsAdmin(true);
          console.log("Is Admin:", true);
        } else {
          setIsAdmin(false);
          console.log("Is Admin:", false);
        }
      }
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
    }
  }, []);

  const partnershipTypes = [
    ...new Set(documents.map((d) => d.partnership_type)),
  ];
  const versions = [...new Set(documents.map((d) => String(d.version_number)))];
  const statuses = [...new Set(documents.map((d) => d.status_at_upload))];

  const filteredDocuments = documents.filter((doc) => {
    const query = (searchQuery || "").toLowerCase();
    const matchesSearch =
      (doc.uploaded_at &&
        new Date(doc.uploaded_at)
          .toLocaleDateString()
          .toLowerCase()
          .includes(query)) ||
      (doc.partner_name && doc.partner_name.toLowerCase().includes(query)) ||
      (doc.document_type && doc.document_type.toLowerCase().includes(query)) ||
      (doc.partnership_type &&
        doc.partnership_type.toLowerCase().includes(query)) ||
      (doc.version_number && String(doc.version_number).includes(query)) ||
      (doc.dts_number && doc.dts_number.toLowerCase().includes(query));

    const matchesDocType = filterDocType
      ? doc.document_type === filterDocType
      : true;
    const matchesPartnershipType = filterPartnershipType
      ? doc.partnership_type === filterPartnershipType
      : true;
    const matchesVersion = filterVersion
      ? String(doc.version_number) === filterVersion
      : true;
    const matchesStatus = filterStatus
      ? doc.status_at_upload === filterStatus
      : true;

    return (
      matchesSearch &&
      matchesDocType &&
      matchesPartnershipType &&
      matchesVersion &&
      matchesStatus
    );
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
    if (!isAdmin) {
      alert("You do not have permission to edit this version.");
      return;
    }
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
      const data = await documentService.updateVersion(
        editingDoc.version_id,
        formData
      );
      if (data?.version) {
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
    if (!isAdmin) {
      alert("You do not have permission to delete this version.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this version?"))
      return;

    try {
      await documentService.deleteVersion(versionId);
      setDocuments((prev) => prev.filter((d) => d.version_id !== versionId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const latestByDts = documents.reduce((acc, doc) => {
    if (!acc[doc.dts_number] || doc.version_number > acc[doc.dts_number]) {
      acc[doc.dts_number] = doc.version_number;
    }
    return acc;
  }, {});

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
              <p>Loading document versions...</p>
            </div>
          ) : (
            <>
              <h2 className="doc-ver-title">Document Version Control</h2>

              <div className="contact-person-wrapper">
                {/* Search + Filter toggle button */}
                <div className="overview1-controls-row">
                  <input
                    type="text"
                    placeholder="Search here"
                    className="overview1-search-input"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <button
                    className={
                      "overview1-filter-btn " + (showFilters ? "active" : "")
                    }
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <span className="filter-icon">
                      <FiFilter size={16} />
                    </span>
                    {showFilters ? "Filters" : "Filters"}
                  </button>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="overview1-filter-panel">
                    <div
                      className="overview1-panel-row"
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-end",
                        flexWrap: "nowrap",
                        overflowX: "auto",
                      }}
                    >
                      <div
                        className="overview1-panel-field"
                        style={{ flex: "1 1 220px", minWidth: 180 }}
                      >
                        <label className="form-label">
                          <FiFile className="label-icon" /> Document Type
                        </label>
                        <SearchableSelect
                          options={[
                            { value: "MOA", label: "MOA" },
                            { value: "MOU", label: "MOU" },
                          ]}
                          value={tempDocType}
                          onChange={(v) => setTempDocType(v)}
                          placeholder="All Document Types"
                        />
                      </div>

                      <div
                        className="overview1-panel-field"
                        style={{ flex: "1 1 220px", minWidth: 180 }}
                      >
                        <label className="form-label">
                          <FiSettings className="label-icon" /> Partnership Type
                        </label>
                        <SearchableSelect
                          options={partnershipTypes.map((t) => ({
                            value: t,
                            label: t,
                          }))}
                          value={tempPartnershipType}
                          onChange={(v) => setTempPartnershipType(v)}
                          placeholder="All Partnership Types"
                        />
                      </div>

                      <div
                        className="overview1-panel-field"
                        style={{ flex: "1 1 140px", minWidth: 120 }}
                      >
                        <label className="form-label">
                          <FiFileText className="label-icon" /> Version
                        </label>
                        <SearchableSelect
                          options={versions.map((v) => ({
                            value: v,
                            label: v,
                          }))}
                          value={tempVersion}
                          onChange={(v) => setTempVersion(v)}
                          placeholder="All Versions"
                        />
                      </div>

                      <div
                        className="overview1-panel-field"
                        style={{ flex: "1 1 140px", minWidth: 120 }}
                      >
                        <label className="form-label">
                          <FiCalendar className="label-icon" /> Status
                        </label>
                        <SearchableSelect
                          options={statuses.map((s) => ({
                            value: s,
                            label: s,
                          }))}
                          value={tempStatus}
                          onChange={(v) => setTempStatus(v)}
                          placeholder="All Status"
                        />
                      </div>
                    </div>

                    <div className="overview1-filter-actions">
                      <button
                        className="btn apply"
                        onClick={() => {
                          setFilterDocType(tempDocType);
                          setFilterPartnershipType(tempPartnershipType);
                          setFilterVersion(tempVersion);
                          setFilterStatus(tempStatus);
                          setCurrentPage(1);
                        }}
                      >
                        Apply
                      </button>
                      <button
                        className="btn clear"
                        onClick={() => {
                          setTempDocType("");
                          setTempPartnershipType("");
                          setTempVersion("");
                          setTempStatus("");
                          setFilterDocType("");
                          setFilterPartnershipType("");
                          setFilterVersion("");
                          setFilterStatus("");
                          setCurrentPage(1);
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="table-container1">
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
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.length > 0 ? (
                        currentData.map((doc) => (
                          <React.Fragment key={doc.version_id}>
                            <tr>
                              <td>
                                {new Date(doc.uploaded_at).toLocaleDateString()}
                              </td>
                              <td>{doc.dts_number}</td>
                              <td>{doc.partner_name}</td>
                              <td>
                                {renderDocumentTypeBadge(doc.document_type)}
                              </td>
                              <td>{doc.partnership_type}</td>
                              <td>{doc.version_number}</td>
                              <td>{doc.version_comment || "-"}</td>
                              <td>{doc.status_at_upload || "-"}</td>
                              <td>
                                <div className="docu-action-buttons">
                                  {/* View Button */}
                                  <button
                                    className="docu-icon-btn docu-view"
                                    title="View Document"
                                    onClick={async () => {
                                      try {
                                        const signed =
                                          await documentService.getDownloadUrl(
                                            doc.version_id
                                          );
                                        const response = await fetch(
                                          signed.download_url,
                                          {
                                            headers: {
                                              Accept: "application/pdf",
                                            },
                                          }
                                        );
                                        if (!response.ok)
                                          throw new Error(
                                            `Failed to fetch file (${response.status})`
                                          );
                                        const arrayBuffer =
                                          await response.arrayBuffer();
                                        const blob = new Blob([arrayBuffer], {
                                          type: "application/pdf",
                                        });
                                        const url =
                                          window.URL.createObjectURL(blob);
                                        window.open(url, "_blank");
                                      } catch (err) {
                                        console.error("View failed:", err);
                                        alert("Failed to open file.");
                                      }
                                    }}
                                  >
                                    <FiEye className="docu-icon" />
                                  </button>

                                  {/* Download Button */}
                                  <button
                                    className="docu-icon-btn docu-download"
                                    title="Download Document"
                                    onClick={async () => {
                                      try {
                                        const signed =
                                          await documentService.getDownloadUrl(
                                            doc.version_id
                                          );
                                        const response = await fetch(
                                          signed.download_url,
                                          {
                                            headers: {
                                              Accept: "application/pdf",
                                            },
                                          }
                                        );
                                        if (!response.ok)
                                          throw new Error(
                                            `Failed to download file (${response.status})`
                                          );
                                        const arrayBuffer =
                                          await response.arrayBuffer();
                                        const blob = new Blob([arrayBuffer], {
                                          type: "application/pdf",
                                        });
                                        const url =
                                          window.URL.createObjectURL(blob);
                                        const link =
                                          document.createElement("a");
                                        link.href = url;
                                        link.download = `${doc.dts_number}_v${doc.version_number}.pdf`;
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                        window.URL.revokeObjectURL(url);
                                      } catch (err) {
                                        console.error("Download failed:", err);
                                        alert("Download failed.");
                                      }
                                    }}
                                  >
                                    <FiDownload className="docu-icon" />
                                  </button>

                                  {/* Admin Actions */}
                                  {isAdmin && (
                                    <>
                                      {/* Edit Button */}
                                      <button
                                        className="docu-icon-btn docu-edit"
                                        title="Edit Version"
                                        onClick={() => handleEdit(doc)}
                                      >
                                        <FiEdit className="docu-icon" />
                                      </button>

                                      {/* Delete Button */}
                                      <button
                                        className="docu-icon-btn docu-delete"
                                        title="Delete Version"
                                        disabled={
                                          doc.version_number !==
                                          latestByDts[doc.dts_number]
                                        }
                                        onClick={() =>
                                          handleDelete(doc.version_id)
                                        }
                                      >
                                        <FiTrash2 className="docu-icon" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Edit handled in modal*/}
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
                {/* Edit Modal */}
                {isAdmin && editingDoc && (
                  <div
                    className="docver-modal-backdrop"
                    onClick={() => setEditingDoc(null)}
                  >
                    <div
                      className="docver-modal"
                      onClick={(e) => e.stopPropagation()}
                      role="dialog"
                      aria-modal="true"
                    >
                      <div className="docver-modal-body">
                        <button
                          className="docver-modal-close"
                          onClick={() => setEditingDoc(null)}
                          aria-label="Close"
                          style={{position:'absolute',right:12,top:12}}
                        >
                          <FiX size={18} />
                        </button>
                        <div className="modal-edit-panel">
                          <div className="edit-section-header">
                            <FiEdit className="section-icon" />
                            <h4>Edit Version</h4>
                          </div>

                          <div className="edit-form-grid">
                            <div className="edit-field full-width">
                              <label className="edit-label">
                                <FiFileText className="label-icon" /> Comment
                              </label>
                              <textarea
                                className="edit-input"
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                placeholder="Edit comment"
                                style={{minHeight:100}}
                              />
                            </div>

                            <div className="edit-field full-width">
                              <label className="edit-label">
                                <FiFile className="label-icon" /> Replace File
                              </label>
                              <div className="docver-file-input">
                                <input
                                  ref={fileInputRef}
                                  name="DOC-VER-file-input"
                                  id={
                                    editingDoc
                                      ? `file-input-${editingDoc.version_id}`
                                      : "file-input"
                                  }
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => setEditFile(e.target.files[0])}
                                  style={{ display: "none" }}
                                />

                                <label
                                  htmlFor={
                                    editingDoc
                                      ? `file-input-${editingDoc.version_id}`
                                      : "file-input"
                                  }
                                  className="docver-file-label-text"
                                >
                                  Choose file
                                </label>

                                <span className="docver-file-name">
                                  {editFile ? editFile.name : "No file chosen"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="edit-actions" style={{marginTop:12,display:'flex',justifyContent:'flex-end',gap:8}}>
                            <button
                              className="btn cancel"
                              onClick={() => setEditingDoc(null)}
                              type="button"
                            >
                              <FiX className="icon" /> Cancel
                            </button>
                            <button
                              className="btn save"
                              onClick={handleSave}
                              type="button"
                            >
                              <FiSave className="icon" /> Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVersion;
