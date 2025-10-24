import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 
import "./mobility.css";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { agreementService } from '../services/agreementService';
import { documentService } from '../services/documentService';
 
const Mobility = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    partnersClassification: "",
    entityType: "",
    country: "",
    validity: "",
  });

   const [pendingFilters, setPendingFilters] = useState({
    partnersClassification: "",
    entityType: "",
    country: "",
    validity: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

    useEffect(() => {
    if (showFilters) {
      setPendingFilters(filters);
    }
  }, [showFilters, filters]);

  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

    useEffect(() => {
    fetchAgreements();
  }, []);

const fetchAgreements = async () => {
  try {
    setLoading(true);
    // Use optimized endpoint for mobility agreements
    const filteredData = await agreementService.getMobilityAgreements();
    setAgreements(filteredData);
  } catch (err) {
    setError("Failed to fetch agreements: " + err.message);
  } finally {
    setLoading(false);
  }
};
  
  const normalizeLabel = (v) => {
    if (!v && v !== 0) return "";
    const s = String(v).trim().replace(/\s+/g, " ");
    return s
      .toLowerCase()
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");
  };

  const uniqueSorted = (arr) =>
    [...new Set((arr || []).map(normalizeLabel).filter(Boolean))].sort();

  const dynamicOptions = {
    partnersClassification: uniqueSorted(
      agreements.map((d) => d.partnership_type)
    ),
    entityType: uniqueSorted(agreements.map((d) => d.entity_type)),
    country: uniqueSorted(agreements.map((d) => d.country)),
    validity: uniqueSorted(agreements.map((d) => d.validity_period)),
  };


  // Apply search and filters
  const filteredData = agreements.filter((item) => {
    const matchesSearch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesFilters =
      (!filters.partnersClassification ||
        item.partnership_type === filters.partnersClassification) &&
      (!filters.entityType || item.entity_type === filters.entityType) &&
      (!filters.country || item.country === filters.country) &&
      (!filters.validity || item.validity_period === filters.validity);

    return matchesSearch && matchesFilters;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatPointPersons = (pointPersons) => {
    if (!Array.isArray(pointPersons) || pointPersons.length === 0) return '-';
    return pointPersons.map(pp => 
      `${pp.point_person_position || ''}: ${pp.point_person_name || ''} (${pp.point_person_email || ''})`
    ).join('; ');
  };

  const formatContactPersons = (contactPersons) => {
    if (!Array.isArray(contactPersons) || contactPersons.length === 0) return '-';
    return contactPersons.map(cp => 
      `${cp.contact_person_position || ''}: ${cp.contact_person_name || ''} (${cp.contact_person_email || ''})`
    ).join('; ');
  };

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

    // Export only filtered agreements if filter/search applied
    const dataToExport =
      searchTerm ||
      filters.partnersClassification ||
      filters.entityType ||
      filters.country ||
      filters.validity
        ? filteredData
        : agreements;

    const rows = dataToExport.map((item) => [
      item.partnership_type || '-',
      item.name || '-',
      item.entity_type || '-',
      item.country || '-',
      item.validity_period || '-',
      item.date_expiry || '-',
      formatPointPersons(item.point_persons),
      formatContactPersons(item.contact_persons),
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

  // Excel Generator
const handleGenerateExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Mobility Report");

  worksheet.columns = [
    { header: "Partners Classification", key: "partnership_type", width: 25 },
    { header: "Partners Name", key: "name", width: 30 },
    { header: "Entity Type", key: "entity_type", width: 20 },
    { header: "Country", key: "country", width: 20 },
    { header: "Validity", key: "validity_period", width: 15 },
    { header: "Expiry Date", key: "date_expiry", width: 15 },
    { header: "Point Person", key: "point_persons", width: 40 },
    { header: "Contact Person", key: "contact_persons", width: 40 },
  ];

  const dataToExport =
    searchTerm ||
    filters.partnersClassification ||
    filters.entityType ||
    filters.country ||
    filters.validity
      ? filteredData
      : agreements;

  dataToExport.forEach((item) => {
    worksheet.addRow({
      partnership_type: item.partnership_type || "-",
      name: item.name || "-",
      entity_type: item.entity_type || "-",
      country: item.country || "-",
      validity_period: item.validity_period || "-",
      date_expiry: item.date_expiry || "-",
      point_persons: formatPointPersons(item.point_persons),
      contact_persons: formatContactPersons(item.contact_persons),
    });
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "800000" }, 
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "mobility-report.xlsx");
};

  const handleViewLatestFile = async (dtsNumber) => {
    console.log("Fetching document for DTS:", dtsNumber);
    try {
      const latest = await documentService.getLatestVersion(dtsNumber);
      if (!latest) {
        alert("No document versions found for this DTS number.");
        return;
      }
      const resp = await fetch(latest.download_url, { headers: { Accept: "application/pdf" } });
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

  // Loading and error states
  if (error) return <div className="dashboard-container">Error: {error}</div>;

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
         {loading ? (
            <div className="lloading-container">
              <div className="spinner"></div>
              <p>Loading Mobility...</p>
            </div>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : (
            <>
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
                Generate PDF
              </button>
              <button className="generate-btn" onClick={handleGenerateExcel}>
              Generate Excel
            </button>
            </div>

            {/* Filters row */}
            {showFilters && (
              <div className="filters-panel">
                <div className="filters-row">
                  <select
                    value={pendingFilters.partnersClassification}
                    onChange={(e) =>
                      setPendingFilters((prev) => ({
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
                    value={pendingFilters.entityType}
                    onChange={(e) =>
                      setPendingFilters((prev) => ({
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
                    value={pendingFilters.country}
                    onChange={(e) =>
                      setPendingFilters((prev) => ({
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
                    value={pendingFilters.validity}
                    onChange={(e) =>
                      setPendingFilters((prev) => ({
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

                <div className="filter-actions">
                  <button
                    className="apply-btn"
                    onClick={() => {
                      setFilters(pendingFilters);
                      setCurrentPage(1);
                      setShowFilters(false);
                    }}
                  >
                    Apply
                  </button>
                  <button
                    className="clear-btn"
                    onClick={() => {
                      const empty = {
                        partnersClassification: "",
                        entityType: "",
                        country: "",
                        validity: "",
                      };
                      setPendingFilters(empty);
                      setFilters(empty);
                      setCurrentPage(1);
                    }}
                  >
                    Clear
                  </button>
                </div>
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
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="loading-message">
                        Loading records...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="no-records">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row, idx) => (
                      <tr key={row.agreement_id || idx}>
                        <td>{row.partnership_type || '-'}</td>
                        <td>{row.name || '-'}</td>
                        <td>{row.entity_type || '-'}</td>
                        <td>{row.country || '-'}</td>
                        <td>{row.validity_period || '-'}</td>
                        <td>{row.date_expiry || '-'}</td>
                        <td>{formatPointPersons(row.point_persons)}</td>
                        <td>{formatContactPersons(row.contact_persons)}</td>
                        <td>
                          <button
                            className="view-btn"
                            onClick={() => handleViewLatestFile(row.dts_number)} 
                          >
                            View File
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mobility;
