
import React from "react";
import "./mouTable.css"; // 

const MOUTable = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="mou-table-card mou-table-empty">
        <p>No data available</p>
      </div>
    );
  }

  const total = data.reduce((acc, row) => acc + row.value, 0);

  // Find top and least country
  const topCountry = data.reduce((max, curr) =>
    curr.value > max.value ? curr : max
  );
  const leastCountry = data.reduce((min, curr) =>
    curr.value < min.value ? curr : min
  );

  return (
    <div className="mou-table-card">
      <h3 className="mou-table-title">MOU by Country</h3>

      <table className="mou-table">
        <thead>
          <tr>
            <th>Country</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <td>{row.name}</td>
              <td>{row.value}</td>
            </tr>
          ))}

          {/* Total */}
          <tr className="mou-table-total-row">
            <td>Total</td>
            <td>{total}</td>
          </tr>
        </tbody>
      </table>

      {/* Insights */}
      <p className="mou-table-insights">
        Among partner countries, <b>{topCountry.name}</b> has the highest
        number of MOUs with <b>{topCountry.value}</b> agreements out of a total
        of <b>{total}</b>.  
        In contrast, <b>{leastCountry.name}</b> has the least number of MOUs
        with only <b>{leastCountry.value}</b> agreements.  
        This highlights both the strongest and weakest areas of collaboration,
        providing insights into where partnerships are concentrated and where
        there is potential for growth.
      </p>
    </div>
  );
};

export default MOUTable;
