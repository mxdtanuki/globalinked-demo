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
  const [allArchiveData, setAllArchiveData] = useState([]);
  const [withdrawnData, setWithdrawnData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [activeTab, setActiveTab] = useState("Expired");
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true); 
  const itemsPerPage = 10;

  // Fetch Expired + Withdrawn stats and data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Expired archive
        const archiveRes = await agreementService.getArchivedAgreements();
        const expiredOnly = archiveRes.filter(
          (d) =>
            d.status?.toLowerCase() === "expired" ||
            (d.date_expiry && new Date(d.date_expiry) < new Date())
        );

        // Withdrawn agreements
        const allAgreements = await agreementService.getAgreements();
        const withdrawnOnly = allAgreements.filter(
          (a) => a.agreement_status?.toLowerCase() === "withdrawn"
        );
        console.log("All agreements:", allAgreements);
        console.log("Withdrawn found:", withdrawnOnly);

        setAllArchiveData(expiredOnly);
        setWithdrawnData(withdrawnOnly);
        setDisplayData(expiredOnly);

        // Compute stats
        setStats([
          { label: "Expired", count: expiredOnly.length },
          { label: "Withdrawn", count: withdrawnOnly.length },
        ]);
      } catch (err) {
        console.error("Failed to load archive data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Switch view (Expired / Withdrawn)
  const filterByStat = (label) => {
    setActiveTab(label);
    setCurrentPage(1);
    setSearchTerm("");
    setFilterDocType("");
    setFilterClassification("");

    if (label === "Expired") {
      setDisplayData(allArchiveData);
    } else if (label === "Withdrawn") {
      setDisplayData(withdrawnData);
    }
  };

  // Filtering + Search logic
  const filteredData = displayData.filter((item) => {
    const searchMatch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const docTypeMatch = filterDocType
      ? item.document_type === filterDocType
      : true;
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
      {mobileShow && (
        <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />
      )}
      <div className="content-body">
        <Sidebar
          collapsed={collapsed}
          toggleCollapse={() => setCollapsed(!collapsed)}
          mobileShow={mobileShow}
        />
        <div
          className="main-content"
          onClick={() => mobileShow && setMobileShow(false)}
        >
          
          <h2 className="archive-title">Archives</h2>
        
          {/* Stats Row */}
          <div className="stats-row">
            {stats.map((s, i) => (
              <button
                key={i}
                className={`stat-card ${
                  activeTab === s.label ? "active-tab" : ""
                }`}
                onClick={() => filterByStat(s.label)}
              >
                <div className="stat-number">{s.count}</div>
                <div className="stat-label">{s.label}</div>
              </button>
            ))}
          </div>

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
              <button
                className="filter-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                Filter
              </button>
            </div>

            {/* Filter Options */}
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
                  {[...new Set(displayData.map((d) => d.document_type))].map(
                    (doc, i) => (
                      <option key={i} value={doc}>
                        {doc}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={filterClassification}
                  onChange={(e) => {
                    setFilterClassification(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Classifications</option>
                  {[...new Set(displayData.map((d) => d.partnership_type))].map(
                    (cls, i) => (
                      <option key={i} value={cls}>
                        {cls}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* TABLES */}
            <div className="table-container">
              {activeTab === "Expired" ? (
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
                              onClick={() =>
                                handleViewLatestFile(item.dts_number)
                              }
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
              ) : (
                <table className="contact-person-table">
                  <thead>
                    <tr>
                      <th>SOURCE</th>
                      <th>POINT PERSON / POSITION</th>
                      <th>DTS NO.</th>
                      <th>DTS LOCATION</th>
                      <th>PARTNER'S NAME</th>
                      <th>ENTITY TYPE</th>
                      <th>COUNTRY</th>
                      <th>REGION</th>
                      <th>ADDRESS</th>
                      <th>SIGNATORIES / POSITION</th>
                      <th>CONTACT PERSON / DETAILS</th>
                      <th>DOCUMENT TYPE</th>
                      <th>PARTNERSHIP CLASSIFICATION</th>
                      <th>EVENT TITLE / OTHER IMPT INFO</th>
                      <th>VALIDITY PERIOD</th>
                      <th>DATE OF SIGNING</th>
                      <th>EXPIRY DATE</th>
                      <th>DATE RECEIVED</th>
                      <th>DATE ENDORSED TO ULCO</th>
                      <th>ULCO APPROVAL</th>
                      <th>PUP OFFICIAL SIGNATURES</th>
                      <th>STATUS</th>
                      <th>WEBSITE LINK</th>
                      <th>BRIEF PROFILE</th>
                      <th>LOGO</th>
                      <th>HARDCOPY LOCATOR</th>
                      <th>REMARKS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.length > 0 ? (
                      currentData.map((item, index) => (
                        <tr key={index}>
                          <td>{item.source_unit || "—"}</td>
                          <td>{item.point_person || "—"}</td>
                          <td>{item.dts_number || "—"}</td>
                          <td>{item.dts_location || "—"}</td>
                          <td>{item.name || item.partner_name || "—"}</td>
                          <td>{item.entity_type || "—"}</td>
                          <td>{item.country || "—"}</td>
                          <td>{item.region || "—"}</td>
                          <td>{item.address || "—"}</td>
                          <td>{item.signatories || "—"}</td>
                          <td>{item.contact_person || "—"}</td>
                          <td>{item.document_type || "—"}</td>
                          <td>{item.partnership_type || "—"}</td>
                          <td>{item.event_title || "—"}</td>
                          <td>{item.validity_period || "—"}</td>
                          <td>{item.date_signing || "—"}</td>
                          <td>{item.date_expiry || "—"}</td>
                          <td>{item.date_received || "—"}</td>
                          <td>{item.date_endorsed || "—"}</td>
                          <td>{item.ulco_approval || "—"}</td>
                          <td>{item.pup_signatures || "—"}</td>
                          <td>{item.agreement_status || item.status || "—"}</td>
                          <td>{item.website_link || "—"}</td>
                          <td>{item.brief_profile || "—"}</td>
                          <td>{item.logo ? <img src={item.logo} alt="Logo" width="50" /> : "—"}</td>
                          <td>{item.hardcopy_locator || "—"}</td>
                          <td>
                            {Array.isArray(item.remarks)
                              ? item.remarks.map((r, i) => (
                                  <div key={i}>{r.remark_text || JSON.stringify(r)}</div>
                                ))
                              : item.remarks?.remark_text || "—"}
                          </td>
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
                        <td colSpan="27" style={{ textAlign: "center" }}>
                          No withdrawn agreements found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
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
