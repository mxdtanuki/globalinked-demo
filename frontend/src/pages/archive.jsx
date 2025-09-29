import React, { useEffect, useState } from "react";
import { agreementService } from "../services/agreementService";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "./archive.css";
import { documentService } from "../services/documentService";

const Archive = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterDocType, setFilterDocType] = useState("");
  const [filterClassification, setFilterClassification] = useState("");
  const [archiveData, setArchiveData] = useState([]);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await agreementService.getArchivedAgreements();
        console.log("📦 Archive API data:", data);
        setArchiveData(data);

      } catch (err) {
        console.error("Failed to load archive data:", err);
      }
    };
    fetchData();
  }, []);

  // Filtering logic
  const filteredData = archiveData.filter((item) => {
    const searchMatch =
      item.partner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partnership_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.date_expiry ? String(item.date_expiry).toLowerCase() : "").includes(searchTerm.toLowerCase()) ||
      (item.point_persons_display ? item.point_persons_display.toLowerCase() : "").includes(searchTerm.toLowerCase());


    const docTypeMatch = filterDocType ? item.document_type === filterDocType : true;
    const classificationMatch = filterClassification
      ? item.partnership_type === filterClassification
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

const handleViewLatestFile = async (dtsNumber) => {
  try {
    const latest = await documentService.getLatestVersion(dtsNumber);
    if (!latest) {
      alert("No document versions found for this DTS number.");
      return;
    }

    const resp = await fetch(latest.download_url, {
      headers: { Accept: "application/pdf" },
    });
    if (!resp.ok) throw new Error(`Failed to fetch file (${resp.status})`);
    const blob = await resp.blob();
    const pdfBlob = new Blob([blob], { type: "application/pdf" });
    const url = window.URL.createObjectURL(pdfBlob);
    window.open(url, "_blank");
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    console.error("View failed:", err);
    alert("Failed to open file: " + (err.message || err));
  }
};

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={() => setMobileShow(!mobileShow)} />
      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}
      <div className="content-body">
        <Sidebar collapsed={collapsed} toggleCollapse={() => setCollapsed(!collapsed)} mobileShow={mobileShow} />
        <div className="main-content" onClick={() => mobileShow && setMobileShow(false)}>

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
                  {[...new Set(archiveData.map((d) => d.document_type))].map((doc, i) => (
                    <option key={i} value={doc}>{doc}</option>
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
                  {[...new Set(archiveData.map((d) => d.partnership_type))].map((cls, i) => (
                    <option key={i} value={cls}>{cls}</option>
                  ))}
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
                        <td>{item.partner_name}</td>
                        <td>{item.document_type}</td>
                        <td>{item.partnership_type}</td>
                        <td>{item.date_expiry}</td>
                        <td>{item.point_persons_display}</td>
                        <td>
                          <button
                            className="view-btn"
                            onClick={() => handleViewLatestFile(item.dts_number)}
                          >
                            View File
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
