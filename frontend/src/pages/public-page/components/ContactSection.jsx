import React from 'react';
import './styles/ContactSection.css';

import emailIcon from './assets/email.png';
import locationIcon from './assets/location.png';
import telephoneIcon from './assets/telephone.png';

export default function ContactSection() {
  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <div className="contact-info-centered">
          <h2>Contact Information</h2>
          
          <div className="contact-items-row">
            <div className="contact-item">
              <img src={emailIcon} alt="Email icon" />
              <div>
                <h3>Email</h3>  
                <p>internationalaffairs@pup.edu.ph</p>
              </div>
            </div>

            <div className="contact-item">
              <img src={locationIcon} alt="Location icon" />
              <div>
                <h3>Postal Mail</h3>
                <p><strong>Office of International Affairs</strong><br />
                  3/F South Wing, Main Building<br />
                  A. Mabini Campus, Anonas St., Sta. Mesa<br />
                  Manila, Philippines 01016
                </p>
              </div>
            </div>

            <div className="contact-item">
              <img src={telephoneIcon} alt="Telephone icon" />
              <div>
                <h3>Telephone</h3>
                <p>(+63 2) 335-1PUP (335-1787) or<br />
335-1777 local 622</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}