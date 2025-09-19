import React, { useState, useEffect, forwardRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./mouChart.css";

const COLORS = [
  "#2E86C1",
  "#9B59B6",
  "#27AE60",
  "#F39C12",
  "#E74C3C",
  "#FFDE21",
  "#16A085",
  "#8E44AD",
  "#F1948A",
  "#85C1E9",
  "#AED6F1",
  "#F8C471",
  "#82E0AA",
  "#BB8FCE"
];

const MOAChart = forwardRef(({ data, onDataUpdate }, ref) => {
  const years = Object.keys(data || {});
  const [filterVisible, setFilterVisible] = useState(false);

  const [selectedYear, setSelectedYear] = useState(years[0] || "");
  const months = selectedYear && data[selectedYear] ? Object.keys(data[selectedYear]) : [];
  const [startMonth, setStartMonth] = useState(months[0] || "");
  const [endMonth, setEndMonth] = useState(months[0] || "");
  const [chartData, setChartData] = useState([]);
  const [rangeLabel, setRangeLabel] = useState(
    months[0] ? `${months[0]} ${years[0]}` : "No Data"
  );

  // Show ALL data instead of grouping top 5
  const processAllData = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.sort((a, b) => b.value - a.value);
  };

  useEffect(() => {
    if (selectedYear && months.length > 0) {
      const initialArr = data[selectedYear][months[0]];
      setChartData(processAllData(initialArr));
      onDataUpdate(initialArr);
    }
  }, []); 

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const years = Object.keys(data);
      const latestYear = years.sort().reverse()[0]; // pick latest year
      const months = Object.keys(data[latestYear]);
      const latestMonth = months.sort().reverse()[0]; // pick latest month

      // Reset selected year/months
      setSelectedYear(latestYear);
      setStartMonth(latestMonth);
      setEndMonth(latestMonth);

      // Set chart data from the latest available dataset
      const latestArr = data[latestYear][latestMonth] || [];
      setChartData(processAllData(latestArr));
      onDataUpdate(latestArr);

      // Update label
      setRangeLabel(`${latestMonth} ${latestYear}`);
    }
  }, [data]);

  const handleApplyFilter = () => {
    if (!selectedYear || months.length === 0) return;

    const startIndex = months.indexOf(startMonth);
    const endIndex = months.indexOf(endMonth);

    if (startIndex > endIndex) {
      alert("End month must be after Start month!");
      return;
    }

    const combined = {};
    months.slice(startIndex, endIndex + 1).forEach((month) => {
      const entries = data[selectedYear][month] || [];
      entries.forEach((entry) => {
        combined[entry.name] = (combined[entry.name] || 0) + entry.value;
      });
    });

    const result = Object.entries(combined).map(([name, value]) => ({ name, value }));

    setChartData(processAllData(result));
    onDataUpdate(result);

    setRangeLabel(
      startMonth === endMonth
        ? `${startMonth} ${selectedYear}`
        : `${startMonth} – ${endMonth} ${selectedYear}`
    );

    setFilterVisible(false);
  };

  return (
    <div className="mou-chart-card" ref={ref}>
      <h2 className="mou-chart-title">Memorandum of Agreement</h2>
      <p className="mou-chart-subtitle">
        Showing data for <strong>{rangeLabel}</strong>
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
          >
            {chartData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mou-chart-filter-btn">
        <button
          className="mou-chart-btn-primary"
          onClick={() => setFilterVisible(!filterVisible)}
        >
          {filterVisible ? "Cancel" : "Filter by Date Range"}
        </button>
      </div>

      {filterVisible && (
        <div className="mou-chart-filter-panel">
          <label>Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => {
              const year = e.target.value;
              const newMonths = Object.keys(data[year] || {});
              setSelectedYear(year);
              setStartMonth(newMonths[0] || "");
              setEndMonth(newMonths[0] || "");
            }}
            className="mou-chart-dropdown"
          >
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>

          <label>Start Month:</label>
          <select
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="mou-chart-dropdown"
          >
            {months.map((month) => (
              <option key={month}>{month}</option>
            ))}
          </select>

          <label>End Month:</label>
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
});

export default MOAChart;
