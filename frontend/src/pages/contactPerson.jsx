import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './contactPerson.css';
import { agreementService } from '../services/agreementService';


const ContactPerson = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
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

// Load agreements and flatten contact persons into table rows
  useEffect(() => {
    (async () => {
      try {
        const data = await agreementService.getAgreements();
        setAgreements(data);
        const flattened = [];
        data.forEach(a => {
          (a.contact_persons || []).forEach(cp => {
            flattened.push({
              partnerName: a.name || '',
              entityType: a.entity_type || '',
              position: cp.contact_person_position || '',
              name: cp.contact_person_name || '',
              email: cp.contact_person_email || '',
              agreementId: a.agreement_id,
            });
          });
        });
        setRows(flattened);
      } catch (e) {
        console.error('Failed to load contact persons', e);
      }
    })();
  }, []);

  // Filter logic
  const filteredData = rows.filter((person) => {
  const term = searchText.toLowerCase();
    return (
      person.partnerName.toLowerCase().includes(term) ||
      person.entityType.toLowerCase().includes(term) ||
      person.position.toLowerCase().includes(term) ||
      person.name.toLowerCase().includes(term) ||
      person.email.toLowerCase().includes(term)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // View agreements
  const handleViewAgreements = (person) => {
    setSelectedPerson(person);
   const seen = new Set();
   const related = rows
   .filter(r => r.email === person.email && !seen.has(r.agreementId) && seen.add(r.agreementId))
     .map(r => ({
       agreement_id: r.agreementId,
       document_type: r.documentType,
       partnership_type: r.partnershipType,
     }));
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

          <h2 className="mobility-title">Contact Person List</h2>

          {/* Contact Person Table */}
          <div className="contact-person-wrapper">
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
              <table className="contact-person-table">
                <thead>
                  <tr>
                    <th>PARTNER'S NAME</th>
                    <th>ENTITY TYPE</th>
                    <th>POSITION</th>
                    <th>NAME</th>
                    <th>EMAIL</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((person, index) => (
                      <tr key={index}>
                        <td>{person.partnerName}</td>
                        <td>{person.entityType}</td>
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
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        No results found
                      </td>
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

      {/* Modal for Agreements */}
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
                    <tr key={a.id}>s
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
                            link.download = a.title;
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

export default ContactPerson;
