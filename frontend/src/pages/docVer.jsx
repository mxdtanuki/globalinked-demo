import React, { useState } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import './docVer.css';

// Mock data 
const mockDocuments = Array.from({ length: 23 }, (_, i) => ({
  date: '05/25/25',
  dtsNum: `DTS-${1000 + i}`,
  partnerName: 'PAUL BAKERY MALAYSIA',
  docType: i % 2 === 0 ? 'MOA' : 'MOU',
  partnershipType: i % 2 === 0 ? 'Contract Agreement' : 'Cooperation Agreement',
  version: i % 2 === 0 ? 'V1.0' : 'V2.0',
  comments: i % 2 === 0 ? 'Reviewed' : 'Pending',
  status: i % 3 === 0 ? 'Endorse' : 'For Signing',
}));

const DocumentVersion = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDocType, setFilterDocType] = useState('');
  const [filterPartnershipType, setFilterPartnershipType] = useState('');
  const [filterVersion, setFilterVersion] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 10;

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  //dynamic values for dropdown filters
  const partnershipTypes = [...new Set(mockDocuments.map(d => d.partnershipType))];
  const versions = [...new Set(mockDocuments.map(d => d.version))];
  const statuses = [...new Set(mockDocuments.map(d => d.status))];

  // filter + search logic
  const filteredDocuments = mockDocuments.filter((doc) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      doc.date.toLowerCase().includes(query) ||
      doc.partnerName.toLowerCase().includes(query) ||
      doc.docType.toLowerCase().includes(query) ||
      doc.partnershipType.toLowerCase().includes(query) ||
      doc.version.toLowerCase().includes(query) ||
      doc.dtsNum.toLowerCase().includes(query);

    const matchesDocType = filterDocType ? doc.docType === filterDocType : true;
    const matchesPartnershipType = filterPartnershipType ? doc.partnershipType === filterPartnershipType : true;
    const matchesVersion = filterVersion ? doc.version === filterVersion : true;
    const matchesStatus = filterStatus ? doc.status === filterStatus : true;

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
                {showFilters ? ' Filters' : ' Filters'}
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="filter-section">
                <select value={filterDocType} onChange={(e) => { setFilterDocType(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Document Types</option>
                  <option value="MOA">MOA</option>
                  <option value="MOU">MOU</option>
                </select>

                <select value={filterPartnershipType} onChange={(e) => { setFilterPartnershipType(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Partnership Types</option>
                  {partnershipTypes.map((type, i) => (
                    <option key={i} value={type}>{type}</option>
                  ))}
                </select>

                <select value={filterVersion} onChange={(e) => { setFilterVersion(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Versions</option>
                  {versions.map((v, i) => (
                    <option key={i} value={v}>{v}</option>
                  ))}
                </select>

                <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Status</option>
                  {statuses.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Table */}
            <div className="table-container">
              <table className="contact-person-table">
                <thead>
                  <tr>
                    <th>UPlOAD DATE</th>
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
                  {currentData.length > 0 ? (
                    currentData.map((doc, index) => (
                      <tr key={index}>
                        <td>{doc.date}</td>
                        <td>{doc.dtsNum}</td>
                        <td>{doc.partnerName}</td>
                        <td>{doc.docType}</td>
                        <td>{doc.partnershipType}</td>
                        <td>{doc.version}</td>
                        <td>{doc.comments}</td>
                        <td>{doc.status}</td>
                        <td>
                          <div className="docu-action-buttons">
                            <div className="docu-top-actions">
                              <button className="docu-edit-btn" onClick={() => alert(`Edit ${doc.dtsNum}`)}>Edit</button>
                              <button className="docu-delete-btn" onClick={() => alert(`Delete ${doc.dtsNum}`)}>Delete</button>
                            </div>
                            <div className="docu-bottom-action">
                              <button className="docu-view-btn">View File</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center' }}>No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                ← Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={currentPage === index + 1 ? 'active' : ''}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
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
