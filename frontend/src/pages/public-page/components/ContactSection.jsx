import React from 'react';
import emailIcon from '../components/assets/email.png';
import locationIcon from '../components/assets/location.png';
import telephoneIcon from '../components/assets/telephone.png';
import './ContactSection.css';

export default function ContactSection() {
  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        {/* Left - Contact Info */}
        <div className="contact-info">
          <h2>Contact Information</h2>

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
              <p>(+63 2) 335-1PUP (335-1787) or 335-1777 local 622</p>
            </div>
          </div>
        </div>

        {/* Right - Contact Form */}
        <div className="contact-form">
          <form>
                      <h3>Contact Us</h3>
            <div className="form-row">
              <div>
                <label htmlFor="first-name">First Name *</label>
                <input type="text" id="first-name" required />
              </div>
              <div>
                <label htmlFor="last-name">Last Name *</label>
                <input type="text" id="last-name" required />
              </div>
            </div>

            <label htmlFor="email">Email Address *</label>
            <input type="email" id="email" required />

            <label htmlFor="message">Message *</label>
            <textarea id="message" rows="6" required></textarea>

            <button type="submit">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
}
