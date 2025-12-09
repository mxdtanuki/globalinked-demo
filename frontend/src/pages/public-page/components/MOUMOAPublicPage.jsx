// MOUMOAPublicPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { agreementService } from "../../../services/agreementService";
import Header from "./Header";
import Footer from "./Footer";
import "./styles/MOUMOAPublicPage.css";

import {
  FaGlobeAmericas,
  FaFileContract,
  FaUniversity,
  FaHandshake,
  FaFlag,
  FaMapMarkedAlt,
} from "react-icons/fa";
import {
  FiSearch,
  FiFilter,
  FiMapPin,
  FiGlobe,
  FiX,
  FiGrid,
  FiList,
} from "react-icons/fi";
import { BiSort } from "react-icons/bi";
import { IoSchoolSharp } from "react-icons/io5";

import { useLocation } from "react-router-dom";

const MOUMOAPublicPage = () => {
  const location = useLocation();
  const [selectedView, setSelectedView] = useState("overview");
  // Auto-select tab if navigated with state
  useEffect(() => {
    if (location.state && location.state.tab) {
      setSelectedView(location.state.tab);
    }
    // eslint-disable-next-line
  }, [location.state]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [filterRegion, setFilterRegion] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showCountryViewDropdown, setShowCountryViewDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [agreementData, setAgreementData] = useState([]);
  const [partnerInstitutions, setPartnerInstitutions] = useState(0);
  const [partnerSearchTerm, setPartnerSearchTerm] = useState("");
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [partnerLogosMap, setPartnerLogosMap] = useState(new Map());
  const [partnerViewMode, setPartnerViewMode] = useState("grid");
  const [countryViewMode, setCountryViewMode] = useState("grid");

  const modalRef = useRef(null);
  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const viewRef = useRef(null);
  const countryViewRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const agreements = await agreementService.getPublicAgreements();
        const activeAgreements = agreements.filter(
          (ag) => ag.agreement_status === "Active"
        );
        setAgreementData(activeAgreements);

        // Extract unique partner institutions and their logos
        const uniquePartners = new Set();
        const logosMap = new Map();

        activeAgreements.forEach((ag) => {
          if (ag.partner_name) {
            const partnerName = ag.partner_name.trim();
            uniquePartners.add(partnerName);

            // Extract logo similar to MainBanner.jsx
            const logoField = ag.logo_path || ag.logo || ag.university_logo;
            if (logoField && !logosMap.has(partnerName)) {
              logosMap.set(partnerName, {
                logo: logoField,
                name: ag.institution_name || ag.university_name || partnerName,
                country: ag.country || "Unknown",
              });
            }
          }
        });

        setPartnerInstitutions(uniquePartners.size);
        setFilteredPartners(Array.from(uniquePartners).sort());
        setPartnerLogosMap(logosMap);
      } catch (err) {
        console.error("Error fetching agreements:", err);
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
      if (viewRef.current && !viewRef.current.contains(event.target)) {
        setShowViewDropdown(false);
      }
      if (
        countryViewRef.current &&
        !countryViewRef.current.contains(event.target)
      ) {
        setShowCountryViewDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter partners based on search term, region filter, and sort
  useEffect(() => {
    let partners = Array.from(
      new Set(
        agreementData
          .map((ag) => ag.partner_name)
          .filter(Boolean)
          .map((p) => p.trim())
      )
    );

    // Apply search filter
    if (partnerSearchTerm.trim() !== "") {
      const searchLower = partnerSearchTerm.toLowerCase();
      partners = partners.filter((partner) => {
        const matchesPartner = partner.toLowerCase().includes(searchLower);
        // Also check if any country associated with this partner matches the search
        const matchesCountry = agreementData.some(
          (ag) =>
            ag.partner_name?.trim() === partner &&
            ag.country?.toLowerCase().includes(searchLower)
        );
        return matchesPartner || matchesCountry;
      });
    }

    // Apply region filter
    if (filterRegion !== "all") {
      partners = partners.filter((partner) =>
        agreementData.some(
          (ag) =>
            ag.partner_name?.trim() === partner &&
            mapRegionToFilter(ag.region) === filterRegion
        )
      );
    }

    // Apply sort
    partners = partners.sort((a, b) => {
      const aCount = agreementData.filter(
        (ag) => ag.partner_name?.trim() === a
      ).length;
      const bCount = agreementData.filter(
        (ag) => ag.partner_name?.trim() === b
      ).length;

      switch (sortBy) {
        case "name-asc":
          return a.localeCompare(b);
        case "name-desc":
          return b.localeCompare(a);
        case "agreements-desc":
          return bCount - aCount;
        case "agreements-asc":
          return aCount - bCount;
        default:
          return a.localeCompare(b);
      }
    });

    setFilteredPartners(partners);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerSearchTerm, agreementData, filterRegion, sortBy]);

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
        partners: new Set(),
      };
    }
    if (ag.document_type === "MOU") countryAgg[key].mou += 1;
    if (ag.document_type === "MOA") countryAgg[key].moa += 1;
    if (ag.partner_name) countryAgg[key].partners.add(ag.partner_name.trim());
  });
  const data = Object.values(countryAgg).map((item) => ({
    ...item,
    total: item.mou + item.moa,
    partnerCount: item.partners.size,
  }));

  const maxMou = data.length ? Math.max(...data.map((item) => item.mou)) : 0;
  const maxMoa = data.length ? Math.max(...data.map((item) => item.moa)) : 0;
  const maxAgreement = Math.max(maxMou, maxMoa);

  // Map detailed regions from the data to the simplified filter buckets
  const regionMap = {
    Africa: [
      "Eastern Africa",
      "Middle Africa",
      "Northern Africa",
      "Southern Africa",
      "Western Africa",
    ],
    Americas: [
      "North America",
      "Caribbean",
      "Central America",
      "South America",
    ],
    "Asia-Pacific": [
      "Central Asia",
      "Eastern Asia",
      "Southern Asia",
      "South-Eastern Asia",
      "Oceania",
    ],
    Europe: [
      "Northern Europe",
      "Western Europe",
      "Eastern Europe",
      "Southern Europe",
    ],
    "Middle East": ["Western Asia"],
  };

  const mapRegionToFilter = (region) => {
    const cleanRegion = (region || "").trim().toLowerCase();
    const match = Object.entries(regionMap).find(([, detailed]) =>
      detailed.some((r) => r.toLowerCase() === cleanRegion)
    );
    return match ? match[0] : "Other";
  };

  const filteredData = data
    .filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      const regionLower = (item.region || "").toLowerCase();
      const matchesSearch =
        item.country.toLowerCase().includes(searchLower) ||
        regionLower.includes(searchLower) ||
        Array.from(item.partners).some((partner) =>
          partner.toLowerCase().includes(searchLower)
        );

      const mappedRegion = mapRegionToFilter(item.region);
      const matchesRegion =
        filterRegion === "all" || mappedRegion === filterRegion;

      return matchesSearch && matchesRegion;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.country.localeCompare(b.country);
        case "name-desc":
          return b.country.localeCompare(a.country);
        case "agreements-desc":
          return b.total - a.total;
        case "agreements-asc":
          return a.total - b.total;
        case "partners":
          return b.partnerCount - a.partnerCount;
        case "mou":
          return b.mou - a.mou;
        case "moa":
          return b.moa - a.moa;
        default:
          return a.country.localeCompare(b.country);
      }
    });

  const totalMOU = data.reduce((sum, item) => sum + item.mou, 0);
  const totalMOA = data.reduce((sum, item) => sum + item.moa, 0);

  // Aggregate region stats using the simplified buckets so charts align with filters
  const regionTotals = {};
  data.forEach((item) => {
    const bucket = mapRegionToFilter(item.region);
    if (!regionTotals[bucket]) {
      regionTotals[bucket] = {
        region: bucket,
        mou: 0,
        moa: 0,
        countries: 0,
        partners: new Set(),
        agreements: 0,
      };
    }
    regionTotals[bucket].mou += item.mou;
    regionTotals[bucket].moa += item.moa;
    regionTotals[bucket].countries += 1;
    regionTotals[bucket].agreements += item.total;
    item.partners.forEach((partner) =>
      regionTotals[bucket].partners.add(partner)
    );
  });

  const regionData = Object.values(regionTotals).map((entry) => ({
    ...entry,
    partners: entry.partners.size,
  }));

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
          <p className="moumoa-loading-text">Loading, please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="moumoa-public-page">
      <Header />

      {/* Hero Section */}
      <section className="moumoa-hero-section">
        <div className="moumoa-hero-background">
          <div className="moumoa-hero-pattern"></div>
          <div className="moumoa-hero-gradient"></div>
        </div>

        <div className="moumoa-hero-content">
          <h1 className="moumoa-hero-title">
            Global <span className="moumoa-title-highlight">Partnerships</span>
          </h1>

          <p className="moumoa-hero-subtitle">
            Fostering international collaboration and academic excellence
            through strategic partnerships with leading institutions worldwide.
          </p>

          <div className="moumoa-hero-stats">
            <div className="moumoa-hero-stat-card">
              <div className="moumoa-stat-icon-wrapper">
                <FaUniversity />
              </div>
              <div className="moumoa-stat-info">
                <span className="moumoa-stat-number">
                  {partnerInstitutions}
                </span>
                <span className="moumoa-stat-label">Partners</span>
              </div>
            </div>

            <div className="moumoa-hero-stat-card">
              <div className="moumoa-stat-icon-wrapper">
                <FaGlobeAmericas />
              </div>
              <div className="moumoa-stat-info">
                <span className="moumoa-stat-number">{data.length}</span>
                <span className="moumoa-stat-label">Countries</span>
              </div>
            </div>

            <div className="moumoa-hero-stat-card">
              <div className="moumoa-stat-icon-wrapper">
                <FaFileContract />
              </div>
              <div className="moumoa-stat-info">
                <span className="moumoa-stat-number">{totalMOU}</span>
                <span className="moumoa-stat-label">MOUs</span>
              </div>
            </div>

            <div className="moumoa-hero-stat-card">
              <div className="moumoa-stat-icon-wrapper">
                <FaHandshake />
              </div>
              <div className="moumoa-stat-info">
                <span className="moumoa-stat-number">{totalMOA}</span>
                <span className="moumoa-stat-label">MOAs</span>
              </div>
            </div>
          </div>
        </div>

        <div className="moumoa-hero-decoration">
          <div className="moumoa-floating-shape moumoa-shape-1"></div>
          <div className="moumoa-floating-shape moumoa-shape-2"></div>
          <div className="moumoa-floating-shape moumoa-shape-3"></div>
        </div>
      </section>

      <main className="moumoa-main-container">
        {/* Navigation Tabs */}
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
            <FaGlobeAmericas className="moumoa-tab-icon" />
            <span>Overview</span>
          </button>
          <button
            className={`moumoa-nav-tab ${
              selectedView === "partnerships" ? "moumoa-active" : ""
            }`}
            onClick={() => setSelectedView("partnerships")}
            aria-selected={selectedView === "partnerships"}
            role="tab"
            id="moumoa-partnerships-tab"
            tabIndex={selectedView === "partnerships" ? 0 : -1}
          >
            <IoSchoolSharp className="moumoa-tab-icon" />
            <span>Institutions</span>
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
            <FaFlag className="moumoa-tab-icon" />
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
            <FaMapMarkedAlt className="moumoa-tab-icon" />
            <span>Regions</span>
          </button>
        </nav>

        {/* Content Area */}
        <div className="moumoa-content-area">
          {/* Search and Filter Section */}
          {selectedView !== "regions" && (
            <div className="moumoa-controls-bar">
              <div className="moumoa-search-wrapper">
                <FiSearch className="moumoa-search-icon" />
                <input
                  type="text"
                  placeholder={
                    selectedView === "partnerships"
                      ? "Search institutions or countries..."
                      : "Search countries, regions, or institutions..."
                  }
                  value={
                    selectedView === "partnerships"
                      ? partnerSearchTerm
                      : searchTerm
                  }
                  onChange={(e) => {
                    if (selectedView === "partnerships") {
                      setPartnerSearchTerm(e.target.value);
                    } else {
                      setSearchTerm(e.target.value);
                    }
                  }}
                  className="moumoa-search-input"
                  aria-label={
                    selectedView === "partnerships"
                      ? "Search partner institutions"
                      : "Search countries"
                  }
                />
                {(selectedView === "partnerships"
                  ? partnerSearchTerm
                  : searchTerm) && (
                  <button
                    className="moumoa-search-clear"
                    onClick={() => {
                      if (selectedView === "partnerships") {
                        setPartnerSearchTerm("");
                      } else {
                        setSearchTerm("");
                      }
                    }}
                    aria-label="Clear search"
                    type="button"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              {/* Sort and Filter Controls */}
              {(selectedView === "overview" ||
                selectedView === "countries" ||
                selectedView === "partnerships") && (
                <div className="moumoa-controls-actions">
                  {/* View Mode Dropdown - Only for Partnerships */}
                  {selectedView === "partnerships" && (
                    <div className="moumoa-dropdown-wrapper" ref={viewRef}>
                      <button
                        className={`moumoa-control-btn ${
                          showViewDropdown ? "active" : ""
                        }`}
                        onClick={() => setShowViewDropdown(!showViewDropdown)}
                        aria-haspopup="menu"
                        aria-expanded={showViewDropdown}
                        aria-label="View mode options"
                        type="button"
                      >
                        <span>View:</span>
                        {partnerViewMode === "grid" ? (
                          <FiGrid size={16} />
                        ) : (
                          <FiList size={16} />
                        )}
                        <span>
                          {partnerViewMode === "grid" ? "Grid" : "List"}
                        </span>
                      </button>
                      {showViewDropdown && (
                        <div
                          className="moumoa-dropdown-menu"
                          role="menu"
                          aria-label="View mode options"
                        >
                          <div className="moumoa-dropdown-header" role="none">
                            View
                          </div>
                          <button
                            className={`moumoa-dropdown-item ${
                              partnerViewMode === "grid" ? "active" : ""
                            }`}
                            onClick={() => {
                              setPartnerViewMode("grid");
                              setShowViewDropdown(false);
                            }}
                            role="menuitem"
                            type="button"
                          >
                            <FiGrid size={14} style={{ marginRight: "8px" }} />
                            Grid View
                          </button>
                          <button
                            className={`moumoa-dropdown-item ${
                              partnerViewMode === "list" ? "active" : ""
                            }`}
                            onClick={() => {
                              setPartnerViewMode("list");
                              setShowViewDropdown(false);
                            }}
                            role="menuitem"
                            type="button"
                          >
                            <FiList size={14} style={{ marginRight: "8px" }} />
                            List View
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* View Mode Dropdown - Only for Countries */}
                  {selectedView === "countries" && (
                    <div
                      className="moumoa-dropdown-wrapper"
                      ref={countryViewRef}
                    >
                      <button
                        className={`moumoa-control-btn ${
                          showCountryViewDropdown ? "active" : ""
                        }`}
                        onClick={() =>
                          setShowCountryViewDropdown(!showCountryViewDropdown)
                        }
                        aria-haspopup="menu"
                        aria-expanded={showCountryViewDropdown}
                        aria-label="View mode options"
                        type="button"
                      >
                        <span>View:</span>
                        {countryViewMode === "grid" ? (
                          <FiGrid size={16} />
                        ) : (
                          <FiList size={16} />
                        )}
                        <span>
                          {countryViewMode === "grid" ? "Grid" : "List"}
                        </span>
                      </button>
                      {showCountryViewDropdown && (
                        <div
                          className="moumoa-dropdown-menu"
                          role="menu"
                          aria-label="View mode options"
                        >
                          <div className="moumoa-dropdown-header" role="none">
                            View
                          </div>
                          <button
                            className={`moumoa-dropdown-item ${
                              countryViewMode === "grid" ? "active" : ""
                            }`}
                            onClick={() => {
                              setCountryViewMode("grid");
                              setShowCountryViewDropdown(false);
                            }}
                            role="menuitem"
                            type="button"
                          >
                            <FiGrid size={14} style={{ marginRight: "8px" }} />
                            Grid View
                          </button>
                          <button
                            className={`moumoa-dropdown-item ${
                              countryViewMode === "list" ? "active" : ""
                            }`}
                            onClick={() => {
                              setCountryViewMode("list");
                              setShowCountryViewDropdown(false);
                            }}
                            role="menuitem"
                            type="button"
                          >
                            <FiList size={14} style={{ marginRight: "8px" }} />
                            List View
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sort Dropdown */}
                  <div className="moumoa-dropdown-wrapper" ref={sortRef}>
                    <button
                      className={`moumoa-control-btn ${
                        showSortDropdown ? "active" : ""
                      }`}
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      aria-haspopup="menu"
                      aria-expanded={showSortDropdown}
                      aria-label="Sort options"
                      type="button"
                    >
                      <BiSort size={16} />
                      <span>Sort</span>
                    </button>
                    {showSortDropdown && (
                      <div
                        className="moumoa-dropdown-menu"
                        role="menu"
                        aria-label="Sort options"
                      >
                        <div className="moumoa-dropdown-header" role="none">
                          Sort By
                        </div>
                        {[
                          { value: "name-asc", label: "Name (A-Z)" },
                          { value: "name-desc", label: "Name (Z-A)" },
                          {
                            value: "agreements-desc",
                            label: "Most Agreements",
                          },
                          {
                            value: "agreements-asc",
                            label: "Fewest Agreements",
                          },
                          { value: "mou", label: "Most MOUs" },
                          { value: "moa", label: "Most MOAs" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            className={`moumoa-dropdown-item ${
                              sortBy === option.value ? "active" : ""
                            }`}
                            onClick={() => {
                              setSortBy(option.value);
                              setShowSortDropdown(false);
                            }}
                            role="menuitem"
                            type="button"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filter Dropdown */}
                  <div className="moumoa-dropdown-wrapper" ref={filterRef}>
                    <button
                      className={`moumoa-control-btn ${
                        filterRegion !== "all" ? "has-filter" : ""
                      } ${showFilterDropdown ? "active" : ""}`}
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      aria-haspopup="menu"
                      aria-expanded={showFilterDropdown}
                      aria-label={`Filter by region${
                        filterRegion !== "all" ? ": " + filterRegion : ""
                      }`}
                      type="button"
                    >
                      <FiFilter size={16} />
                      <span>Region</span>
                      {filterRegion !== "all" && (
                        <div
                          className="moumoa-filter-badge"
                          aria-label="Filter active"
                        >
                          1
                        </div>
                      )}
                    </button>
                    {showFilterDropdown && (
                      <div
                        className="moumoa-dropdown-menu moumoa-filter-menu"
                        role="menu"
                        aria-label="Region filter options"
                      >
                        <div className="moumoa-dropdown-header" role="none">
                          Region
                        </div>
                        <button
                          className={`moumoa-dropdown-item ${
                            filterRegion === "all" ? "active" : ""
                          }`}
                          onClick={() => {
                            setFilterRegion("all");
                            setShowFilterDropdown(false);
                          }}
                          role="menuitem"
                          type="button"
                        >
                          All Regions
                        </button>
                        {[
                          "Africa",
                          "Americas",
                          "Asia-Pacific",
                          "Europe",
                          "Middle East",
                        ].map((region) => (
                          <button
                            key={region}
                            className={`moumoa-dropdown-item ${
                              filterRegion === region ? "active" : ""
                            }`}
                            onClick={() => {
                              setFilterRegion(region);
                              setShowFilterDropdown(false);
                            }}
                            role="menuitem"
                            type="button"
                          >
                            {region}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Views */}
          {selectedView === "overview" && (
            <section
              className="moumoa-overview-view"
              role="tabpanel"
              aria-labelledby="moumoa-overview-tab"
            >
              {/* Summary Cards */}
              <div className="moumoa-overview-summary">
                <div className="moumoa-summary-card moumoa-primary">
                  <div className="moumoa-summary-label">Total Agreements</div>
                  <div className="moumoa-summary-value">
                    {filteredData.reduce(
                      (sum, country) => sum + country.total,
                      0
                    )}
                  </div>
                  <div className="moumoa-summary-unit">MOUs + MOAs</div>
                </div>
                <div className="moumoa-summary-card">
                  <div className="moumoa-summary-label">
                    Active Partnerships
                  </div>
                  <div className="moumoa-summary-value">
                    {
                      new Set(
                        filteredData.flatMap((c) => Array.from(c.partners))
                      ).size
                    }
                  </div>
                  <div className="moumoa-summary-unit">Institutions</div>
                </div>
                <div className="moumoa-summary-card">
                  <div className="moumoa-summary-label">Countries</div>
                  <div className="moumoa-summary-value">
                    {filteredData.length}
                  </div>
                  <div className="moumoa-summary-unit">Regions</div>
                </div>
                <div className="moumoa-summary-card">
                  <div className="moumoa-summary-label">Avg. Agreements</div>
                  <div className="moumoa-summary-value">
                    {filteredData.length > 0
                      ? Math.round(
                          (filteredData.reduce((sum, c) => sum + c.total, 0) /
                            filteredData.length) *
                            10
                        ) / 10
                      : 0}
                  </div>
                  <div className="moumoa-summary-unit">Per Country</div>
                </div>
              </div>

              {/* Top Countries Grid */}
              <div className="moumoa-top-countries-section">
                <div className="moumoa-section-header">
                  <FaGlobeAmericas className="moumoa-section-header-icon" />
                  <h3>Top Countries</h3>
                </div>
                <div className="moumoa-top-countries-grid">
                  {filteredData.slice(0, 6).map((country, index) => (
                    <div key={country.country} className="moumoa-country-card">
                      <div className="moumoa-country-rank-badge">
                        {index + 1}
                      </div>
                      <div className="moumoa-country-header">
                        <img
                          src={`https://flagcdn.com/40x30/${country.code}.png`}
                          alt={`Flag of ${country.country}`}
                          className="moumoa-country-flag"
                        />
                        <div className="moumoa-country-info-text">
                          <div className="moumoa-country-name">
                            {country.country}
                          </div>
                          <div className="moumoa-country-region">
                            {country.region}
                          </div>
                        </div>
                      </div>

                      <div className="moumoa-country-stats">
                        <div className="moumoa-stat-item">
                          <div className="moumoa-stat-label">Partners</div>
                          <div className="moumoa-stat-value">
                            {country.partners.size}
                          </div>
                        </div>
                        <div className="moumoa-stat-item">
                          <div className="moumoa-stat-label">Agreements</div>
                          <div className="moumoa-stat-value">
                            {country.total}
                          </div>
                        </div>
                      </div>

                      <div className="moumoa-progress-item">
                        <div className="moumoa-progress-label-row">
                          <span>MOUs</span>
                          <span>{country.mou}</span>
                        </div>
                        <div className="moumoa-progress-container-bar">
                          <div
                            className="moumoa-progress-fill-bar moumoa-regional-mou"
                            style={{
                              width: `${
                                maxAgreement > 0
                                  ? (country.mou / maxAgreement) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="moumoa-progress-item">
                        <div className="moumoa-progress-label-row">
                          <span>MOAs</span>
                          <span>{country.moa}</span>
                        </div>
                        <div className="moumoa-progress-container-bar">
                          <div
                            className="moumoa-progress-fill-bar moumoa-regional-moa"
                            style={{
                              width: `${
                                maxAgreement > 0
                                  ? (country.moa / maxAgreement) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regional Distribution */}
              <div className="moumoa-top-countries-section">
                <div className="moumoa-section-header">
                  <FiGlobe className="moumoa-section-header-icon" />
                  <h3>Regional Distribution</h3>
                </div>
                <div className="moumoa-regional-overview">
                  {regionData
                    .sort((a, b) => b.agreements - a.agreements)
                    .map((region) => (
                      <div key={region.region} className="moumoa-regional-item">
                        <div className="moumoa-regional-label">
                          {region.region}
                        </div>
                        <div className="moumoa-regional-bar-wrapper">
                          {region.mou > 0 && (
                            <div
                              className="moumoa-regional-bar-segment moumoa-regional-mou"
                              style={{
                                width: `${
                                  totalMOU + totalMOA > 0
                                    ? (region.mou / (totalMOU + totalMOA)) * 100
                                    : 0
                                }%`,
                              }}
                              title={`${region.mou} MOUs`}
                            >
                              {region.mou > 0 &&
                                (totalMOU + totalMOA) * 0.05 < region.mou && (
                                  <span>{region.mou}</span>
                                )}
                            </div>
                          )}
                          {region.moa > 0 && (
                            <div
                              className="moumoa-regional-bar-segment moumoa-regional-moa"
                              style={{
                                width: `${
                                  totalMOU + totalMOA > 0
                                    ? (region.moa / (totalMOU + totalMOA)) * 100
                                    : 0
                                }%`,
                              }}
                              title={`${region.moa} MOAs`}
                            >
                              {region.moa > 0 &&
                                (totalMOU + totalMOA) * 0.05 < region.moa && (
                                  <span>{region.moa}</span>
                                )}
                            </div>
                          )}
                        </div>
                        <div className="moumoa-regional-count">
                          {region.agreements}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}

          {selectedView === "partnerships" && (
            <section
              className="moumoa-partnerships-view"
              role="tabpanel"
              aria-labelledby="moumoa-partnerships-tab"
            >
              {/* Grid View */}
              {partnerViewMode === "grid" ? (
                <div className="partners-grid">
                  {filteredPartners.map((partner) => {
                    const partnerInfo = partnerLogosMap.get(partner);
                    const countryData = data.find(
                      (c) => c.country === partnerInfo?.country
                    );
                    return (
                      <div
                        key={partner}
                        className="partner-card"
                        onClick={() =>
                          countryData && setSelectedCountry(countryData)
                        }
                        onKeyDown={(e) => {
                          if (
                            (e.key === "Enter" || e.key === " ") &&
                            countryData
                          ) {
                            setSelectedCountry(countryData);
                          }
                        }}
                        tabIndex={countryData ? "0" : "-1"}
                        role={countryData ? "button" : "presentation"}
                        aria-label={
                          countryData
                            ? `View details for ${partnerInfo?.country}`
                            : partner
                        }
                      >
                        <div className="partner-logo">
                          {partnerInfo?.logo ? (
                            <img
                              src={`data:image/png;base64,${partnerInfo.logo}`}
                              alt={`${partner} logo`}
                            />
                          ) : (
                            <div className="logo-placeholder">
                              {partner
                                .split(" ")
                                .map((word) => word[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                          )}
                        </div>
                        <h3 className="partner-name">{partner}</h3>
                        <p className="partner-location">
                          {partnerInfo?.country || "International"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="partners-list">
                  {filteredPartners.map((partner) => {
                    const partnerInfo = partnerLogosMap.get(partner);
                    const countryData = data.find(
                      (c) => c.country === partnerInfo?.country
                    );
                    return (
                      <div
                        key={partner}
                        className="partner-list-item"
                        onClick={() =>
                          countryData && setSelectedCountry(countryData)
                        }
                        onKeyDown={(e) => {
                          if (
                            (e.key === "Enter" || e.key === " ") &&
                            countryData
                          ) {
                            setSelectedCountry(countryData);
                          }
                        }}
                        tabIndex={countryData ? "0" : "-1"}
                        role={countryData ? "button" : "presentation"}
                        aria-label={
                          countryData
                            ? `View details for ${partnerInfo?.country}`
                            : partner
                        }
                        style={{ cursor: countryData ? "pointer" : "default" }}
                      >
                        <div className="list-logo">
                          {partnerInfo?.logo ? (
                            <img
                              src={`data:image/png;base64,${partnerInfo.logo}`}
                              alt={`${partner} logo`}
                            />
                          ) : (
                            <div className="logo-placeholder-small">
                              {partner
                                .split(" ")
                                .map((word) => word[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                          )}
                        </div>
                        <div className="list-info">
                          <h4>{partner}</h4>
                          <p>{partnerInfo?.country || "International"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {selectedView === "countries" && (
            <section
              className="moumoa-countries-view"
              role="tabpanel"
              aria-labelledby="moumoa-countries-tab"
            >
              {countryViewMode === "grid" ? (
                /* Grid View */
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
                            <span className="moumoa-stat-value">
                              {item.partnerCount}
                            </span>
                            <span className="moumoa-stat-label">Partners</span>
                          </div>
                          <div className="moumoa-stat-divider"></div>
                          <div className="moumoa-stat-item">
                            <span className="moumoa-stat-value">
                              {item.total}
                            </span>
                            <span className="moumoa-stat-label">
                              Agreements
                            </span>
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
              ) : (
                /* List View */
                <div className="countries-list">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <div
                        key={item.country}
                        className="country-list-item"
                        onClick={() => setSelectedCountry(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedCountry(item);
                          }
                        }}
                        tabIndex="0"
                        role="button"
                        aria-label={`View details for ${item.country}`}
                      >
                        <div className="list-flag">
                          <img
                            src={`https://flagcdn.com/48x36/${item.code}.png`}
                            alt={`Flag of ${item.country}`}
                          />
                        </div>
                        <div className="list-content">
                          <div className="list-header">
                            <h4 className="list-title">{item.country}</h4>
                            <span className="list-region">{item.region}</span>
                          </div>
                          <div className="list-details">
                            <div className="list-stat">
                              <span className="list-stat-label">Partners:</span>
                              <span className="list-stat-value">
                                {item.partnerCount}
                              </span>
                            </div>
                            <div className="list-stat-separator">•</div>
                            <div className="list-stat">
                              <span className="list-stat-label">MOUs:</span>
                              <span className="list-stat-value">
                                {item.mou}
                              </span>
                            </div>
                            <div className="list-stat-separator">•</div>
                            <div className="list-stat">
                              <span className="list-stat-label">MOAs:</span>
                              <span className="list-stat-value">
                                {item.moa}
                              </span>
                            </div>
                            <div className="list-stat-separator">•</div>
                            <div className="list-stat">
                              <span className="list-stat-label">Total:</span>
                              <span className="list-stat-value list-total">
                                {item.total}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="moumoa-no-results">
                      No countries match your search criteria.
                    </p>
                  )}
                </div>
              )}
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
                            {region.partners}
                          </span>
                          <span className="moumoa-stat-text">Partners</span>
                        </div>
                        <div className="moumoa-region-stat">
                          <span className="moumoa-stat-number">
                            {region.agreements}
                          </span>
                          <span className="moumoa-stat-text">Agreements</span>
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
              <div className="moumoa-modal-header-left">
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
                  <p>Memorandum of Understanding</p>
                </div>
                <div className="moumoa-modal-stat">
                  <h4>{selectedCountry.moa}</h4>
                  <p>Memorandum of Agreement</p>
                </div>
              </div>
            </div>
            <div className="moumoa-modal-universities">
              <h4 className="moumoa-modal-universities-title">
                Partner Institutions
              </h4>
              <div className="moumoa-modal-universities-list">
                {Array.from(
                  new Map(
                    agreementData
                      .filter((ag) => ag.country === selectedCountry.country)
                      .map((ag) => {
                        const nameField =
                          ag.institution_name ||
                          ag.university_name ||
                          ag.partner_name ||
                          ag.name;
                        const logoField =
                          ag.logo_path || ag.logo || ag.university_logo;
                        return [nameField, { nameField, logoField }];
                      })
                  ).values()
                ).map((item, idx) => (
                  <div key={idx} className="moumoa-modal-university-item">
                    {item.logoField ? (
                      <img
                        src={`data:image/png;base64,${item.logoField}`}
                        alt={item.nameField}
                        className="moumoa-modal-university-logo"
                      />
                    ) : (
                      <span className="moumoa-modal-university-placeholder">
                        <FiMapPin />
                      </span>
                    )}
                    <span className="moumoa-modal-university-name">
                      {item.nameField}
                    </span>
                  </div>
                ))}
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
