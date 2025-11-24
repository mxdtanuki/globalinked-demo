import React from "react";
import "./styles/ContactSection.css";
import { HiOutlineMail } from "react-icons/hi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { HiOutlinePhone } from "react-icons/hi";

export default function ContactSection() {
  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <div className="contact-info-centered">
          <h2>Contact Information</h2>

          <div className="contact-items-row">
            <div className="contact-item">
              <HiOutlineMail className="contact-icon" />
              <div>
                <h3>Email</h3>
                <p>internationalaffairs@pup.edu.ph</p>
              </div>
            </div>

            <div className="contact-item">
              <HiOutlineLocationMarker className="contact-icon" />
              <div>
                <h3>Postal Mail</h3>
                <p>
                  <strong>Office of International Affairs</strong>
                  <br />
                  3/F South Wing, Main Building
                  <br />
                  A. Mabini Campus, Anonas St., Sta. Mesa
                  <br />
                  Manila, Philippines 01016
                </p>
              </div>
            </div>

            <div className="contact-item">
              <HiOutlinePhone className="contact-icon" />
              <div>
                <h3>Telephone</h3>
                <p>
                  (+63 2) 335-1PUP (335-1787) or
                  <br />
                  335-1777 local 622
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}