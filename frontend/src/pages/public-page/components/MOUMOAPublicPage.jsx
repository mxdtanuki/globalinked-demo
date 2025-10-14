// MOUMOAPublicPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { agreementService } from "../../../services/agreementService";
import Header from "./Header";
import Footer from "./Footer";
import "./styles/MOUMOAPublicPage.css";

import searchIcon from "./assets/search.png";
import sortIcon from "./assets/sort.png";
import globeIcon from "./assets/globe.png";
import agreementIcon from "./assets/agreement.png";
import partnershipIcon from "./assets/partnership-icon.png";
import overviewIcon from "./assets/overview.png";
import countriesIcon from "./assets/countries.png";
import regionsIcon from "./assets/regions.png";

const MOUMOAPublicPage = () => {
  const [selectedView, setSelectedView] = useState("overview");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [isLoading, setIsLoading] = useState(true);
  const [agreementData, setAgreementData] = useState([]);
  const [error, setError] = useState(null);

  const modalRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const agreements = await agreementService.getAgreements();
        const activeAgreements = agreements.filter(
          (ag) => ag.agreement_status === "Active"
        );
        setAgreementData(activeAgreements);
      } catch (err) {
        console.error("Error fetching agreements:", err);
        setError("Failed to load agreement data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCountry && modalRef.current) {
      modalRef.current.focus();
    }
  }, [selectedCountry]);

  const countryCodeMap = {
    Afghanistan: "af",
    Albania: "al",
    Algeria: "dz",
    Andorra: "ad",
    Angola: "ao",
    "Antigua and Barbuda": "ag",
    Argentina: "ar",
    Armenia: "am",
    Australia: "au",
    Austria: "at",
    Azerbaijan: "az",
    Bahamas: "bs",
    Bahrain: "bh",
    Bangladesh: "bd",
    Barbados: "bb",
    Belarus: "by",
    Belgium: "be",
    Belize: "bz",
    Benin: "bj",
    Bhutan: "bt",
    Bolivia: "bo",
    "Bosnia and Herzegovina": "ba",
    Botswana: "bw",
    Brazil: "br",
    Brunei: "bn",
    Bulgaria: "bg",
    "Burkina Faso": "bf",
    Burundi: "bi",
    "Cabo Verde": "cv",
    Cambodia: "kh",
    Cameroon: "cm",
    Canada: "ca",
    "Central African Republic": "cf",
    Chad: "td",
    Chile: "cl",
    China: "cn",
    Colombia: "co",
    Comoros: "km",
    Congo: "cg",
    "Costa Rica": "cr",
    Croatia: "hr",
    Cuba: "cu",
    Cyprus: "cy",
    Czechia: "cz",
    "Czech Republic": "cz",
    "Democratic Republic of the Congo": "cd",
    Denmark: "dk",
    Djibouti: "dj",
    Dominica: "dm",
    "Dominican Republic": "do",
    Ecuador: "ec",
    Egypt: "eg",
    "El Salvador": "sv",
    "Equatorial Guinea": "gq",
    Eritrea: "er",
    Estonia: "ee",
    Eswatini: "sz",
    Ethiopia: "et",
    Fiji: "fj",
    Finland: "fi",
    France: "fr",
    Gabon: "ga",
    Gambia: "gm",
    Georgia: "ge",
    Germany: "de",
    Ghana: "gh",
    Greece: "gr",
    Grenada: "gd",
    Guatemala: "gt",
    Guinea: "gn",
    "Guinea-Bissau": "gw",
    Guyana: "gy",
    Haiti: "ht",
    Honduras: "hn",
    Hungary: "hu",
    Iceland: "is",
    India: "in",
    Indonesia: "id",
    Iran: "ir",
    Iraq: "iq",
    Ireland: "ie",
    Israel: "il",
    Italy: "it",
    Jamaica: "jm",
    Japan: "jp",
    Jordan: "jo",
    Kazakhstan: "kz",
    Kenya: "ke",
    Kiribati: "ki",
    Kuwait: "kw",
    Kyrgyzstan: "kg",
    Laos: "la",
    Latvia: "lv",
    Lebanon: "lb",
    Lesotho: "ls",
    Liberia: "lr",
    Libya: "ly",
    Liechtenstein: "li",
    Lithuania: "lt",
    Luxembourg: "lu",
    Madagascar: "mg",
    Malawi: "mw",
    Malaysia: "my",
    Maldives: "mv",
    Mali: "ml",
    Malta: "mt",
    "Marshall Islands": "mh",
    Mauritania: "mr",
    Mauritius: "mu",
    Mexico: "mx",
    Micronesia: "fm",
    Moldova: "md",
    Monaco: "mc",
    Mongolia: "mn",
    Montenegro: "me",
    Morocco: "ma",
    Mozambique: "mz",
    Myanmar: "mm",
    Namibia: "na",
    Nauru: "nr",
    Nepal: "np",
    Netherlands: "nl",
    "New Zealand": "nz",
    Nicaragua: "ni",
    Niger: "ne",
    Nigeria: "ng",
    "North Korea": "kp",
    "North Macedonia": "mk",
    Norway: "no",
    Oman: "om",
    Pakistan: "pk",
    Palau: "pw",
    Palestine: "ps",
    Panama: "pa",
    "Papua New Guinea": "pg",
    Paraguay: "py",
    Peru: "pe",
    Philippines: "ph",
    Poland: "pl",
    Portugal: "pt",
    Qatar: "qa",
    Romania: "ro",
    Russia: "ru",
    Rwanda: "rw",
    "Saint Kitts and Nevis": "kn",
    "Saint Lucia": "lc",
    "Saint Vincent and the Grenadines": "vc",
    Samoa: "ws",
    "San Marino": "sm",
    "Sao Tome and Principe": "st",
    "Saudi Arabia": "sa",
    Senegal: "sn",
    Serbia: "rs",
    Seychelles: "sc",
    "Sierra Leone": "sl",
    Singapore: "sg",
    Slovakia: "sk",
    Slovenia: "si",
    "Solomon Islands": "sb",
    Somalia: "so",
    "South Africa": "za",
    "South Korea": "kr",
    "South Sudan": "ss",
    Spain: "es",
    "Sri Lanka": "lk",
    Sudan: "sd",
    Suriname: "sr",
    Sweden: "se",
    Switzerland: "ch",
    Syria: "sy",
    Taiwan: "tw",
    Tajikistan: "tj",
    Tanzania: "tz",
    Thailand: "th",
    "Timor-Leste": "tl",
    Togo: "tg",
    Tonga: "to",
    "Trinidad and Tobago": "tt",
    Tunisia: "tn",
    Turkey: "tr",
    Turkmenistan: "tm",
    Tuvalu: "tv",
    Uganda: "ug",
    Ukraine: "ua",
    "United Arab Emirates": "ae",
    "United Kingdom": "gb",
    "United States": "us",
    "U.S.A.": "us",
    Uruguay: "uy",
    Uzbekistan: "uz",
    Vanuatu: "vu",
    "Vatican City": "va",
    Venezuela: "ve",
    Vietnam: "vn",
    Yemen: "ye",
    Zambia: "zm",
    Zimbabwe: "zw",
    "Hong Kong": "hk",
    Macau: "mo",
    "Palestinian Territories": "ps",
    Kosovo: "xk",
  };

  const countryAgg = {};
  agreementData.forEach((ag) => {
    if (!ag.country) return;
    const key = ag.country.trim();
    if (!countryAgg[key]) {
      countryAgg[key] = {
        country: key,
        mou: 0,
        moa: 0,
        region: ag.region || "",
        code: countryCodeMap[key] || "",
      };
    }
    if (ag.document_type === "MOU") countryAgg[key].mou += 1;
    if (ag.document_type === "MOA") countryAgg[key].moa += 1;
  });
  const data = Object.values(countryAgg).map((item) => ({
    ...item,
    total: item.mou + item.moa,
  }));

  const maxMou = data.length ? Math.max(...data.map((item) => item.mou)) : 0;
  const maxMoa = data.length ? Math.max(...data.map((item) => item.moa)) : 0;
  const maxAgreement = Math.max(maxMou, maxMoa);

  const filteredData = data
    .filter((item) => {
      const matchesSearch = item.country
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "total":
          return b.total - a.total;
        case "mou":
          return b.mou - a.mou;
        case "moa":
          return b.moa - a.moa;
        case "name":
          return a.country.localeCompare(b.country);
        default:
          return 0;
      }
    });

  const totalMOU = data.reduce((sum, item) => sum + item.mou, 0);
  const totalMOA = data.reduce((sum, item) => sum + item.moa, 0);

  const regions = [...new Set(data.map((item) => item.region))];
  const regionData = regions.map((region) => {
    const regionCountries = data.filter((item) => item.region === region);
    return {
      region,
      mou: regionCountries.reduce((sum, item) => sum + item.mou, 0),
      moa: regionCountries.reduce((sum, item) => sum + item.moa, 0),
      countries: regionCountries.length,
    };
  });

  if (isLoading) {
    return (
      <div className="moumoa-public-page">
        <Header />
        <div
          className="moumoa-loading-container"
          role="status"
          aria-live="polite"
          aria-label="Loading content"
        >
          <div className="moumoa-loading-spinner">
            <div className="moumoa-spinner-ring"></div>
          </div>
          <p className="moumoa-loading-text">Loading partnership data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="moumoa-public-page">
      <Header />

      <section className="moumoa-hero-section">
        <div className="moumoa-hero-content">
          <h1 className="moumoa-hero-title">International Affairs</h1>

          <div className="moumoa-quick-stats-row">
            <div className="moumoa-stat-item-row">
              <img
                src={globeIcon}
                alt="Partner Countries"
                className="moumoa-stat-icon-row"
              />
              <div className="moumoa-stat-content">
                <span className="moumoa-stat-number-row">{data.length}</span>
                <span className="moumoa-stat-label-row">Partner Countries</span>
              </div>
            </div>
            <div className="moumoa-stat-item-row">
              <img
                src={agreementIcon}
                alt="MOUs Signed"
                className="moumoa-stat-icon-row"
              />
              <div className="moumoa-stat-content">
                <span className="moumoa-stat-number-row">{totalMOU}</span>
                <span className="moumoa-stat-label-row">MOUs Signed</span>
              </div>
            </div>
            <div className="moumoa-stat-item-row">
              <img
                src={partnershipIcon}
                alt="MOAs Active"
                className="moumoa-stat-icon-row"
              />
              <div className="moumoa-stat-content">
                <span className="moumoa-stat-number-row">{totalMOA}</span>
                <span className="moumoa-stat-label-row">MOAs Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="moumoa-main-container">
        <nav className="moumoa-view-navigation" role="tablist">
          <button
            className={`moumoa-nav-tab ${
              selectedView === "overview" ? "moumoa-active" : ""
            }`}
            onClick={() => setSelectedView("overview")}
            aria-selected={selectedView === "overview"}
            role="tab"
            id="moumoa-overview-tab"
            tabIndex={selectedView === "overview" ? 0 : -1}
          >
            <img
              src={overviewIcon}
              alt=""
              className="moumoa-tab-icon"
              aria-hidden="true"
            />
            <span>Overview</span>
          </button>
          <button
            className={`moumoa-nav-tab ${
              selectedView === "countries" ? "moumoa-active" : ""
            }`}
            onClick={() => setSelectedView("countries")}
            aria-selected={selectedView === "countries"}
            role="tab"
            id="moumoa-countries-tab"
            tabIndex={selectedView === "countries" ? 0 : -1}
          >
            <img
              src={countriesIcon}
              alt=""
              className="moumoa-tab-icon"
              aria-hidden="true"
            />
            <span>Countries</span>
          </button>
          <button
            className={`moumoa-nav-tab ${
              selectedView === "regions" ? "moumoa-active" : ""
            }`}
            onClick={() => setSelectedView("regions")}
            aria-selected={selectedView === "regions"}
            role="tab"
            id="moumoa-regions-tab"
            tabIndex={selectedView === "regions" ? 0 : -1}
          >
            <img
              src={regionsIcon}
              alt=""
              className="moumoa-tab-icon"
              aria-hidden="true"
            />
            <span>Regions</span>
          </button>
        </nav>

        <div className="moumoa-content-area">
          {selectedView === "overview" && (
            <section
              className="moumoa-overview-view"
              role="tabpanel"
              aria-labelledby="moumoa-overview-tab"
            >
              <h2 className="moumoa-section-title">Partnership Distribution</h2>

              <div className="moumoa-controls-bar">
                <div className="moumoa-search-wrapper">
                  <img
                    src={searchIcon}
                    alt=""
                    className="moumoa-search-icon"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="moumoa-search-input"
                    aria-label="Search countries"
                  />
                </div>

                <div className="moumoa-filter-controls">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="moumoa-sort-select"
                    aria-label="Sort data by"
                  >
                    <option value="" disabled>
                      Sort By
                    </option>
                    <option value="name">Name</option>
                    <option value="mou">MOU</option>
                    <option value="moa">MOA</option>
                    <option value="total">Total</option>
                  </select>
                  <img
                    src={sortIcon}
                    alt="Sort Icon"
                    className="moumoa-custom-sort-icon"
                  />
                </div>
              </div>

              <div className="moumoa-chart-section">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <div
                      key={item.country}
                      className="moumoa-chart-item"
                      onClick={() => setSelectedCountry(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedCountry(item);
                        }
                      }}
                      tabIndex="0"
                      role="button"
                      aria-label={`View details for ${item.country}. Has ${item.mou} MOUs and ${item.moa} MOAs.`}
                    >
                      <div className="moumoa-country-info">
                        <img
                          src={`https://flagcdn.com/24x18/${item.code}.png`}
                          alt={`Flag of ${item.country}`}
                          className="moumoa-country-flag"
                        />
                        <span className="moumoa-country-name">
                          {item.country}
                        </span>
                      </div>
                      <div className="moumoa-progress-container">
                        <div
                          className="moumoa-progress-bar"
                          role="progressbar"
                          aria-valuenow={item.mou}
                          aria-valuemin="0"
                          aria-valuemax={maxAgreement}
                          aria-label={`${item.mou} MOUs`}
                        >
                          <div
                            className="moumoa-progress-fill moumoa-mou-fill"
                            style={{
                              width: `${(item.mou / maxAgreement) * 100}%`,
                            }}
                          >
                            <span className="moumoa-progress-label">
                              {item.mou}
                            </span>
                          </div>
                        </div>
                        <div
                          className="moumoa-progress-bar"
                          role="progressbar"
                          aria-valuenow={item.moa}
                          aria-valuemin="0"
                          aria-valuemax={maxAgreement}
                          aria-label={`${item.moa} MOAs`}
                        >
                          <div
                            className="moumoa-progress-fill moumoa-moa-fill"
                            style={{
                              width: `${(item.moa / maxAgreement) * 100}%`,
                            }}
                          >
                            <span className="moumoa-progress-label">
                              {item.moa}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className="moumoa-total-badge"
                        aria-label={`Total agreements: ${item.total}`}
                      >
                        {item.total}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="moumoa-no-results">
                    No countries match your search criteria.
                  </p>
                )}
              </div>
            </section>
          )}

          {selectedView === "countries" && (
            <section
              className="moumoa-countries-view"
              role="tabpanel"
              aria-labelledby="moumoa-countries-tab"
            >
              <div className="moumoa-countries-grid">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <div
                      key={item.country}
                      className="moumoa-country-card"
                      onClick={() => setSelectedCountry(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedCountry(item);
                        }
                      }}
                      tabIndex="0"
                      role="button"
                      aria-label={`View details for ${item.country}. Region: ${item.region}, MOUs: ${item.mou}, MOAs: ${item.moa}, Total: ${item.total}.`}
                    >
                      <div className="moumoa-card-header">
                        <img
                          src={`https://flagcdn.com/32x24/${item.code}.png`}
                          alt={`Flag of ${item.country}`}
                          className="moumoa-card-flag"
                        />
                        <h3>{item.country}</h3>
                      </div>
                      <div className="moumoa-card-stats">
                        <div className="moumoa-stat-item">
                          <span className="moumoa-stat-value">{item.mou}</span>
                          <span className="moumoa-stat-label">MOUs</span>
                        </div>
                        <div className="moumoa-stat-divider"></div>
                        <div className="moumoa-stat-item">
                          <span className="moumoa-stat-value">{item.moa}</span>
                          <span className="moumoa-stat-label">MOAs</span>
                        </div>
                      </div>
                      <div className="moumoa-card-footer">
                        <span className="moumoa-region-label">
                          {item.region}
                        </span>
                        <span className="moumoa-total-label">
                          Total: {item.total}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="moumoa-no-results">
                    No countries match your search criteria.
                  </p>
                )}
              </div>
            </section>
          )}

          {selectedView === "regions" && (
            <section
              className="moumoa-regions-view"
              role="tabpanel"
              aria-labelledby="moumoa-regions-tab"
            >
              <div className="moumoa-regions-grid">
                {regionData.length > 0 ? (
                  regionData.map((region) => (
                    <div key={region.region} className="moumoa-region-card">
                      <h3 className="moumoa-region-name">{region.region}</h3>
                      <div className="moumoa-region-stats">
                        <div className="moumoa-region-stat">
                          <span className="moumoa-stat-number">
                            {region.countries}
                          </span>
                          <span className="moumoa-stat-text">Countries</span>
                        </div>
                        <div className="moumoa-region-stat">
                          <span className="moumoa-stat-number">
                            {region.mou}
                          </span>
                          <span className="moumoa-stat-text">MOUs</span>
                        </div>
                        <div className="moumoa-region-stat">
                          <span className="moumoa-stat-number">
                            {region.moa}
                          </span>
                          <span className="moumoa-stat-text">MOAs</span>
                        </div>
                      </div>
                      <div
                        className="moumoa-region-chart"
                        role="progressbar"
                        aria-valuenow={region.mou + region.moa}
                        aria-valuemin="0"
                        aria-valuemax={totalMOU + totalMOA}
                        aria-label={`${region.mou} MOUs and ${region.moa} MOAs in ${region.region}`}
                      >
                        <div
                          className="moumoa-chart-segment moumoa-mou-segment"
                          style={{
                            width: `${
                              (region.mou / (region.mou + region.moa)) * 100
                            }%`,
                          }}
                        ></div>
                        <div
                          className="moumoa-chart-segment moumoa-moa-segment"
                          style={{
                            width: `${
                              (region.moa / (region.mou + region.moa)) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="moumoa-no-results">No regions found.</p>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {selectedCountry && (
        <div
          className="moumoa-modal-overlay"
          onClick={() => setSelectedCountry(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="moumoa-modal-title"
        >
          <div
            className="moumoa-modal-content"
            ref={modalRef}
            tabIndex="-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="moumoa-close-btn"
              onClick={() => setSelectedCountry(null)}
              aria-label="Close country details"
            >
              ×
            </button>
            <div className="moumoa-modal-header">
              <img
                src={`https://flagcdn.com/48x36/${selectedCountry.code}.png`}
                alt={`Flag of ${selectedCountry.country}`}
                className="moumoa-modal-flag"
              />
              <h3 id="moumoa-modal-title">{selectedCountry.country}</h3>
            </div>
            <div className="moumoa-modal-stats">
              <div className="moumoa-modal-stat">
                <h4>{selectedCountry.mou}</h4>
                <p>Memorandums of Understanding</p>
              </div>
              <div className="moumoa-modal-stat">
                <h4>{selectedCountry.moa}</h4>
                <p>Memorandums of Agreement</p>
              </div>
            </div>
            <div className="moumoa-modal-footer">
              <span className="moumoa-region-tag">
                {selectedCountry.region}
              </span>
              <span className="moumoa-total-tag">
                Total Agreements: {selectedCountry.total}
              </span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MOUMOAPublicPage;
