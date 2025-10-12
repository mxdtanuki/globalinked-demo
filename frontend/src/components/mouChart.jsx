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

const MONTHS_ORDER = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
];

const MOUChart = forwardRef(({ data, onDataUpdate, selectedYear: propSelectedYear, visibleStartMonth, visibleEndMonth }, ref) => {
  const years = Object.keys(data || {});
  const [filterVisible, setFilterVisible] = useState(false);

  const [selectedYear, setSelectedYear] = useState(years[0] || "");
  const months = selectedYear && data[selectedYear] ? MONTHS_ORDER.filter(m => Object.keys(data[selectedYear] || {}).includes(m)) : [];
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

  // Remove mount-only initialization: rely on the data-driven effect below.

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const years = Object.keys(data);
      const latestYear = years.sort().reverse()[0];
      const months = Object.keys(data[latestYear]);
      const latestMonth = months.sort().reverse()[0];

      // If parent supplied a selectedYear, prefer it; otherwise use latest
      const useYear = propSelectedYear || latestYear;
  const yearMonthsUnsorted = Object.keys(data[useYear] || {});
  const yearMonths = MONTHS_ORDER.filter(m => yearMonthsUnsorted.includes(m));
  const useLatestMonth = yearMonths.length ? yearMonths[yearMonths.length - 1] : (latestMonth || yearMonthsUnsorted.sort().reverse()[0]);

      setSelectedYear(useYear);
      setStartMonth(visibleStartMonth || useLatestMonth);
      setEndMonth(visibleEndMonth || useLatestMonth);

      // If parent provided a selectedYear, combine full-year months for that year
      if (propSelectedYear && data[useYear] && yearMonths.length > 0) {
        const combined = {};
        yearMonths.forEach((m) => {
          const entries = data[useYear][m] || [];
          entries.forEach((e) => {
            combined[e.name] = (combined[e.name] || 0) + e.value;
          });
        });
        const result = Object.entries(combined).map(([name, value]) => ({ name, value }));
        setChartData(processAllData(result));
        setRangeLabel(
          yearMonths.length === 1 ? `${yearMonths[0]} ${useYear}` : `${yearMonths[0]} – ${yearMonths[yearMonths.length - 1]} ${useYear}`
        );
        console.debug('MOUChart full-year', { useYear, monthsShown: yearMonths.length, resultCount: result.length });

      } else if (visibleStartMonth && visibleEndMonth && data[useYear]) {
        const startIndex = yearMonths.indexOf(visibleStartMonth);
        const endIndex = yearMonths.indexOf(visibleEndMonth);
        const range = startIndex >= 0 && endIndex >= 0 && endIndex >= startIndex ? yearMonths.slice(startIndex, endIndex + 1) : [];
        const combined = {};
        range.forEach((m) => {
          const entries = data[useYear][m] || [];
          entries.forEach((e) => {
            combined[e.name] = (combined[e.name] || 0) + e.value;
          });
        });
        const result = Object.entries(combined).map(([name, value]) => ({ name, value }));
        setChartData(processAllData(result));
        setRangeLabel(
          visibleStartMonth === visibleEndMonth
            ? `${visibleStartMonth} ${useYear}`
            : `${visibleStartMonth} – ${visibleEndMonth} ${useYear}`
        );
      } else {
    const latestArr = data[useYear][useLatestMonth] || [];
    setChartData(processAllData(latestArr));
        setRangeLabel(`${useLatestMonth} ${useYear}`);
      }

      // Fallback: if chartData would be empty but data has entries, aggregate first available month across any year
      const hasAnyData = Object.keys(data).some(y => Object.keys(data[y] || {}).length > 0);
      if ((chartData == null || chartData.length === 0) && hasAnyData) {
        // find first year/month with data
        for (const y of Object.keys(data)) {
          const months = Object.keys(data[y] || {});
          if (months.length > 0) {
            const arr = data[y][months[0]] || [];
            if (arr.length > 0) {
              const processed = processAllData(arr);
              setChartData(processed);
              // DO NOT call onDataUpdate here; parent controls table state
              setRangeLabel(`${months[0]} ${y}`);
              break;
            }
          }
        }
      }
    }
  }, [data, propSelectedYear, visibleStartMonth, visibleEndMonth]);

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

    const result = Object.entries(combined).map(([name, value]) => ({
      name,
      value,
    }));

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
      <h2 className="mou-chart-title">Memorandum of Understanding</h2>
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

export default MOUChart;
