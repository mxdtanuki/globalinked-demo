import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/MainBanner.css";
import { agreementService } from "../../../services/agreementService";

// React Icons
import {
  FaUserGraduate,
  FaGlobe,
  FaBookOpen,
  FaChalkboardTeacher,
  FaHandshake,
  FaLink,
} from "react-icons/fa";
import {
  FiList,
  FiTarget,
  FiLayers,
  FiHelpCircle,
  FiUsers,
  FiMail,
  FiInfo,
} from "react-icons/fi";
import mainBuilding from "./assets/pup-main-building.jpg";
import img1 from "./assets/oia/OIA_P1.jpg";
import img2 from "./assets/oia/OIA_P2.jpg";
import img3 from "./assets/oia/OIA_P3.jpg";
import img4 from "./assets/oia/OIA_P4.jpg";

const countryToCode = {
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

export default function MainBanner() {
  const [currentFlagIndex, setCurrentFlagIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [flags, setFlags] = useState([]);
  const [partnerLogos, setPartnerLogos] = useState([]);
  const [currentPartnerIndex, setCurrentPartnerIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [tocOnLightBg, setTocOnLightBg] = useState(false);

  const aboutRef = useRef(null);
  const heroRef = useRef(null);

  const defaultSlideshowImages = [
    mainBuilding,
    img1,
    img2,
    mainBuilding,
    img3,
    mainBuilding,
    img4,
    mainBuilding,
  ];
  const [slideshowImages] = useState(defaultSlideshowImages);

  const services = [
    { icon: <FaUserGraduate />, title: "International Exchange Students" },
    { icon: <FaGlobe />, title: "International Seminars/Fora" },
    { icon: <FaBookOpen />, title: "International Scholarship Grants" },
    { icon: <FaChalkboardTeacher />, title: "International Faculty Exchange" },
    { icon: <FaHandshake />, title: "International Organizations Affiliation" },
    { icon: <FaLink />, title: "International Linkages" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const agreements = await agreementService.getPublicAgreements();
        const activeAgreements = agreements.filter(
          (ag) => ag.agreement_status === "Active"
        );

        const countriesSet = new Set();
        const partnersMap = new Map();

        activeAgreements.forEach((ag) => {
          if (ag.country) countriesSet.add(ag.country);

          const logoField = ag.logo_path || ag.logo || ag.university_logo;
          const nameField =
            ag.institution_name ||
            ag.university_name ||
            ag.partner_name ||
            ag.name;

          if (logoField && nameField) {
            partnersMap.set(logoField, {
              logo: logoField,
              name: nameField,
              country: ag.country || "Unknown",
            });
          }
        });

        const countries = Array.from(countriesSet);
        const partnerFlags = countries
          .filter((country) => countryToCode[country])
          .map((country) => ({
            country,
            flag: `https://flagcdn.com/${countryToCode[country]}.svg`,
          }));

        setFlags(
          partnerFlags.length > 0
            ? partnerFlags
            : [{ country: "Philippines", flag: "https://flagcdn.com/ph.svg" }]
        );

        const logos = Array.from(partnersMap.values());
        logos.sort((a, b) => a.name.localeCompare(b.name));
        setPartnerLogos(logos);
      } catch (error) {
        console.error("Error fetching data:", error);
        setFlags([
          { country: "Philippines", flag: "https://flagcdn.com/ph.svg" },
        ]);
        setPartnerLogos([]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (flags.length > 0) {
      const interval = setInterval(() => {
        setCurrentFlagIndex((prev) => (prev + 1) % flags.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [flags.length]);

  useEffect(() => {
    if (slideshowImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [slideshowImages.length]);

  useEffect(() => {
    if (partnerLogos.length > 0) {
      const interval = setInterval(() => {
        setCurrentPartnerIndex((prev) => prev + 1);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [partnerLogos.length]);

  useEffect(() => {
    if (currentPartnerIndex >= partnerLogos.length && partnerLogos.length > 0) {
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentPartnerIndex(0);
      }, 500);
    } else if (!isTransitioning) {
      setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
    }
  }, [currentPartnerIndex, partnerLogos.length, isTransitioning]);

  useEffect(() => {
    const handleScroll = () => {
      const aboutTop = aboutRef.current?.offsetTop ?? 0;
      const scrollPos = window.scrollY + 80;
      setTocOnLightBg(scrollPos >= aboutTop - 40);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigate = useNavigate();

  const handleCountriesClick = () => {
    navigate("/mou-moa", { state: { tab: "countries" } });
  };

  const handleInstitutionsClick = () => {
    navigate("/mou-moa", { state: { tab: "partnerships" } });
  };

  const tocLinks = [
    { label: "About Us", target: "#about-hero-edge", icon: <FiInfo /> },
    { label: "Objectives & Functions", target: "#objectives", icon: <FiTarget /> },
    { label: "Services", target: "#services", icon: <FiLayers /> },
    { label: "FAQ", target: "#faq", icon: <FiHelpCircle /> },
    { label: "Officials & Staff", target: "#officials", icon: <FiUsers /> },
    { label: "Contact", target: "#contact", icon: <FiMail /> },
  ];

  const scrollToTarget = (selector) => {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsTocOpen(false);
    }
  };

  return (
    <section id="main-banner" className="oia-main-banner">
      <div className="oia-toc-wrapper">
        <button
          type="button"
          className={`oia-toc-button ${
            tocOnLightBg ? "oia-toc-button--maroon" : "oia-toc-button--white"
          } ${isTocOpen ? "oia-toc-button--open" : ""}`}
          onClick={() => setIsTocOpen((open) => !open)}
          aria-expanded={isTocOpen}
          aria-label="Open table of contents"
        >
          <FiList className="oia-toc-icon" />
          <span className="oia-toc-label">Table of Contents</span>
        </button>

        {isTocOpen && (
          <div
            className={`oia-toc-menu ${
              tocOnLightBg ? "oia-toc-menu--light" : "oia-toc-menu--dark"
            }`}
          >
            {tocLinks.map((item) => (
              <button
                key={item.target}
                type="button"
                className="oia-toc-link"
                onClick={() => scrollToTarget(item.target)}
              >
                <span className="oia-toc-link-icon">{item.icon}</span>
                <span className="oia-toc-link-text">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hero Section */}
      <div className="oia-hero-section" ref={heroRef}>
        <div className="oia-hero-background">
          {slideshowImages.map((image, index) => (
            <div
              key={index}
              className={`oia-hero-slide ${
                index === currentImageIndex ? "oia-hero-slide--active" : ""
              }`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
          <div className="oia-hero-overlay" />
        </div>

        <div className="oia-hero-content">
          <h1 className="oia-hero-title">
            <span className="oia-title-accent">
              Office of International Affairs
            </span>
            <span className="oia-title-sub">
              Polytechnic University of the Philippines
            </span>
          </h1>
          <p className="oia-hero-tagline">
            <span className="oia-tagline-accent">Connecting Our Campus</span>
            <span className="oia-tagline-separator">—</span>
            <span className="oia-tagline-text">To The World</span>
          </p>

          {/* Slide Indicators */}
          <div className="oia-slide-indicators">
            {slideshowImages.map((_, index) => (
              <button
                key={index}
                className={`oia-slide-dot ${
                  index === currentImageIndex ? "oia-slide-dot--active" : ""
                }`}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scroll marker for About Us TOC link */}
      <div id="about-hero-edge" style={{ height: 0 }} />

      {/* About Section */}
      <div id="about" className="oia-about-section" ref={aboutRef}>
        <div className="oia-section-container">
          <div className="oia-about-grid">
            <div className="oia-about-content">
              <h2 className="oia-about-title">About the Office</h2>
              <div className="oia-title-underline oia-title-underline--left" />
              <p className="oia-about-text">
                The PUP Office of International Affairs is engaged in a wide
                variety of programs and activities aligned with the vision of
                President Manuel M. Muhi towards establishment of PUP as a
                National Polytechnic University.
              </p>
              <p className="oia-about-text">
                The Office for International Affairs provides leadership and
                coordination for all University-wide international activities
                for coherence and integration of the institution's international
                linkages, cooperation, exchanges, programs and services.
              </p>
            </div>

            <div className="oia-recognition-card">
              <div className="oia-recognition-content">
                <div className="oia-polytechnic-text">
                  <span className="oia-poly-line">The Country's</span>
                  <span className="oia-poly-line">1st PolytechnicU</span>
                </div>
                <div className="oia-wuri-badge">
                  <a
                    href="/577342267_1281755067312027_5041505358784559960_n.jpg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="/577342267_1281755067312027_5041505358784559960_n.jpg"
                      alt="WURI Logo"
                      className="oia-wuri-logo"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Reach & Services Section */}
      <div className="oia-global-section">
        <div className="oia-section-container">
          <div className="oia-global-content">
            {/* Left: Our Global Reach */}
            <div className="oia-global-left">
              <div className="oia-global-header">
                <h2 className="oia-section-title">Our Global Reach</h2>
                <div className="oia-title-underline oia-title-underline--left" />
              </div>
              <div className="oia-flag-display">
                <div className="oia-flag-carousel-container">
                  <button
                    className="oia-carousel-arrow oia-carousel-arrow--left"
                    onClick={() =>
                      setCurrentFlagIndex((prev) =>
                        prev === 0 ? flags.length - 1 : prev - 1
                      )
                    }
                    aria-label="Previous countries"
                  >
                    &#10094;
                  </button>

                  <div className="oia-flag-carousel-wrapper">
                    {flags.map((flagData, index) => (
                      <div
                        key={flagData.country}
                        className={`oia-flag-item ${
                          index === currentFlagIndex
                            ? "oia-flag-item--active"
                            : ""
                        }`}
                      >
                        <div className="oia-flag-card">
                          <img
                            src={flagData.flag}
                            alt={`${flagData.country} flag`}
                            className="oia-flag-img"
                          />
                        </div>
                        <span className="oia-flag-name">
                          {flagData.country}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="oia-carousel-arrow oia-carousel-arrow--right"
                    onClick={() =>
                      setCurrentFlagIndex((prev) => (prev + 1) % flags.length)
                    }
                    aria-label="Next countries"
                  >
                    &#10095;
                  </button>
                </div>
                <div className="oia-flag-counter">
                  <span className="oia-counter-current">
                    {currentFlagIndex + 1}
                  </span>
                  <span className="oia-counter-separator">/</span>
                  <span className="oia-counter-total">{flags.length}</span>
                </div>
              </div>

              <div className="oia-stats-row">
                <div
                  className="oia-stat-box oia-stat-box--clickable"
                  onClick={handleCountriesClick}
                  tabIndex={0}
                  role="button"
                  aria-label="View Partner Countries"
                  style={{ cursor: "pointer" }}
                >
                  <span className="oia-stat-number">{flags.length}</span>
                  <span className="oia-stat-label">Partner Countries</span>
                </div>
                <div
                  className="oia-stat-box oia-stat-box--clickable"
                  onClick={handleInstitutionsClick}
                  tabIndex={0}
                  role="button"
                  aria-label="View Institutions"
                  style={{ cursor: "pointer" }}
                >
                  <span className="oia-stat-number">{partnerLogos.length}</span>
                  <span className="oia-stat-label">Institutions</span>
                </div>
              </div>
            </div>

            {/* Right: Our Services */}
            <div className="oia-global-right">
              <div className="oia-services-header">
                <h2 className="oia-section-title">Our Services</h2>
                <div className="oia-title-underline oia-title-underline--left" />
              </div>
              <div className="oia-services-list">
                {services.map((service, index) => (
                  <div key={index} className="oia-service-item">
                    <span className="oia-service-icon">{service.icon}</span>
                    <span className="oia-service-title">{service.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Institutions Section */}
      <div className="oia-partners-section">
        <div className="oia-section-container">
          <div className="oia-partners-header">
            <h2 className="oia-section-title">Partner Institutions</h2>
            <div className="oia-title-underline" />
          </div>

          {partnerLogos.length > 0 ? (
            <div className="oia-partners-carousel-container">
              <button
                className="oia-carousel-arrow oia-carousel-arrow--left"
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentPartnerIndex((prev) =>
                    prev === 0 ? partnerLogos.length - 1 : prev - 1
                  );
                }}
                aria-label="Previous institutions"
              >
                &#10094;
              </button>

              <div className="oia-partners-carousel-wrapper">
                <div
                  className="oia-partners-carousel"
                  style={{
                    transform: `translateX(-${currentPartnerIndex * 236}px)`,
                    transition: isTransitioning
                      ? "transform 0.5s ease-in-out"
                      : "none",
                  }}
                >
                  {[...partnerLogos, ...partnerLogos].map((partner, index) => (
                    <div
                      key={`${partner.name}-${index}`}
                      className="oia-partner-card"
                    >
                      <div className="oia-partner-logo-container">
                        <img
                          src={`data:image/png;base64,${partner.logo}`}
                          alt={partner.name}
                          className="oia-partner-logo"
                        />
                      </div>
                      <div className="oia-partner-info">
                        <span className="oia-partner-name">{partner.name}</span>
                        <span className="oia-partner-country">
                          {partner.country}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="oia-carousel-arrow oia-carousel-arrow--right"
                onClick={() => {
                  setIsTransitioning(true);
                  setCurrentPartnerIndex((prev) => prev + 1);
                }}
                aria-label="Next institutions"
              >
                &#10095;
              </button>
            </div>
          ) : (
            <div className="oia-partners-loading">
              <div className="oia-loading-spinner" />
              <p>Loading partner institutions...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
