import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import facebookIcon from "./assets/facebook.png";
import logo from "./assets/logo.png";
import "./styles/Footer.css";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleFacultyLinkClick = (e) => {
    e.preventDefault();
    
    if (location.pathname === '/faculty-login') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      navigate('/faculty-login');
    }
  };

  const handleScrollLinkClick = (e, targetId) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/", { state: { targetId } });
    } else {
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo-section">
              <img src={logo} alt="PUP Logo" className="footer-logo" />
              <div className="footer-university-info">
                <h3 className="footer-university-name">
                  <a
                    href="https://www.pup.edu.ph/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    Polytechnic University <br />
                    of the Philippines <br />
                  </a>
                </h3>
                <p className="footer-office-name">
                  Office of International Affairs
                </p>
              </div>
            </div>
            <p className="footer-description">
              Fostering global partnerships and <br />
              international collaboration to enhance <br />
              educational excellence and cultural <br />
              exchange.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-section-title">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <a href="/#objectives" className="footer-link" onClick={(e) => handleScrollLinkClick(e, "#objectives")}>
                  Objective and Functions
                </a>
              </li>
              <li>
                <a href="/#services" className="footer-link" onClick={(e) => handleScrollLinkClick(e, "#services")}>
                  Services
                </a>
              </li>
              <li>
                <a href="/#faq" className="footer-link" onClick={(e) => handleScrollLinkClick(e, "#faq")}>
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <a href="/#officials" className="footer-link" onClick={(e) => handleScrollLinkClick(e, "#officials")}>
                  Officials and Staff
                </a>
              </li>
              <li>
                <a href="/#contact" className="footer-link" onClick={(e) => handleScrollLinkClick(e, "#contact")}>
                  Contact Information
                </a>
              </li>
              <li>
                <Link to="/mou-moa" className="footer-link">
                  International Linkages
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-section-title">Our Services</h4>
            <ul className="footer-services-text">
              <li>Student Exchange Programs</li>
              <li>International Partnerships</li>
              <li>Study Abroad Assistance</li>
              <li>Cultural Exchange</li>
              <li>Research Collaboration</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-section-title">Faculty</h4>
            <ul className="footer-links">
              <li>
                <a 
                  href="/faculty-login" 
                  className="footer-link"
                  onClick={handleFacultyLinkClick}
                >
                  Globalinked
                </a>
              </li>
            </ul>

            <h4 className="footer-section-title" style={{ marginTop: "2rem" }}>
              Follow Us
            </h4>
            <div className="footer-social-clean">
              <a
                href="https://www.facebook.com/PUPOFIA"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link-clean"
              >
                <img
                  src={facebookIcon}
                  alt="Facebook Icon"
                  className="social-icon-clean"
                />
                <span className="social-text">PUP OIA Page</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-floating-elements">
        <div className="floating-element floating-1"></div>
        <div className="floating-element floating-2"></div>
        <div className="floating-element floating-3"></div>
        <div className="floating-element floating-4"></div>
        <div className="floating-element floating-5"></div>
      </div>
    </footer>
  );
};

export default Footer;
