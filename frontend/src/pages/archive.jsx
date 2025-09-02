import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "./archive.css";

/* Mock data */
const archiveData = Array.from({ length: 24 }, (_, i) => ({
  partnerName: "PAUL BAKERY MALAYSIA",
  documentType: i % 2 === 0 ? "MOA" : "MOU",
  partnershipClassification: i % 2 === 0 ? "MOA on Research" : "MOU on Exchange",
  expireDate: "06/04/28",
  pointPerson: "LIZBETTE R. VERGARA",
}));

const Archive = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDocType, setFilterDocType] = useState("");
  const [filterClassification, setFilterClassification] = useState("");

  const itemsPerPage = 10;

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    const handleResize = () => {
      const isNowDesktop = window.innerWidth >= 768;
      setIsDesktop(isNowDesktop);
      if (isNowDesktop) setMobileShow(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filtering logic
  const filteredData = archiveData.filter((item) => {
    const searchMatch =
      item.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partnershipClassification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.expireDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pointPerson.toLowerCase().includes(searchTerm.toLowerCase());

    const docTypeMatch = filterDocType ? item.documentType === filterDocType : true;
    const classificationMatch = filterClassification
      ? item.partnershipClassification === filterClassification
      : true;

    return searchMatch && docTypeMatch && classificationMatch;
  });

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
          {isDesktop && (
            <div
              className={`floating-toggle-btn ${collapsed ? "collapsed" : ""}`}
              onClick={toggleCollapse}
            >
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </div>
          )}
          <h2 className="archive-title">Archives</h2>

          <div className="contact-person-wrapper">
            {/* Search & Filter Bar */}
            <div className="search-filter-bar">
              <input
                type="text"
                placeholder="Search here"
                className="search-input"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
                Filter
              </button>
            </div>

            {/* Filter Options*/}
            {showFilters && (
              <div className="filter-options">
                <select
                  value={filterDocType}
                  onChange={(e) => {
                    setFilterDocType(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Document Types</option>
                  {[...new Set(archiveData.map((d) => d.documentType))].map((doc, i) => (
                    <option key={i} value={doc}>
                      {doc}
                    </option>
                  ))}
                </select>

                <select
                  value={filterClassification}
                  onChange={(e) => {
                    setFilterClassification(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Classifications</option>
                  {[...new Set(archiveData.map((d) => d.partnershipClassification))].map(
                    (cls, i) => (
                      <option key={i} value={cls}>
                        {cls}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* Table */}
            <div className="table-container">
              <table className="contact-person-table">
                <thead>
                  <tr>
                    <th>PARTNER NAME</th>
                    <th>DOCUMENT TYPE</th>
                    <th>PARTNERSHIP CLASSIFICATION</th>
                    <th>EXPIRE DATE</th>
                    <th>POINT PERSON</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.partnerName}</td>
                        <td>{item.documentType}</td>
                        <td>{item.partnershipClassification}</td>
                        <td>{item.expireDate}</td>
                        <td>{item.pointPerson}</td>
                        <td>
                          <button className="view-btn">View File</button>
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
                  className={currentPage === index + 1 ? "active" : ""}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Archive;
