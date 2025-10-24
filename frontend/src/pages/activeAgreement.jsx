import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "../components/layout.css";
import "./activeAgreement.css";
import { FiEye, FiLink, FiArrowRight } from "react-icons/fi";

const mockAgreements = [
  {
    id: 'moa-1',
    date: '2025-10-12',
    source: 'College of Science',
    pointPerson: 'Research Coordinator: Dr. Ana Bautista',
    pointPersonEmail: 'abautista@pup.edu.ph',
    dtsNumber: 'DT2025897659304',
    partnerName: 'Seoul National University',
    country: 'South Korea',
    region: 'Eastern Asia',
    address: 'Gwanak-ro, Seoul',
    contactPerson: 'Research Officer: Mr. Joon Park',
    contactPersonEmail: 'jpark@snu.ac.kr',
    documentType: 'MOA',
    partnershipClassification: 'MOA on Research',
    eventTitle: 'Joint publication launch',
    validityPeriod: 3,
    dateOfSigning: '2025-06-15',
    expiryDate: '2028-06-15',
    websiteLink: 'https://www.snu.ac.kr',
    briefProfile: 'Joint research and publications',
    hardcopyLocator: 'Filing Cabinet B-2',
    remarks: 'Awaiting next stage',
    status: 'active',
  },
  {
    id: 'mou-1',
    date: '2024-08-20',
    source: 'College of Engineering',
    pointPerson: 'Dean: Dr. Maria Santos',
    pointPersonEmail: 'msantos@pup.edu.ph',
    dtsNumber: 'DT2024756234891',
    partnerName: 'Tokyo Institute of Technology',
    country: 'Japan',
    region: 'Eastern Asia',
    address: 'Ookayama, Meguro-ku, Tokyo',
    contactPerson: 'International Affairs: Dr. Yuki Tanaka',
    contactPersonEmail: 'ytanaka@titech.ac.jp',
    documentType: 'MOU',
    partnershipClassification: 'MOU on Academic Collaboration',
    eventTitle: 'Technology exchange framework',
    validityPeriod: 5,
    dateOfSigning: '2024-03-10',
    expiryDate: '2029-03-10',
    websiteLink: 'https://www.titech.ac.jp',
    briefProfile: 'Framework for technology transfer and student exchange programs',
    hardcopyLocator: 'Filing Cabinet A-5',
    remarks: 'Active collaboration ongoing',
    status: 'active',
  },
  {
    id: 'moa-2',
    date: '2024-09-15',
    source: 'College of Engineering',
    pointPerson: 'Project Lead: Prof. Roberto Cruz',
    pointPersonEmail: 'rcruz@pup.edu.ph',
    dtsNumber: 'DT2024823456789',
    partnerName: 'Tokyo Institute of Technology',
    country: 'Japan',
    region: 'Eastern Asia',
    address: 'Ookayama, Meguro-ku, Tokyo',
    contactPerson: 'Project Manager: Dr. Kenji Yamamoto',
    contactPersonEmail: 'kyamamoto@titech.ac.jp',
    documentType: 'MOA',
    partnershipClassification: 'MOA on Student Exchange',
    eventTitle: 'Semester exchange program implementation',
    validityPeriod: 3,
    dateOfSigning: '2024-04-20',
    expiryDate: '2027-04-20',
    websiteLink: 'https://www.titech.ac.jp',
    briefProfile: 'Bilateral student exchange for engineering programs',
    hardcopyLocator: 'Filing Cabinet A-5',
    remarks: 'First batch of students deployed',
    status: 'active',
    linkedMouId: 'mou-1',
  },
  {
    id: 'mou-2',
    date: '2023-05-10',
    source: 'College of Business Administration',
    pointPerson: 'Business Development Head: Dr. Linda Reyes',
    pointPersonEmail: 'lreyes@pup.edu.ph',
    dtsNumber: 'DT2023445667889',
    partnerName: 'National University of Singapore',
    country: 'Singapore',
    region: 'Southeast Asia',
    address: '21 Lower Kent Ridge Rd, Singapore',
    contactPerson: 'Partnership Director: Dr. Wei Chen',
    contactPersonEmail: 'wchen@nus.edu.sg',
    documentType: 'MOU',
    partnershipClassification: 'MOU on Business Education',
    eventTitle: 'Business education partnership framework',
    validityPeriod: 5,
    dateOfSigning: '2023-01-15',
    expiryDate: '2028-01-15',
    websiteLink: 'https://www.nus.edu.sg',
    briefProfile: 'Collaboration on business research and faculty development',
    hardcopyLocator: 'Filing Cabinet C-1',
    remarks: 'Regular faculty exchange conducted',
    status: 'active',
  },
  {
    id: 'moa-3',
    date: '2024-11-05',
    source: 'College of Business Administration',
    pointPerson: 'Research Chair: Prof. Eduardo Garcia',
    pointPersonEmail: 'egarcia@pup.edu.ph',
    dtsNumber: 'DT2024934567812',
    partnerName: 'National University of Singapore',
    country: 'Singapore',
    region: 'Southeast Asia',
    address: '21 Lower Kent Ridge Rd, Singapore',
    contactPerson: 'Research Coordinator: Dr. Sarah Lim',
    contactPersonEmail: 'slim@nus.edu.sg',
    documentType: 'MOA',
    partnershipClassification: 'MOA on Joint Research',
    eventTitle: 'ASEAN business sustainability study',
    validityPeriod: 2,
    dateOfSigning: '2024-08-20',
    expiryDate: '2026-01-15',
    websiteLink: 'https://www.nus.edu.sg',
    briefProfile: 'Joint research on sustainable business practices in ASEAN region',
    hardcopyLocator: 'Filing Cabinet C-1',
    remarks: 'Research phase 1 completed',
    status: 'expiring-soon',
    linkedMouId: 'mou-2',
  },
  {
    id: 'moa-4',
    date: '2024-07-18',
    source: 'Institute of Technology',
    pointPerson: 'Industry Liaison: Engr. Patricia Mendoza',
    pointPersonEmail: 'pmendoza@pup.edu.ph',
    dtsNumber: 'DT2024678912345',
    partnerName: 'Siemens Philippines',
    country: 'Philippines',
    region: 'Southeast Asia',
    address: '26th Floor, The Finance Centre, Taguig City',
    contactPerson: 'HR Manager: Ms. Jennifer Tan',
    contactPersonEmail: 'jennifer.tan@siemens.com',
    documentType: 'MOA',
    partnershipClassification: 'MOA on Industry Partnership',
    eventTitle: 'Internship and training program',
    validityPeriod: 5,
    dateOfSigning: '2024-02-10',
    expiryDate: '2029-02-10',
    websiteLink: 'https://www.siemens.com.ph',
    briefProfile: 'Industry immersion and skills training for technology students',
    hardcopyLocator: 'Filing Cabinet D-3',
    remarks: '50 students placed annually',
    status: 'active',
  },
  {
    id: 'mou-3',
    date: '2024-12-01',
    source: 'Graduate School',
    pointPerson: 'Dean: Dr. Alfonso Mercado',
    pointPersonEmail: 'amercado@pup.edu.ph',
    dtsNumber: 'DT2024998877665',
    partnerName: 'University of Melbourne',
    country: 'Australia',
    region: 'Oceania',
    address: 'Grattan Street, Parkville VIC',
    contactPerson: 'International Office: Ms. Emma Wilson',
    contactPersonEmail: 'ewilson@unimelb.edu.au',
    documentType: 'MOU',
    partnershipClassification: 'MOU on Graduate Studies',
    eventTitle: 'PhD collaboration framework',
    validityPeriod: 4,
    dateOfSigning: '2024-09-05',
    expiryDate: '2028-12-31',
    websiteLink: 'https://www.unimelb.edu.au',
    briefProfile: 'Joint PhD supervision and research collaboration',
    hardcopyLocator: 'Filing Cabinet E-1',
    remarks: 'First cohort enrollment in progress',
    status: 'active',
  },
  {
    id: 'moa-5',
    date: '2024-12-10',
    source: 'Graduate School',
    pointPerson: 'Program Director: Dr. Carmen Lopez',
    pointPersonEmail: 'clopez@pup.edu.ph',
    dtsNumber: 'DT2024112233445',
    partnerName: 'University of Melbourne',
    country: 'Australia',
    region: 'Oceania',
    address: 'Grattan Street, Parkville VIC',
    contactPerson: 'PhD Coordinator: Dr. James Mitchell',
    contactPersonEmail: 'jmitchell@unimelb.edu.au',
    documentType: 'MOA',
    partnershipClassification: 'MOA on Research Collaboration',
    eventTitle: 'Joint PhD program in Educational Leadership',
    validityPeriod: 3,
    dateOfSigning: '2024-10-15',
    expiryDate: '2027-10-15',
    websiteLink: 'https://www.unimelb.edu.au',
    briefProfile: 'Dual supervision PhD program with scholarship opportunities',
    hardcopyLocator: 'Filing Cabinet E-1',
    remarks: '5 scholarship slots available',
    status: 'active',
    linkedMouId: 'mou-3',
  },
  {
    id: 'mou-4',
    date: '2023-03-20',
    source: 'College of Communication',
    pointPerson: 'Department Head: Prof. Teresa Aquino',
    pointPersonEmail: 'taquino@pup.edu.ph',
    dtsNumber: 'DT2023334455667',
    partnerName: 'Chulalongkorn University',
    country: 'Thailand',
    region: 'Southeast Asia',
    address: 'Phaya Thai Rd, Bangkok',
    contactPerson: 'Faculty Dean: Dr. Somchai Prasert',
    contactPersonEmail: 'sprasert@chula.ac.th',
    documentType: 'MOU',
    partnershipClassification: 'MOU on Media Studies',
    eventTitle: 'ASEAN media education network',
    validityPeriod: 5,
    dateOfSigning: '2023-02-10',
    expiryDate: '2026-02-28',
    websiteLink: 'https://www.chula.ac.th',
    briefProfile: 'Regional collaboration on media education and digital journalism',
    hardcopyLocator: 'Filing Cabinet F-2',
    remarks: 'Annual conference scheduled',
    status: 'expiring-soon',
  },
  {
    id: 'moa-6',
    date: '2024-10-25',
    source: 'College of Engineering',
    pointPerson: 'Research Director: Prof. Benjamin Ramos',
    pointPersonEmail: 'bramos@pup.edu.ph',
    dtsNumber: 'DT2024887766554',
    partnerName: 'Tokyo Institute of Technology',
    country: 'Japan',
    region: 'Eastern Asia',
    address: 'Ookayama, Meguro-ku, Tokyo',
    contactPerson: 'Research Lab Head: Dr. Hiroshi Nakamura',
    contactPersonEmail: 'hnakamura@titech.ac.jp',
    documentType: 'MOA',
    partnershipClassification: 'MOA on Joint Research',
    eventTitle: 'AI and Robotics collaborative research',
    validityPeriod: 4,
    dateOfSigning: '2024-05-18',
    expiryDate: '2028-05-18',
    websiteLink: 'https://www.titech.ac.jp',
    briefProfile: 'Joint research laboratory for AI, robotics, and automation systems',
    hardcopyLocator: 'Filing Cabinet A-5',
    remarks: 'Lab equipment procurement in progress',
    status: 'active',
    linkedMouId: 'mou-1', 
  },
];

