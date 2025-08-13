import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../components/assets/logo.png';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();

  const handleAdminClick = () => {
    navigate('/login'); // Redirect to login
  };

  return (
    <header>
      <div className="brand" aria-label="LOGO AND NAME">
        <img src={logo} alt="Polytechnic University of the Philippines logo" />
        <div className="brand-text">
          <h1 className="university-name">
            POLYTECHNIC UNIVERSITY OF THE PHILIPPINES
          </h1>
          <p style={{ fontSize: '1.2rem', fontWeight: 150 }}>
            OFFICE OF THE INTERNATIONAL AFFAIRS
          </p>
        </div>
      </div>
      <nav aria-label="Primary navigation">
        <a href="#about" title="About">ABOUT</a>
        <a href="#about" title="About">MOUs/MOAs</a>
        <a href="#contact" title="Contact Us">CONTACT US</a>

        <button
          onClick={handleAdminClick}
          className="admin-button"
          style={{ cursor: 'pointer' }}
        >
          ADMIN
        </button>
      </nav>
    </header>
  );
}
