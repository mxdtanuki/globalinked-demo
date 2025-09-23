import React from "react";
import { Link } from "react-router-dom";
import facebookIcon from "./assets/facebook.png";
import logo from "./assets/logo.png";
import "./styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          {/* University Info Section */}
          <div className="footer-section">
            <div className="footer-logo-section">
              <img src={logo} alt="PUP Logo" className="footer-logo" />
              <div className="footer-university-info">
                <h3 className="footer-university-name">
                  Polytechnic University <br />
                  of the Philippines <br />
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

          {/* Quick Links Section */}
          <div className="footer-section">
            <h4 className="footer-section-title">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <a href="#objectives" className="footer-link">
                  Objective and Functions
                </a>
              </li>
              <li>
                <a href="#services" className="footer-link">
                  Services
                </a>
              </li>
              <li>
                <a href="#faq" className="footer-link">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <a href="#officials" className="footer-link">
                  Officials and Staff
                </a>
              </li>
              <li>
                <a href="#contact" className="footer-link">
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

          {/* Services Section */}
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

          {/* Faculty and Social Media Combined Section */}
          <div className="footer-section">
            <h4 className="footer-section-title">Faculty</h4>
            <ul className="footer-links">
              <li>
                <Link to="/faculty-login" className="footer-link">
                  Globalinked
                </Link>
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

      {/* Floating Elements for Animation */}
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
