import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './pointPerson.css'; 

/* Mock data */
const mockData = Array.from({ length: 23 }, (_, i) => ({ 
  position: i % 2 === 0 ? 'DEAN' : 'CHAIRPERSON',
  name: `Person ${i + 1}`,
  email: `person${i + 1}@gmail.com`,
}));

/* Mock agreements */
const mockAgreements = [
  {
    id: 1,
    documentType: 'MOU',
    partnerClassification: 'Research Agreement',
    contactEmail: 'person1@gmail.com',
    fileUrl: '/mock-files/mou-person1.pdf',
  },
  {
    id: 2,
    documentType: 'MOA',
    partnerClassification: 'Contract Agreement',
    contactEmail: 'person2@gmail.com',
    fileUrl: '/mock-files/moa-person2.pdf',
  },
  {
    id: 3,
    documentType: 'MOU',
    partnerClassification: 'Collaboration',
    contactEmail: 'person1@gmail.com',
    fileUrl: '/mock-files/mou-person1-2.pdf',
  },
];

const PointPerson = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [agreements, setAgreements] = useState([]);

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

  // FILTER
  const filteredData = mockData.filter((person) => {
    const term = searchText.toLowerCase();
    return (
      person.name.toLowerCase().includes(term) ||
      person.email.toLowerCase().includes(term) ||
      person.position.toLowerCase().includes(term)
    );
  });

  // PAGINATION
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Handle View Agreements
  const handleViewAgreements = (person) => {
    setSelectedPerson(person);
    const related = mockAgreements.filter(a => a.contactEmail === person.email);
    setAgreements(related);
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

          <h2 className="point-title">Point Person List</h2>

          <div className="point-person-wrapper">
            <div className="search-filter-bar">
              <input
                type="text"
                placeholder="Search here"
                className="search-input"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="table-container">
              <table className="point-person-table">
                <thead>
                  <tr>
                    <th>POSITION</th>
                    <th>NAME</th>
                    <th>EMAIL ADDRESS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((person, index) => (
                      <tr key={index}>
                        <td>{person.position}</td>
                        <td>{person.name}</td>
                        <td>{person.email}</td>
                        <td>
                          <button className="view-btn" onClick={() => handleViewAgreements(person)}>
                            View Agreements
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center" }}>
                        No results found
                      </td>
                    </tr>
                  )}
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

      {/* Modal */}
      {selectedPerson && (
        <div className="modal">
          <div className="modal-content modal-large">
            <h3>Agreements for {selectedPerson.name}</h3>
            {agreements.length > 0 ? (
              <table className="agreements-table">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Partner Classification</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((a) => (
                    <tr key={a.id}>
                      <td>{a.documentType}</td>
                      <td>{a.partnerClassification}</td>
                      <td>
                        <button className="action-btn" onClick={() => window.open(a.fileUrl, "_blank")}>
                          View File
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = a.fileUrl;
                            link.download = a.documentType;
                            link.click();
                          }}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No agreements found.</p>
            )}
            <button onClick={() => setSelectedPerson(null)} style={{ marginTop: '10px' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointPerson;
