import React, { useState } from "react";
import TopbarSidebar from "../../components/topbarSidebar";
import "./globalstat.css";

const NearingExpiration = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [selectedPartnerClass, setSelectedPartnerClass] = useState("");

  const itemsPerPage = 5;

  // Example dataset
  const agreements = [
    { partnerName: "Global Tech Corp", documentType: "MOA", partnerClass: "MOA on Academic Partnership", dtsNo: "DTS-00123", expiryDate: "2025-08-20", status: "Expiring Soon" },
    { partnerName: "DEF Research", documentType: "MOA", partnerClass: "MOA Global Leadership", dtsNo: "DTS-00456", expiryDate: "2025-09-05", status: "Expiring Soon" },
    { partnerName: "XYZ University", documentType: "MOU", partnerClass: "MOU", dtsNo: "DTS-00789", expiryDate: "2025-12-04", status: "Active" },
    { partnerName: "ABC Solutions", documentType: "MOA", partnerClass: "MOA on International Competition", dtsNo: "DTS-00999", expiryDate: "2025-08-25", status: "Expiring Soon" },
    { partnerName: "Tech Innovators", documentType: "MOU", partnerClass: "MOU", dtsNo: "DTS-00222", expiryDate: "2025-09-08", status: "Expiring Soon" },
    { partnerName: "Future Labs", documentType: "MOU", partnerClass: "MOU", dtsNo: "DTS-00555", expiryDate: "2025-08-30", status: "Expiring Soon" },
  ];

  // Determine unique partner classifications dynamically
  const partnerClasses = [...new Set(agreements.map(a => a.partnerClass))];

  // Determine nearing expiration (within 30 days)
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const nearingExpirationAgreements = agreements.filter((agreement) => {
    const expiry = new Date(agreement.expiryDate);
    return expiry > now && expiry <= thirtyDaysFromNow;
  });

  // Apply search filter
  let filteredAgreements = nearingExpirationAgreements.filter((agreement) =>
    Object.values({
      dtsNo: agreement.dtsNo,
      partnerName: agreement.partnerName,
      documentType: agreement.documentType,
      partnerClass: agreement.partnerClass,
      expiryDate: agreement.expiryDate
    })
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Apply extra filters
  if (selectedDocType) {
    filteredAgreements = filteredAgreements.filter(a => a.documentType === selectedDocType);
  }
  if (selectedPartnerClass) {
    filteredAgreements = filteredAgreements.filter(a => a.partnerClass === selectedPartnerClass);
  }

  // Pagination
  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAgreements.slice(startIndex, startIndex + itemsPerPage);

  return (
    <TopbarSidebar>
      <div className="expired-wrapper">
        <h2 className="expired-title">Nearing Expiration</h2>
        <p className="expired-subtitle">Agreements expiring within the next 30 days.</p>

        {/* Search & Filter bar */}
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="Search DTS No., Partner Name, Document Type, Partner Classification, Expiry Date..."
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

        {/* Filter options */}
        {showFilter && (
          <div className="filter-panel">
            <div>
              <label>Document Type:</label>
              <select value={selectedDocType} onChange={(e) => setSelectedDocType(e.target.value)}>
                <option value="">All</option>
                <option value="MOA">MOA</option>
                <option value="MOU">MOU</option>
              </select>
            </div>
            <div>
              <label>Partner Classification:</label>
              <select value={selectedPartnerClass} onChange={(e) => setSelectedPartnerClass(e.target.value)}>
                <option value="">All</option>
                {partnerClasses.map((cls, idx) => (
                  <option key={idx} value={cls}>{cls}</option>
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
                  setSelectedDocType("");
                  setSelectedPartnerClass("");
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
                <th>Partner's Name</th>
                <th>Document Type</th>
                <th>Partner Classification</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((agreement, index) => (
                  <tr key={index}>
                    <td>{agreement.dtsNo}</td>
                    <td>{agreement.partnerName}</td>
                    <td>{agreement.documentType}</td>
                    <td>{agreement.partnerClass}</td>
                    <td>{agreement.expiryDate}</td>
                    <td>
                      <span className={`status-badge expiring-soon ${agreement.status.toLowerCase().replace(/\s/g, '-')}`}>
                        {agreement.status}
                      </span>
                    </td>
                    <td>
                      <button className="view-btn">View</button>
                      <button className="download-btn">Download</button>
                      <button className="renew-btn">Renew</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No agreements nearing expiration.
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

export default NearingExpiration;
