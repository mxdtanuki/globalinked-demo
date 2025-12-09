import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./styles/FAQ.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
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

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question:
        "Does PUP admit/accept transferee for undergraduate program from another Philippine school or school abroad?",
      answer:
        "YES. A letter of intent addressed to the University President thru the Vice-President for Academic Affairs should be sent/submitted.",
    },
    {
      question: "Where can I get information on courses?",
      answer:
        "Polytechnic University of the Philippines has a wide range of courses at various levels - Bachelors, Masters, and Doctorate. For information please browse the programs offered in undergraduate and graduate levels.",
    },
    {
      question:
        "Can an international student take admission exam any time of the year?",
      answer:
        "Yes, provided they take the exam during the admission exam schedule in time for the enrollment schedule for first or second semester or summer.",
    },
    {
      question: "How do I apply?",
      answer: (
        <>
          For application procedures and other requirements, please click{" "}
          <a
            href="https://www.pup.edu.ph/international/requirements"
            target="_blank"
            rel="noopener noreferrer"
          >
            here.
          </a>{" "}
        </>
      ),
    },
    {
      question: "What are the entry requirements?",
      answer:
        "Applicants should meet PUP's academic, English language and document requirements. Applicants should take the PUP Admission Examination for International Students at the PUP Main Campus.",
    },
    {
      question: "How do I get a visa?",
      answer:
        "After meeting all the requirements (academic, language and documentary) PUP Registrar will issue a Notice of Acceptance needed for converting current visa to student visa. The Liaison Officer of PUP will assist student at the Bureau of Immigration.",
    },
    {
      question: "How long does it take to get a student visa?",
      answer:
        "Processing of student visa conversion takes at most 2-3 months provided documents are complete and duly authenticated by the Philippine Foreign Service Post in the applicant's country of origin. PUP Liaison officer facilitates student visa processing.",
    },
    {
      question:
        "If I am below 18 years old, am I required to have a student visa?",
      answer:
        "A Special Study Permit (SSP) from the Philippine Bureau of Immigration is required for a student below 18 years old. PUP Liaison Officer will assist in securing the SSP.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq">
      <div className="container">
        <motion.h2
          className="section-title"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={titleVariants}
        >
          Frequently Asked Questions
        </motion.h2>
        <motion.h3
          className="section-subtitle"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={titleVariants}
        >
          International Student FAQ For Non-Filipino/International Students
        </motion.h3>

        <motion.div
          className="faq-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className={`faq-item ${openIndex === index ? "open" : ""}`}
              variants={itemVariants}
            >
              <button className="faq-question" onClick={() => toggleFAQ(index)}>
                <span>{faq.question}</span>
                <span className="faq-icon">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    className="faq-answer"
                    initial={{ maxHeight: 0, opacity: 0 }}
                    animate={{ maxHeight: 500, opacity: 1 }}
                    exit={{ maxHeight: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    {typeof faq.answer === "string" ? (
                      <p>{faq.answer}</p>
                    ) : (
                      <p>{faq.answer}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