const ActiveAgreement = () => {
  const [mobileShow, setMobileShow] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [reportType, setReportType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [agreements, setAgreements] = useState(mockAgreements);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, agreements]);
  
  const [editingField, setEditingField] = useState(null); 
  const [editValue, setEditValue] = useState("");

  const [isModalEdit, setIsModalEdit] = useState(false);
  const [editForm, setEditForm] = useState({ hardcopyLocator: "", remarks: "" });

  useEffect(() => {
    if (selectedAgreement) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setEditingField(null);
      setEditValue("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedAgreement]);

  useEffect(() => {
    if (selectedAgreement) {
      setIsModalEdit(false);
      setEditForm({
        hardcopyLocator: selectedAgreement.hardcopyLocator || "",
        remarks: selectedAgreement.remarks || "",
      });
    } else {
      setIsModalEdit(false);
      setEditForm({ hardcopyLocator: "", remarks: "" });
    }
  }, [selectedAgreement]);

  const toggleMobileSidebar = () => setMobileShow(!mobileShow);
  const closeModal = () => setSelectedAgreement(null);

  const startModalEdit = () => {
    setIsModalEdit(true);
    setEditForm({
      hardcopyLocator: selectedAgreement?.hardcopyLocator || "",
      remarks: selectedAgreement?.remarks || "",
    });
  };

  const cancelModalEdit = () => {
    setIsModalEdit(false);
    setEditForm({
      hardcopyLocator: selectedAgreement?.hardcopyLocator || "",
      remarks: selectedAgreement?.remarks || "",
    });
  };

  const saveModalEdits = () => {
    if (!selectedAgreement) return;
    const updated = agreements.map((a) =>
      a.id === selectedAgreement.id
        ? { ...a, hardcopyLocator: editForm.hardcopyLocator, remarks: editForm.remarks }
        : a
    );
    setAgreements(updated);
    setSelectedAgreement({
      ...selectedAgreement,
      hardcopyLocator: editForm.hardcopyLocator,
      remarks: editForm.remarks,
    });
    setIsModalEdit(false);
  };

  const activeAgreements = agreements.filter(
    (a) => a.status === "active" || a.status === "expiring-soon"
  );
  const activeMOAs = activeAgreements.filter((a) => a.documentType === "MOA");
  const activeMOUs = activeAgreements.filter((a) => a.documentType === "MOU");
  const expiringSoon = activeAgreements.filter(
    (a) => a.status === "expiring-soon"
  );

  const filteredAgreements = activeAgreements
    .filter((a) => {
      if (filter === "moa") return a.documentType === "MOA";
      if (filter === "mou") return a.documentType === "MOU";
      if (filter === "linked") return !!a.linkedMouId;
      return true;
    })
    .filter((a) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const fields = [
        a.dtsNumber,
        a.eventTitle,
        a.partnerName,
        a.source,
        a.country,
        a.documentType,
        a.partnershipClassification,
        a.briefProfile,
        a.remarks,
      ];
      return fields.some((f) => f && f.toString().toLowerCase().includes(q));
    });

  const totalPages = Math.max(1, Math.ceil(filteredAgreements.length / itemsPerPage));
  const paginatedAgreements = filteredAgreements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const gotoPage = (p) => {
    const page = Math.max(1, Math.min(totalPages, p));
    setCurrentPage(page);
  };
  const prevPage = () => gotoPage(currentPage - 1);
  const nextPage = () => gotoPage(currentPage + 1);

  const calculateDaysLeft = (expiryDate) => {
    const today = new Date();
    const exp = new Date(expiryDate);
    const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const linkedAgreement =
    selectedAgreement && selectedAgreement.linkedMouId
      ? agreements.find((a) => a.id === selectedAgreement.linkedMouId)
      : null;

  const reportLabelMap = {
    all: "Complete Agreements Report",
    mou: "MOU Only Report",
    moa: "MOA Only Report",
    linked: "Linked MOU → MOA Report",
  };

  const reportItems = (() => {
    if (reportType === "mou") return agreements.filter((a) => a.documentType === "MOU");
    if (reportType === "moa") return agreements.filter((a) => a.documentType === "MOA");
    if (reportType === "linked") return agreements.filter((a) => !!a.linkedMouId);
    return agreements.slice();
  })();

  const escapeHtml = (str = "") =>
    String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const safeCsv = (v = "") => {
    const s = String(v ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const generatePrintableReport = () => {
    const rows = reportItems
      .map((r) => {
        const parent = r.linkedMouId ? agreements.find((x) => x.id === r.linkedMouId) : null;
        return `<tr>
            <td>${escapeHtml(r.documentType)}</td>
            <td>${escapeHtml(r.dtsNumber)}</td>
            <td>${escapeHtml(r.eventTitle)}</td>
            <td>${escapeHtml(r.partnerName)}</td>
            <td>${escapeHtml(r.source)}</td>
            <td>${escapeHtml(new Date(r.dateOfSigning).toLocaleDateString())}</td>
            <td>${escapeHtml(new Date(r.expiryDate).toLocaleDateString())}</td>
            <td>${parent ? escapeHtml(parent.eventTitle) : ""}</td>
          </tr>`;
      })
      .join("");

    const html = `
      <html>
        <head>
          <title>${reportLabelMap[reportType]}</title>
          <style>
            body{font-family: Arial, Helvetica, sans-serif; padding:20px; color:#111}
            h1{font-size:20px; margin-bottom:6px}
            table{width:100%;border-collapse:collapse;margin-top:12px}
            th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
            th{background:#f7f7f7}
          </style>
        </head>
        <body>
          <h1>${reportLabelMap[reportType]}</h1>
          <div>Total records: ${reportItems.length}</div>
          <table>
            <thead>
              <tr>
                <th>Type</th><th>DTS</th><th>Title</th><th>Partner</th><th>Source</th><th>Signing</th><th>Expiry</th><th>Linked MOU</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>`;

    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
  };

  const downloadCSV = () => {
    const headers = ['Type','DTS Number','Title','Partner','Country','Source','DateOfSigning','ExpiryDate','LinkedMouId','Remarks'];
    const csvRows = [headers.join(",")];

    reportItems.forEach((r) => {
      const row = [
        safeCsv(r.documentType),
        safeCsv(r.dtsNumber),
        safeCsv(r.eventTitle),
        safeCsv(r.partnerName),
        safeCsv(r.country),
        safeCsv(r.source),
        safeCsv(r.dateOfSigning),
        safeCsv(r.expiryDate),
        safeCsv(r.linkedMouId || ""),
        safeCsv(r.remarks || ""),
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-agreements-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-container active-agreements-page">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}

      <div className="content-body">
        <Sidebar mobileShow={mobileShow} />

        <div className="main-content" onClick={() => mobileShow && setMobileShow(false)}>
          <div className="activeAgreement-main">
            {/* === Summary Cards === */}
            <div className="activeAgreement-summary">
              <div className="activeAgreement-card total">
                <h4>Total Active Agreements</h4>
                <p className="count">{activeAgreements.length}</p>
                <span>Currently in effect</span>
              </div>
              <div className="activeAgreement-card moa">
                <h4>Active MOAs</h4>
                <p className="count">{activeMOAs.length}</p>
                <span>Memorandum of Agreement</span>
              </div>
              <div className="activeAgreement-card mou">
                <h4>Active MOUs</h4>
                <p className="count">{activeMOUs.length}</p>
                <span>Memorandum of Understanding</span>
              </div>
              <div className="activeAgreement-card expiring">
                <h4>Expiring Soon</h4>
                <p className="count">{expiringSoon.length}</p>
                <span>Within 90 days</span>
              </div>
            </div>

            {/* === Agreement Table Section === */}
            <div className="activeAgreement-table-section">
              <div className="table-controls">
                <div className="activeAgreement-tabs">
                  <button
                    className={filter === "all" ? "active" : ""}
                    onClick={() => setFilter("all")}
                  >
                    All Active Agreements
                  </button>
                  <button
                    className={filter === "moa" ? "active" : ""}
                    onClick={() => setFilter("moa")}
                  >
                    MOA Only
                  </button>
                  <button
                    className={filter === "mou" ? "active" : ""}
                    onClick={() => setFilter("mou")}
                  >
                    MOU Only
                  </button>
                  <button
                    className={filter === "linked" ? "active" : ""}
                    onClick={() => setFilter("linked")}
                  >
                    Linked Agreements
                  </button>
                </div>

                <div className="table-search">
                  <input
                    type="search"
                    placeholder="Search DTS, title, partner, source..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search agreements"
                  />
                  {searchQuery && (
                    <button
                      className="clear-search"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <h3 className="section-title">Agreements ({filteredAgreements.length})</h3>
              {filter === "linked" ? (
                (() => {
                  const mouList = activeAgreements.filter((a) => a.documentType === "MOU");

                  const mouWithChildren = mouList
                    .map((mou) => {
                      const children = activeAgreements.filter((c) => c.linkedMouId === mou.id);
                      return { mou, children };
                    })
                    .filter((item) => item.children.length > 0);

                  if (mouWithChildren.length === 0) {
                    return <div className="no-linked">No linked agreements found.</div>;
                  }

                  return (
                    <div className="mou-relationships">
                      {mouWithChildren.map(({ mou, children }) => (
                        <div className="mou-relationship" key={mou.id}>
                          <div className="mou-relationship-header">
                            <span className="mou-dot" />
                            <span className={`badge mou`}>MOU</span>
                            <div className="mou-meta">
                              <strong className="mou-title">{mou.eventTitle}</strong>
                              <div className="mou-sub">
                                Partner: {mou.partnerName} ({mou.country})
                              </div>
                              <div className="mou-sub small">
                                Valid: {new Date(mou.dateOfSigning).toLocaleDateString()} →{" "}
                                {new Date(mou.expiryDate).toLocaleDateString()}
                              </div>
                              <div className="mou-dts small">{mou.dtsNumber}</div>
                            </div>
                          </div>

                          <div className="mou-based">
                            <div className="mou-based-title">
                              <FiLink className="link-inline" /> Agreements based on this MOU ({children.length})
                            </div>

                            <div className="mou-children">
                              {children.map((c) => (
                                <div className="moa-child-card" key={c.id}>
                                  <div className="moa-left">
                                    <FiArrowRight className="arrow-icon" />
                                    <span className="badge moa">MOA</span>
                                  </div>
                                  <div className="moa-body">
                                    <strong className="moa-title">{c.eventTitle}</strong>
                                    <div className="moa-sub small">
                                      Partner: {c.partnerName} ({c.country})
                                    </div>
                                    <div className="moa-sub small">
                                      Source: {c.source}
                                    </div>
                                    <div className="moa-valid small">
                                      Valid: {new Date(c.dateOfSigning).toLocaleDateString()} →{" "}
                                      {new Date(c.expiryDate).toLocaleDateString()}
                                    </div>
                                    <div className="moa-dts small">{c.dtsNumber}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="activeAgreement-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>DTS Number</th>
                        <th>Title</th>
                        <th>Partner</th>
                        <th>Source</th>
                        <th>Expiration Date</th>
                        <th>Days Left</th>
                        <th>Connection</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAgreements.map((a, i) => (
                        <tr key={a.id || i}>
                          <td>
                            <span className={`badge ${a.documentType.toLowerCase()}`}>
                              {a.documentType}
                            </span>
                          </td>

                          <td className="dts-number">{a.dtsNumber}</td>

                          <td>
                            <div>
                              <b>{a.eventTitle}</b>
                              <div className="small">{a.partnershipClassification}</div>
                            </div>
                          </td>

                          <td>
                            <div>
                              <b>{a.partnerName}</b>
                              <div className="small">{a.country}</div>
                            </div>
                          </td>

                          <td>{a.source}</td>

                          <td>{new Date(a.expiryDate).toDateString()}</td>

                          <td>
                            <span className="days-pill">{calculateDaysLeft(a.expiryDate)} days</span>
                          </td>

                          {/* Connection column */}
                          <td className="connection">
                            {a.linkedMouId ? (
                              <a href={`#${a.linkedMouId}`} className="linked">
                                <FiLink className="link-icon" />
                                Linked to MOU
                              </a>
                            ) : a.documentType === "MOA" ? (
                              <span className="independent">Independent</span>
                            ) : (
                              <span className="dash">—</span>
                            )}
                          </td>

                          <td>
                            <button
                              className="icon-btn"
                              onClick={() => setSelectedAgreement(a)}
                              aria-label="View details"
                            >
                              <FiEye className="icon" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button className="page-btn" onClick={prevPage} disabled={currentPage === 1}>
                        Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => {
                        const page = idx + 1;
                        return (
                          <button
                            key={page}
                            className={`page-btn ${page === currentPage ? "active" : ""}`}
                            onClick={() => gotoPage(page)}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        className="page-btn"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nearing Expiration Section */}
            <div className="activeAgreement-expiring">
               <h3>⚠️ Nearing Expiration</h3>
              <p className="subtext">
                These agreements will expire within the next 90 days
              </p>

              {expiringSoon.map((a, i) => (
                <div key={i} className="activeAgreement-expiring-card">
                  <div className="activeAgreement-expiring-header">
                    <span className={`badge ${a.documentType.toLowerCase()}`}>
                      {a.documentType}
                    </span>
                    <h4>{a.eventTitle}</h4>
                    <div className="days-left">
                      <button
                        className="eye-btn"
                        onClick={() => setSelectedAgreement(a)}
                        aria-label="View details"
                      >
                        <FiEye className="icon" />
                      </button>
                      <span>{calculateDaysLeft(a.expiryDate)} days left</span>
                    </div>
                  </div>
                  <p>
                    <b>Partner:</b> {a.partnerName}
                    <br />
                    <b>Expires:</b> {new Date(a.expiryDate).toDateString()}
                    <br />
                    <b>Source:</b> {a.source} • <span>{a.dtsNumber}</span>
                  </p>

                  {a.linkedMouId && (
                    <p className="linked">
                      🔗 Requires MOU:{" "}
                      <span>Business education partnership framework</span>
                      <br />
                      <small>MOU expires: Jan 15, 2028 (814 days)</small>
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Report Generator */}
            <div className="report-generator-card">
              <div className="report-header">
                <div className="report-icon">📄</div>
                <div>
                  <h4>Report Generator</h4>
                  <div className="report-sub">Generate comprehensive reports for agreements in various formats</div>
                </div>
              </div>

              <div className="report-controls">
                <div className="report-select">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    aria-label="Select report type"
                  >
                    <option value="all">All Agreements</option>
                    <option value="mou">MOU</option>
                    <option value="moa">MOA</option>
                    <option value="linked">Linked MOU to MOA</option>
                  </select>
                </div>

                <div className="report-actions">
                  <button
                    className="btn btn-primary btn-print"
                    onClick={generatePrintableReport}
                    aria-label="Generate printable report"
                  >
                    <span className="btn-icon">🖨️</span>
                    <span>Generate Report</span>
                  </button>

                  <button
                    className="btn btn-outline btn-csv"
                    onClick={downloadCSV}
                    aria-label="Download CSV"
                  >
                    <span className="btn-icon">⬇️</span>
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              <div className="report-meta">
                <div>
                  <strong>Selected:</strong> <span className="muted">{reportLabelMap[reportType]}</span>
                </div>
                <div>
                  <strong>Total records:</strong> <span className="muted">{reportItems.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details modal */}
      {selectedAgreement && (
        <div className="agreement-modal-backdrop" onClick={closeModal}>
          <div className="agreement-modal" onClick={(e) => e.stopPropagation()}>
            <header className="agreement-modal-header">
              <div className="modal-badge-row">
                <span className={`badge ${selectedAgreement.documentType.toLowerCase()}`}>
                  {selectedAgreement.documentType}
                </span>
                <h2 className="modal-title">{selectedAgreement.eventTitle}</h2>
              </div>
              <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </header>

            <div className="agreement-modal-body">

              {/* Document Information */}
              <section className="modal-section docinfo">
                <h4>Document Information</h4>
                <div className="row two-col">
                  <div>
                    <div className="label">DTS Number</div>
                    <div className="value mono">{selectedAgreement.dtsNumber}</div>
                  </div>

                  <div>
                    <div className="label">Hardcopy Locator</div>
                    <div className="value">{selectedAgreement.hardcopyLocator || "—"}</div>
                  </div>

                  <div>
                    <div className="label">Entry Date</div>
                    <div className="value">{new Date(selectedAgreement.date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="label">Brief Profile</div>
                <div className="brief">{selectedAgreement.briefProfile}</div>
              </section>

              <section className="modal-section partner">
                <h4>Partner Information</h4>

                <div className="partner-top">
                  <div className="partner-logo">
                    {selectedAgreement.logo ? (
                      <img src={selectedAgreement.logo} alt={`${selectedAgreement.partnerName} logo`} />
                    ) : (
                      <div className="partner-fallback">{getInitials(selectedAgreement.partnerName)}</div>
                    )}
                  </div>

                  <div className="partner-details">
                    <div className="row two-col">
                      <div>
                        <div className="label">Organization</div>
                        <div className="value">{selectedAgreement.partnerName}</div>
                      </div>
                      <div>
                        <div className="label">Country</div>
                        <div className="value">{selectedAgreement.country}</div>
                      </div>
                      <div>
                        <div className="label">Region</div>
                        <div className="value">{selectedAgreement.region}</div>
                      </div>
                      <div>
                        <div className="label">Address</div>
                        <div className="value">{selectedAgreement.address}</div>
                      </div>
                      <div>
                        <div className="label">Website</div>
                        <div className="value"><a href={selectedAgreement.websiteLink} target="_blank" rel="noreferrer">{selectedAgreement.websiteLink}</a></div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="modal-section contacts">
                <h4>Contact Persons</h4>
                <div className="contacts-grid">
                  <div className="contact-card">
                    <div className="contact-role">PUP Point Person</div>
                    <div className="contact-name">{selectedAgreement.pointPerson}</div>
                    <div className="contact-org">{selectedAgreement.source}</div>
                    <a className="contact-email" href={`mailto:${selectedAgreement.pointPersonEmail}`}>{selectedAgreement.pointPersonEmail}</a>
                  </div>

                  <div className="contact-card alt">
                    <div className="contact-role">Partner Contact Person</div>
                    <div className="contact-name">{selectedAgreement.contactPerson}</div>
                    <div className="contact-org">{selectedAgreement.partnerName}</div>
                    <a className="contact-email" href={`mailto:${selectedAgreement.contactPersonEmail}`}>{selectedAgreement.contactPersonEmail}</a>
                  </div>
                </div>
              </section>

              {/* ===== Linked MOU ===== */}
              {linkedAgreement && (
                <section className="modal-section linked-mou">
                  <h4>
                    <span style={{ marginRight: 8 }}>🔗</span> Linked MOU
                  </h4>

                  <div className="linked-mou-card">
                    <div className="linked-mou-left">
                      <span className="badge mou">MOU</span>
                    </div>

                    <div className="linked-mou-body">
                      <strong className="linked-mou-title">{linkedAgreement.eventTitle}</strong>
                      <div className="small linked-mou-sub">{linkedAgreement.partnershipClassification}</div>
                      <div className="small linked-mou-valid">
                        Valid until: {new Date(linkedAgreement.expiryDate).toLocaleDateString()}
                      </div>
                      <div className="linked-mou-dts small">{linkedAgreement.dtsNumber}</div>
                    </div>
                  </div>
                </section>
              )}

              {/* Agreement Timeline */}
              <section className="modal-section timeline">
                <h4>Agreement Timeline</h4>
                <div className="row two-col">
                  <div>
                    <div className="label">Date of Signing</div>
                    <div className="value">{new Date(selectedAgreement.dateOfSigning).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="label">Expiry Date</div>
                    <div className="value">{new Date(selectedAgreement.expiryDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="label">Validity Period</div>
                    <div className="value">{selectedAgreement.validityPeriod} years</div>
                  </div>
                  <div>
                    <div className="label">Status</div>
                    <div className="value status-pill">{selectedAgreement.status === "expiring-soon" ? "Expiring soon" : "Active"}</div>
                  </div>
                </div>
              </section>

              <section className="modal-section remarks">
                <div className="label">Remarks</div>
                <div className="brief">{selectedAgreement.remarks || "—"}</div>
              </section>
            </div>

            <footer className="agreement-modal-footer">
              {!isModalEdit ? (
                <>
                  <button className="btn edit" onClick={startModalEdit}>✎ Edit</button>
                </>
              ) : (
                <div style={{ width: "100%" }} className="modal-edit-panel">
                  <div className="row two-col" style={{ gap: 12, alignItems: "flex-start" }}>
                    <div>
                      <div className="label">Hardcopy Locator</div>
                      <input
                        className="edit-input"
                        value={editForm.hardcopyLocator}
                        onChange={(e) => setEditForm({ ...editForm, hardcopyLocator: e.target.value })}
                        placeholder="Enter hardcopy locator"
                      />
                    </div>

                    <div>
                      <div className="label">Remarks</div>
                      <textarea
                        className="edit-textarea"
                        rows={3}
                        value={editForm.remarks}
                        onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                        placeholder="Enter remarks"
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
                    <button className="btn save" onClick={saveModalEdits}>Save</button>
                    <button className="btn cancel" onClick={cancelModalEdit}>Cancel</button>
                  </div>
                </div>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveAgreement;
