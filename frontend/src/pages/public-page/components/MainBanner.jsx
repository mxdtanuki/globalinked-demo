import React, { useState, useEffect } from 'react';
import './styles/MainBanner.css';

// OIA PICS
import mainBuilding from './assets/pup-main-building.jpg';
import img1 from './assets/oia/492538302_1141368874460018_475243773290951159_n.jpg';
import img2 from './assets/oia/500059530_1161499052447000_311588536245123899_n.jpg';
import img3 from './assets/oia/500629817_1161511382445767_3024279927008367590_n.jpg';
import img4 from './assets/oia/503487405_1170236698239902_8096217446390630624_n.jpg';
import img5 from './assets/oia/506298123_1174810761115829_2331846753144179783_n.jpg';
import img6 from './assets/oia/509439345_1185931203337118_8048473438923343952_n.jpg';

export default function MainBanner() {
  const [currentFlagIndex, setCurrentFlagIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // slideshow images
  const slideshowImages = [mainBuilding, img1, img2, mainBuilding, img3, mainBuilding, img4, mainBuilding, img5, img6];

  const flags = [
    { country: 'Philippines', flag: 'https://flagcdn.com/ph.svg' },
    { country: 'Belgium', flag: 'https://flagcdn.com/be.svg' },
    { country: 'Canada', flag: 'https://flagcdn.com/ca.svg' },
    { country: 'China', flag: 'https://flagcdn.com/cn.svg' },
    { country: 'Cyprus', flag: 'https://flagcdn.com/cy.svg' },
    { country: 'Hongkong', flag: 'https://flagcdn.com/hk.svg' },
    { country: 'India', flag: 'https://flagcdn.com/in.svg' },
    { country: 'Indonesia', flag: 'https://flagcdn.com/id.svg' },
    { country: 'Japan', flag: 'https://flagcdn.com/jp.svg' },
    { country: 'Malaysia', flag: 'https://flagcdn.com/my.svg' },
    { country: 'Nepal', flag: 'https://flagcdn.com/np.svg' },
    { country: 'Netherlands', flag: 'https://flagcdn.com/nl.svg' },
    { country: 'Portugal', flag: 'https://flagcdn.com/pt.svg' },
    { country: 'Russia', flag: 'https://flagcdn.com/ru.svg' },
    { country: 'Singapore', flag: 'https://flagcdn.com/sg.svg' },
    { country: 'South Korea', flag: 'https://flagcdn.com/kr.svg' },
    { country: 'Spain', flag: 'https://flagcdn.com/es.svg' },
    { country: 'Sri Lanka', flag: 'https://flagcdn.com/lk.svg' },
    { country: 'Switzerland', flag: 'https://flagcdn.com/ch.svg' },
    { country: 'Taiwan', flag: 'https://flagcdn.com/tw.svg' },
    { country: 'Thailand', flag: 'https://flagcdn.com/th.svg' },
    { country: 'U.S.A.', flag: 'https://flagcdn.com/us.svg' },
    { country: 'Ukraine', flag: 'https://flagcdn.com/ua.svg' },
    { country: 'United Kingdom', flag: 'https://flagcdn.com/gb.svg' },
    { country: 'Vietnam', flag: 'https://flagcdn.com/vn.svg' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFlagIndex((prev) => (prev + 1) % flags.length);
    }, 3000); // Change flag every 3 seconds
    return () => clearInterval(interval);
  }, [flags.length]);

    useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 5000); // Change image every 4 seconds
    return () => clearInterval(interval);
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
              className={`hero-image ${index === currentImageIndex ? 'active' : ''}`}
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
                style={{ transform: `translateX(-${currentFlagIndex * 100}%)` }}
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
          The PUP Office of International Affairs is engaged in a wide variety of
          programs and activities aligned with the vision of President Manuel M.
          Muhi towards establishment of PUP as a National Polytechnic University.
        </p>
        <p>
          Thus, the Office for International Affairs provides leadership and
          coordination for all University-wide international activities for coherence
          and integration of the institution's international linkages, cooperation,
          exchanges, programs and services:
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
    </div> {/* closes banner-overlay */}
  </section>
);
}