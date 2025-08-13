import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineManageHistory } from 'react-icons/md';
import { agreementService } from '../services/agreementService';
import './overviewDash.css';

const OverviewDash = () => {
  const navigate = useNavigate();
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAudit, setShowAudit] = useState(false);
  const [agreements, setAgreements] = useState([]);
  const [filteredAgreements, setFilteredAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    documentType: '',
    partnershipType: '',
    validityPeriod: '',
    country: ''
  });
  const rowsPerPage = 10;

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      const data = await agreementService.getAgreements();
      setAgreements(data);
      setFilteredAgreements(data);
    } catch (err) {
      setError('Failed to fetch agreements: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = useCallback(() => {
    let data = agreements;

    if (selectedStatus) {
      data = data.filter(a => a.agreement_status === selectedStatus);
    }

    if (searchTerm.trim() !== '') {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(a =>
        Object.values(a).some(val =>
          val && val.toString().toLowerCase().includes(lowerTerm)
        )
      );
    }

    setFilteredAgreements(data);
    setCurrentPage(1);
  }, [agreements, searchTerm, selectedStatus]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const filterByStatus = (status) => {
    if (selectedStatus === status) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(status);
    }
  };

  const applyIndependentFilter = () => {
    let data = agreements;
    if (filters.documentType) {
      data = data.filter(a => a.document_type === filters.documentType);
    }
    if (filters.partnershipType) {
      data = data.filter(a => a.partnership_type === filters.partnershipType);
    }
    if (filters.validityPeriod) {
      data = data.filter(a => a.validity_period === filters.validityPeriod);
    }
    if (filters.country) {
      data = data.filter(a => a.country === filters.country);
    }
    setFilteredAgreements(data);
    setCurrentPage(1);
  };

  const clearIndependentFilter = () => {
    setFilters({ documentType: '', partnershipType: '', validityPeriod: '', country: '' });
    setFilteredAgreements(agreements);
    setCurrentPage(1);
  };

  const stats = [
    { label: 'Total Agreement', count: agreements.length, route: '/stat/totalAgreement' },
    { label: 'Active Agreement', count: agreements.filter(a => a.agreement_status !== 'Complete').length, route: '/stat/activeAgreement' },
    { label: 'Expired Agreement', count: agreements.filter(a => new Date(a.date_expiry) < new Date()).length, route: '/stat/expiredAgreement' },
    { label: 'Nearing Expiration', count: agreements.filter(a => a.date_expiry && new Date(a.date_expiry) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length, route: '/stat/nearExpAgreement' }
  ];

  const lifecycleStages = [
    { label: 'Endorse to ULCO', status: 'Endorse' },
    { label: 'Revert to Initiator', status: 'Revert' },
    { label: 'For Replication', status: 'Replication' },
    { label: 'For Signature of PUP Official', status: 'SignituresPUP' },
    { label: 'Signed by PUP Official', status: 'SignedPUP' },
    { label: 'For Signature of Partners', status: 'SignituresPartner' },
    { label: 'Signed by Partners', status: 'Complete' },
    { label: 'Completely Signed', status: 'Complete' },
    { label: 'For Notary', status: 'Notary' },
    { label: 'To FFUP Copy', status: 'FFUPCopy' },
    { label: 'Renewals', status: 'Renewal' }
  ].map(stage => ({
    ...stage,
    count: agreements.filter(a => a.agreement_status === stage.status).length
  }));

  const tableColumns = [
    'Date', 'SOURCE', 'POINT PERSON / POSITION', 'DTS NO.', 'DTS LOCATION',
    "PARTNER'S NAME", 'ENTITY TYPE', 'COUNTRY', 'REGION', 'ADDRESS',
    'SIGNATORIES / POSITION', 'CONTACT PERSON / DETAILS', 'DOCUMENT TYPE',
    'PARTNERSHIP CLASSIFICATION', 'EVENT TITLE / OTHER IMPT INFO ABOUT AGREEMENT',
    'VALIDITY PERIOD', 'DATE / YEAR OF SIGNING', 'EXPIRY DATE / YEAR',
    'DATE RECEIVED', 'DATE ENDORSED TO ULCO', "ULCO'S APPROVAL",
    "PUP OFFICIALS' SIGNATURE", 'STATUS', 'WEBSITE LINK',
    'Brief Profile', 'LOGO', 'HARDCOPY LOCATOR', 'REMARKS', 'ACTIONS'
  ];

  const totalPages = Math.ceil(filteredAgreements.length / rowsPerPage);
  const paginatedData = filteredAgreements.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading) return <div className="overview-container">Loading agreements...</div>;
  if (error) return <div className="overview-container">Error: {error}</div>;

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
            <div
              key={i}
              className={`lifecycle-box ${selectedStatus === stage.status ? 'active' : ''}`}
              onClick={() => filterByStatus(stage.status)}
            >
              <div className="count">{stage.count}</div>
              <div className="label">{stage.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="table-section">
        <div className="table-header">
          <div className="search-audit-wrapper">
            <input
              type="text"
              placeholder="Search here"
              className="search-box"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="audit-icon-wrapper" onClick={toggleAudit} title="View Audit Log">
              <MdOutlineManageHistory className="audit-icon" />
            </div>
          </div>
          <div className="table-actions">
            <button className="btn">Freeze</button>
            <button className="btn" onClick={() => setShowFilterPanel(!showFilterPanel)}>Filter</button>
            <button className="btn btn-generate">Generate</button>
          </div>
        </div>

        {showFilterPanel && (
          <div className="filter-panel">
            <label>
              Document Type:
              <select
                value={filters.documentType}
                onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}
              >
                <option value="">All</option>
                {[...new Set(agreements.map(a => a.document_type).filter(Boolean))].map((type, i) => (
                  <option key={i} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              Partnership Classification:
              <select
                value={filters.partnershipType}
                onChange={(e) => setFilters({ ...filters, partnershipType: e.target.value })}
              >
                <option value="">All</option>
                {[...new Set(agreements.map(a => a.partnership_type).filter(Boolean))].map((type, i) => (
                  <option key={i} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label>
              Validity Period:
              <select
                value={filters.validityPeriod}
                onChange={(e) => setFilters({ ...filters, validityPeriod: e.target.value })}
              >
                <option value="">All</option>
                {[...new Set(agreements.map(a => a.validity_period).filter(Boolean))].map((vp, i) => (
                  <option key={i} value={vp}>{vp}</option>
                ))}
              </select>
            </label>

            <label>
              Country:
              <select
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              >
                <option value="">All</option>
                {[...new Set(agreements.map(a => a.country).filter(Boolean))].map((country, i) => (
                  <option key={i} value={country}>{country}</option>
                ))}
              </select>
            </label>

            <div className="filter-actions">
              <button onClick={applyIndependentFilter}>Apply</button>
              <button onClick={clearIndependentFilter}>Clear</button>
            </div>
          </div>
        )}

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
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length} style={{ textAlign: 'center' }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((agreement, rowIndex) => (
                  <tr key={agreement.agreement_id}>
                    <td>{agreement.entry_date || '-'}</td>
                    <td>{agreement.unit_name}</td>
                    <td>{agreement.point_persons_list || '-'}</td>
                    <td>{agreement.dts_number}</td>
                    <td>{agreement.dts_status}</td>
                    <td>{agreement.name}</td>
                    <td>{agreement.entity_type || '-'}</td>
                    <td>{agreement.country || '-'}</td>
                    <td>{agreement.region || '-'}</td>
                    <td>{agreement.address || '-'}</td>
                    <td>{agreement.signatories_list || '-'}</td>
                    <td>
                      {agreement.contact_persons && agreement.contact_persons.length > 0
                        ? agreement.contact_persons.map(cp =>
                            `${cp.contact_person_position},${cp.contact_person_name}, ${cp.contact_person_email}`
                          ).join(' | ')
                        : '-'}
                    </td>
                    <td>{agreement.document_type}</td>
                    <td>{agreement.partnership_type || '-'}</td>
                    <td>{agreement.event_info || '-'}</td>
                    <td>{agreement.validity_period || '-'}</td>
                    <td>{agreement.date_signed || '-'}</td>
                    <td>{agreement.date_expiry || '-'}</td>
                    <td>{agreement.date_received || '-'}</td>
                    <td>{agreement.date_endorsed_to_ulco || '-'}</td>
                    <td>{agreement.date_ulco_approved || '-'}</td>
                    <td>{agreement.date_signed_by_pup || '-'}</td>
                    <td>{agreement.agreement_status}</td>
                    <td>
                      {agreement.website_url ? (
                        <a href={agreement.website_url} target="_blank" rel="noopener noreferrer">
                          Link
                        </a>
                      ) : '-'}
                    </td>
                    <td>{agreement.description || '-'}</td>
                    <td>{agreement.logo_url ? (
                      <a href={agreement.logo_url} target="_blank" rel="noopener noreferrer">
                        View Logo
                      </a>
                    ) : '-'}</td>
                    <td>{agreement.hardcopy_location || '-'}</td>
                    <td>
                      {agreement.remarks && agreement.remarks.length > 0
                        ? agreement.remarks.map(remark => remark.remark_text).join(' | ')
                        : '-'}
                    </td>
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
                ))
              )}
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
          <button className="btn-add" onClick={() => navigate('/upload/manualEntryMoa')}> + Add Document</button>
        </div>
      </div>
    </div>
  );
};

export default OverviewDash;
