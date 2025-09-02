import React, { useState } from "react";
import TopbarSidebar from "../../components/topbarSidebar";
import "./globalstat.css";

const ActiveAgreement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedClassification, setSelectedClassification] = useState("");

  const itemsPerPage = 5;

  // Sample Data
  const agreements = [
    {
      dtsNo: "DTS-00001",
      date: "2023-01-15",
      partnerName: "ABC University",
      type: "MOA",
      classification: "MOA on Cultural Exchange",
      startDate: "2023-01-15",
      endDate: "2026-01-14",
      status: "Active",
    },
    {
      dtsNo: "DTS-00002",
      date: "2022-08-10",
      partnerName: "XYZ Institute",
      type: "MOU",
      classification: "MOU",
      startDate: "2022-08-10",
      endDate: "2025-08-09",
      status: "Active",
    },
    {
      dtsNo: "DTS-00003",
      date: "2021-05-01",
      partnerName: "DEF Corp",
      type: "MOA",
      classification: "MOA Global Leadership",
      startDate: "2021-05-01",
      endDate: "2024-04-30",
      status: "Active",
    },
    
  ];

  // Get unique partner classifications dynamically
  const classifications = [
    ...new Set(agreements.map((a) => a.classification)),
  ];

  // Filter logic
  let filteredAgreements = agreements.filter((agreement) =>
    [
      agreement.dtsNo,
      agreement.date,
      agreement.partnerName,
      agreement.type,
      agreement.classification,
      agreement.startDate,
      agreement.endDate,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (selectedType) {
    filteredAgreements = filteredAgreements.filter(
      (a) => a.type === selectedType
    );
  }

  if (selectedClassification) {
    filteredAgreements = filteredAgreements.filter(
      (a) => a.classification === selectedClassification
    );
  }

  // Pagination
  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAgreements.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <TopbarSidebar>
      <div className="expired-wrapper">
        <h2 className="expired-title">Active Agreements</h2>
        <p className="expired-subtitle">
          Showing all currently valid agreements.
        </p>

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
          <button
            className="filter-btn"
            onClick={() => setShowFilter(!showFilter)}
          >
            Filter
          </button>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="filter-panel">
            <div>
              <label>Document Type:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All</option>
                <option value="MOA">MOA</option>
                <option value="MOU">MOU</option>
              </select>
            </div>
            <div>
              <label>Partner Classification:</label>
              <select
                value={selectedClassification}
                onChange={(e) => setSelectedClassification(e.target.value)}
              >
                <option value="">All</option>
                {classifications.map((c, idx) => (
                  <option key={idx} value={c}>
                    {c}
                  </option>
                ))}
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
                  setSelectedClassification("");
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
                <th>Date</th>
                <th>Partner Name</th>
                <th>Document Type</th>
                <th>Partner Classification</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((agreement, index) => (
                  <tr key={index}>
                    <td>{agreement.dtsNo}</td>
                    <td>{agreement.date}</td>
                    <td>{agreement.partnerName}</td>
                    <td>{agreement.type}</td>
                    <td>{agreement.classification}</td>
                    <td>{agreement.startDate}</td>
                    <td>{agreement.endDate}</td>
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
                  <td colSpan="9" className="empty-state">
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
