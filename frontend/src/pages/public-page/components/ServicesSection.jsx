import React from "react";
import { motion } from "framer-motion";
import "./styles/Services.css";
import { IoSchoolOutline } from "react-icons/io5";
import { PiChalkboardTeacher } from "react-icons/pi";
import { HiOutlineGlobeAlt } from "react-icons/hi";

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

const titleVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export default function Services() {
  const services = [
    {
      title: "Student Mobility",
      icon: IoSchoolOutline,
      subsections: [
        {
          subtitle: "International Students in PUP",
          items: [
            "Admission - Attends to the recruitment and application of international students",
            "Legal Status - Coordinates with the Liaison Officer from OUR and ARO",
            "Residency - Monitors stay and residency needs of all international students",
          ],
        },
        {
          subtitle: "Student Exchange Program",
          items: [
            "Coordinates and implements academic and cultural exchange activities with partner universities abroad",
          ],
        },
        {
          subtitle: "Students' Travel Abroad",
          items: [
            "Attend convention/conference/seminar/training",
            "Participate in competition",
            "Paper presentation",
            "Campus visit",
            "Industry visit",
          ],
        },
      ],
    },
    {
      title: "Faculty and Staff Mobility",
      icon: PiChalkboardTeacher,
      subsections: [
        {
          subtitle: "Travel Abroad Purposes",
          items: [
            "Paper presentation",
            "Benchmarking",
            "Research collaborations",
            "Speakership/as resource person",
            "Serving as panelists/judges",
            "Visiting Professor/Lecturers",
          ],
        },
      ],
    },
    {
      title: "Partnership, Linkages, and Networks",
      icon: HiOutlineGlobeAlt,
      subsections: [
        {
          subtitle: "International Partnerships",
          items: [
            "Facilitates signing of Memorandum of Understanding with Institution and/or industry partners abroad",
            "Coordinates with colleges implementation of Memorandum of Agreement reached with partner institutions",
            "Represents PUP high officials in international events/activities locally/abroad",
          ],
        },
      ],
    },
  ];

  return (
    <section id="services" className="services">
      <div className="container">
        <motion.h2
          className="section-title"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={titleVariants}
        >
          Services
        </motion.h2>

        <div className="services-grid">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className={`service-card ${
                service.title === "Faculty and Staff Mobility"
                  ? "faculty-staff"
                  : ""
              }`}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardVariants}
            >
              <div className="service-header">
                <div className="service-icon">
                  <service.icon className="service-icon-img" />
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}