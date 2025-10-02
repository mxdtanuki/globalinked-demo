import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import '../components/layout.css';
import '../components/overviewDash.css';

const AgreementDocument = () => {
  const [mobileShow, setMobileShow] = useState(false);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  // Agreements data
  const [agreements, setAgreements] = useState([]);
  const [filteredAgreements, setFilteredAgreements] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Edit 
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ hardcopy_locator: "", activities: [] });

  // Search, Filter, Generate
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    documentType: "",
    partnershipType: "",
    validityPeriod: "",
    country: ""
  });

  useEffect(() => {
    const mockData = [
      {
        id: 1, dts_no: "DTS-001", document_type: "MOU", classification: "Academic",
        partners_name: "University A", country: "Philippines", date_signed: "2024-05-12",
        validity: "3 years", date_expiry: "2027-05-12", point_person: "Dr. Santos / Dean",
        contact_details: "dr.santos@universitya.edu", hardcopy_locator: "Cabinet A1",
        activities: ["Exchange Program", "Faculty Training"]
      },
      {
        id: 2, dts_no: "DTS-002", document_type: "MOA", classification: "Research",
        partners_name: "Institute B", country: "Japan", date_signed: "2023-09-01",
        validity: "5 years", date_expiry: "2028-09-01", point_person: "Prof. Tanaka / Research Head",
        contact_details: "+81 123-456-7890", hardcopy_locator: "Cabinet B2",
        activities: ["Joint Research"]
      },
      { id: 4, dts_no: "DTS-004", document_type: "MOA", classification: "Academic", partners_name: "University D", country: "South Korea", date_signed: "2021-11-15", validity: "4 years", date_expiry: "2025-11-15", point_person: "Prof. Kim", contact_details: "kim@unid.kr", hardcopy_locator: "Cabinet D1", activities: ["Research Seminar"] },
      { id: 6, dts_no: "DTS-006", document_type: "MOA", classification: "Academic", partners_name: "School F", country: "USA", date_signed: "2019-03-05", validity: "10 years", date_expiry: "2029-03-05", point_person: "Dr. Smith", contact_details: "smith@schoolf.edu", hardcopy_locator: "Cabinet F6", activities: ["Scholarships"] },
    ];
    setAgreements(mockData);
    setFilteredAgreements(mockData);
  }, []);

  // Stats
  const stats = [
    {
      label: 'Active Agreement',
      count: agreements.filter(a => !a.date_expiry || new Date(a.date_expiry) > new Date()).length
    },
    {
      label: 'Nearing Expiration',
      count: agreements.filter(a => {
        if (!a.date_expiry) return false;
        const daysDifference = (new Date(a.date_expiry) - new Date()) / (1000 * 60 * 60 * 24);
        return daysDifference > 0 && daysDifference <= 30;
      }).length
    }
  ];

  // Filter by Stat
  const filterByStat = (statLabel) => {
    let data = [...agreements];
    const now = new Date();

    if (statLabel === 'Active Agreement') {
      data = data.filter(a => !a.date_expiry || new Date(a.date_expiry) > now);
    } else if (statLabel === 'Nearing Expiration') {
      data = data.filter(a => {
        if (!a.date_expiry) return false;
        const daysDifference = (new Date(a.date_expiry) - now) / (1000 * 60 * 60 * 24);
        return daysDifference > 0 && daysDifference <= 30;
      });
    }

    setFilteredAgreements(data);
    setCurrentPage(1);
  };

  // Apply filters
  useEffect(() => {
    let data = agreements;

    data = data.filter(a => {
      return (
        (!filters.documentType || a.document_type === filters.documentType) &&
        (!filters.partnershipType || a.classification === filters.partnershipType) &&
        (!filters.validityPeriod || a.validity === filters.validityPeriod) &&
        (!filters.country || a.country === filters.country)
      );
    });

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(a =>
        Object.values(a).some(val => String(val).toLowerCase().includes(term))
      );
    }

    setFilteredAgreements(data);
    setCurrentPage(1);
  }, [searchTerm, filters, agreements]);

  const clearIndependentFilter = () => {
    setFilters({ documentType: "", partnershipType: "", validityPeriod: "", country: "" });
    setSearchTerm("");
    setFilteredAgreements(agreements);
    setCurrentPage(1);
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredAgreements.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredAgreements.length / rowsPerPage);

  const nextPage = () => currentPage < totalPages && setCurrentPage(prev => prev + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(prev => prev - 1);

  // Editing logic
  const handleEdit = (agreement) => {
    setEditId(agreement.id);
    setEditData({
      hardcopy_locator: agreement.hardcopy_locator,
      activities: [...agreement.activities]
    });
  };

  const handleSave = (id) => {
    const updated = agreements.map(a =>
      a.id === id ? { ...a, hardcopy_locator: editData.hardcopy_locator, activities: editData.activities } : a
    );
    setAgreements(updated);
    setFilteredAgreements(updated);
    setEditId(null);
  };

  const handleCancel = () => setEditId(null);

  const addActivity = () => setEditData({ ...editData, activities: [...editData.activities, ""] });

  const updateActivity = (index, value) => {
    const updated = [...editData.activities];
    updated[index] = value;
    setEditData({ ...editData, activities: updated });
  };

  const removeActivity = (index) => {
    const updated = [...editData.activities];
    updated.splice(index, 1);
    setEditData({ ...editData, activities: updated });
  };

  // Dummy export muna
  const exportToExcel = () => alert("Exporting to Excel...");

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}
      <div className="content-body">
        <Sidebar mobileShow={mobileShow} />

        <div className="main-content" onClick={() => mobileShow && setMobileShow(false)}>

          {/* Stats */}
          <div className="stats-row">
            {stats.map((s, i) => (
              <button key={i} className="stat-card" onClick={() => filterByStat(s.label)}>
                <div className="stat-number">{s.count}</div>
                <div className="stat-label">{s.label}</div>
              </button>
            ))}
          </div>

          {/* Search + Filter + Generate */}
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
                  <button className="btn" onClick={() => setShowFilterPanel(!showFilterPanel)}>Filter</button>
                  <button className="btn btn-generate" onClick={exportToExcel}>Generate</button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilterPanel && (
              <div className="filter-panel sticky-filter">
                <label>
                  Document Type:
                  <select value={filters.documentType} onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}>
                    <option value="">All</option>
                    {[...new Set(agreements.map(a => a.document_type))].map((type, i) => <option key={i} value={type}>{type}</option>)}
                  </select>
                </label>
                <label>
                  Partnership Classification:
                  <select value={filters.partnershipType} onChange={(e) => setFilters({ ...filters, partnershipType: e.target.value })}>
                    <option value="">All</option>
                    {[...new Set(agreements.map(a => a.classification))].map((type, i) => <option key={i} value={type}>{type}</option>)}
                  </select>
                </label>
                <label>
                  Validity Period:
                  <select value={filters.validityPeriod} onChange={(e) => setFilters({ ...filters, validityPeriod: e.target.value })}>
                    <option value="">All</option>
                    {[...new Set(agreements.map(a => a.validity))].map((vp, i) => <option key={i} value={vp}>{vp}</option>)}
                  </select>
                </label>
                <label>
                  Country:
                  <select value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })}>
                    <option value="">All</option>
                    {[...new Set(agreements.map(a => a.country))].map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                </label>
                <div className="filter-actions">
                  <button onClick={() => setCurrentPage(1)}>Apply</button>
                  <button onClick={clearIndependentFilter}>Clear</button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="table-scroll">
              <table className="document-table">
                <thead>
                  <tr>
                    <th>DTS No.</th>
                    <th>Document Type</th>
                    <th>Partnership Classification</th>
                    <th>Partners Name</th>
                    <th>Country</th>
                    <th>Date Signed</th>
                    <th>Validity</th>
                    <th>Expiry Date</th>
                    <th>Point Person / Position</th>
                    <th>Contact Person/Details</th>
                    <th>Hardcopy Locator</th>
                    <th>Activities</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((a) => (
                      <tr key={a.id}>
                        <td>{a.dts_no}</td>
                        <td>{a.document_type}</td>
                        <td>{a.classification}</td>
                        <td>{a.partners_name}</td>
                        <td>{a.country}</td>
                        <td>{a.date_signed}</td>
                        <td>{a.validity}</td>
                        <td>{a.date_expiry || "N/A"}</td>
                        <td>{a.point_person}</td>
                        <td>{a.contact_details}</td>
                        <td>
                          {editId === a.id ? (
                            <input
                              type="text"
                              value={editData.hardcopy_locator}
                              onChange={(e) => setEditData({ ...editData, hardcopy_locator: e.target.value })}
                            />
                          ) : (
                            a.hardcopy_locator
                          )}
                        </td>
                        <td>
                          {editId === a.id ? (
                            <div style={{ background: "#fff8dc", padding: "5px" }}>
                              {editData.activities.map((act, idx) => (
                                <div key={idx} style={{ display: "flex", marginBottom: "5px" }}>
                                  <input
                                    type="text"
                                    value={act}
                                    onChange={(e) => updateActivity(idx, e.target.value)}
                                    style={{ flex: 1 }}
                                  />
                                  <button onClick={() => removeActivity(idx)}>x</button>
                                </div>
                              ))}
                              <button onClick={addActivity}>+ Add</button>
                            </div>
                          ) : (
                            a.activities.join("; ")
                          )}
                        </td>
                        <td>
                          {editId === a.id ? (
                            <>
                              <button className="btn-action" onClick={() => handleSave(a.id)}>Save</button>
                              <button className="btn-action delete" onClick={handleCancel}>Cancel</button>
                            </>
                          ) : (
                            <div className="action-buttons">
                              <button className="btn-action" onClick={() => handleEdit(a)}>Edit</button>
                              <button className="btn-action delete">Delete</button>
                              <button className="btn-action">View File</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="13" style={{ textAlign: "center" }}>No agreements found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination" style={{ borderTop: "1px solid #ccc", marginTop: "10px", paddingTop: "10px" }}>
              <button disabled={currentPage === 1} onClick={prevPage}>Prev</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={nextPage}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementDocument;