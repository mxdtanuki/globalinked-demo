import React, { useState, useEffect } from "react";
import "./styles/MainBanner.css";
import { agreementService } from "../../../services/agreementService";

// OIA PICS (fallback images)
import mainBuilding from "./assets/pup-main-building.jpg";
import img1 from "./assets/oia/OIA_P1.jpg";
import img2 from "./assets/oia/OIA_P2.jpg";
import img3 from "./assets/oia/OIA_P3.jpg";
import img4 from "./assets/oia/OIA_P4.jpg";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Mapping of country names to ISO codes for flags
const countryToCode = {
  "Afghanistan": "af", "Albania": "al", "Algeria": "dz", "Andorra": "ad", "Angola": "ao", "Antigua and Barbuda": "ag", "Argentina": "ar", "Armenia": "am", "Australia": "au", "Austria": "at", "Azerbaijan": "az",
  "Bahamas": "bs", "Bahrain": "bh", "Bangladesh": "bd", "Barbados": "bb", "Belarus": "by", "Belgium": "be", "Belize": "bz", "Benin": "bj", "Bhutan": "bt", "Bolivia": "bo", "Bosnia and Herzegovina": "ba", "Botswana": "bw", "Brazil": "br", "Brunei": "bn", "Bulgaria": "bg", "Burkina Faso": "bf", "Burundi": "bi",
  "Cabo Verde": "cv", "Cambodia": "kh", "Cameroon": "cm", "Canada": "ca", "Central African Republic": "cf", "Chad": "td", "Chile": "cl", "China": "cn", "Colombia": "co", "Comoros": "km", "Congo": "cg", "Costa Rica": "cr", "Croatia": "hr", "Cuba": "cu", "Cyprus": "cy", "Czechia": "cz", "Czech Republic": "cz",
  "Democratic Republic of the Congo": "cd", "Denmark": "dk", "Djibouti": "dj", "Dominica": "dm", "Dominican Republic": "do", "Ecuador": "ec", "Egypt": "eg", "El Salvador": "sv", "Equatorial Guinea": "gq", "Eritrea": "er", "Estonia": "ee", "Eswatini": "sz", "Ethiopia": "et",
  "Fiji": "fj", "Finland": "fi", "France": "fr", "Gabon": "ga", "Gambia": "gm", "Georgia": "ge", "Germany": "de", "Ghana": "gh", "Greece": "gr", "Grenada": "gd", "Guatemala": "gt", "Guinea": "gn", "Guinea-Bissau": "gw", "Guyana": "gy",
  "Haiti": "ht", "Honduras": "hn", "Hungary": "hu", "Iceland": "is", "India": "in", "Indonesia": "id", "Iran": "ir", "Iraq": "iq", "Ireland": "ie", "Israel": "il", "Italy": "it",
  "Jamaica": "jm", "Japan": "jp", "Jordan": "jo",
  "Kazakhstan": "kz", "Kenya": "ke", "Kiribati": "ki", "Kuwait": "kw", "Kyrgyzstan": "kg",
  "Laos": "la", "Latvia": "lv", "Lebanon": "lb", "Lesotho": "ls", "Liberia": "lr", "Libya": "ly", "Liechtenstein": "li", "Lithuania": "lt", "Luxembourg": "lu",
  "Madagascar": "mg", "Malawi": "mw", "Malaysia": "my", "Maldives": "mv", "Mali": "ml", "Malta": "mt", "Marshall Islands": "mh", "Mauritania": "mr", "Mauritius": "mu", "Mexico": "mx", "Micronesia": "fm", "Moldova": "md", "Monaco": "mc", "Mongolia": "mn", "Montenegro": "me", "Morocco": "ma", "Mozambique": "mz", "Myanmar": "mm",
  "Namibia": "na", "Nauru": "nr", "Nepal": "np", "Netherlands": "nl", "New Zealand": "nz", "Nicaragua": "ni", "Niger": "ne", "Nigeria": "ng", "North Korea": "kp", "North Macedonia": "mk", "Norway": "no",
  "Oman": "om",
  "Pakistan": "pk", "Palau": "pw", "Palestine": "ps", "Panama": "pa", "Papua New Guinea": "pg", "Paraguay": "py", "Peru": "pe", "Philippines": "ph", "Poland": "pl", "Portugal": "pt",
  "Qatar": "qa",
  "Romania": "ro", "Russia": "ru", "Rwanda": "rw",
  "Saint Kitts and Nevis": "kn", "Saint Lucia": "lc", "Saint Vincent and the Grenadines": "vc", "Samoa": "ws", "San Marino": "sm", "Sao Tome and Principe": "st", "Saudi Arabia": "sa", "Senegal": "sn", "Serbia": "rs", "Seychelles": "sc", "Sierra Leone": "sl", "Singapore": "sg", "Slovakia": "sk", "Slovenia": "si", "Solomon Islands": "sb", "Somalia": "so", "South Africa": "za", "South Korea": "kr", "South Sudan": "ss", "Spain": "es", "Sri Lanka": "lk", "Sudan": "sd", "Suriname": "sr", "Sweden": "se", "Switzerland": "ch", "Syria": "sy",
  "Taiwan": "tw", "Tajikistan": "tj", "Tanzania": "tz", "Thailand": "th", "Timor-Leste": "tl", "Togo": "tg", "Tonga": "to", "Trinidad and Tobago": "tt", "Tunisia": "tn", "Turkey": "tr", "Turkmenistan": "tm", "Tuvalu": "tv",
  "Uganda": "ug", "Ukraine": "ua", "United Arab Emirates": "ae", "United Kingdom": "gb", "United States": "us", "U.S.A.": "us", "Uruguay": "uy", "Uzbekistan": "uz",
  "Vanuatu": "vu", "Vatican City": "va", "Venezuela": "ve", "Vietnam": "vn",
  "Yemen": "ye",
  "Zambia": "zm", "Zimbabwe": "zw",
  // Special/territories
  "Hong Kong": "hk", "Macau": "mo", "Palestinian Territories": "ps", "Kosovo": "xk"
};

