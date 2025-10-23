import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { agreementService } from '../services/agreementService';
import { documentService } from '../services/documentService';
import './overviewDash.css';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const OverviewDash = () => {
  const navigate = useNavigate();
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [agreements, setAgreements] = useState([]);
  const [filteredAgreements, setFilteredAgreements] = useState([]);
  const [statFilter, setStatFilter] = useState('OPEN');
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

  const rowsPerPage = 10;

  useEffect(() => {
    fetchAgreements();
  }, []);

const fetchAgreements = async () => {
  try {
    const data = await agreementService.getAgreements();
    console.log("Fetched agreements:", data);
    setAgreements(data);
    setFilteredAgreements(data);
  } catch (err) {
    console.error(err);
    setError("Failed to fetch agreements: " + err.message);
  } finally {
    setLoading(false);
  }
};

const [dateSortOrder, setDateSortOrder] = useState(null);

const handleDateSort = () => {
  const newOrder = dateSortOrder === 'asc' ? 'desc' : 'asc';
  setDateSortOrder(newOrder);

  const sorted = [...filteredAgreements].sort((a, b) => {
    const dateA = new Date(a.entry_date);
    const dateB = new Date(b.entry_date);
    return newOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });
  setFilteredAgreements(sorted);
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

  const handleViewLatestFile = async (dtsNumber) => {
    try {
      const latest = await documentService.getLatestVersion(dtsNumber);
      if (!latest) {
        alert("No document versions found for this DTS number.");
        return;
      }

      // fetch the signed url, get blob, then open
      const resp = await fetch(latest.download_url, { headers: { Accept: "application/pdf" } });
      if (!resp.ok) throw new Error(`Failed to fetch file (${resp.status})`);
      const blob = await resp.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
      // optional: revoke after a short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error("View failed:", err);
      alert("Failed to open file: " + (err.message || err));
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
      'entry_date', 'source_unit', 'dts_number', 'dts_status', 'agreement_status',
      'name', 'entity_type', 'country', 'region', 'address', 'signatories_list','partnership_type',
      'contact_persons', 'document_type', 'partnership_type', 'event_info',
      'validity_period', 'date_signed', 'date_expiry', 'date_received',
      'date_endorsed_to_ulco', 'date_ulco_approved', 'date_signed_by_pup',
      'agreement_status', 'website_url', 'description', 'hardcopy_location', 'remarks'
    ];

    const isEditable = editableFields.includes(field);

      if (field === 'document_type' && !isEditing) {
    const getDocumentTypeClass = (docType) => {
      switch (docType?.toUpperCase()) {
        case 'MOA':
          return 'document-type-badge document-type-moa';
        case 'MOU':
          return 'document-type-badge document-type-mou';
        default:
          return 'document-type-badge document-type-default';
      }
    };

    return (
      <span className={getDocumentTypeClass(value)}>
        {value || '-'}
      </span>
    );
  }
  
    if (field === 'logo_path') {
      if (!isEditing) {
        return value ? (
          <img
            src={`data:image/png;base64,${value}`}
            alt="Partner Logo"
            style={{ width: "80px", height: "80px", objectFit: "contain" }}
          />
        ) : (
          "-"
        );
      }

      return (
        <div>
          {editedData.logo_path ? (
            <img
              src={`data:image/png;base64,${editedData.logo_path}`}
              alt="Partner Logo"
              style={{ width: "80px", height: "80px", objectFit: "contain" }}
            />
          ) : (
            <span>No logo uploaded</span>
          )}

          <input
            type="file"
            accept="image/*"
            style={{
              marginTop: "8px",
              width: "120px",
              padding: "2px 4px",
              fontSize: "12px",
            }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              // Check size
              if (file.size > 2 * 1024 * 1024) {
                alert("Logo file is too large. Maximum size is 2MB.");
                return;
              }

              // Read as base64
              const reader = new FileReader();
              reader.onload = () => {
                const base64String = reader.result.split(",")[1]; // remove "data:image/png;base64,"

                // Just update your local state
                handleInputChange("logo_path", base64String);
              };
              reader.readAsDataURL(file);
            }}
          />

        </div>
      );
    }
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
        <option value="InitialReview">Initial Review</option>
        <option value="Endorse">Endorse to ULCO for Review and Approval</option>
        <option value="Revert">Revert To Initiator with Comments</option>
        <option value="Consultation">For Consultation</option>
        <option value="Replication">Replication of Copies (8 sets)</option>
        <option value="SignituresPUP">For Signatures of PUP Officials</option>
        <option value="SignedPUP">Signed by PUP Officials</option>
        <option value="SignituresPartner">For Signatures of Partner</option>
        <option value="SignedPartner">Signed by Partner Institution</option>
        <option value="Complete">Completely Signed</option>
        <option value="Notary">For Notary</option>
        <option value="FFUPCopy">FFUP Copy From College/Campus</option>
        <option value="Active">Active</option>
        <option value="Withdrawn">Withdrawn</option>
      </select>
    );
    } else if (field === 'dts_status') {
      return (
        <select
          value={editedData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="edit-input"
        >
          <option value="">Select Status</option>
          <option value="Open - OIA">Open</option>
          <option value="Open - Other Office">Close</option>
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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setOpenMenuIndex(null);
  };

const handleSearch = useCallback(() => {
  let data = agreements;

  // Exclude Active and Withdrawn
  data = data.filter(a =>
    a.agreement_status !== "Active" &&
    a.agreement_status !== "Withdrawn"
  );

  // Filter by statFilter
  if (statFilter) {
    switch (statFilter) {
      case 'OPEN':
        data = data.filter(a => a.dts_status === 'Open - OIA');
        break;
      case 'CLOSE':
        data = data.filter(a => a.dts_status === 'Open - Other Office');
        break;
      default:
        break;
    }
  }

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
}, [agreements, searchTerm, selectedStatus, statFilter]);

useEffect(() => {
  handleSearch();
}, [handleSearch, statFilter]);

  const filterByStatus = (status) => {
    if (selectedStatus === status) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(status);
    }
  };

const applyIndependentFilter = () => {
  let data = agreements;

  // Exclude Active and Withdrawn
  data = data.filter(a =>
    a.agreement_status !== "Active" &&
    a.agreement_status !== "Withdrawn"
  );

  // Always filter by statFilter first
  if (statFilter) {
    switch (statFilter) {
      case 'OPEN':
        data = data.filter(a => a.dts_status === 'Open - OIA');
        break;
      case 'CLOSE':
        data = data.filter(a => a.dts_status === 'Open - Other Office');
        break;
      default:
        break;
    }
  }

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
};

const stats = [
  { 
    label: 'OPEN', 
    count: agreements.filter(a => 
      a.dts_status === 'Open - OIA' &&
      a.agreement_status !== 'Active' &&
      a.agreement_status !== 'Withdrawn'
    ).length 
  },
  { 
    label: 'CLOSE', 
    count: agreements.filter(a => 
      a.dts_status === 'Open - Other Office' &&
      a.agreement_status !== 'Active' &&
      a.agreement_status !== 'Withdrawn'
    ).length 
  },
];
  
const filteredForLifecycle = agreements.filter(a => {
  // Exclude Active and Withdrawn
  if (a.agreement_status === "Active" || a.agreement_status === "Withdrawn") return false;
  switch (statFilter) {
    case 'OPEN':
      return a.dts_status === 'Open - OIA';
    case 'CLOSE':
      return a.dts_status === 'Open - Other Office';
    default:
      return true;
  }
});

const lifecycleStages = [
  { label: 'Initial Review', status: 'InitialReview' },
  { label: 'Endorse to ULCO', status: 'Endorse' },
  { label: 'Revert to Initiator', status: 'Revert' },
  { label: 'For Consultation', status: 'Consultation' },
  { label: 'For Replication', status: 'Replication' },
  { label: 'For Signature of PUP Official', status: 'SignituresPUP' },
  { label: 'Signed by PUP Official', status: 'SignedPUP' },
  { label: 'For Signature of Partners', status: 'SignituresPartner' },
  { label: 'Signed by Partners', status: 'SignedPartner' },
  { label: 'Completely Signed', status: 'Complete' },
  { label: 'For Notary', status: 'Notary' },
  { label: 'To FFUP Copy', status: 'FFUPCopy' },
].map(stage => ({
  ...stage,
  count: filteredForLifecycle.filter(a => a.agreement_status === stage.status).length
}));

  const tableColumns = [
    'Date',  'STATUS','DTS NO.', 'DTS LOCATION','SOURCE', 'POINT PERSON / POSITION',
    "PARTNER'S NAME", 'ENTITY TYPE', 'COUNTRY', 'REGION', 'ADDRESS',
    'SIGNATORIES / POSITION', 'CONTACT PERSON / DETAILS', 'DOCUMENT TYPE',
    'PARTNERSHIP CLASSIFICATION', 'EVENT TITLE / OTHER IMPT INFO ABOUT AGREEMENT',
    'VALIDITY PERIOD', 'DATE / YEAR OF SIGNING', 'EXPIRY DATE / YEAR',
    'DATE RECEIVED', 'DATE ENDORSED TO ULCO', "ULCO'S APPROVAL",
    "PUP OFFICIALS' SIGNATURE", 'WEBSITE LINK',
    'Brief Profile', 'LOGO', 'HARDCOPY LOCATOR', 'REMARKS', 'ACTIONS'
  ];

  const totalPages = Math.ceil(filteredAgreements.length / rowsPerPage);
  
  // added update: sort by entry_date descending by default (newest first) 
  const sortedFilteredAgreements = [...filteredAgreements].sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
  // added update: paginate after sorting 
  const paginatedData = sortedFilteredAgreements.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage); 

  const [showUploadForm, setShowUploadForm] = useState(false);

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadComment, setUploadComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setCurrentUser(parsedUser);
      }
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
    }
  }, []);

  if (loading)
  return (
    <div className="overview-container">
      <div className="lloading-container">
        <div className="spinner"></div>
        <p>Loading Overview...</p>
      </div>
    </div>
  );
  if (error) return <div className="overview-container">Error: {error}</div>;

