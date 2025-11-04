import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import './pointPerson.css'; 
import useDebounce from "../hooks/useDebounce";
import { agreementService } from '../services/agreementService';

const PointPerson = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const [rows, setRows] = useState([]);
  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

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
            (a.point_persons || []).forEach(pp => {
              flattened.push({
                dts_number: a.dts_number || '',
                source_unit: a.source_unit || '',
                position: pp.point_person_position || '',
                name: pp.point_person_name || '',
                email: pp.point_person_email || '',
                agreementId: a.agreement_id,
                documentType: a.document_type,
                partnershipType: a.partnership_type || '-',
              });
            });
          });
        setRows(flattened);
      } catch (e) {
        console.error('Failed to load point persons', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // FILTER
  const filteredData = useMemo(() => {  
  return rows.filter((person) => {
    const term = (debouncedSearchText || "").trim().toLowerCase();  // Use debounced value
    if (!term) return true;
    const name = (person.name || "").toLowerCase();
    const email = (person.email || "").toLowerCase();
    const position = (person.position || "").toLowerCase();
    const dts = (person.dts_number || "").toLowerCase();
    const source = (person.source_unit || "").toLowerCase();
    const docType = (person.documentType || "").toLowerCase();
    return (
      name.includes(term) ||
      email.includes(term) ||
      position.includes(term) ||
      dts.includes(term) ||
      source.includes(term) ||
      docType.includes(term)
    );
  });
}, [rows, debouncedSearchText]);

  // PAGINATION
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
              <p>Loading point persons...</p>
            </div>
          ) : (
            <>
              <h2 className="point-title">Point Person List | Initiator</h2>

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
                        <th>DTS NO.</th>
                        <th>SOURCE</th>
                        <th>POSITION</th>
                        <th>NAME</th>
                        <th>EMAIL ADDRESS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.length > 0 ? (
                        currentData.map((person, index) => (
                          <tr key={index}>
                            <td>{person.dts_number}</td>
                            <td>{person.source_unit}</td>
                            <td>{person.position}</td>
                            <td>{person.name}</td>
                            <td>{person.email}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center" }}>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PointPerson;
