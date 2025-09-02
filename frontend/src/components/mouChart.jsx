import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./mouChart.css"; 

const COLORS = ["#2E86C1", "#9B59B6", "#27AE60", "#F39C12", "#E74C3C"];

const MOUChart = ({ data, onDataUpdate }) => {
  const months = Object.keys(data);
  const [filterVisible, setFilterVisible] = useState(false);
  const [startMonth, setStartMonth] = useState(months[0]);
  const [endMonth, setEndMonth] = useState(months[0]);
  const [filteredData, setFilteredData] = useState(data[months[0]]);
  const [rangeLabel, setRangeLabel] = useState(`${months[0]} 2025`);

  //  Push initial dataset to parent
  useEffect(() => {
    onDataUpdate(data[months[0]]);
  }, []);

  const handleApplyFilter = () => {
    const startIndex = months.indexOf(startMonth);
    const endIndex = months.indexOf(endMonth);

    if (startIndex > endIndex) {
      alert("End month must be after Start month!");
      return;
    }

    // Combine range data
    const combined = {};
    months.slice(startIndex, endIndex + 1).forEach((month) => {
      data[month].forEach((entry) => {
        combined[entry.name] = (combined[entry.name] || 0) + entry.value;
      });
    });

    const result = Object.entries(combined).map(([name, value]) => ({
      name,
      value,
    }));

    setFilteredData(result);
    onDataUpdate(result);

    setRangeLabel(
      startMonth === endMonth
        ? `${startMonth} 2025`
        : `${startMonth} – ${endMonth} 2025`
    );

    setFilterVisible(false);
  };

  return (
    <div className="mou-chart-card">
      <h2 className="mou-chart-title">Memorandum of Understanding</h2>
      <p className="mou-chart-subtitle">
        Showing data for <strong>{rangeLabel}</strong>
      </p>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(1)}%`
            }
          >
            {filteredData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Filter button */}
      <div className="mou-chart-filter-btn">
        <button
          className="mou-chart-btn-primary"
          onClick={() => setFilterVisible(!filterVisible)}
        >
          {filterVisible ? "Cancel" : "Filter by Date Range"}
        </button>
      </div>

      {/* Filter dropdowns */}
      {filterVisible && (
        <div className="mou-chart-filter-panel">
          <label>Start:</label>
          <select
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="mou-chart-dropdown"
          >
            {months.map((month) => (
              <option key={month}>{month}</option>
            ))}
          </select>

          <label>End:</label>
          <select
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="mou-chart-dropdown"
          >
            {months.map((month) => (
              <option key={month}>{month}</option>
            ))}
          </select>

          <button
            className="mou-chart-btn-secondary"
            onClick={handleApplyFilter}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

export default MOUChart;
