import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineManageHistory } from 'react-icons/md';
import './overviewDash.css';

const OverviewDash = () => {
  const navigate = useNavigate();
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAudit, setShowAudit] = useState(false);
  const rowsPerPage = 5;

  const toggleMenu = (index) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };

  const toggleAudit = () => {
    setShowAudit(!showAudit);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setOpenMenuIndex(null);
  };

  const stats = [
    { label: 'Total Agreement', count: 2020, route: '/stat/totalAgreement' },
    { label: 'Active Agreement', count: 120, route: '/stat/activeAgreement' },
    { label: 'Expired Agreement', count: 90, route: '/stat/expiredAgreement' },
    { label: 'Nearing Expiration', count: 12, route: '/stat/nearExpAgreement' }
  ];

  const lifecycleStages = [
    { label: 'Endorse to ULCO', count: 5, route: '/lifecycle/ulco' },
    { label: 'Revert to Initiator', count: 3 , route: '/lifecycle/revertIni'},
    { label: 'For Replication', count: 2, route: '/lifecycle/replication' },
    { label: 'For Signature of PUP Official', count: 3, route: '/lifecycle/forSignPup' },
    { label: 'Signed by PUP Official', count: 4, route: '/lifecycle/ulco' },
    { label: 'For Signature of Partners', count: 6, route: '/lifecycle/forSignPartner' },
    { label: 'Signed by Partners', count: 1, route: '/lifecycle/signedPartners' },
    { label: 'Completely Signed', count: 2, route: '/lifecycle/completelySigned' },
    { label: 'For Notary', count: 0, route: '/lifecycle/notary' },
    { label: 'To FFUP Copy', count: 2, route: '/lifecycle/FFUPCopy' },
    { label: 'Renewals', count: 1, route: '/lifecycle/renewals' }
  ];

  const tableColumns = [
    'Date', 'SOURCE', 'POINT PERSON / POSITION', 'DTS NO.', 'DTS LOCATION',
    "PARTNER'S NAME", 'ENTITY TYPE', 'COUNTRY', 'Region', 'ADDRESS',
    'SIGNATORIES / POSITION', 'CONTACT PERSON / DETAILS', 'DOCUMENT TYPE',
    'PARTNERSHIP CLASSIFICATION', 'EVENT TITLE / OTHER IMPT INFO ABOUT AGREEMENT',
    'VALIDITY PERIOD', 'DATE / YEAR OF SIGNING', 'EXPIRY DATE / YEAR',
    'DATE RECEIVED', 'DATE ENDORSED TO ULCO', "ULCO'S APPROVAL",
    "PUP OFFICIALS' SIGNATURE", 'REMARKS', 'STATUS', 'WEBSITE LINK',
    'Brief Profile', 'LOGO', 'HARDCOPY LOCATOR', 'ACTIONS'
  ];

  const tableData = Array(8).fill({
    date: '07/22/25',
    source: 'CTHTM',
    pointPerson: 'Dean Vergara / Chair Trinidad',
    dtsNo: 'DT2025004623',
    dtsLocation: 'Office A',
    partner: 'ABC University',
    entity: 'University',
    country: 'Philippines',
    region: 'NCR',
    address: '123 University Ave.',
    signatories: 'Dr. A / Mr. B',
    contact: 'contact@abc.edu',
    docType: 'MOU',
    classification: 'Academic',
    event: 'Student Exchange 2025',
    validity: '2025-2028',
    signingDate: '07/21/25',
    expiry: '07/21/28',
    received: '07/20/25',
    endorsed: '07/21/25',
    approval: '07/21/25',
    pupSign: 'VP Academic Affairs',
    remarks: 'Ongoing',
    status: 'Open - OIA',
    link: 'http://abc.edu',
    profile: 'Top-ranked SEA university',
    logo: 'Logo.png',
    locator: 'Cabinet A - Shelf 2'
  });

  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const paginatedData = tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="overview-container">
      <div className="stats-row">
        {stats.map((s, i) => (
          <button key={i} className="stat-card" onClick={() => navigate(s.route)}>
            <div className="stat-number">{s.count}</div>
            <div className="stat-label">{s.label}</div>
          </button>
        ))}
      </div>

      <div className="lifecycle-section">
        <h3>Lifecycle Agreement</h3>
        <div className="lifecycle-bar">
          {lifecycleStages.map((stage, i) => (
            <div key={i} className="lifecycle-box" onClick={() => navigate(stage.route)}>
              <div className="count">{stage.count}</div>
              <div className="label">{stage.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="table-section">
      <div className="table-header">
        <div className="search-audit-wrapper">
          <input type="text" placeholder="Search here" className="search-box" />
          <div className="audit-icon-wrapper" onClick={toggleAudit} title="View Audit Log">
            <MdOutlineManageHistory className="audit-icon" />
          </div>
        </div>
        <div className="table-actions">
          <button className="btn">Freeze</button>
          <button className="btn">Filter</button>
          <button className="btn btn-generate">Generate</button>
        </div>
      </div>

        <div className="table-scroll">
          <table className="document-table">
            <thead>
              <tr>
                {tableColumns.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.values(row).map((value, i) => (
                    <td key={i}>{value}</td>
                  ))}
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action">Edit</button>
                      <button className="btn-action delete">Delete</button>
                      <div className="menu-wrapper">
                        <button
                          className="dots-btn"
                          onClick={() => toggleMenu(rowIndex)}
                          title="More actions"
                        >
                          &#8942;
                        </button>
                        {openMenuIndex === rowIndex && (
                          <div className="dropdown-menu">
                            <div>View File</div>
                            <div>View Older File</div>
                            <div>Upload New File</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            &laquo; Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={currentPage === i + 1 ? 'active' : ''}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next &raquo;
          </button>
        </div>

        <div className="table-footer">
          <button className="btn-add">+ Add Document</button>
        </div>
      </div>
    </div>
  );
};

export default OverviewDash;
