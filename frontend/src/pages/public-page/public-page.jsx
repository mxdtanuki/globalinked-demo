import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "./components/Header";
import MainBanner from "./components/MainBanner";
import ObjectivesFunctions from "./components/ObjectivesFunctions";
import ServicesSection from "./components/ServicesSection";
import FAQSection from "./components/FAQSection";
import Officials from "./components/Officials";
import ContactSection from "./components/ContactSection";
// import MOUMOAPage from './components/MOUMOAPage';
import Footer from "./components/Footer";
import "./components/styles/PublicPage.css";

export default function PublicPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.targetId) {
      const target = document.querySelector(location.state.targetId);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [location]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <div className="public-page">
      <Header />
      <MainBanner />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <ObjectivesFunctions />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <ServicesSection />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <FAQSection />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <Officials />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
      >
        <ContactSection />
      </motion.div>

      <Footer />
    </div>
  );
}
