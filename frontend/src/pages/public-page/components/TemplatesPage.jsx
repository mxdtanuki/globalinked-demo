import React, { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./styles/TemplatesPage.css";

// React Icons
import {
  FaDownload,
  FaEye,
  FaFileAlt,
  FaUniversity,
  FaGraduationCap,
  FaHandshake,
  FaGlobeAmericas,
} from "react-icons/fa";
import { HiAcademicCap } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const templates = [
    {
      category: "MOA on Conference Co-Hosting",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template_CONFERENCE Co-Hosting.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on CONFERENCE_Co-Hosting/MOA Template_CONFERENCE Co-Hosting.docx",
      icon: FaUniversity,
      type: "moa",
      description:
        "Agreement template for co-hosting academic conferences and events",
    },
    {
      category: "MOA on Cultural Exchange",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA ON CULTURAL EXCHANGE_template.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on CULTURAL EXCHANGE/MOA ON CULTURAL EXCHANGE_template.docx",
      icon: FaGlobeAmericas,
      type: "moa",
      description: "Template for cultural exchange programs and partnerships",
    },
    {
      category: "MOA on Faculty Exchange",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template for Faculty-Exchange.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on FACULTY EXCHANGE/MOA Template for Faculty-Exchange.docx",
      icon: HiAcademicCap,
      type: "moa",
      description: "Faculty exchange program agreement template",
    },
    {
      category: "MOA on International Competition",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template on CO-Hosting International Student Competition.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on INTERNATIONAL COMPETITION/MOA Template on CO-Hosting International Student Competition.docx",
      icon: FaGraduationCap,
      type: "moa",
      description: "Agreement for hosting international student competitions",
    },
    {
      category: "MOA on Research",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template for RESEARCH.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on RESEARCH/MOA Template for RESEARCH.docx",
      icon: FaFileAlt,
      type: "moa",
      description: "Research collaboration and partnership agreement",
    },
    {
      category: "MOA on Student Exchange",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template for Student Exchange.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on STUDENT EXCHANGE/MOA Template for Student Exchange.docx",
      icon: FaGraduationCap,
      type: "moa",
      description: "Student exchange program agreement template",
    },
    {
      category: "MOA on Student Internship",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template on STUDENT INTERNSHIP 2025.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on STUDENT INTERNSHIP/MOA Template on STUDENT INTERNSHIP 2025.docx",
      icon: FaHandshake,
      type: "moa",
      description: "Internship program partnership agreement",
    },
    {
      category: "MOU Template 2025",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOU-template-PUP-2025_wd-contact_final.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOU TEMPLATE 2025/MOU-template-PUP-2025_wd-contact_final.docx",
      icon: FaUniversity,
      type: "mou",
      description: "Comprehensive Memorandum of Understanding template",
    },
  ];

  const categories = [
    { id: "all", name: "All Templates", count: templates.length },
    {
      id: "mou",
      name: "MOU Templates",
      count: templates.filter((t) => t.type === "mou").length,
    },
    {
      id: "moa",
      name: "MOA Templates",
      count: templates.filter((t) => t.type === "moa").length,
    },
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || t.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Header />
      <main className="templates-page-main">
        {/* Hero Section */}
        <div className="templates-hero-section">
          <div className="templates-hero-content">
            <h1 className="templates-main-title">Memorandum Templates</h1>

            {/* Info Cards in Hero */}
            <div className="templates-info-section">
              <div className="templates-info-card">
                <HiAcademicCap className="templates-info-icon" />
                <h4>University Approved</h4>
                <p>All templates are reviewed and approved</p>
              </div>
              <div className="templates-info-card">
                <FaFileAlt className="templates-info-icon" />
                <h4>Easy to Customize</h4>
                <p>
                  Download editable DOCX files tailored to your specific needs
                </p>
              </div>
              <div className="templates-info-card">
                <FaHandshake className="templates-info-icon" />
                <h4>Partnership Ready</h4>
                <p>
                  Professional templates designed for successful collaborations
                </p>
              </div>
            </div>
          </div>
          <div className="templates-hero-accent"></div>
        </div>

        {/* Search and Filter Section */}
        <div className="templates-search-section">
          <div className="templates-search-container">
            <div className="templates-search-bar">
              <FiSearch className="templates-search-icon" />
              <input
                type="text"
                placeholder="Search templates by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="templates-search-input"
              />
            </div>
          </div>

          <div className="templates-category-filters">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`templates-category-filter ${
                  selectedCategory === cat.id ? "templates-filter-active" : ""
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="templates-filter-name">{cat.name}</span>
                <span className="templates-filter-count">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="templates-grid-container">
          {filteredTemplates.length > 0 ? (
            <div className="templates-cards-grid">
              {filteredTemplates.map((template, index) => {
                const IconComponent = template.icon;
                return (
                  <div key={index} className="template-item-card">
                    <div
                      className={`template-type-badge badge-${template.type}`}
                    >
                      {template.type.toUpperCase()}
                    </div>
                    <div className="template-card-header">
                      <div className="template-icon-container">
                        <IconComponent className="template-card-icon" />
                      </div>
                      <h3 className="template-card-title">
                        {template.category}
                      </h3>
                      <p className="template-card-description">
                        {template.description}
                      </p>
                    </div>
                    <div className="template-card-actions">
                      <button
                        className="templates-btn templates-preview-btn"
                        onClick={() =>
                          window.open(template.previewPath, "_blank")
                        }
                      >
                        <FaEye className="templates-btn-icon" />
                        Preview PDF
                      </button>
                      <a
                        href={template.downloadPath}
                        download
                        className="templates-btn templates-download-btn"
                      >
                        <FaDownload className="templates-btn-icon" />
                        Download DOCX
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="templates-no-results">
              <FaFileAlt className="templates-no-results-icon" />
              <h3>No templates found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}