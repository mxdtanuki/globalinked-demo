import React, { useState, useEffect } from "react";
import { FiGrid, FiList } from "react-icons/fi";
import { DUMMY_PARTNERS } from "../dummyData";

const PartnerInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [filterRegion, setFilterRegion] = useState("");

  useEffect(() => {
    const grouped = {};
    DUMMY_PARTNERS.forEach((p) => {
      if (!grouped[p.name]) {
        grouped[p.name] = {
          name: p.name,
          logo: p.logo,
          country: p.country,
          region: p.region,
          agreements: p.mou + p.moa,
        };
      }
    });
    setInstitutions(Object.values(grouped));
    setLoading(false);
  }, []);

  const filteredInstitutions = filterRegion
    ? institutions.filter((inst) => inst.region === filterRegion)
    : institutions;

  const regions = [
    ...new Set(institutions.map((inst) => inst.region).filter(Boolean)),
  ];

  return (
    <div className="partners-public-container">
      {/* Header */}
      <div className="partners-header">
        <div className="header-content">
          <h1>Our Partner Institutions</h1>
          <p>
            Collaborating with institutions worldwide for academic excellence
          </p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">{institutions.length}</span>
            <span className="stat-label">Partner Institutions</span>
          </div>
          <div className="stat">
            <span className="stat-number">
              {institutions.reduce((sum, inst) => sum + inst.agreements, 0)}
            </span>
            <span className="stat-label">Total Agreements</span>
          </div>
          <div className="stat">
            <span className="stat-number">{regions.length}</span>
            <span className="stat-label">Regions</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="partners-controls">
        <div className="view-toggle">
          <button
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
          >
            <FiGrid /> Grid View
          </button>
          <button
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
          >
            <FiList /> List View
          </button>
        </div>

        <select
          className="region-filter"
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
        >
          <option value="">All Regions</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading partner institutions...</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="partners-grid">
          {filteredInstitutions.map((inst, index) => (
            <div key={index} className="partner-card">
              <div className="partner-logo">
                {inst.logo ? (
                  <img src={inst.logo} alt={inst.name} />
                ) : (
                  <div className="logo-placeholder">
                    {inst.name
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
              </div>
              <h3 className="partner-name">{inst.name}</h3>
              <p className="partner-location">
                {inst.country}
                {inst.region && ` • ${inst.region}`}
              </p>
              {inst.agreements > 0 && (
                <div className="partner-agreements">
                  {inst.agreements}{" "}
                  {inst.agreements === 1 ? "Agreement" : "Agreements"}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="partners-list">
          {filteredInstitutions.map((inst, index) => (
            <div key={index} className="partner-list-item">
              <div className="list-logo">
                {inst.logo ? (
                  <img src={inst.logo} alt={inst.name} />
                ) : (
                  <div className="logo-placeholder-small">
                    {inst.name
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
              </div>
              <div className="list-info">
                <h4>{inst.name}</h4>
                <p>
                  {inst.country}
                  {inst.region && ` • ${inst.region}`}
                </p>
              </div>
              {inst.agreements > 0 && (
                <div className="list-agreements">
                  <span className="agreement-count">{inst.agreements}</span>
                  <span className="agreement-label">
                    {inst.agreements === 1 ? "Agreement" : "Agreements"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerInstitutions;
