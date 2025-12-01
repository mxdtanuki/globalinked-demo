import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FiFileText,
  FiX,
  FiBarChart,
  FiSettings,
  FiFile,
  FiFilter,
  FiEye,
  FiCalendar,
  FiInfo,
  FiDownload,
  FiPrinter,
} from "react-icons/fi";
import "../components/overview1.css";
import "../pages/activeAgreement.css";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ReportGen from "../components/reportGeneration";
import useDebounce from "../hooks/useDebounce";
import "./mobility.css";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { agreementService } from "../services/agreementService";
import { documentService } from "../services/documentService";

const Mobility = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [showFilters, setShowFilters] = useState(false);
  // Generate report modal 
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateClassification, setGenerateClassification] = useState("All");
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
  const [error, setError] = useState("");

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
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

  // Reusable SearchableSelect
  const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    allowClear = false,
  }) => {
    const normalized = (options || []).map((o) =>
      typeof o === "string" ? { value: o, label: o } : o
    );
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef();
    const panelRef = useRef(null);
    const searchInputRef = useRef(null);
    const [panelStyle, setPanelStyle] = useState(null);

    useEffect(() => {
      const onDocClick = (e) => {
        const clickInsideToggle = ref.current && ref.current.contains(e.target);
        const clickInsidePanel = panelRef.current && panelRef.current.contains(e.target);
        if (!clickInsideToggle && !clickInsidePanel) {
          setOpen(false);
        }
      };
      window.addEventListener("click", onDocClick);
      return () => window.removeEventListener("click", onDocClick);
    }, []);

    useEffect(() => {
      if (open && searchInputRef.current) {
        try {
          searchInputRef.current.focus({ preventScroll: true });
        } catch (e) {
          searchInputRef.current.focus();
        }
      }
    }, [open]);

    useEffect(() => {
      if (!open) {
        setPanelStyle(null);
        return;
      }

      const updatePosition = () => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const viewportPadding = 8;
        const maxAllowed = window.innerWidth - viewportPadding * 2;
        const desiredWidth = Math.min(Math.max(rect.width, 120), Math.min(320, maxAllowed));

        const left = Math.min(
          Math.max(rect.left, viewportPadding),
          Math.max(viewportPadding, window.innerWidth - desiredWidth - viewportPadding)
        );
        const top = rect.bottom;
        setPanelStyle({
          position: "fixed",
          left: left + "px",
          top: top + "px",
          width: desiredWidth + "px",
          zIndex: 9999,
        });
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }, [open]);

    const filtered = normalized.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );
    const selectedLabel =
      normalized.find((o) => String(o.value) === String(value))?.label || "";

    return (
      <div
        className="searchable-select"
        ref={ref}
        style={{ position: "relative" }}
      >
        <button
          type="button"
          className="ss-toggle"
          onClick={() => {
            // If opening, measure toggle position synchronously and set panel style
            if (!open && ref.current) {
              const rect = ref.current.getBoundingClientRect();
              const viewportPadding = 8;
              const maxAllowed = window.innerWidth - viewportPadding * 2;
              const desiredWidth = Math.min(Math.max(rect.width, 120), Math.min(320, maxAllowed));
              const left = Math.min(
                Math.max(rect.left, viewportPadding),
                Math.max(viewportPadding, window.innerWidth - desiredWidth - viewportPadding)
              );
              const top = rect.bottom;
              setPanelStyle({
                position: "fixed",
                left: left + "px",
                top: top + "px",
                width: desiredWidth + "px",
                zIndex: 9999,
              });
              setOpen(true);
              return;
            }
            // closing
            setPanelStyle(null);
            setOpen(false);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          style={{ whiteSpace: "nowrap" }}
        >
          <span className={`ss-value ${selectedLabel ? "" : "placeholder"}`}>
            {selectedLabel || placeholder}
          </span>
          <span className="ss-caret">▾</span>
        </button>
        {allowClear && selectedLabel && (
          <button
            className="ss-clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange && onChange("");
            }}
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
        {open &&
          createPortal(
            <div
              ref={panelRef}
              className="ss-panel"
              role="dialog"
              style={{
                ...panelStyle,
                background: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                marginTop: 6,
                maxHeight: 260,
                overflow: "auto",
              }}
            >
              <div style={{ padding: 8 }}>
                <input
                  ref={searchInputRef}
                  className="ss-search"
                  placeholder="Type to search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
              <ul
                className="ss-list"
                role="listbox"
                aria-label="options"
                style={{ listStyle: "none", margin: 0, padding: 0 }}
              >
                {filtered.length === 0 && (
                  <li style={{ padding: 8, color: "#666" }}>No results</li>
                )}
                {filtered.map((o) => (
                  <li
                    key={o.value}
                    className="ss-item"
                    style={{ padding: 8, cursor: "pointer" }}
                    onClick={() => {
                      onChange && onChange(o.value);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {o.label}
                  </li>
                ))}
              </ul>
            </div>,
            document.body
          )}
      </div>
    );
  };

  const dynamicOptions = {
    partnersClassification: uniqueSorted(
      agreements.map((d) => d.partnership_type)
    ),
    entityType: uniqueSorted(agreements.map((d) => d.entity_type)),
    country: uniqueSorted(agreements.map((d) => d.country)),
    validity: uniqueSorted(agreements.map((d) => d.validity_period)),
  };

  // Apply search and filters
  const filteredData = useMemo(() => {
    return agreements.filter((item) => {
      const matchesSearch = Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()); 

      const matchesFilters =
        (!filters.partnersClassification ||
          item.partnership_type
            ?.toLowerCase()
            .includes(filters.partnersClassification.toLowerCase())) &&
        (!filters.entityType ||
          item.entity_type
            ?.toLowerCase()
            .includes(filters.entityType.toLowerCase())) &&
        (!filters.country ||
          item.country
            ?.toLowerCase()
            .includes(filters.country.toLowerCase())) &&
        (!filters.validity ||
          item.validity_period
            ?.toLowerCase()
            .includes(filters.validity.toLowerCase()));

      return matchesSearch && matchesFilters;
    });
  }, [agreements, debouncedSearchTerm, filters]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatPointPersons = (pointPersons) => {
    if (!Array.isArray(pointPersons) || pointPersons.length === 0) return "-";
    return pointPersons
      .map(
        (pp) =>
          `${pp.point_person_position || ""}: ${pp.point_person_name || ""} (${
            pp.point_person_email || ""
          })`
      )
      .join("; ");
  };

  const formatContactPersons = (contactPersons) => {
    if (!Array.isArray(contactPersons) || contactPersons.length === 0)
      return "-";
    return contactPersons
      .map(
        (cp) =>
          `${cp.contact_person_position || ""}: ${
            cp.contact_person_name || ""
          } (${cp.contact_person_email || ""})`
      )
      .join("; ");
  };

  // PDF Generator - use shared ReportGen.generatePrintableReport
  const handleGeneratePDF = (docFilter = "All", statusFilter = "All") => {
    const base =
      searchTerm ||
      filters.partnersClassification ||
      filters.entityType ||
      filters.country ||
      filters.validity
        ? filteredData
        : agreements;

    let dataToExport = base;
    if (docFilter && docFilter !== "All") {
      const df = String(docFilter).toLowerCase();
      dataToExport = dataToExport.filter((item) =>
        String(item.document_type || item.partnership_type || "")
          .toLowerCase()
          .includes(df)
      );
    }
    if (statusFilter && statusFilter !== "All") {
      const sf = String(statusFilter).toLowerCase();
      dataToExport = dataToExport.filter((item) =>
        String(item.status || item.agreement_status || "")
          .toLowerCase()
          .includes(sf)
      );
    }

    try {
      ReportGen.generatePrintableReport({
        items: dataToExport,
        reportKey: "mobility",
        reportLabelMap: { mobility: "Mobility Office Report" },
        allAgreements: agreements,
      });
    } catch (e) {
      console.error("Printable report failed", e);
      alert("Printable report failed: " + (e?.message || e));
    }
  };

  // Excel Generator
  const handleGenerateExcel = async (
    docFilter = "All",
    statusFilter = "All"
  ) => {
    // base dataset
    const base =
      searchTerm ||
      filters.partnersClassification ||
      filters.entityType ||
      filters.country ||
      filters.validity
        ? filteredData
        : agreements;

    let dataToExport = base;
    if (docFilter && docFilter !== "All") {
      const df = String(docFilter).toLowerCase();
      dataToExport = dataToExport.filter((item) =>
        String(item.document_type || item.partnership_type || "")
          .toLowerCase()
          .includes(df)
      );
    }
    if (statusFilter && statusFilter !== "All") {
      const sf = String(statusFilter).toLowerCase();
      dataToExport = dataToExport.filter((item) =>
        String(item.status || item.agreement_status || "")
          .toLowerCase()
          .includes(sf)
      );
    }

    try {
      await ReportGen.downloadXLSX({
        items: dataToExport,
        reportKey: "mobility",
        filenamePrefix: "mobility-report",
        allAgreements: agreements,
      });
    } catch (e) {
      console.error("Excel export failed", e);
      alert("Excel export failed: " + (e?.message || e));
    }
  };

  const handleViewLatestFile = async (dtsNumber) => {
    console.log("Fetching document for DTS:", dtsNumber);
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

  // Loading and error states
  if (error) return <div className="dashboard-container">Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && (
        <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />
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
                    className="overview1-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <button
                    type="button"
                    className={`overview1-filter-btn ${
                      showFilters ? "open" : ""
                    }`}
                    onClick={() => setShowFilters((prev) => !prev)}
                  >
                    <FiFilter className="filter-icon" /> Filters
                  </button>

                  {/* Generate Report (Overview-style) */}
                  <button
                    className="btn generate"
                    title="Generate Report"
                    onClick={() => setShowGenerateModal(true)}
                  >
                    <FiFileText className="icon" style={{ marginRight: 8 }} />
                    Generate Report
                  </button>
                </div>

                {/* Generate Report Modal (Overview exact markup & classes) */}
                {showGenerateModal && (
                  <div
                    className="overview1-modal-backdrop"
                    onClick={() => setShowGenerateModal(false)}
                  >
                    <div
                      className="overview1-modal report-modal"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="overview1-modal-header">
                        <div className="modal-badge-row">
                          <FiFileText className="header-icon" />
                          <h3 className="modal-title">Generate Report</h3>
                        </div>
                        <button
                          className="modal-close"
                          onClick={() => setShowGenerateModal(false)}
                          aria-label="Close"
                        >
                          <FiX className="icon" />
                        </button>
                      </div>

                      <div className="overview1-modal-body">
                        {/* Report Summary Card */}
                        <div className="report-summary-card">
                          <div className="report-header">
                            <div className="report-icon-container">
                              <FiBarChart className="report-main-icon" />
                            </div>
                            <div className="report-titles">
                              <div className="report-title">
                                Agreement Report Generator
                              </div>
                              <div className="report-sub">
                                Generate comprehensive reports for agreements in
                                Excel format
                              </div>
                            </div>
                          </div>

                          <div className="report-stats">
                            <div className="stat-item">
                              <div className="stat-label">Total Agreements</div>
                              <div className="stat-number">
                                {filteredData.length}
                              </div>
                            </div>
                            <div className="stat-item">
                              <div className="stat-label">
                                Partnership Classification
                              </div>
                              <div className="stat-value">
                                {generateClassification === "All"
                                  ? "All Classifications"
                                  : generateClassification}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Report Configuration */}
                        <div className="report-configuration">
                          <div className="config-section">
                            <h4 className="config-title">
                              <FiSettings className="config-icon" />
                              Report Configuration
                            </h4>

                            <div className="config-rows">
                              <div className="config-row">
                                <label className="config-label">
                                  <FiFile className="label-icon" />
                                  Partnership Classification
                                </label>
                                <select
                                  value={generateClassification}
                                  onChange={(e) =>
                                    setGenerateClassification(e.target.value)
                                  }
                                  className="config-select"
                                >
                                  <option value="All">
                                    All Classifications
                                  </option>
                                  {uniqueSorted(
                                    agreements.map((d) => d.partnership_type)
                                  ).map((opt, i) => (
                                    <option key={i} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Report Preview */}
                          <div className="preview-section">
                            <h4 className="config-title">
                              <FiEye className="config-icon" />
                              Report Preview
                            </h4>
                            <div className="preview-info">
                              <div className="preview-stats">
                                <div className="preview-stat">
                                  <FiFile className="stat-icon" />
                                  <span>
                                    Total records:{" "}
                                    <strong>{filteredData.length}</strong>
                                  </span>
                                </div>
                                <div className="preview-stat">
                                  <FiCalendar className="stat-icon" />
                                  <span>
                                    Generated:{" "}
                                    <strong>
                                      {new Date().toLocaleDateString()}
                                    </strong>
                                  </span>
                                </div>
                              </div>
                              <div className="preview-note">
                                <FiInfo className="note-icon" />
                                The report will include all agreement details,
                                contact information, and timeline data.
                              </div>
                            </div>
                          </div>

                          {/* Export Options */}
                          <div className="export-section">
                            <h4 className="config-title">
                              <FiDownload className="config-icon" />
                              Export Options
                            </h4>

                            <div className="export-options">
                              <div className="export-option">
                                <div className="option-header">
                                  <FiPrinter className="option-icon print" />
                                  <div className="option-info">
                                    <div className="option-title">
                                      Printable Report
                                    </div>
                                    <div className="option-desc">
                                      Opens a printable HTML view suitable for
                                      PDF export or printing
                                    </div>
                                  </div>
                                </div>
                                <button
                                  className="btn export-btn print-btn"
                                  onClick={() => {
                                    try {
                                      handleGeneratePDF(generateClassification);
                                    } catch (e) {
                                      console.error(
                                        "Printable report failed",
                                        e
                                      );
                                      alert(
                                        "Printable report failed: " +
                                          (e?.message || e)
                                      );
                                    }
                                    setShowGenerateModal(false);
                                  }}
                                >
                                  <FiPrinter className="icon" />
                                  Print / PDF
                                </button>
                              </div>
                              <div className="export-option">
                                <div className="option-header">
                                  <FiFile className="option-icon excel" />
                                  <div className="option-info">
                                    <div className="option-title">
                                      Excel Report
                                    </div>
                                    <div className="option-desc">
                                      Comprehensive spreadsheet with all
                                      agreement details and formatting
                                    </div>
                                  </div>
                                </div>
                                <button
                                  className="btn export-btn excel-btn"
                                  onClick={async () => {
                                    await handleGenerateExcel(
                                      generateClassification
                                    );
                                    setShowGenerateModal(false);
                                  }}
                                >
                                  <FiDownload className="icon" />
                                  Download Excel
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="overview1-modal-footer">
                        <button
                          className="btn cancel"
                          onClick={() => setShowGenerateModal(false)}
                        >
                          <FiX className="icon" />
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters row */}
                {showFilters && (
                  <div className="overview1-filter-panel">
                    <div
                      className="overview1-panel-row"
                      style={{
                        display: "flex",
                        gap: 16,
                        overflowX: "auto",
                        flexWrap: "nowrap",
                        alignItems: "flex-start",
                        paddingBottom: 8,
                      }}
                    >
                      <div className="overview1-panel-field" style={{ minWidth: 240 }}>
                        <label className="form-label">
                          <FiFile className="label-icon" /> Partnership
                          Classification
                        </label>
                        <SearchableSelect
                          options={dynamicOptions.partnersClassification}
                          value={pendingFilters.partnersClassification}
                          onChange={(v) =>
                            setPendingFilters((prev) => ({
                              ...prev,
                              partnersClassification: v,
                            }))
                          }
                          placeholder="All Classifications"
                        />
                      </div>

                      <div className="overview1-panel-field" style={{ minWidth: 240 }}>
                        <label className="form-label">
                          <FiSettings className="label-icon" /> Entity Type
                        </label>
                        <SearchableSelect
                          options={dynamicOptions.entityType}
                          value={pendingFilters.entityType}
                          onChange={(v) =>
                            setPendingFilters((prev) => ({
                              ...prev,
                              entityType: v,
                            }))
                          }
                          placeholder="All Entity Types"
                        />
                      </div>

                      <div className="overview1-panel-field" style={{ minWidth: 240 }}>
                        <label className="form-label">
                          <FiFileText className="label-icon" /> Country
                        </label>
                        <SearchableSelect
                          options={dynamicOptions.country}
                          value={pendingFilters.country}
                          onChange={(v) =>
                            setPendingFilters((prev) => ({
                              ...prev,
                              country: v,
                            }))
                          }
                          placeholder="All Countries"
                        />
                      </div>

                      <div className="overview1-panel-field" style={{ minWidth: 240 }}>
                        <label className="form-label">
                          <FiCalendar className="label-icon" /> Validity
                        </label>
                        <SearchableSelect
                          options={dynamicOptions.validity}
                          value={pendingFilters.validity}
                          onChange={(v) =>
                            setPendingFilters((prev) => ({
                              ...prev,
                              validity: v,
                            }))
                          }
                          placeholder="All Validity"
                        />
                      </div>
                    </div>

                    <div className="overview1-filter-actions">
                      <button
                        className="btn apply"
                        onClick={() => {
                          setFilters(pendingFilters);
                          setCurrentPage(1);
                          setShowFilters(false);
                        }}
                      >
                        Apply
                      </button>
                      <button
                        className="btn clear"
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
                            <td>{row.partnership_type || "-"}</td>
                            <td>{row.name || "-"}</td>
                            <td>{row.entity_type || "-"}</td>
                            <td>{row.country || "-"}</td>
                            <td>{row.validity_period || "-"}</td>
                            <td>{row.date_expiry || "-"}</td>
                            <td>{formatPointPersons(row.point_persons)}</td>
                            <td>{formatContactPersons(row.contact_persons)}</td>
                            <td>
                              <button
                                className="view-btn"
                                onClick={() =>
                                  handleViewLatestFile(row.dts_number)
                                }
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
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
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
