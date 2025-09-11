import React, { useState } from "react";
import "./mouList.css";

const moaPartnersData = [
  {
    source: "COED",
    name: "UNIVERSITY OF MALAYA",
    country: "Malaysia",
    classification: "Academic Exchange",
    date: "2023-02-12",
  },
  {
    source: "CBA",
    name: "UNIVERSITY OF QUEENSLAND",
    country: "Australia",
    classification: "Research Collaboration",
    date: "2023-07-20",
  },
  {
    source: "CENG",
    name: "KYOTO UNIVERSITY",
    country: "Japan",
    classification: "Faculty & Student Exchange",
    date: "2024-03-18",
  },
  {
    source: "CCIS",
    name: "NATIONAL UNIVERSITY OF SINGAPORE",
    country: "Singapore",
    classification: "Joint Research",
    date: "2025-06-05",
  },
];

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const MOAListPartners = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [year, setYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", startMonth: "", endMonth: "" });

  // Apply filters 
  const applyFilters = () => {
    setAppliedFilters({ year, startMonth, endMonth });
  };

  // Filtering logic
  const filteredData = moaPartnersData.filter((partner) => {
    const d = new Date(partner.date);
    const y = d.getFullYear().toString();
    const m = d.getMonth() + 1;

    return (
      (appliedFilters.year ? y === appliedFilters.year : true) &&
      (appliedFilters.startMonth ? m >= parseInt(appliedFilters.startMonth) : true) &&
      (appliedFilters.endMonth ? m <= parseInt(appliedFilters.endMonth) : true)
    );
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
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
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
            filteredData.map((partner, idx) => (
              <tr key={idx}>
                <td>{partner.source}</td>
                <td>{partner.name}</td>
                <td>{partner.country}</td>
                <td>{partner.classification}</td>
                <td>{partner.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MOAListPartners;
