import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import './contactPerson.css';
import { agreementService } from '../services/agreementService';

const ContactPerson = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  // Load agreements 
  useEffect(() => {
    (async () => {
      try {
        setLoading(true); 
        const data = await agreementService.getAgreements();
        const flattened = [];
        data
          .filter(a =>
            a.agreement_status !== "Withdrawn" &&
            (!a.date_expiry || new Date(a.date_expiry) > new Date())
          )
          .forEach(a => {
            (a.contact_persons || []).forEach(cp => {
              flattened.push({
                dts_number: a.dts_number || '',
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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter logic
  const filteredData = rows.filter((person) => {
    const term = searchText.toLowerCase();
    if (!term) return true;
    const dts = (person.dts_number || "").toLowerCase();
    const partnerName = (person.partnerName || "").toLowerCase();
    const entityType = (person.entityType || "").toLowerCase();
    const position = (person.position || "").toLowerCase();
    const name = (person.name || "").toLowerCase();
    const email = (person.email || "").toLowerCase();
    return (
      dts.includes(term) ||
      partnerName.includes(term) ||
      entityType.includes(term) ||
      position.includes(term) ||
      name.includes(term) ||
      email.includes(term)
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

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}
      <div className="content-body">
        <Sidebar collapsed={collapsed} toggleCollapse={toggleCollapse} mobileShow={mobileShow} />
        <div className="main-content" onClick={() => mobileShow && setMobileShow(false)}>

          {loading ? (
            <div className="lloading-container">
              <div className="spinner"></div>
              <p>Loading contact persons...</p>
            </div>
          ) : (
            <>
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
                        <th>DTS NO.</th>
                        <th>PARTNER'S NAME</th>
                        <th>ENTITY TYPE</th>
                        <th>POSITION</th>
                        <th>NAME</th>
                        <th>EMAIL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.length > 0 ? (
                        currentData.map((person, index) => (
                          <tr key={index}>
                            <td>{person.dts_number}</td>
                            <td>{person.partnerName}</td>
                            <td>{person.entityType}</td>
                            <td>{person.position}</td>
                            <td>{person.name}</td>
                            <td>{person.email}</td>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPerson;
