import React, { useState } from "react";
import "./mouList.css";

const partnersData = [
  { source: "COED", name: "KAOHSIUNG MUNICIPAL WUFU ELEMENTARY SCHOOL", country: "Taiwan", date: "2023-02-15" },
  { source: "COED", name: "NATIONAL TAIPEI UNIVERSITY", country: "Taiwan", date: "2023-07-10" },
  { source: "CBA", name: "WASEDA UNIVERSITY", country: "Japan", date: "2024-03-25" },
  { source: "CBA", name: "SEOUL NATIONAL UNIVERSITY", country: "South Korea", date: "2024-08-08" },
  { source: "COED", name: "UNIVERSITY OF MALAYA", country: "Malaysia", date: "2025-01-15" },
  { source: "CBA", name: "CHULALONGKORN UNIVERSITY", country: "Thailand", date: "2025-06-20" },
];

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const MOUListPartners = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [year, setYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", startMonth: "", endMonth: "" });

  // Extract years dynamically
  const years = Array.from(
    new Set(partnersData.map((p) => new Date(p.date).getFullYear()))
  ).sort();

  const applyFilters = () => {
    setAppliedFilters({ year, startMonth, endMonth });
  };

  // Filtering 
  const filteredData = partnersData.filter((partner) => {
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
      <h2 className="mou-title">MOU List of Partners</h2>

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
              {years.map((y, i) => (
                <option key={i} value={y}>{y}</option>
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
        </div>
      )}

      {/* Table */}
      <table className="mou-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Name of Partners</th>
            <th>Country</th>
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
                <td>{partner.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MOUListPartners;