const filterByStat = (statLabel) => {
  setStatFilter(statLabel);      // Set the stat filter (e.g., "OPEN - OIA")
  setSelectedStatus(null);       // Reset any lifecycle/status filter
  setCurrentPage(1);             // Reset to first page
};
 

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Agreements");

  const rawCols = tableColumns.filter((col) => col && col.toString().toUpperCase() !== "ACTIONS");
  const desiredStart = ['Date', 'DOCUMENT TYPE'];
  const remaining = rawCols.filter(c => !desiredStart.includes(c));
  const excelColumns = [...desiredStart.filter(c => rawCols.includes(c)), ...remaining];
  worksheet.columns = excelColumns.map((col) => ({ header: col, key: col, width: 30 }));

  const formatPointPersons = (pps) => {
    if (!Array.isArray(pps) || pps.length === 0) return "-";
    return pps.map(pp => {
      const pos = pp.point_person_position || pp.position || '';
      const name = pp.point_person_name || pp.name || '';
      const email = pp.point_person_email || pp.email || '';
      return [pos && pos.trim(), name && name.trim(), email && `(${email.trim()})`].filter(Boolean).join(' ');
    }).join('; ');
  };

  const formatContactPersons = (cps) => {
    if (!Array.isArray(cps) || cps.length === 0) return "-";
    return cps.map(cp => {
      const pos = cp.contact_person_position || cp.position || '';
      const name = cp.contact_person_name || cp.name || '';
      const email = cp.contact_person_email || cp.email || '';
      return [pos && pos.trim(), name && name.trim(), email && `(${email.trim()})`].filter(Boolean).join(' ');
    }).join('; ');
  };

  const formatSignatories = (list) => {
    if (!Array.isArray(list) || list.length === 0) return "-";
    return list.map(s => {
      const name = s.signatory_name || s.name || s.person || '';
      const pos = s.signatory_position || s.position || '';
      return [name && name.trim(), pos && `(${pos.trim()})`].filter(Boolean).join(' ');
    }).join('; ');
  };

  const formatRemarks = (rms) => {
    if (!Array.isArray(rms) || rms.length === 0) return "-";
    return rms.map(r => {
      const text = r.remark_text || r.text || '';
      const ts = r.remark_timestamp || r.timestamp || '';
      return ts ? `${text} [${ts}]` : text;
    }).join('; ');
  };

  const headerIndex = excelColumns.reduce((m, h, i) => {
    m[h] = i;
    return m;
  }, {});

  const overviewData = agreements.filter(a =>
    a.agreement_status !== "Active" &&
    a.agreement_status !== "Withdrawn" &&
    (a.dts_status === 'Open - OIA' || a.dts_status === 'Open - Other Office')
  );

  for (const a of overviewData) {
    const rowArray = new Array(excelColumns.length).fill('');

    if (headerIndex['Date'] !== undefined) rowArray[headerIndex['Date']] = a.entry_date || '';
    if (headerIndex['DOCUMENT TYPE'] !== undefined) rowArray[headerIndex['DOCUMENT TYPE']] = a.document_type || '';

    if (headerIndex['STATUS'] !== undefined) rowArray[headerIndex['STATUS']] = a.agreement_status || '';
    if (headerIndex['DTS NO.'] !== undefined) rowArray[headerIndex['DTS NO.']] = a.dts_number || '';
    if (headerIndex['DTS LOCATION'] !== undefined) rowArray[headerIndex['DTS LOCATION']] = a.dts_status || '';
    if (headerIndex['SOURCE'] !== undefined) rowArray[headerIndex['SOURCE']] = a.source_unit || '';
    if (headerIndex['POINT PERSON / POSITION'] !== undefined) rowArray[headerIndex['POINT PERSON / POSITION']] = formatPointPersons(a.point_persons);
    if (headerIndex["PARTNER'S NAME"] !== undefined) rowArray[headerIndex["PARTNER'S NAME"]] = a.name || '';
    if (headerIndex['ENTITY TYPE'] !== undefined) rowArray[headerIndex['ENTITY TYPE']] = a.entity_type || '';
    if (headerIndex['COUNTRY'] !== undefined) rowArray[headerIndex['COUNTRY']] = a.country || '';
    if (headerIndex['REGION'] !== undefined) rowArray[headerIndex['REGION']] = a.region || '';
    if (headerIndex['ADDRESS'] !== undefined) rowArray[headerIndex['ADDRESS']] = a.address || '';
    if (headerIndex['SIGNATORIES / POSITION'] !== undefined) rowArray[headerIndex['SIGNATORIES / POSITION']] = formatSignatories(a.signatories_list);
    if (headerIndex['CONTACT PERSON / DETAILS'] !== undefined) rowArray[headerIndex['CONTACT PERSON / DETAILS']] = formatContactPersons(a.contact_persons);
    if (headerIndex['PARTNERSHIP CLASSIFICATION'] !== undefined) rowArray[headerIndex['PARTNERSHIP CLASSIFICATION']] = a.partnership_type || '';
    if (headerIndex['EVENT TITLE / OTHER IMPT INFO ABOUT AGREEMENT'] !== undefined) rowArray[headerIndex['EVENT TITLE / OTHER IMPT INFO ABOUT AGREEMENT']] = a.event_info || '';
    if (headerIndex['VALIDITY PERIOD'] !== undefined) rowArray[headerIndex['VALIDITY PERIOD']] = a.validity_period || '';
    if (headerIndex['DATE / YEAR OF SIGNING'] !== undefined) rowArray[headerIndex['DATE / YEAR OF SIGNING']] = a.date_signed || '';
    if (headerIndex['EXPIRY DATE / YEAR'] !== undefined) rowArray[headerIndex['EXPIRY DATE / YEAR']] = a.date_expiry || '';
    if (headerIndex['DATE RECEIVED'] !== undefined) rowArray[headerIndex['DATE RECEIVED']] = a.date_received || '';
    if (headerIndex['DATE ENDORSED TO ULCO'] !== undefined) rowArray[headerIndex['DATE ENDORSED TO ULCO']] = a.date_endorsed_to_ulco || '';
    if (headerIndex["ULCO'S APPROVAL"] !== undefined) rowArray[headerIndex["ULCO'S APPROVAL"]] = a.date_ulco_approved || '';
    if (headerIndex["PUP OFFICIALS' SIGNATURE"] !== undefined) rowArray[headerIndex["PUP OFFICIALS' SIGNATURE"]] = a.date_signed_by_pup || '';
    if (headerIndex['WEBSITE LINK'] !== undefined) rowArray[headerIndex['WEBSITE LINK']] = a.website_url || '';
    if (headerIndex['Brief Profile'] !== undefined) rowArray[headerIndex['Brief Profile']] = a.description || '';
    if (headerIndex['LOGO'] !== undefined) rowArray[headerIndex['LOGO']] = a.logo_path ? '' : '';
    if (headerIndex['HARDCOPY LOCATOR'] !== undefined) rowArray[headerIndex['HARDCOPY LOCATOR']] = a.hardcopy_location || '';
    if (headerIndex['REMARKS'] !== undefined) rowArray[headerIndex['REMARKS']] = formatRemarks(a.remarks);

    const row = worksheet.addRow(rowArray);

    if (a.logo_path && headerIndex['LOGO'] !== undefined) {
      try {
        const imgId = workbook.addImage({ base64: a.logo_path, extension: 'png' });
        const colNum = headerIndex['LOGO'] + 1;
        worksheet.getColumn(colNum).width = Math.max(worksheet.getColumn(colNum).width || 8, 18);
        worksheet.getRow(row.number).height = Math.max(worksheet.getRow(row.number).height || 15, 60);
        const colLetter = worksheet.getColumn(colNum).letter;
        const range = `${colLetter}${row.number}:${colLetter}${row.number}`;
        worksheet.addImage(imgId, range);
      } catch (err) {
        if (headerIndex['LOGO'] !== undefined) {
          row.getCell(headerIndex['LOGO'] + 1).value = 'Has Logo';
        }
        console.warn('Failed to embed logo for DTS', a.dts_number, err);
      }
    }
  }

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB22222" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { wrapText: true, vertical: "top" };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "agreements_overview.xlsx");
};



  return (
    <div className="overview-container">
      <div className="stats-row">
  {stats.map((s, i) => (
    <button
      key={i}
      className={`stat-card ${statFilter === s.label ? 'active' : ''}`}
      onClick={() => filterByStat(s.label)}
    >
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
          </div>
        <div className="table-actions">
          <div className="button-group">
            <button className="btn" onClick={() => setShowFilterPanel(!showFilterPanel)}>Filter</button>
              <button className="btn btn-generate" onClick={exportToExcel}>
                Generate
              </button>
                    <button
        className="btn btn-scroll-nav"
        title="Scroll to first column"
        onClick={() => {
          const tableScrollDiv = document.querySelector('.table-scroll');
          if (tableScrollDiv) {
            tableScrollDiv.scrollLeft = 0;
          }
        }}
      >
        ◄ First Column
      </button>
      <button
        className="btn btn-scroll-nav"
        title="Scroll to last column"
        onClick={() => {
          const tableScrollDiv = document.querySelector('.table-scroll');
          if (tableScrollDiv) {
            tableScrollDiv.scrollLeft = tableScrollDiv.scrollWidth;
          }
        }}
      >
        Last Column ►
      </button>

          </div>
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
              <th style={{ cursor: 'pointer' }} onClick={handleDateSort}>
                  Date {dateSortOrder === 'asc' ? '▲' : dateSortOrder === 'desc' ? '▼' : '⇅'}
                </th>
              <th>DOCUMENT TYPE</th>  
              <th>STATUS</th>
              <th>DTS NO.</th>
              <th>DTS STATUS</th>
              <th>SOURCE</th>
              <th>POINT PERSON / POSITION</th>
              <th>PARTNER'S NAME</th>
              <th>ENTITY TYPE</th>
              <th>COUNTRY</th>
              <th>REGION</th>
              <th>ADDRESS</th>
              <th>SIGNATORIES / POSITION</th>
              <th>CONTACT PERSON / DETAILS</th>
              <th>PARTNERSHIP CLASSIFICATION</th>
              <th>EVENT TITLE / OTHER IMPT INFO ABOUT AGREEMENT</th>
              <th>VALIDITY PERIOD</th>
              <th>DATE / YEAR OF SIGNING</th>
              <th>EXPIRY DATE / YEAR</th>
              <th>DATE RECEIVED</th>
              <th>DATE ENDORSED TO ULCO</th>
              <th>ULCO'S APPROVAL</th>
              <th>PUP OFFICIALS' SIGNATURE</th>
              <th>WEBSITE LINK</th>
              <th>Brief Profile</th>
              <th>LOGO</th>
              <th>HARDCOPY LOCATOR</th>
              <th>REMARKS</th>
              <th>ACTIONS</th>
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
                    <td>{renderEditableCell(agreement, 'document_type', agreement.document_type)}</td>
                    <td>{renderEditableCell(agreement, 'agreement_status', agreement.agreement_status)}</td>
                    <td>{renderEditableCell(agreement, 'dts_number', agreement.dts_number)}</td>
                    <td>{renderEditableCell(agreement, 'dts_status', agreement.dts_status)}</td>
                    <td>{renderEditableCell(agreement, 'source_unit', agreement.source_unit)}</td>
                    <td>{renderEditableCell(agreement, 'point_persons', agreement.point_persons)}</td>
                    <td>{renderEditableCell(agreement, 'name', agreement.name)}</td>
                    <td>{renderEditableCell(agreement, 'entity_type', agreement.entity_type)}</td>
                    <td>{renderEditableCell(agreement, 'country', agreement.country)}</td>
                    <td>{renderEditableCell(agreement, 'region', agreement.region)}</td>
                    <td>{renderEditableCell(agreement, 'address', agreement.address)}</td>
                    <td>{renderEditableCell(agreement, 'signatories_list', agreement.signatories_list)}</td>
                    <td>{renderEditableCell(agreement, 'contact_persons', agreement.contact_persons)}</td>
                    <td>{renderEditableCell(agreement, 'partnership_type', agreement.partnership_type)}</td>
                    <td>{renderEditableCell(agreement, 'event_info', agreement.event_info)}</td>
                    <td>{renderEditableCell(agreement, 'validity_period', agreement.validity_period)}</td>
                    <td>{renderEditableCell(agreement, 'date_signed', agreement.date_signed)}</td>
                    <td>{renderEditableCell(agreement, 'date_expiry', agreement.date_expiry)}</td>
                    <td>{renderEditableCell(agreement, 'date_received', agreement.date_received)}</td>
                    <td>{renderEditableCell(agreement, 'date_endorsed_to_ulco', agreement.date_endorsed_to_ulco)}</td>
                    <td>{renderEditableCell(agreement, 'date_ulco_approved', agreement.date_ulco_approved)}</td>
                    <td>{renderEditableCell(agreement, 'date_signed_by_pup', agreement.date_signed_by_pup)}</td>
                    <td>
                      {editingRow === agreement.agreement_id ?
                        renderEditableCell(agreement, 'website_url', agreement.website_url) :
                        (agreement.website_url ? (
                          <a href={agreement.website_url} target="_blank" rel="noopener noreferrer">
                            {agreement.website_url.length > 30 ? agreement.website_url.slice(0, 30) + '...' : agreement.website_url}
                          </a>
                        ) : '-')
                      }
                    </td>
                    <td>{renderEditableCell(agreement, 'description', agreement.description)}</td>
                    <td>{renderEditableCell(agreement, 'logo_path', agreement.logo_path)}</td>
                    <td>{renderEditableCell(agreement, 'hardcopy_location', agreement.hardcopy_location)}</td>
                    <td>{renderEditableCell(agreement, 'remarks', agreement.remarks)}</td>
                    <td>
                      <div className="action-buttons">
                        {editingRow === agreement.agreement_id ? (
                          <>
                            {currentUser?.user_role?.toLowerCase() === "admin" && (
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
                            )}
                          </>
                        ) : (
                          <>
                            {currentUser?.user_role?.toLowerCase() === "admin" && (
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
                          </>
                        )}
                                                <div className="menu-wrapper">
                          <button
                            className="dots-btn"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPosition({
                                top: rect.bottom,
                                left: rect.left,
                              });
                              toggleMenu(rowIndex);
                            }}
                            title="More actions"
                          >
                            &#8942;
                          </button>
                          {openMenuIndex === rowIndex && (
                            <div
                              className="dropdown-menu"
                              style={{
                                position: "fixed",
                                zIndex: 1000,
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                              }}
                            >
                              <div
                                className="dropdown-item"
                                onClick={() => handleViewLatestFile(agreement.dts_number)}
                              >
                                View File
                              </div>
                              <div
                                className="dropdown-item"
                                onClick={() => navigate(`/docVer?dts_number=${agreement.dts_number}`)}
                              >
                                View Older File
                              </div>
                              {currentUser?.user_role?.toLowerCase() === "admin" && (
                                <div
                                  className="dropdown-item"
                                  onClick={() => {
                                    setSelectedAgreement(agreement);
                                    setShowUploadForm(true);
                                  }}
                                >
                                  Upload New File
                                </div>
                              )}
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

        {paginatedData.length > 5 && (
  <div className="table-bottom-actions">
    <button
      className="btn btn-scroll-nav"
      title="Scroll to first column"
      onClick={() => {
        const tableScrollDiv = document.querySelector('.table-scroll');
        if (tableScrollDiv) {
          tableScrollDiv.scrollLeft = 0;
        }
      }}
    >
      ◄ First Column
    </button>
    <button
      className="btn btn-scroll-nav"
      title="Scroll to last column"
      onClick={() => {
        const tableScrollDiv = document.querySelector('.table-scroll');
        if (tableScrollDiv) {
          tableScrollDiv.scrollLeft = tableScrollDiv.scrollWidth;
        }
      }}
    >
      Last Column ►
    </button>
  </div>
)}


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
        {currentUser?.user_role?.toLowerCase() === "admin" && (
          <button className="btn-add" onClick={() => navigate('/docUpload')}> + Add Document</button>
        )}
      </div>
      </div>

    {/* Upload New File Modal */}
    {showUploadForm && (
      <div className="overview-upload-form-overlay">
        <div className="overview-upload-form-modal">
          <h3>Upload New File</h3>

          {selectedAgreement && (
            <p className="overview-upload-form-info">
              For: <strong>{selectedAgreement.name}</strong>
            </p>
          )}

          {selectedAgreement && (
            <p className="overview-upload-form-info">
              Status: <strong>{selectedAgreement.agreement_status}</strong>
            </p>
          )}

          <form>
            <div className="overview-upload-form-group">
              <label>Upload File:</label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files[0])}
              />
            </div>

            <div className="overview-upload-form-group">
              <label>Comments:</label>
              <textarea
                placeholder="Enter comments here"
                value={uploadComment}
                onChange={(e) => setUploadComment(e.target.value)}
              ></textarea>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedAgreement(null);
                  setUploadFile(null);
                  setUploadComment("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="submit-button"
                disabled={uploading}
                onClick={async () => {
                  if (!uploadFile) {
                    alert("Please select a file.");
                    return;
                  }
                  try {
                    setUploading(true);
                    const res = await documentService.uploadVersion(
                      selectedAgreement.dts_number,
                      uploadFile,
                      uploadComment,
                      selectedAgreement.agreement_status // status_at_upload
                    );
                    alert("Upload successful!");
                    console.log("Uploaded:", res);
                    setShowUploadForm(false);
                    setSelectedAgreement(null);
                    setUploadFile(null);
                    setUploadComment("");
                  } catch (err) {
                    console.error("Upload failed:", err);
                    alert("Upload failed: " + err.message);
                  } finally {
                    setUploading(false);
                  }
                }}
              >
                {uploading ? "Uploading..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>


    )}
  </div>
);
};

export default OverviewDash;
