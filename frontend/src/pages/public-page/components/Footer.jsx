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
                  Polytechnic University of the Philippines
                </h3>
                <p className="footer-office-name">
                  Office of International Affairs
                </p>
              </div>
            </div>
            <p className="footer-description">
              Fostering global partnerships and international collaboration to
              enhance educational excellence and cultural exchange.
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

          {/* Social Media Section - Inline */}
          <div className="footer-section">
            <div className="footer-social-inline">
              <h4 className="footer-section-title no-margin">
                Follow our Social Media
              </h4>
              <a
                href="https://www.facebook.com/PUPOFIA"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link facebook"
                aria-label="Visit PUP OIA Facebook Page"
              >
                <img
                  src={facebookIcon}
                  alt="Facebook Icon"
                  className="social-icon-img"
                />
                <span className="social-text">PUP OIA</span>
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
