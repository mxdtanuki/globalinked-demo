import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './contactPerson.css';

// Mock data for contact persons
const mockData = Array.from({ length: 42 }, (_, i) => ({
  partnerName: 'PAUL BAKERY MALAYSIA',
  entityType: 'CORPORATION',
  position: 'DEAN',
  name: 'SIR MECMAC',
  email: 'MECMAC@GMAIL.COM',
}));

const ContactPerson = () => {
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

  const totalPages = Math.ceil(mockData.length / itemsPerPage);
  const currentData = mockData.slice(
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
                    <th>PARTNERS NAME</th>
                    <th>ENTITY TYPE</th>
                    <th>POSITION</th>
                    <th>NAME</th>
                    <th>EMAIL</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((person, index) => (
                    <tr key={index}>
                      <td>{person.partnerName}</td>
                      <td>{person.entityType}</td>
                      <td>{person.position}</td>
                      <td>{person.name}</td>
                      <td>{person.email}</td>
                      <td>
                        <button className="view-btn">View Agreements</button>
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

export default ContactPerson;