export default function MainBanner() {
  const [currentFlagIndex, setCurrentFlagIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [flags, setFlags] = useState([]);
  const [slideshowImages, setSlideshowImages] = useState([
    mainBuilding,
    img1,
    img2,
    mainBuilding,
    img3,
    mainBuilding,
    img4,
    mainBuilding,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch agreements to get countries and partner logos
        const agreements = await agreementService.getAgreements();
        
        // Extract unique countries
        const countriesSet = new Set();
        const logosSet = new Set();
        agreements.forEach(ag => {
          if (ag.country) countriesSet.add(ag.country);
          if (ag.logo_path) logosSet.add(ag.logo_path);
        });
        const countries = Array.from(countriesSet);
        
        // Set flags
        const partnerFlags = countries
          .filter(country => countryToCode[country])
          .map(country => ({
            country,
            flag: `https://flagcdn.com/${countryToCode[country]}.svg`
          }));
        setFlags(partnerFlags.length > 0 ? partnerFlags : [
          { country: "Philippines", flag: "https://flagcdn.com/ph.svg" },
        ]);
        
        // Set slideshow images (partner logos, fallback to static)
        const logos = Array.from(logosSet).filter(logo => logo);
        setSlideshowImages(logos.length > 0 ? logos : [
          mainBuilding,
          img1,
          img2,
          mainBuilding,
          img3,
          mainBuilding,
          img4,
          mainBuilding,
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Fallbacks
        setFlags([{ country: "Philippines", flag: "https://flagcdn.com/ph.svg" }]);
        setSlideshowImages([
          mainBuilding,
          img1,
          img2,
          mainBuilding,
          img3,
          mainBuilding,
          img4,
          mainBuilding,
        ]);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (flags.length > 0) {
      const interval = setInterval(() => {
        setCurrentFlagIndex((prev) => (prev + 1) % flags.length);
      }, 3000); // Change flag every 3 seconds
      return () => clearInterval(interval);
    }
  }, [flags.length]);

  useEffect(() => {
    if (slideshowImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval);
    }
  }, [slideshowImages.length]);

  return (
    <section id="main-banner" className="main-banner">
      <div className="banner-overlay">
        <div className="banner-content">
          <h1 className="banner-title">PUP Office of International Affairs</h1>

          <div className="hero-images">
            {slideshowImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Slide ${index + 1}`}
                className={`hero-image ${
                  index === currentImageIndex ? "active" : ""
                }`}
              />
            ))}
          </div>
        </div>

        {/* Two-column grid layout */}
        <div className="carousel-quote-grid">
          {/* Left column: Flag carousel + title */}
          <div className="carousel-column">
            <div className="flag-carousel">
              <div className="flag-carousel-container">
                <div
                  className="flag-slider"
                  style={{
                    transform: `translateX(-${currentFlagIndex * 100}%)`,
                  }}
                >
                  {flags.map((flagData) => (
                    <div key={flagData.country} className="flag-slide">
                      <div className="flag-content">
                        <img
                          src={flagData.flag}
                          alt={`${flagData.country} flag`}
                          className="flag-image-main"
                        />
                        <div className="flag-country">{flagData.country}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <h3 className="carousel-title">Our Partner Countries</h3>
          </div>

          {/* Right column: Quote */}
          <div className="quote-column">
            <div className="banner-quote">
              <h2>
                <span className="quote-line-1">Connecting Our Campus</span>
                <span className="quote-line-2">To The World</span>
              </h2>
            </div>
          </div>
        </div>

        <div className="banner-description">
          <p>
            The PUP Office of International Affairs is engaged in a wide variety
            of programs and activities aligned with the vision of President
            Manuel M. Muhi towards establishment of PUP as a National
            Polytechnic University.
          </p>
          <p>
            Thus, the Office for International Affairs provides leadership and
            coordination for all University-wide international activities for
            coherence and integration of the institution's international
            linkages, cooperation, exchanges, programs and services:
          </p>
          <ul className="services-list">
            <li>International Exchange Students</li>
            <li>International Seminars/Fora</li>
            <li>International Scholarship Grants</li>
            <li>International Faculty Exchange</li>
            <li>International Organizations Affiliation</li>
            <li>International Linkages</li>
          </ul>
        </div>
      </div>{" "}
      {/* closes banner-overlay */}
    </section>
  );
}