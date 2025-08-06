import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './docVer.css';

// Mock data for demonstration purposes
const mockDocuments = Array.from({ length: 23 }, (_, i) => ({
  date: '05/25/25',
  partnerName: 'PAUL BAKERY MALAYSIA',
  docType: 'MOA',
  version: 'V1.0',
}));

const DocumentVersion = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    const handleResize = () => {
      const isNowDesktop = window.innerWidth >= 768;
      setIsDesktop(isNowDesktop);
      if (isNowDesktop) setMobileShow(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.ceil(mockDocuments.length / itemsPerPage);
  const currentData = mockDocuments.slice(
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
          {isDesktop && (
            <div className={`floating-toggle-btn ${collapsed ? 'collapsed' : ''}`} onClick={toggleCollapse}>
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </div>
          )}

          <div className="contact-person-wrapper">
            <div className="search-filter-bar">
              <input type="text" placeholder="Search here" className="search-input" />
              <button className="filter-btn">Filter</button>
            </div>

            <div className="table-container">
              <table className="contact-person-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>PARTNER NAME</th>
                    <th>DOCUMENT TYPE</th>
                    <th>VERSION</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((doc, index) => (
                    <tr key={index}>
                      <td>{doc.date}</td>
                      <td>{doc.partnerName}</td>
                      <td>{doc.docType}</td>
                      <td>{doc.version}</td>
                      <td>
                        <button className="view-btn">View File</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
