import React, { useState } from 'react';
import TopbarSidebar from '../../components/topbarSidebar';
import './globalstat.css';

const ExpiredAgreement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterClassification, setFilterClassification] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ type: '', classification: '' });

  const itemsPerPage = 5;

  // Sample Data
  const expiredAgreements = [
    { dtsNo: 'DTS-20201', partner: 'University of Tokyo', type: 'MOU', partnerClassification: 'MOU', startDate: '2020-01-15', endDate: '2024-01-15', status: 'Expired', region: 'Asia / Japan' },
    { dtsNo: 'DTS-202105', partner: 'Harvard University', type: 'MOA', partnerClassification: 'MOA Global Leadership', startDate: '2021-03-10', endDate: '2024-03-10', status: 'Expired', region: 'North America / USA' },
    { dtsNo: 'DTS-201907', partner: 'University of Melbourne', type: 'MOU', partnerClassification: 'MOU', startDate: '2019-05-01', endDate: '2023-05-01', status: 'Expired', region: 'Oceania / Australia' },
    { dtsNo: 'DTS-202015', partner: 'Oxford University', type: 'MOA', partnerClassification: 'MOA on Conferences', startDate: '2020-09-20', endDate: '2024-09-20', status: 'Expired', region: 'Europe / UK' },
    { dtsNo: 'DTS-201803', partner: 'National University of Singapore', type: 'MOU', partnerClassification: 'MOU', startDate: '2018-07-11', endDate: '2023-07-11', status: 'Expired', region: 'Asia / Singapore' },
    { dtsNo: 'DTS-201908', partner: 'Seoul National University', type: 'MOA', partnerClassification: 'MOA for Donation', startDate: '2019-10-05', endDate: '2024-10-05', status: 'Expired', region: 'Asia / South Korea' },
    { dtsNo: 'DTS-201809', partner: 'University of Toronto', type: 'MOU', partnerClassification: 'MOU', startDate: '2018-02-15', endDate: '2023-02-15', status: 'Expired', region: 'North America / Canada' },
    { dtsNo: 'DTS201711', partner: 'University of Cape Town', type: 'MOA', partnerClassification: 'MOA on Academic Partnership', startDate: '2017-11-23', endDate: '2022-11-23', status: 'Expired', region: 'Africa / South Africa' },
  ];

  // Dynamic partner classifications
  const partnerClassifications = [...new Set(expiredAgreements.map(a => a.partnerClassification))];

  // SEARCH & FILTER LOGIC
  const filteredAgreements = expiredAgreements.filter((agreement) => {
    const matchesSearch =
      agreement.dtsNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.partner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.partnerClassification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.startDate.includes(searchTerm) ||
      agreement.endDate.includes(searchTerm) ||
      agreement.region.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = appliedFilters.type ? agreement.type === appliedFilters.type : true;
    const matchesClassification = appliedFilters.classification
      ? agreement.partnerClassification === appliedFilters.classification
      : true;

    return matchesSearch && matchesType && matchesClassification;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAgreements.slice(startIndex, startIndex + itemsPerPage);

  return (
    <TopbarSidebar>
      <div className="expired-wrapper">
        <h1 className="expired-title">Expired Agreements</h1>
        <p className="expired-subtitle">
          These agreements have passed their end date and are no longer active.
        </p>

        <div className="search-filter-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search expired agreements..."
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
            Filter
          </button>
        </div>

        {/* FILTER PANEL */}
        {showFilter && (
          <div className="filter-panel">
            <label>
              Document Type:
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All</option>
                <option value="MOU">MOU</option>
                <option value="MOA">MOA</option>
              </select>
            </label>
            <label>
              Partner Classification:
              <select
                value={filterClassification}
                onChange={(e) => setFilterClassification(e.target.value)}
              >
                <option value="">All</option>
                {partnerClassifications.map((cls, i) => (
                  <option key={i} value={cls}>{cls}</option>
                ))}
              </select>
            </label>
            <div className="filter-buttons">
              <button
                className="apply-btn"
                onClick={() => {
                  setAppliedFilters({ type: filterType, classification: filterClassification });
                  setCurrentPage(1);
                  setShowFilter(false);
                }}
              >
                Apply
              </button>
              <button
                className="clear-btn"
                onClick={() => {
                  setFilterType('');
                  setFilterClassification('');
                  setAppliedFilters({ type: '', classification: '' });
                  setCurrentPage(1);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="table-container">
          {paginatedData.length > 0 ? (
            <table className="expired-table">
              <thead>
                <tr>
                  <th>DTS Number</th>
                  <th>Partner Name</th>
                  <th>Document Type</th>
                  <th>Partner Classification</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Region / Country</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((agreement, index) => (
                  <tr key={index}>
                    <td>{agreement.dtsNo}</td>
                    <td>{agreement.partner}</td>
                    <td>{agreement.type}</td>
                    <td>{agreement.partnerClassification}</td>
                    <td>{agreement.startDate}</td>
                    <td>{agreement.endDate}</td>
                    <td>{agreement.region}</td>
                    <td>
                      <span className="status-badge expired">{agreement.status}</span>
                    </td>
                    <td>
                      <button className="view-btn">View</button>
                      <button className="download-btn">Download</button>
                      <button className="renew-btn">Renew</button>
                      <button className="archive-btn">Archive</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              No expired agreements found. All agreements are currently active or upcoming.
            </div>
          )}
        </div>

        {filteredAgreements.length > itemsPerPage && (
          <div className="pagination">
            <button onClick={() => setCurrentPage((prev) => prev - 1)} disabled={currentPage === 1}>
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={currentPage === i + 1 ? 'active' : ''}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage((prev) => prev + 1)} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        )}
      </div>
    </TopbarSidebar>
  );
};

export default ExpiredAgreement;
