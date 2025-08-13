import React, { useState } from "react";
import TopbarSidebar from "../../components/topbarSidebar";
import "./globalstat.css";

const TotalAgreement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [tempDocType, setTempDocType] = useState("");
  const [tempStatus, setTempStatus] = useState("");
  const [filterDocType, setFilterDocType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const itemsPerPage = 5;

  // Example data
  const agreements = [
    { dtsNo: "DTS-10001", date: "2023-02-14", partnerName: "ABC University", entityType: "University", country: "Philippines", documentType: "MOA", partnershipClassification: "Academic", validityPeriod: "2023-02-14 to 2026-02-13", status: "Active" },
    { dtsNo: "DTS-10002", date: "2021-08-05", partnerName: "XYZ Corporation", entityType: "Private Company", country: "Japan", documentType: "MOU", partnershipClassification: "Industry", validityPeriod: "2021-08-05 to 2024-08-04", status: "Expiring Soon" },
    { dtsNo: "DTS-10003", date: "2019-04-12", partnerName: "DEF Institute", entityType: "Research Institute", country: "USA", documentType: "MOA", partnershipClassification: "Research", validityPeriod: "2019-04-12 to 2022-04-11", status: "Expired" },
    { dtsNo: "DTS-10004", date: "2020-06-18", partnerName: "GHI Tech", entityType: "Private Company", country: "Singapore", documentType: "MOU", partnershipClassification: "Industry", validityPeriod: "2020-06-18 to 2023-06-17", status: "Expired" },
    { dtsNo: "DTS-10005", date: "2022-11-25", partnerName: "JKL Foundation", entityType: "Non-Profit", country: "Australia", documentType: "MOA", partnershipClassification: "Academic", validityPeriod: "2022-11-25 to 2025-11-24", status: "Active" },
    { dtsNo: "DTS-10006", date: "2021-01-10", partnerName: "MNO Labs", entityType: "Research Institute", country: "UK", documentType: "MOU", partnershipClassification: "Research", validityPeriod: "2021-01-10 to 2024-01-09", status: "Expiring Soon" },
  ];

  // Filtering logic
  const filteredAgreements = agreements.filter((agreement) => {
    const matchesSearch = Object.values(agreement)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesDocType = filterDocType ? agreement.documentType === filterDocType : true;
    const matchesStatus = filterStatus ? agreement.status.toLowerCase() === filterStatus.toLowerCase() : true;

    return matchesSearch && matchesDocType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAgreements.slice(startIndex, startIndex + itemsPerPage);

  // Apply filters
  const applyFilters = () => {
    setFilterDocType(tempDocType);
    setFilterStatus(tempStatus);
    setCurrentPage(1);
    setShowFilter(false);
  };

  // Clear filters
  const clearFilters = () => {
    setTempDocType("");
    setTempStatus("");
    setFilterDocType("");
    setFilterStatus("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <TopbarSidebar>
      <div className="expired-wrapper">
        <h2 className="expired-title">Total Agreements</h2>
        <p className="expired-subtitle">All agreements from the past 5 years.</p>

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
            onClick={() => setShowFilter((prev) => !prev)}
          >
            {showFilter ? "Close Filter" : "Filter"}
          </button>
        </div>

        {showFilter && (
          <div className="filter-options">
            <select value={tempDocType} onChange={(e) => setTempDocType(e.target.value)}>
              <option value="">All Document Types</option>
              <option value="MOA">MOA</option>
              <option value="MOU">MOU</option>
            </select>

            <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Expiring Soon">Expiring Soon</option>
            </select>

            <div className="filter-buttons">
              <button className="apply-btn" onClick={applyFilters}>Apply</button>
              <button className="clear-btn" onClick={clearFilters}>Clear</button>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="expired-table">
            <thead>
              <tr>
                <th>DTS No.</th>
                <th>Date</th>
                <th>Partner's Name</th>
                <th>Entity Type</th>
                <th>Country</th>
                <th>Document Type</th>
                <th>Partnership Classification</th>
                <th>Validity Period</th>
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
                    <td>{agreement.entityType}</td>
                    <td>{agreement.country}</td>
                    <td>{agreement.documentType}</td>
                    <td>{agreement.partnershipClassification}</td>
                    <td>{agreement.validityPeriod}</td>
                    <td>
                      <span
                        className={`status-badge ${agreement.status.toLowerCase().replace(" ", "-")}`}
                      >
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
                  <td colSpan="10" className="empty-state">
                    No agreements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

export default TotalAgreement;
