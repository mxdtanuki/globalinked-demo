import React, { useMemo } from "react";
import "./mouTable.css";

const MOUTable = ({ data = [] }) => {
  // Normalize input 
  const rawRows = useMemo(
    () =>
      Array.isArray(data)
        ? data.map((r) => ({
            name: r?.name ?? "Unknown",
            value: Number(r?.value) || 0,
          }))
        : [],
    [data] 
  );

  // Process rows for table
  const { processedRows, topCountries, leastCountries, maxVal, minVal } =
    useMemo(() => {
      if (!rawRows.length) {
        return {
          processedRows: [],
          topCountries: [],
          leastCountries: [],
          maxVal: 0,
          minVal: 0,
        };
      }

      // Sort descending by value
      const sorted = [...rawRows].sort((a, b) => b.value - a.value);

      // Compute min and max values for insights
      const values = rawRows.map((r) => r.value);
      const maxVal = Math.max(...values);
      const minVal = Math.min(...values);

      const topCountries = rawRows.filter((r) => r.value === maxVal);
      const leastCountries = rawRows.filter((r) => r.value === minVal);

      return {
        processedRows: sorted, 
        topCountries,
        leastCountries,
        maxVal,
        minVal,
      };
    }, [rawRows]); 

  if (!processedRows.length) {
    return (
      <div className="mou-table-card mou-table-empty">
        <p>No data available</p>
      </div>
    );
  }

  const displayTotal = processedRows.reduce((sum, r) => sum + r.value, 0);
  const rowsWithPercent = processedRows.map((r) => ({
    ...r,
    percent: displayTotal > 0 ? Number(((r.value / displayTotal) * 100).toFixed(1)) : 0,
  }));

  const insightTotal = rawRows.reduce((sum, r) => sum + r.value, 0);

  const listNames = (arr) => {
    if (arr.length === 1) return arr[0].name;
    if (arr.length === 2) return `${arr[0].name} and ${arr[1].name}`;
    return `${arr.slice(0, -1).map((x) => x.name).join(", ")}, and ${
      arr[arr.length - 1].name
    }`;
  };

  const plural = (n, singular, pluralForm) => (n === 1 ? singular : pluralForm);

  return (
    <div className="mou-table-card">
      <h3 className="mou-table-title">MOU by Country</h3>

      <div className="mou-table-wrapper">
        <table className="mou-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>Count</th>
              <th>Percent</th>
            </tr>
          </thead>
          <tbody>
            {rowsWithPercent.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.value}</td>
                <td>{row.percent}%</td>
              </tr>
            ))}
            <tr className="mou-table-total-row">
              <td>Total</td>
              <td>{displayTotal}</td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mou-table-insights">
        Among partner countries, <b>{listNames(topCountries)}</b>{" "}
        {topCountries.length > 1 ? "tie for the highest" : "has the highest"}{" "}
        number of MOUs with <b>{maxVal}</b>{" "}
        {plural(maxVal, "agreement", "agreements")} out of a total of{" "}
        <b>{insightTotal}</b>. In contrast, <b>{listNames(leastCountries)}</b>{" "}
        {leastCountries.length > 1 ? "tie for the lowest" : "has the lowest"}{" "}
        with <b>{minVal}</b> {plural(minVal, "agreement", "agreements")}.
      </p>
    </div>
  );
};

export default MOUTable;
