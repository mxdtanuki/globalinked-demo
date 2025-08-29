import React, { useState } from 'react';
import './styles/FAQ.css';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Does PUP admit/accept transferee for undergraduate program from another Philippine school or school abroad?",
      answer: "YES. A letter of intent addressed to the University President thru the Vice-President for Academic Affairs should be sent/submitted."
    },
    {
      question: "Where can I get information on courses?",
      answer: "Polytechnic University of the Philippines has a wide range of courses at various levels - Bachelors, Masters, and Doctorate. For information please browse the programs offered in undergraduate and graduate levels."
    },
    {
      question: "Can an international student take admission exam any time of the year?",
      answer: "Yes, provided he takes the exam during the admission exam schedule in time for the enrollment schedule for first or second semester or summer."
    },
    {
      question: "How do I apply?",
      answer: "For application procedures and other requirements, please click here (Qualifications and Requirements for International Students)"
    },
    {
      question: "What are the entry requirements?",
      answer: "Applicants should meet PUP's academic, English language and document requirements. Applicants should take the PUP Admission Examination for International Students at the PUP Main Campus."
    },
    {
      question: "How do I get a visa?",
      answer: "After meeting all the requirements (academic, language and documentary) PUP Registrar will issue a Notice of Acceptance needed for converting current visa to student visa. The Liaison Officer of PUP will assist student at the Bureau of Immigration."
    },
    {
      question: "How long does it take to get a student visa?",
      answer: "Processing of student visa conversion takes at most 2-3 months provided documents are complete and duly authenticated by the Philippine Foreign Service Post in the applicant's country of origin. PUP Liaison officer facilitates student visa processing."
    },
    {
      question: "If I am below 18 years old, am I required to have a student visa?",
      answer: "A Special Study Permit (SSP) from the Philippine Bureau of Immigration is required for a student below 18 years old. PUP Liaison Officer will assist in securing the SSP."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq">
      <div className="container">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <h3 className="section-subtitle">International Student FAQ For Non-Filipino/International Students</h3>
        
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div key={index} className={`faq-item ${openIndex === index ? 'open' : ''}`}>
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}