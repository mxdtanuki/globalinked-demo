import React from 'react';
import searchIcon from '../components/assets/search.png';

export default function Hero() {
  return (
    <section className="hero-gradient py-20">
      <div className="hero-container">
        <h2 className="hero-title">Office Of The International Affairs</h2>
        <p className="hero-description">
          The Office for International Affairs provides leadership and coordination for all University-wide
          international activities for coherence and integration of the institution's international linkages,
          cooperation, exchanges, programs and services.
        </p>
        <div className="search-wrapper">
          <input type="text" placeholder="Search countries, program, or staff..." />
          <button>
            <img src={searchIcon} alt="Search" />
          </button>
        </div>
      </div>
    </section>
  );
}
