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

  // New states for editing functionality
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [savingRows, setSavingRows] = useState(new Set());
  const [deletingRows, setDeletingRows] = useState(new Set());

  const rowsPerPage = 20;

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

  // Start editing a specific row
  const startEditing = (agreement) => {
    setEditingRow(agreement.agreement_id);
    setEditedData({ ...agreement });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingRow(null);
    setEditedData({});
  };

  // Handle input changes in edit mode
  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const deleteRow = async (agreementId) => {
      const proceed = window.confirm('Are you sure you want to delete this agreement? This action cannot be undone.');
      if (!proceed) return;

      try {
        setDeletingRows(prev => new Set(prev).add(agreementId));

        await agreementService.deleteAgreement(agreementId);

        // Remove from local state
        setAgreements(prev => prev.filter(a => a.agreement_id !== agreementId));
        setFilteredAgreements(prev => prev.filter(a => a.agreement_id !== agreementId));

        // Clear edit state if the deleted row was being 
        if (editingRow === agreementId) {
          setEditingRow(null);
          setEditedData({});
        }

        alert('Agreement deleted successfully.');
      } catch (err) {
        console.error('Error deleting agreement:', err);
        alert('Failed to delete agreement: ' + err.message);
      } finally {
        setDeletingRows(prev => {
          const s = new Set(prev);
          s.delete(agreementId);
          return s;
        });
      }
    };


  // Save changes to a specific row
  const saveRow = async (agreementId) => {
    try {
      setSavingRows(prev => new Set(prev).add(agreementId));

      // Update the agreement
      await agreementService.updateAgreement(agreementId, editedData);

      // Update local state
      setAgreements(prev => prev.map(agreement =>
        agreement.agreement_id === agreementId ? editedData : agreement
      ));
      setFilteredAgreements(prev => prev.map(agreement =>
        agreement.agreement_id === agreementId ? editedData : agreement
      ));

      setEditingRow(null);
      setEditedData({});

      // Show success message (put css here frontend!!)
      alert('Agreement updated successfully!');

    } catch (error) {
      console.error('Error saving agreement:', error);
      alert('Failed to save changes: ' + error.message);
    } finally {
      setSavingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(agreementId);
        return newSet;
      });
    }
  };

  // Helper functions for list editing -WIPPP
  const upsertListItem = (field, idx, key, val) => {
    setEditedData(prev => {
      const list = Array.isArray(prev[field]) ? [...prev[field]] : [];
      const item = { ...(list[idx] || {}) };
      item[key] = val;
      list[idx] = item;
      return { ...prev, [field]: list };
    });
  };

  const addListItem = (field, template) => {
    setEditedData(prev => {
      const list = Array.isArray(prev[field]) ? [...prev[field]] : [];
      return { ...prev, [field]: [...list, template] };
    });
  };

  const removeListItem = (field, idx) => {
    setEditedData(prev => {
      const list = Array.isArray(prev[field]) ? [...prev[field]] : [];
      list.splice(idx, 1);
      return { ...prev, [field]: list };
    });
  };

  // Render editable cell
  const renderEditableCell = (agreement, field, value) => {
    const isEditing = editingRow === agreement.agreement_id;

    const editableFields = [
      'entry_date', 'unit_name', 'dts_number', 'dts_status',
      'name', 'entity_type', 'country', 'region', 'address', 'signatories_list','partnership_type',
      'contact_persons', 'document_type', 'partnership_type', 'event_info',
      'validity_period', 'date_signed', 'date_expiry', 'date_received',
      'date_endorsed_to_ulco', 'date_ulco_approved', 'date_signed_by_pup',
      'agreement_status', 'website_url', 'description', 'hardcopy_location', 'remarks'
    ];

    const isEditable = editableFields.includes(field);

    // Display/edit for POINT PERSONS
    if (field === 'point_persons') {
      if (!isEditing) {
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div>
              {value.map((pp, idx) => (
                <div key={idx}>
                  {pp.point_person_position}: {pp.point_person_name} ({pp.point_person_email})
                </div>
              ))}
            </div>
          );
        }
        return '-';
      }

      const list = Array.isArray(editedData.point_persons) && editedData.point_persons.length > 0
        ? editedData.point_persons
        : [{ point_person_position: '', point_person_name: '', point_person_email: '' }];

      return (
        <div className="list-editor">
          {list.map((pp, idx) => (
            <div key={idx} className="list-row" style={{ marginBottom: '8px', display: 'flex', gap: '4px' }}>
              <input
                type="text"
                className="edit-input"
                placeholder="Position"
                style={{ flex: 1, minWidth: '80px' }}
                value={pp.point_person_position || ''}
                onChange={(e) => upsertListItem('point_persons', idx, 'point_person_position', e.target.value)}
              />
              <input
                type="text"
                className="edit-input"
                placeholder="Name"
                style={{ flex: 1, minWidth: '100px' }}
                value={pp.point_person_name || ''}
                onChange={(e) => upsertListItem('point_persons', idx, 'point_person_name', e.target.value)}
              />
              <input
                type="email"
                className="edit-input"
                placeholder="Email"
                style={{ flex: 1, minWidth: '120px' }}
                value={pp.point_person_email || ''}
                onChange={(e) => upsertListItem('point_persons', idx, 'point_person_email', e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => removeListItem('point_persons', idx)}
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addListItem('point_persons', { point_person_position: '', point_person_name: '', point_person_email: '' })}
            style={{ padding: '4px 8px', fontSize: '12px', marginTop: '4px' }}
          >
            + Add
          </button>
        </div>
      );
    }

    // Display/edit for CONTACT PERSONS
    if (field === 'contact_persons') {
      if (!isEditing) {
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div>
              {value.map((cp, idx) => (
                <div key={idx}>
                  {cp.contact_person_position}: {cp.contact_person_name} ({cp.contact_person_email})
                </div>
              ))}
            </div>
          );
        }
        return '-';
      }

      const list = Array.isArray(editedData.contact_persons) && editedData.contact_persons.length > 0
        ? editedData.contact_persons
        : [{ contact_person_position: '', contact_person_name: '', contact_person_email: '' }];

      return (
        <div className="list-editor">
          {list.map((cp, idx) => (
            <div key={idx} className="list-row" style={{ marginBottom: '8px', display: 'flex', gap: '4px' }}>
              <input
                type="text"
                className="edit-input"
                placeholder="Position"
                style={{ flex: 1, minWidth: '80px' }}
                value={cp.contact_person_position || ''}
                onChange={(e) => upsertListItem('contact_persons', idx, 'contact_person_position', e.target.value)}
              />
              <input
                type="text"
                className="edit-input"
                placeholder="Name"
                style={{ flex: 1, minWidth: '100px' }}
                value={cp.contact_person_name || ''}
                onChange={(e) => upsertListItem('contact_persons', idx, 'contact_person_name', e.target.value)}
              />
              <input
                type="email"
                className="edit-input"
                placeholder="Email"
                style={{ flex: 1, minWidth: '120px' }}
                value={cp.contact_person_email || ''}
                onChange={(e) => upsertListItem('contact_persons', idx, 'contact_person_email', e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => removeListItem('contact_persons', idx)}
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addListItem('contact_persons', { contact_person_position: '', contact_person_name: '', contact_person_email: '' })}
            style={{ padding: '4px 8px', fontSize: '12px', marginTop: '4px' }}
          >
            + Add
          </button>
        </div>
      );
    }

    // Display/edit for REMARKS
    if (field === 'remarks') {
      if (!isEditing) {
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div>
              {value.map((r, idx) => (
                <div key={idx}>{r.remark_text}</div>
              ))}
            </div>
          );
        }
        return '-';
      }

      const list = Array.isArray(editedData.remarks) && editedData.remarks.length > 0
        ? editedData.remarks
        : [{ remark_text: '' }];

      return (
        <div className="list-editor">
          {list.map((r, idx) => (
            <div key={idx} className="list-row" style={{ marginBottom: '8px', display: 'flex', gap: '4px' }}>
              <input
                type="text"
                className="edit-input"
                placeholder="Remark"
                style={{ flex: 1 }}
                value={r.remark_text || ''}
                onChange={(e) => upsertListItem('remarks', idx, 'remark_text', e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => removeListItem('remarks', idx)}
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addListItem('remarks', { remark_text: '' })}
            style={{ padding: '4px 8px', fontSize: '12px', marginTop: '4px' }}
          >
            + Add
          </button>
        </div>
      );
    }

    // Generic display (not editing or not editable)
    if (!isEditable || !isEditing) {
      return value || '-';
    }

    // Special handling for different field types
    if (field === 'agreement_status') {
      return (
        <select
          value={editedData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="edit-input"
        >
          <option value="">Select Status</option>
          <option value="Endorse">Endorse to ULCO</option>
          <option value="Revert">Revert to Initiator</option>
          <option value="Replication">For Replication</option>
          <option value="SignituresPUP">For Signature of PUP Official</option>
          <option value="SignedPUP">Signed by PUP Official</option>
          <option value="SignituresPartner">For Signature of Partners</option>
          <option value="Complete">Complete</option>
          <option value="Notary">For Notary</option>
          <option value="FFUPCopy">To FFUP Copy</option>
          <option value="Renewal">Renewals</option>
        </select>
      );
    } else if (field === 'document_type') {
      return (
        <select
          value={editedData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="edit-input"
        >
          <option value="">Select Type</option>
          <option value="MOA">MOA</option>
          <option value="MOU">MOU</option>
        </select>
      );
    } else if (field.includes('date')) {
      return (
        <input
          type="date"
          value={editedData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="edit-input"
        />
      );
    } else {
      return (
        <input
          type="text"
          value={editedData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="edit-input"
          placeholder={`Enter ${field.replace('_', ' ')}`}
        />
      );
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
                  <tr key={agreement.agreement_id}
                    className={editingRow === agreement.agreement_id ? 'editing-row' : ''}>
                    <td>{renderEditableCell(agreement, 'entry_date', agreement.entry_date)}</td>
                    <td>{renderEditableCell(agreement, 'unit_name', agreement.unit_name)}</td>
                    <td>{renderEditableCell(agreement, 'point_persons', agreement.point_persons)}</td>
                    <td>{renderEditableCell(agreement, 'dts_number', agreement.dts_number)}</td>
                    <td>{renderEditableCell(agreement, 'dts_status', agreement.dts_status)}</td>
                    <td>{renderEditableCell(agreement, 'name', agreement.name)}</td>
                    <td>{renderEditableCell(agreement, 'entity_type', agreement.entity_type)}</td>
                    <td>{renderEditableCell(agreement, 'country', agreement.country)}</td>
                    <td>{renderEditableCell(agreement, 'region', agreement.region)}</td>
                    <td>{renderEditableCell(agreement, 'address', agreement.address)}</td>
                    <td>{renderEditableCell(agreement, 'signatories_list', agreement.signatories_list)}</td>
                    <td>{renderEditableCell(agreement, 'contact_persons', agreement.contact_persons)}</td>
                    <td>{renderEditableCell(agreement, 'document_type', agreement.document_type)}</td>
                    <td>{renderEditableCell(agreement, 'partnership_type', agreement.partnership_type)}</td>
                    <td>{renderEditableCell(agreement, 'event_info', agreement.event_info)}</td>
                    <td>{renderEditableCell(agreement, 'validity_period', agreement.validity_period)}</td>
                    <td>{renderEditableCell(agreement, 'date_signed', agreement.date_signed)}</td>
                    <td>{renderEditableCell(agreement, 'date_expiry', agreement.date_expiry)}</td>
                    <td>{renderEditableCell(agreement, 'date_received', agreement.date_received)}</td>
                    <td>{renderEditableCell(agreement, 'date_endorsed_to_ulco', agreement.date_endorsed_to_ulco)}</td>
                    <td>{renderEditableCell(agreement, 'date_ulco_approved', agreement.date_ulco_approved)}</td>
                    <td>{renderEditableCell(agreement, 'date_signed_by_pup', agreement.date_signed_by_pup)}</td>
                    <td>{renderEditableCell(agreement, 'agreement_status', agreement.agreement_status)}</td>
                    <td>
                      {editingRow === agreement.agreement_id ?
                        renderEditableCell(agreement, 'website_url', agreement.website_url) :
                        (agreement.website_url ? (
                          <a href={agreement.website_url} target="_blank" rel="noopener noreferrer">
                            Link
                          </a>
                        ) : '-')
                      }
                    </td>
                    <td>{renderEditableCell(agreement, 'description', agreement.description)}</td>
                    <td>{agreement.logo_url ? (
                      <a href={agreement.logo_url} target="_blank" rel="noopener noreferrer">
                        View Logo
                      </a>
                    ) : '-'}</td>
                    <td>{renderEditableCell(agreement, 'hardcopy_location', agreement.hardcopy_location)}</td>
                    <td>{renderEditableCell(agreement, 'remarks', agreement.remarks)}</td>
                    <td>
                      <div className="action-buttons">
                        {editingRow === agreement.agreement_id ? (
                          // Show Save/Cancel buttons when editing
                          <>
                            <button
                              className="btn-action save"
                              onClick={() => saveRow(agreement.agreement_id)}
                              disabled={savingRows.has(agreement.agreement_id)}
                            >
                              {savingRows.has(agreement.agreement_id) ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              className="btn-action cancel"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          // Show Edit/Delete buttons when not editing
                          <>
                            <button
                              className="btn-action"
                              onClick={() => startEditing(agreement)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-action delete"
                              onClick={() => deleteRow(agreement.agreement_id)}
                              disabled={deletingRows.has(agreement.agreement_id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
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
