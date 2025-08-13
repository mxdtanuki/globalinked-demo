import React, { useState } from 'react';
import TopbarSidebar from '../../components/topbarSidebar';
import './globalstat.css';

const ExpiredAgreement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ type: '', year: '' });

  const itemsPerPage = 5;

  // Sample Data
  const expiredAgreements = [
    { dtsNo: 'DTS-20201', partner: 'University of Tokyo', type: 'MOU', startDate: '2020-01-15', endDate: '2024-01-15', status: 'Expired', region: 'Asia / Japan' },
    { dtsNo: 'DTS-202105', partner: 'Harvard University', type: 'MOA', startDate: '2021-03-10', endDate: '2024-03-10', status: 'Expired', region: 'North America / USA' },
    { dtsNo: 'DTS-201907', partner: 'University of Melbourne', type: 'MOU', startDate: '2019-05-01', endDate: '2023-05-01', status: 'Expired', region: 'Oceania / Australia' },
    { dtsNo: 'DTS-202015', partner: 'Oxford University', type: 'MOA', startDate: '2020-09-20', endDate: '2024-09-20', status: 'Expired', region: 'Europe / UK' },
    { dtsNo: 'DTS-201803', partner: 'National University of Singapore', type: 'MOU', startDate: '2018-07-11', endDate: '2023-07-11', status: 'Expired', region: 'Asia / Singapore' },
    { dtsNo: 'DTS-201908', partner: 'Seoul National University', type: 'MOA', startDate: '2019-10-05', endDate: '2024-10-05', status: 'Expired', region: 'Asia / South Korea' },
    { dtsNo: 'DTS-201809', partner: 'University of Toronto', type: 'MOU', startDate: '2018-02-15', endDate: '2023-02-15', status: 'Expired', region: 'North America / Canada' },
    { dtsNo: 'DTS201711', partner: 'University of Cape Town', type: 'MOA', startDate: '2017-11-23', endDate: '2022-11-23', status: 'Expired', region: 'Africa / South Africa' },
  ];

  // Get years from endDate
  const expiryYears = [...new Set(expiredAgreements.map(a => new Date(a.endDate).getFullYear()))].sort((a, b) => b - a);

  // SEARCH & FILTER LOGIC
  const filteredAgreements = expiredAgreements.filter((agreement) => {
    const matchesSearch =
      agreement.dtsNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.partner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.region.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = appliedFilters.type ? agreement.type === appliedFilters.type : true;
    const matchesYear = appliedFilters.year
      ? new Date(agreement.endDate).getFullYear().toString() === appliedFilters.year
      : true;

    return matchesSearch && matchesType && matchesYear;
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
              Type:
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All</option>
                <option value="MOU">MOU</option>
                <option value="MOA">MOA</option>
              </select>
            </label>
            <label>
              Expiry Year:
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="">All</option>
                {expiryYears.map((year, i) => (
                  <option key={i} value={year}>{year}</option>
                ))}
              </select>
            </label>
            <button
              className="apply-btn"
              onClick={() => {
                setAppliedFilters({ type: filterType, year: filterYear });
                setCurrentPage(1);
                setShowFilter(false);
              }}
            >
              Apply
            </button>
          </div>
        )}

        <div className="table-container">
          {paginatedData.length > 0 ? (
            <table className="expired-table">
              <thead>
                <tr>
                  <th>DTS Number</th>
                  <th>Partner Name</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Region / Country</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((agreement, index) => (
                  <tr key={index}>
                    <td>{agreement.dtsNo}</td>
                    <td>{agreement.partner}</td>
                    <td>{agreement.type}</td>
                    <td>{agreement.startDate}</td>
                    <td>{agreement.endDate}</td>
                    <td>
                      <span className="status-badge expired">{agreement.status}</span>
                    </td>
                    <td>{agreement.region}</td>
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
