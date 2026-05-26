import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "./assets/logo.png";
import searchIcon from "./assets/search.png";
import "./styles/Header.css";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside the header
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (isSearchOpen && !event.target.closest(".search-modal")) {
  //       setIsSearchOpen(false);
  //     }
  //   };
  //   if (isSearchOpen) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   }
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [isSearchOpen]);

  const scrollToSection = (sectionId) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        if (sectionId === "top") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }
      }, 100);
    } else {
      if (sectionId === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
    setIsMobileMenuOpen(false);
  };

  // const handleSearch = () => {
  //   if (searchKeyword.trim()) {
  //     console.log("Searching for:", searchKeyword);
  //     setIsSearchOpen(false);
  //     setSearchKeyword("");
  //   }
  // };

  // const handleKeyPress = (e) => {
  //   if (e.key === "Enter") {
  //     handleSearch();
  //   }
  // };

  return (
    <>
      <header
        ref={headerRef}
        className={`header ${isScrolled ? "scrolled" : ""}`}
      >
        <div className="header-container">
          <Link to="/" className="logo-section">
            <img src={logo} alt="PUP Logo" className="logo" />
            <div className="university-info">
              <h1>Polytechnic University of the Philippines</h1>
              <p>Office of International Affairs</p>
            </div>
          </Link>

          <div className="header-right">
            <nav
              id="mobile-nav"
              className={`nav ${isMobileMenuOpen ? "nav-open" : ""}`}
            >
              <button
                className="nav-item"
                onClick={() => {
                  if (location.pathname !== "/") {
                    navigate("/");
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    document.documentElement.scrollTop = 0;
                  }
                  setIsMobileMenuOpen(false);
                }}
              >
                ABOUT
              </button>

              <button
                className="nav-item"
                onClick={() => {
                  navigate("/mou-moa");
                  setIsMobileMenuOpen(false);
                }}
              >
                PARTNERSHIP STATISTICS
              </button>

              <button
                className="nav-item"
                onClick={() => {
                  navigate("/templates");
                  setIsMobileMenuOpen(false);
                }}
              >
                MEMORANDUM TEMPLATES
              </button>

              <button
                className="nav-item"
                onClick={() => scrollToSection("contact")}
              >
                CONTACT US
              </button>
            </nav>

            {/* <button
              className="search-btn"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
            >
              <img src={searchIcon} alt="Search" className="search-icon" />
            </button> */}

            <button
              className={`mobile-menu-toggle ${isMobileMenuOpen ? "is-open" : ""}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* {isSearchOpen && (
        <div className="search-overlay">
          <div className="search-modal">
            <div className="search-header">
              <h2>Search</h2>
              <button
                className="search-close"
                onClick={() => setIsSearchOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="search-content">
              <label htmlFor="search-input" className="search-label">
                Keyword
              </label>
              <input
                id="search-input"
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="search-input"
                placeholder="Enter search keywords..."
                autoFocus
              />
              <button className="search-submit" onClick={handleSearch}>
                SEARCH
              </button>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}
