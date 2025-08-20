import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 
import "./mobility.css";

const Mobility = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    partnersClassification: "",
    entityType: "",
    country: "",
    validity: "",
  });
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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* Mock data */
  const data = Array(34).fill({
    partnersClassification: "MOA ON CONFERENCE",
    partnersName: "PAUL BAKERY MALAYSIA",
    entityType: "CORPORATION",
    country: "MALAYSIA",
    validity: "5 YEARS",
    expiryDate: "JULY 2030",
    pointPerson: "LIZBETTE R. VERGARA",
    contactPerson: "SIR MECMAC",
  });

  const dynamicOptions = {
    partnersClassification: [
      ...new Set(data.map((d) => d.partnersClassification)),
    ],
    entityType: [...new Set(data.map((d) => d.entityType))],
    country: [...new Set(data.map((d) => d.country))],
    validity: [...new Set(data.map((d) => d.validity))],
  };

  // Apply search and filters
  const filteredData = data.filter((item) => {
    const matchesSearch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesFilters =
      (!filters.partnersClassification ||
        item.partnersClassification === filters.partnersClassification) &&
      (!filters.entityType || item.entityType === filters.entityType) &&
      (!filters.country || item.country === filters.country) &&
      (!filters.validity || item.validity === filters.validity);

    return matchesSearch && matchesFilters;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // PDF Generator
  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Mobility Office Report", 14, 15);

    const columns = [
      "Partners Classification",
      "Partners Name",
      "Entity Type",
      "Country",
      "Validity",
      "Expiry Date",
      "Point Person",
      "Contact Person",
    ];

    // Export only filtered data if filter/search applied, otherwise all data
    const dataToExport =
      searchTerm ||
      filters.partnersClassification ||
      filters.entityType ||
      filters.country ||
      filters.validity
        ? filteredData
        : data;

    const rows = dataToExport.map((item) => [
      item.partnersClassification,
      item.partnersName,
      item.entityType,
      item.country,
      item.validity,
      item.expiryDate,
      item.pointPerson,
      item.contactPerson,
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255] }, 
    });

    doc.save("mobility-report.pdf");
  };

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileShow(false)}
        />
      )}
      <div className="content-body">
        <Sidebar
          collapsed={collapsed}
          toggleCollapse={toggleCollapse}
          mobileShow={mobileShow}
        />
        <div
          className="main-content"
          onClick={() => mobileShow && setMobileShow(false)}
        >
          {isDesktop && (
            <div
              className={`floating-toggle-btn ${
                collapsed ? "collapsed" : ""
              }`}
              onClick={toggleCollapse}
            >
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </div>
          )}

          <h2 className="mobility-title">Mobility Office</h2>

          <div className="mobility-wrapper">
            <div className="mobility-header">
              <input
                type="text"
                placeholder="Search here"
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <button
                type="button"
                className={`filter-btn ${showFilters ? "active" : ""}`}
                onClick={() => setShowFilters((prev) => !prev)}
              >
                Filters
              </button>

              {/* Generate PDF Button */}
              <button className="generate-btn" onClick={handleGeneratePDF}>
                Generate
              </button>
            </div>

            {/* Filters row */}
            {showFilters && (
              <div className="filters-container">
                <select
                  value={filters.partnersClassification}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      partnersClassification: e.target.value,
                    }))
                  }
                >
                  <option value="">All Classifications</option>
                  {dynamicOptions.partnersClassification.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.entityType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      entityType: e.target.value,
                    }))
                  }
                >
                  <option value="">All Entity Types</option>
                  {dynamicOptions.entityType.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.country}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                >
                  <option value="">All Countries</option>
                  {dynamicOptions.country.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.validity}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      validity: e.target.value,
                    }))
                  }
                >
                  <option value="">All Validity</option>
                  {dynamicOptions.validity.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Table */}
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

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={currentPage === i + 1 ? "active" : ""}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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

export default Mobility;
