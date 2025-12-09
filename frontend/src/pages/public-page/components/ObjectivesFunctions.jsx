import React from "react";
import { motion } from "framer-motion";
import "./styles/ObjectivesAndFunctions.css";
import { PiTargetFill } from "react-icons/pi";
import { FiSettings } from "react-icons/fi";

// Importing icons
import gradCapIcon from "./assets/gradcap.png";
import collaborationIcon from "./assets/collaboration.png";
import trophyIcon from "./assets/trophy.png";
import learningIcon from "./assets/learning.png";
import locationIcon from "./assets/global-map.png";
import passportIcon from "./assets/passport.png";

import agreementIcon from "./assets/agreement.png";
import partnershipIcon from "./assets/feedback.png";
import feedbackIcon from "./assets/Info-icon.png";
import studentIcon from "./assets/student-travel.png";
import tourIcon from "./assets/tour.png";
import conferenceIcon from "./assets/conference.png";
import universityNetworkIcon from "./assets/feedback.png";

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};

const ObjectivesAndFunctions = () => {
  const objectives = [
    {
      text: "Promote PUP as a premier institution of higher learning in the Asia-Pacific Region.",
      icon: gradCapIcon,
    },
    {
      text: "Underscore productive collaboration with international institutions, linkages and affiliations.",
      icon: collaborationIcon,
    },
    {
      text: "Prepare stakeholder to meet the challenges of global competition.",
      icon: trophyIcon,
    },
    {
      text: "Offer wider opportunities for educational, cultural and scientific exchange.",
      icon: learningIcon,
    },
    {
      text: "Increase PUP's international exposure and participation.",
      icon: locationIcon,
    },
    {
      text: "Attract a greater number of international visitors.",
      icon: passportIcon,
    },
  ];

  const functions = [
    {
      text: "Explore, establish and administer the forging of linkages with overseas universities.",
      icon: universityNetworkIcon,
    },
    {
      text: "Ensure the smooth and efficient implementation and execution of PUP's responsibilities specified in agreements/understandings entered into with international institutions/agencies.",
      icon: agreementIcon,
    },
    {
      text: "Provide information and assist grantees/recipients of academic exchanges, study tours and presentation of papers and researches in international fora/conferences.",
      icon: feedbackIcon,
    },
    {
      text: "Facilitate, oversee and monitor entry and departure of international students in coordination with the Office of the Vice President for Student Services and other concerned offices inside and outside of PUP.",
      icon: studentIcon,
    },
    {
      text: "Coordinate and assist international visits to the campus.",
      icon: tourIcon,
    },
    {
      text: "Assist in holding international conferences.",
      icon: conferenceIcon,
    },
    {
      text: "Provide the PUP president and other executive officials, education agencies and foreign institutions with progress reports, feedback and other pertinent information about international programs, projects and activities of the University.",
      icon: partnershipIcon,
    },
  ];

  return (
    <section className="pup-io-objectives-functions" id="objectives">
      <div className="pup-io-container">
        <div className="pup-io-content-grid">
          {/* Objectives Section */}
          <div className="pup-io-objectives-section">
            <div className="pup-io-section-header">
              <PiTargetFill className="pup-io-section-icon" size={40} />
              <h3 className="pup-io-section-title">Objectives</h3>
            </div>

            <div className="pup-io-cards-container">
              {objectives.map((objective, index) => (
                <motion.div
                  key={index}
                  className="pup-io-objective-card"
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={cardVariants}
                >
                  <img
                    src={objective.icon}
                    alt="Objective Icon"
                    className="pup-io-card-icon-img"
                  />
                  <p className="pup-io-card-text">{objective.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Functions Section */}
          <div className="pup-io-functions-section">
            <div className="pup-io-section-header">
              <FiSettings className="pup-io-section-icon" size={40} />
              <h3 className="pup-io-section-title">Functions</h3>
            </div>

            <div className="pup-io-cards-container">
              {functions.map((func, index) => (
                <motion.div
                  key={index}
                  className="pup-io-function-card"
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={cardVariants}
                >
                  <img
                    src={func.icon}
                    alt="Function Icon"
                    className="pup-io-card-icon-img"
                  />
                  <p className="pup-io-card-text">{func.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ObjectivesAndFunctions;