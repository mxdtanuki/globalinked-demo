import React, { useState } from "react";
import TopbarSidebar from "../../components/topbarSidebar";
import "./globalstat.css";

const ActiveAgreement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedType, setSelectedType] = useState("");

  const itemsPerPage = 5;

  // Sample Data
  const agreements = [
    { dtsNo: "DTS-00001", title: "MOA with ABC University", type: "MOA", startDate: "2023-01-15", endDate: "2026-01-14", daysRemaining: 520, status: "Active" },
    { dtsNo: "DTS-00002", title: "MOU with XYZ Institute", type: "MOU", startDate: "2022-08-10", endDate: "2025-08-09", daysRemaining: 365, status: "Active" },
    { dtsNo: "DTS-00003", title: "Contract with DEF Corp", type: "MOA", startDate: "2021-05-01", endDate: "2024-04-30", daysRemaining: 260, status: "Active" },
    { dtsNo: "DTS-00004", title: "MOA with Tech Solutions", type: "MOA", startDate: "2023-06-20", endDate: "2026-06-19", daysRemaining: 670, status: "Active" },
    { dtsNo: "DTS-00005", title: "MOU with Future Innovations", type: "MOU", startDate: "2023-11-05", endDate: "2026-11-04", daysRemaining: 840, status: "Active" },
    { dtsNo: "DTS-00006", title: "Contract with Global Ventures", type: "MOU", startDate: "2022-03-15", endDate: "2025-03-14", daysRemaining: 220, status: "Active" },
  ];

  // Filter logic
  let filteredAgreements = agreements.filter((agreement) =>
    Object.values(agreement)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (selectedType) {
    filteredAgreements = filteredAgreements.filter(a => a.type === selectedType);
  }

  // Pagination
  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAgreements.slice(startIndex, startIndex + itemsPerPage);

  return (
    <TopbarSidebar>
      <div className="expired-wrapper">
        <h2 className="expired-title">Active Agreements</h2>
        <p className="expired-subtitle">Showing all currently valid agreements.</p>

        {/* Search & Filter bar */}
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="Search agreements..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <button className="filter-btn" onClick={() => setShowFilter(!showFilter)}>
            Filter
          </button>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="filter-panel">
            <div>
              <label>Type:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All</option>
                <option value="MOA">MOA</option>
                <option value="MOU">MOU</option>
              </select>
            </div>
            <div className="filter-actions">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setShowFilter(false);
                }}
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setSelectedType("");
                  setCurrentPage(1);
                  setShowFilter(false);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="table-container">
          <table className="expired-table">
            <thead>
              <tr>
                <th>DTS No.</th>
                <th>Title / Partner</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days Remaining</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((agreement, index) => (
                  <tr key={index}>
                    <td>{agreement.dtsNo}</td>
                    <td>{agreement.title}</td>
                    <td>{agreement.type}</td>
                    <td>{agreement.startDate}</td>
                    <td>{agreement.endDate}</td>
                    <td>{agreement.daysRemaining}</td>
                    <td>
                      <span className="status-badge active">
                        {agreement.status}
                      </span>
                    </td>
                    <td>
                      <button className="view-btn">View</button>
                      <button className="download-btn">Download</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No active agreements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAgreements.length > itemsPerPage && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={currentPage === i + 1 ? "active" : ""}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </TopbarSidebar>
  );
};

export default ActiveAgreement;
