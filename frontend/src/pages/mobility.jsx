import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 
import "./mobility.css";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { agreementService } from '../services/agreementService';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    const data = await agreementService.getAgreements();

    // Only include agreements with status "Active"
    const activeData = data.filter(item => item.agreement_status === "Active");

    const allowedClassifications = [
      "MOA on Student Competition",
      "MOA on Internship",
      "MOA on Faculty Exchange",
      "MOA on Student Exchange",
      "MOA on Faculty and Student Exchange"
    ];

    const filteredData = activeData.filter(item =>
      allowedClassifications.includes(item.partnership_type)
    );

    setAgreements(filteredData);
  } catch (err) {
    setError("Failed to fetch agreements: " + err.message);
  } finally {
    setLoading(false);
  }
};
  
  const dynamicOptions = {
    partnersClassification: [
      ...new Set(agreements.map((d) => d.partnership_type).filter(Boolean)),
    ],
    entityType: [...new Set(agreements.map((d) => d.entity_type).filter(Boolean))],
    country: [...new Set(agreements.map((d) => d.country).filter(Boolean))],
    validity: [...new Set(agreements.map((d) => d.validity_period).filter(Boolean))],
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
                          <button className="view-btn">View File</button>
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
