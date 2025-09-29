import React, { useState } from "react";
import "./mouList.css";


const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const MOAListPartners = ({ agreements }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [year, setYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", startMonth: "", endMonth: "" });

  // Filter MOA agreements
  const moaAgreements = agreements.filter(agreement => 
    agreement.document_type?.toUpperCase() === 'MOA'
  );

  console.log('📝 MOA agreements:', moaAgreements.length);

  // Get unique years from the data for dropdown
  const availableYears = [...new Set(
    moaAgreements.map(agreement => {
      const date = agreement.date_signed || agreement.entry_date;
      return date ? new Date(date).getFullYear().toString() : null;
    }).filter(Boolean)
  )].sort();

  // Apply filters 
  const applyFilters = () => {
    setAppliedFilters({ year, startMonth, endMonth });
  };

    // Clear filters
  const clearFilters = () => {
    setYear("");
    setStartMonth("");
    setEndMonth("");
    setAppliedFilters({ year: "", startMonth: "", endMonth: "" });
  };

  // Filtering logic
  const filteredData = moaAgreements.filter((agreement) => {
    const dateString = agreement.date_signed || agreement.entry_date;
    if (!dateString) return false;

    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return false;

      const y = d.getFullYear().toString();
      const m = d.getMonth() + 1;

      return (
        (appliedFilters.year ? y === appliedFilters.year : true) &&
        (appliedFilters.startMonth ? m >= parseInt(appliedFilters.startMonth) : true) &&
        (appliedFilters.endMonth ? m <= parseInt(appliedFilters.endMonth) : true)
      );
    } catch (error) {
      console.warn('Date parsing error for agreement:', agreement.agreement_id, error);
      return false;
    }
  });

  return (
    <div className="mou-container">
      <h2 className="mou-title">MOA List of Partners</h2>

      {/* Toggle filter button */}
      <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
        {showFilters ? "Hide Filters" : "Show Filters"}
      </button>

      {/* Filters Section */}
      {showFilters && (
        <div className="filters" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
          <label>
            <strong>Year:</strong>{" "}
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">All Years</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>

          <label>
            <strong>Start Month:</strong>{" "}
            <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)}>
              <option value="">--</option>
              {months.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label>
            <strong>End Month:</strong>{" "}
            <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)}>
              <option value="">--</option>
              {months.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <button onClick={applyFilters} style={{ padding: "5px 12px", cursor: "pointer" }}>Apply</button>
          <button onClick={clearFilters} style={{ padding: "5px 12px", cursor: "pointer" }}> Clear </button>
        </div>
      )}

      {/* Table */}
      <table className="mou-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Name of Partner</th>
            <th>Country</th>
            <th>Classification of Partnership</th>
            <th>Date Signed</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((agreement, idx) => (
              <tr key={agreement.agreement_id || idx}>
                <td>{agreement.source_unit || 'N/A'}</td>
                <td>{agreement.name || 'N/A'}</td>
                <td>{agreement.country || 'N/A'}</td>
                <td>{agreement.partnership_type || 'N/A'}</td>
                <td>{agreement.date_signed ? new Date(agreement.date_signed).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
               📝 No MOA Agreements Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MOAListPartners;
