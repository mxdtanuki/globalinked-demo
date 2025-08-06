
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './mobility.css';

const Mobility = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [searchTerm, setSearchTerm] = useState('');
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

  /* Mock data for demonstration purposes */
  const data = Array(34).fill({
    partnersClassification: 'MOA ON CONFERENCE',
    partnersName: 'PAUL BAKERY MALAYSIA',
    entityType: 'CORPORATION',
    country: 'MALAYSIA',
    validity: '5 YEARS',
    expiryDate: 'JULY 2030',
    pointPerson: 'LIZBETTE R. VERGARA',
    contactPerson: 'SIR MECMAC'
  });

  const filteredData = data.filter(item =>
    item.partnersName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

          <div className="mobility-wrapper">
            <div className="mobility-header">
              <input
                type="text"
                placeholder="Search here"
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="filter-btn">Filter</button>
              <button className="generate-btn">Generate</button>
            </div>

            <div className="table-container">
              <table className="mobility-table">
                <thead>
                  <tr>
                    <th>PARTNERS CLASSIFICATION</th>
                    <th>PARTNERS NAME</th>
                    <th>ENTITY TYPE</th>
                    <th>COUNTRY</th>
                    <th>VALIDITY</th>
                    <th>EXPIRY DATE</th>
                    <th>POINT PERSON</th>
                    <th>CONTACT PERSON</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.partnersClassification}</td>
                      <td>{row.partnersName}</td>
                      <td>{row.entityType}</td>
                      <td>{row.country}</td>
                      <td>{row.validity}</td>
                      <td>{row.expiryDate}</td>
                      <td>{row.pointPerson}</td>
                      <td>{row.contactPerson}</td>
                      <td>
                        <button className="view-btn">View File</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                ← Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={currentPage === i + 1 ? 'active' : ''}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mobility;
