import React, { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./styles/TemplatesPage.css";

// icons
import downloadIcon from "./assets/download.png";
import folderIcon from "./assets/folder.png";
import searchIcon from "./assets/search.png";

export default function TemplatesPage() {
  const [search, setSearch] = useState("");

  const templates = [
    {
      category: "MOA on Conference Co-Hosting",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template_CONFERENCE Co-Hosting.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on CONFERENCE_Co-Hosting/MOA Template_CONFERENCE Co-Hosting.docx",
      icon: folderIcon,
    },
    {
      category: "MOA on Cultural Exchange",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA ON CULTURAL EXCHANGE_template.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on CULTURAL EXCHANGE/MOA ON CULTURAL EXCHANGE_template.docx",
      icon: folderIcon,
    },
    {
      category: "MOA on Faculty Exchange",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template for Faculty-Exchange.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on FACULTY EXCHANGE/MOA Template for Faculty-Exchange.docx",
      icon: folderIcon,
    },
    {
      category: "MOA on International Competition",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template on CO-Hosting International Student Competition.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on INTERNATIONAL COMPETITION/MOA Template on CO-Hosting International Student Competition.docx",
      icon: folderIcon,
    },
    {
      category: "MOA on Research",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template for RESEARCH.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on RESEARCH/MOA Template for RESEARCH.docx",
      icon: folderIcon,
    },
    {
      category: "MOA on Student Exchange",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template for Student Exchange.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on STUDENT EXCHANGE/MOA Template for Student Exchange.docx",
      icon: folderIcon,
    },
    {
      category: "MOA on Student Internship",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOA Template on STUDENT INTERNSHIP 2025.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOA on STUDENT INTERNSHIP/MOA Template on STUDENT INTERNSHIP 2025.docx",
      icon: folderIcon,
    },
    {
      category: "MOU Template 2025",
      previewPath:
        "/assets/MOU and MOA TEMPLATES/pdfs/MOU-template-PUP-2025_wd-contact_final.pdf",
      downloadPath:
        "/assets/MOU and MOA TEMPLATES/MOU TEMPLATE 2025/MOU-template-PUP-2025_wd-contact_final.docx",
      icon: folderIcon,
    },
  ];

  const filteredTemplates = templates.filter((t) =>
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const rows = [
    filteredTemplates.slice(0, 3),
    filteredTemplates.slice(3, 6),
    filteredTemplates.slice(6),
  ];

  return (
    <>
      <Header />
      <main className="templates-page">
        <h1 className="templates-title">MOU and MOA Templates</h1>

        <div className="search-container">
          <div className="search-bar">
            <img src={searchIcon} alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="templates-row">
            {row.map((t, index) => (
              <div key={index} className="template-card">
                <div className="template-header">
                  <img
                    src={t.icon}
                    alt="Folder Icon"
                    className="template-icon"
                  />
                  <h3>{t.category}</h3>
                </div>
                <div className="template-actions">
                  {/* Preview PDF */}
                  <button
                    className="btn preview-btn"
                    onClick={() => window.open(t.previewPath, "_blank")}
                  >
                    Preview
                  </button>
                  {/* Download DOCX */}
                  <a
                    href={t.downloadPath}
                    download
                    className="btn download-btn"
                  >
                    <img
                      src={downloadIcon}
                      alt="Download"
                      className="download-icon"
                    />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>
      <Footer />
    </>
  );
}
