import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import '../components/layout.css';
import '../components/overviewDash.css';
import { agreementService } from '../services/agreementService';
import { documentService } from '../services/documentService';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import axios from "axios";
import { renderDocumentTypeBadge } from '../utils/documentTypeUtils';

const AgreementDocument = () => {
  const [mobileShow, setMobileShow] = useState(false);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  const [agreements, setAgreements] = useState([]);
  const [filteredAgreements, setFilteredAgreements] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    hardcopy_location: "",
    remarks: []
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    documentType: "",
    partnershipType: "",
    validityPeriod: "",
    country: ""
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const createAuditLog = async (description) => {
  try {
    const token = localStorage.getItem("access_token");
    await axios.post(
      `${API_BASE_URL}/audit/logs`,
      { audit_description: description },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } catch (err) {
    console.error("Failed to create audit log:", err);
  }
};


  // Fetch agreements
const fetchAgreements = async () => {
  try {
    // Use optimized endpoint for active agreements only
    const data = await agreementService.getActiveAgreements();
    console.log("Fetched agreements:", data);

    setAgreements(data);
    setFilteredAgreements(data);
  } catch (err) {
    console.error(err);
    setError("Failed to fetch agreements: " + err.message);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchAgreements();
  }, []);

  // Stats
  const stats = [
    {
      label: "Active Agreement",
      count: agreements.filter(
        (a) => !a.date_expiry || new Date(a.date_expiry) > new Date()
      ).length,
    },
    {
      label: "Nearing Expiration",
      count: agreements.filter((a) => {
        if (!a.date_expiry) return false;
        const daysDiff =
          (new Date(a.date_expiry) - new Date()) / (1000 * 60 * 60 * 24);
        return daysDiff > 0 && daysDiff <= 30;
      }).length,
    },
  ];

  const filterByStat = (statLabel) => {
    let data = [...agreements];
    const now = new Date();

    if (statLabel === "Active Agreement") {
      data = data.filter(
        (a) => !a.date_expiry || new Date(a.date_expiry) > now
      );
    } else if (statLabel === "Nearing Expiration") {
      data = data.filter((a) => {
        if (!a.date_expiry) return false;
        const daysDiff = (new Date(a.date_expiry) - now) / (1000 * 60 * 60 * 24);
        return daysDiff > 0 && daysDiff <= 30;
      });
    }

    setFilteredAgreements(data);
    setCurrentPage(1);
  };

  // Filtering
useEffect(() => {
  let data = [...agreements];
  data = data.filter((a) => {
    return (
      (!appliedFilters.documentType || a.document_type === appliedFilters.documentType) &&
      (!appliedFilters.partnershipType || a.partnership_type === appliedFilters.partnershipType) &&
      (!appliedFilters.validityPeriod || a.validity_period === appliedFilters.validityPeriod) &&
      (!appliedFilters.country || a.country === appliedFilters.country)
    );
  });

  if (searchTerm.trim() !== "") {
    const term = searchTerm.toLowerCase();
    data = data.filter((a) =>
      Object.values(a).some((val) =>
        val ? String(val).toLowerCase().includes(term) : false
      )
    );
  }

  setFilteredAgreements(data);
  setCurrentPage(1);
}, [searchTerm, appliedFilters, agreements]);


  const clearIndependentFilter = () => {
    const cleared = {
      documentType: "",
      partnershipType: "",
      validityPeriod: "",
      country: "",
    };
    setFilters(cleared);
    setAppliedFilters(cleared); 
    setSearchTerm("");
    setFilteredAgreements(agreements);
    setCurrentPage(1);
  };


  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredAgreements.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredAgreements.length / rowsPerPage);

  const nextPage = () =>
    currentPage < totalPages && setCurrentPage((prev) => prev + 1);
  const prevPage = () =>
    currentPage > 1 && setCurrentPage((prev) => prev - 1);

const [isAdmin, setIsAdmin] = useState(false);
const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setCurrentUser(parsedUser);

        if (parsedUser.user_role && parsedUser.user_role.toLowerCase() === "admin") {
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

  // Editing 
const handleEdit = (agreement) => {
  if (!isAdmin) {
    alert("You do not have permission to edit agreements.");
    return;
  }
   const normalizedRemarks = Array.isArray(agreement.remarks)
     ? agreement.remarks.map((r) =>
         typeof r === "object"
           ? r.remark_text || r.text || r.remark || ""
           : r
       )
     : [];

  setEditId(agreement.agreement_id);
  setEditData({
    hardcopy_location: agreement.hardcopy_location || "",
    remarks: normalizedRemarks,
    agreement_status: agreement.agreement_status || "", 
  });
};


  const handleSave = async (id) => {
    try {
      const formattedRemarks = editData.remarks.map((r) =>
        typeof r === "string" ? { remark_text: r } : r
      );

      await agreementService.updateAgreement(id, {
        ...editData,
        remarks: formattedRemarks,
      });

      await createAuditLog(`Edited agreement #${id} — updated hardcopy location or remarks`);

      alert("Agreement updated successfully!");
      await fetchAgreements(); // refresh data
      setEditId(null);

    } catch (err) {
      console.error("Error saving agreement:", err);
      alert("Failed to save agreement: " + err.message);
    }
  };


  const handleCancel = () => setEditId(null);

  // Delete logic
  const handleDelete = async (id) => {
    if (!isAdmin) {
      alert("You do not have permission to delete agreements.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this agreement?")) return;

    try {
      await agreementService.deleteAgreement(id);
      await createAuditLog(`Deleted agreement #${id}`);

      alert("Agreement deleted successfully!");
      await fetchAgreements(); // refresh data

    } catch (err) {
      console.error("Error deleting agreement:", err);
      alert("Failed to delete agreement: " + err.message);
    }
  };

  const handleViewLatestFile = async (dtsNumber) => {
    try {
      const latest = await documentService.getLatestVersion(dtsNumber);
      if (!latest) {
        alert("No document versions found for this DTS number.");
        return;
      }
      const resp = await fetch(latest.download_url, { headers: { Accept: "application/pdf" } });
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

  // Remarks 
  const addRemarks = () =>
    setEditData({ ...editData, remarks: [...editData.remarks, ""] });

  const updateRemarks = (index, value) => {
    const updated = [...editData.remarks];
    updated[index] = value;
    setEditData({ ...editData, remarks: updated });
  };

  const removeRemarks = (index) => {
    const updated = [...editData.remarks];
    updated.splice(index, 1);
    setEditData({ ...editData, remarks: updated });
  };

const exportToExcel = async () => {
  if (!filteredAgreements || filteredAgreements.length === 0) {
    alert("No data available to export.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Agreements");

  worksheet.mergeCells("A1:M1");
  const title = worksheet.getCell("A1");
  title.value = "Globalinked Agreements Report";
  title.font = { size: 16, bold: true };
  title.alignment = { horizontal: "center" };

  const headerCols = [
    "DTS Number",
    "Document Type",
    "Partnership Type",
    "Partner Name",
    "Country",
    "Date Signed",
    "Validity Period",
    "Expiry Date",
    "Point Person",
    "Contact Person",
    "Logo",
    "Hardcopy Locator",
    "Remarks"
  ];

  worksheet.addRow(headerCols);

  const headerRow = worksheet.getRow(2);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "800000" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const logoColIndex = headerCols.indexOf("Logo"); 

  for (const a of filteredAgreements) {
    const remarksText = Array.isArray(a.remarks)
      ? a.remarks
          .map(r =>
            typeof r === "object"
              ? r.remark_text || r.text || r.remark || ""
              : r
          )
          .join("\n")
      : "N/A";

    const row = worksheet.addRow([
      a.dts_number || "N/A",
      a.document_type || "N/A",
      a.partnership_type || "N/A",
      a.name || "N/A",
      a.country || "N/A",
      a.date_signed || "N/A",
      a.validity_period || "N/A",
      a.date_expiry || "N/A",
      a.point_persons_display || a.point_persons || "N/A",
      a.contact_persons_display || a.contact_persons || "N/A",
      "",
      a.hardcopy_location || "N/A",
      remarksText,
    ]);

    try {
      const lp = a.logo_path;
      if (lp && lp.toString().trim() !== "") {
        let base64;
        let extension = "png";

        if (typeof lp === "string" && lp.startsWith("data:image")) {

          const match = lp.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
          if (match) {
            extension = match[1].split("/")[1] || "png";
            base64 = match[2];
          } else {
            const idx = lp.indexOf("base64,");
            base64 = idx !== -1 ? lp.substring(idx + 7) : lp;
          }
        } else if (typeof lp === "string" && (lp.startsWith("iVBORw0") || lp.startsWith("/9j/"))) {
          extension = lp.startsWith("iVBORw0") ? "png" : "jpeg";
          base64 = lp;
        } else {
          let url = lp;
          if (!/^https?:\/\//i.test(url)) {
            url = `${API_BASE_URL.replace(/\/$/, "")}/${String(lp).replace(/^\/+/, "")}`;
          }
          const resp = await axios.get(url, { responseType: "arraybuffer" });
          base64 = arrayBufferToBase64(resp.data);
          const ct = resp.headers && resp.headers['content-type'];
          if (ct && ct.startsWith("image/")) {
            extension = ct.split("/")[1].split(";")[0] || "png";
          } else {
            extension = "png";
          }
        }

        if (base64) {
          const imageId = workbook.addImage({ base64, extension });
          const rowNumber = row.number;
          worksheet.addImage(imageId, {
            tl: { col: logoColIndex, row: rowNumber - 1 },
            ext: { width: 80, height: 50 },
          });

          worksheet.getRow(rowNumber).height = 40;
        }
      }
    } catch (err) {
      console.warn("Failed to add logo for", a.dts_number, err);
    }
  }

  worksheet.columns.forEach((col, idx) => {
    if (idx === logoColIndex) {
      col.width = 14; 
    } else {
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, val.length);
      });
      col.width = maxLength < 15 ? 15 : maxLength + 2;
    }
  });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Generate the Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `Agreements_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && (
        <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />
      )}
      <div className="content-body">
        <Sidebar mobileShow={mobileShow} />
        <div
          className="main-content"
          onClick={() => mobileShow && setMobileShow(false)}
        >
          {loading ? (
            <div className="lloading-container">
              <div className="spinner"></div>
              <p>Loading Agreements...</p>
            </div>
          ) : (
            <>
            <h2 className="archive-title">Agreements</h2>
              <div className="stats-row">
                {stats.map((s, i) => (
                  <button
                    key={i}
                    className="stat-card"
                    onClick={() => filterByStat(s.label)}
                  >
                    <div className="stat-number">{s.count}</div>
                    <div className="stat-label">{s.label}</div>
                  </button>
                ))}
              </div>

              <div className="table-section">
                <div className="table-header sticky-header">
                  <div className="search-audit-wrapper">
                    <input
                      type="text"
                      placeholder="Search here"
                      className="search-box"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="table-actions">
  <div className="button-group">
    <button
      className="btn"
      onClick={() => setShowFilterPanel(!showFilterPanel)}
    >
      Filter
    </button>
    <button className="btn btn-generate" onClick={exportToExcel}>
      Generate
    </button>
    <button
      className="btn btn-scroll-nav"
      title="Scroll to first column"
      onClick={() => {
        const tableScrollDiv = document.querySelector('.table-scroll');
        if (tableScrollDiv) {
          tableScrollDiv.scrollLeft = 0;
        }
      }}
    >
      ◄ First Column
    </button>
    <button
      className="btn btn-scroll-nav"
      title="Scroll to last column"
      onClick={() => {
        const tableScrollDiv = document.querySelector('.table-scroll');
        if (tableScrollDiv) {
          tableScrollDiv.scrollLeft = tableScrollDiv.scrollWidth;
        }
      }}
    >
      Last Column ►
    </button>
  </div>
</div>
                </div>

                {showFilterPanel && (
                  <div className="filter-panel sticky-filter">
                    <label>
                      Document Type:
                      <select
                        value={filters.documentType}
                        onChange={(e) =>
                          setFilters({ ...filters, documentType: e.target.value })
                        }
                      >
                        <option value="">All</option>
                        {[...new Set(agreements.map((a) => a.document_type))].map(
                          (type, i) => (
                            <option key={i} value={type}>
                              {type}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                    <label>
                      Partnership Type:
                      <select
                        value={filters.partnershipType}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            partnershipType: e.target.value,
                          })
                        }
                      >
                        <option value="">All</option>
                        {[...new Set(agreements.map((a) => a.partnership_type))].map(
                          (type, i) => (
                            <option key={i} value={type}>
                              {type}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                    <label>
                      Validity Period:
                      <select
                        value={filters.validityPeriod}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            validityPeriod: e.target.value,
                          })
                        }
                      >
                        <option value="">All</option>
                        {[...new Set(agreements.map((a) => a.validity_period))].map(
                          (vp, i) => (
                            <option key={i} value={vp}>
                              {vp}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                    <label>
                      Country:
                      <select
                        value={filters.country}
                        onChange={(e) =>
                          setFilters({ ...filters, country: e.target.value })
                        }
                      >
                        <option value="">All</option>
                        {[...new Set(agreements.map((a) => a.country))].map(
                          (c, i) => (
                            <option key={i} value={c}>
                              {c}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                    <div className="filter-actions">
                      <button onClick={() => {
                          setAppliedFilters(filters);
                          setCurrentPage(1);
                        }}>
                          Apply
                        </button>
                      <button onClick={clearIndependentFilter}>Clear</button>
                    </div>
                  </div>
                )}

                <div className="table-scroll">
                  <table className="document-table">
                    <thead>
                      <tr>
                        <th>DTS No.</th>
                        <th>Document Type</th>
                        <th>Partnership Type</th>
                        <th>Partner Name</th>
                        <th>Country</th>
                        <th>Date Signed</th>
                        <th>Validity</th>
                        <th>Expiry Date</th>
                        <th>Point Person</th>
                        <th>Contact Person</th>
                        <th> Logo </th>
                        <th>Status</th> 
                        <th>Hardcopy Locator</th>
                        <th>Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRows.length > 0 ? (
                        currentRows.map((a) => (
                          <tr key={a.agreement_id}>
                            <td>{a.dts_number}</td>
                            <td>{renderDocumentTypeBadge(a.document_type)}</td>
                            <td>{a.partnership_type}</td>
                            <td>{a.name}</td>
                            <td>{a.country}</td>
                            <td>{a.date_signed}</td>
                            <td>{a.validity_period}</td>
                            <td>{a.date_expiry || "N/A"}</td>
                            <td>{a.point_persons_display || a.point_persons || "N/A"}</td>
                            <td>{a.contact_persons_display || a.contact_persons || "N/A"}</td>
                            <td>
                              {a.logo_path && a.logo_path.trim() !== "" ? (
                                <img
                                  src={
                                    a.logo_path.startsWith("data:image")
                                      ? a.logo_path
                                      : a.logo_path.startsWith("iVBORw0")
                                      ? `data:image/png;base64,${a.logo_path}`
                                      : a.logo_path.startsWith("/9j/")
                                      ? `data:image/jpeg;base64,${a.logo_path}`
                                      : a.logo_path.startsWith("http")
                                      ? a.logo_path
                                      : `${API_BASE_URL.replace(/\/$/, "")}/${a.logo_path.replace(/^\/+/, "")}`
                                  }
                                  alt="Partner Logo"
                                  style={{
                                    width: "80px",
                                    height: "80px",
                                    objectFit: "contain",
                                    borderRadius: "4px",
                                    backgroundColor: "#f9f9f9",
                                    border: "1px solid #ddd",
                                  }}
                                  onError={(e) => {
                                    console.warn("Logo failed to load:", e.target.src);
                                    e.target.onerror = null;
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span style={{ color: "#888", fontStyle: "italic" }}>No Logo</span>
                              )}
                            </td>
                            <td>
                              {isAdmin && editId === a.agreement_id ? (
                                <select
                                  value={editData.agreement_status || a.agreement_status || ""}
                                  onChange={e =>
                                    setEditData({ ...editData, agreement_status: e.target.value })
                                  }
                                  style={{ minWidth: "180px" }}
                                >
                                  <option value="">Select Status</option>
                                  <option value="InitialReview">Initial Review</option>
                                  <option value="Endorse">Endorse to ULCO for Review and Approval</option>
                                  <option value="Revert">Revert To Initiator with Comments</option>
                                  <option value="Consultation">For Consultation</option>
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
                              ) : (
                                a.agreement_status || "N/A"
                              )}
                            </td>

                            <td>
                              {isAdmin && editId === a.agreement_id ? (
                                <input
                                  type="text"
                                  value={editData.hardcopy_location}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      hardcopy_location: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                a.hardcopy_location || "N/A"
                              )}
                            </td>

                            <td>
                              {isAdmin && editId === a.agreement_id ? (
                                <div style={{ background: "#fff8dc", padding: "5px" }}>
                                  {editData.remarks.map((act, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        marginBottom: "5px",
                                      }}
                                    >
                                      <input
                                        type="text"
                                        value={act}
                                        onChange={(e) =>
                                          updateRemarks(idx, e.target.value)
                                        }
                                        style={{ flex: 1 }}
                                      />
                                      <button onClick={() => removeRemarks(idx)}>x</button>
                                    </div>
                                  ))}
                                  <button onClick={addRemarks}>+ Add</button>
                                </div>
                              ) : (
                                Array.isArray(a.remarks) ? (
                                  a.remarks.map((r, idx) => (
                                    <div key={idx}>
                                      {typeof r === "object"
                                        ? r.remark_text || r.text || r.remark || ""
                                        : r}
                                    </div>
                                  ))
                                ) : (
                                  "N/A"
                                )
                              )}
                            </td>

                            <td>
                              {isAdmin && editId === a.agreement_id ? (
                                <>
                                  <button
                                    className="btn-action"
                                    onClick={() => handleSave(a.agreement_id)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn-action delete"
                                    onClick={handleCancel}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <div className="action-buttons">
                                  {isAdmin && (
                                    <>
                                      <button
                                        className="btn-action"
                                        onClick={() => handleEdit(a)}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="btn-action delete"
                                        onClick={() => handleDelete(a.agreement_id)}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                  <button className="btn-action" onClick={() => handleViewLatestFile(a.dts_number)}>View File</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="13" style={{ textAlign: "center" }}>
                            No agreements found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

{currentRows.length > 5 && (
  <div className="table-bottom-actions">
    <button
      className="btn btn-scroll-nav"
      title="Scroll to first column"
      onClick={() => {
        const tableScrollDiv = document.querySelector('.table-scroll');
        if (tableScrollDiv) {
          tableScrollDiv.scrollLeft = 0;
        }
      }}
    >
      ◄ First Column
    </button>
    <button
      className="btn btn-scroll-nav"
      title="Scroll to last column"
      onClick={() => {
        const tableScrollDiv = document.querySelector('.table-scroll');
        if (tableScrollDiv) {
          tableScrollDiv.scrollLeft = tableScrollDiv.scrollWidth;
        }
      }}
    >
      Last Column ►
    </button>
  </div>
)}

                <div
                  className="pagination"
                  style={{
                    borderTop: "1px solid #ccc",
                    marginTop: "10px",
                    paddingTop: "10px",
                  }}
                >
                  <button disabled={currentPage === 1} onClick={prevPage}>
                    Prev
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button disabled={currentPage === totalPages} onClick={nextPage}>
                    Next
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

export default AgreementDocument;
