import React from 'react';
import './styles/Services.css';

import studentIcon from './assets/student-icon.png';
import facultyIcon from './assets/faculty-icon.png';
import partnershipIcon from './assets/partnership-icon.png';

export default function Services() {
  const services = [
    {
      title: "Student Mobility",
      icon: studentIcon,
      subsections: [
        {
          subtitle: "International Students in PUP",
          items: [
            "Admission - Attends to the recruitment and application of international students",
            "Legal Status - Coordinates with the Liaison Officer from OUR and ARO",
            "Residency - Monitors stay and residency needs of all international students"
          ]
        },
        {
          subtitle: "Student Exchange Program",
          items: [
            "Coordinates and implements academic and cultural exchange activities with partner universities abroad"
          ]
        },
        {
          subtitle: "Students' Travel Abroad",
          items: [
            "Attend convention/conference/seminar/training",
            "Participate in competition",
            "Paper presentation",
            "Campus visit",
            "Industry visit"
          ]
        }
      ]
    },
    {
      title: "Faculty and Staff Mobility",
      icon: facultyIcon,
      subsections: [
        {
          subtitle: "Travel Abroad Purposes",
          items: [
            "Paper presentation",
            "Benchmarking",
            "Research collaborations",
            "Speakership/as resource person",
            "Serving as panelists/judges",
            "Visiting Professor/Lecturers"
          ]
        }
      ]
    },
    {
      title: "Partnership, Linkages and Networks",
      icon: partnershipIcon,
      subsections: [
        {
          subtitle: "International Partnerships",
          items: [
            "Facilitates signing of Memorandum of Understanding with Institution and/or industry partners abroad",
            "Coordinates with colleges implementation of Memorandum of Agreement reached with partner institutions",
            "Represents PUP high officials in international events/activities locally/abroad"
          ]
        }
      ]
    }
  ];

  return (
    <section id="services" className="services">
      <div className="container">
        <h2 className="section-title">Services</h2>
        
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-header">
                <div className="service-icon">
                  <img src={service.icon} alt={`${service.title} icon`} className="service-icon-img" />
                </div>
                <h3>{service.title}</h3>
              </div>
              
              <div className="service-content">
                {service.subsections.map((subsection, subIndex) => (
                  <div key={subIndex} className="subsection">
                    <h4>{subsection.subtitle}</h4>
                    <ul>
                      {subsection.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
