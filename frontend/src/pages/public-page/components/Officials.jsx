import React from "react";
import "./styles/Officials.css";

import trinidad from "./assets/oia/OIA_Felicitas C. Trinidad (1).jpg";
import linkageschief from "./assets/Sir Nicky.jpg";
import sasot from "./assets/oia/OIA_Christoper F. Sasot (1).jpg";
import chiefseps from "./assets/IMG_2031.JPG";
import murao from "./assets/oia/OIA_Rochelle S. Murao (2).jpg";
import cynthia from "./assets/oia/OIA_Cynthia C. Trinidad.jpg";
import enguerra from "./assets/oia/OIA_Marianne P. Enguerra (2).jpg";

export default function Officials() {
  const officials = [
    {
      name: "Felicitas C. Trinidad, MPsy, RPm, CHRA",
      position: "Director",
      image: trinidad,
    },
    {
      name: "Nicky C. Cardenas, EMJMD",
      position: "Chief, Partnership and Linkages Section",
      image: linkageschief,
    },
    {
      name: "Christopher F. Sasot, PhD",
      position: "Chief, Special Internationalization Projects",
      image: sasot,
    },
    {
      name: "Joseph Christopher DT. Briana",
      position: "Chief, Study and Exchange Program Section",
      image: chiefseps,
    },
    {
      name: "Rochelle S. Murao",
      position: "Administrative Aide VI",
      image: murao,
    },
    {
      name: "Cynthia C. Trinidad",
      position: "Administrative Aide VI",
      image: cynthia,
    },
    {
      name: "Marianne P. Enguerra",
      position: "Emergency Administrative Aide III",
      image: enguerra,
    },
  ];

  return (
    <section id="officials" className="officials">
      <div className="container">
        <h2 className="section-title">Officials and Staff</h2>

        <div className="officials-grid">
          <div className="officials-row top">
            {officials.slice(0, 3).map((official, index) => (
              <div key={index} className="official-card">
                <div className="official-image">
                  <img
                    src={official.image}
                    alt={official.name}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/200x200/4A1D1D/ffffff?text=Photo";
                    }}
                  />
                </div>
                <div className="official-info">
                  <h3>{official.name}</h3>
                  <p>{official.position}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="officials-row bottom">
            {officials.slice(3).map((official, index) => (
              <div key={index + 3} className="official-card">
                <div className="official-image">
                  <img
                    src={official.image}
                    alt={official.name}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/200x200/4A1D1D/ffffff?text=Photo";
                    }}
                  />
                </div>
                <div className="official-info">
                  <h3>{official.name}</h3>
                  <p>{official.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
