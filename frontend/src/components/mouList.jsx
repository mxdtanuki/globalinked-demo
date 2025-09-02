import React from "react";
import "./mouList.css";

const partnersData = [
  { source: "COED", name: "KAOHSIUNG MUNICIPAL WUFU ELEMENTARY SCHOOL", country: "Taiwan" },
  { source: "COED", name: "NATIONAL TAIPEI UNIVERSITY", country: "Taiwan" },
  { source: "CBA", name: "WASEDA UNIVERSITY", country: "Japan" },
  { source: "CBA", name: "SEOUL NATIONAL UNIVERSITY", country: "South Korea" },
];

const MOUListPartners = () => {
  return (
    <div className="mou-container">
      <h2 className="mou-title">MOU List of Partners</h2>
      <table className="mou-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Name of Partners</th>
            <th>Country</th>
          </tr>
        </thead>
        <tbody>
          {partnersData.map((partner, idx) => (
            <tr key={idx}>
              <td>{partner.source}</td>
              <td>{partner.name}</td>
              <td>{partner.country}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MOUListPartners;
