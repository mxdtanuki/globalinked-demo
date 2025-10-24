import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './layout.css';
import './overview1.css';
import { agreementService } from '../services/agreementService';
import { documentService } from '../services/documentService';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


/* ---------- Constants & helpers (copied/adapted from uploaded files) ---------- */

const LIFECYCLE_OPTIONS = [
  { value: '', label: 'Select Status' },
  { value: 'InitialReview', label: 'Initial Review' },
  { value: 'Endorse', label: 'Endorse to ULCO for Review and Approval' },
  { value: 'Revert', label: 'Revert To Initiator with Comments' },
  { value: 'Consultation', label: 'For Consultation' },
  { value: 'Replication', label: 'Replication of Copies (8 sets)' },
  { value: 'SignituresPUP', label: 'For Signatures of PUP Officials' },
  { value: 'SignedPUP', label: 'Signed by PUP Officials' },
  { value: 'SignituresPartner', label: 'For Signatures of Partner' },
  { value: 'SignedPartner', label: 'Signed by Partner Institution' },
  { value: 'Complete', label: 'Completely Signed' },
  { value: 'Notary', label: 'For Notary' },
  { value: 'FFUPCopy', label: 'FFUP Copy From College/Campus' },
];

const DEFAULT_THRESHOLD_DAYS = 3;
const CRITICAL_THRESHOLD_DAYS = 7;
const STATUS_THRESHOLDS = {
  "InitialReview": 3, "Endorse": 3, "Revert": 3, "Consultation": 3,
  "Replication": 3, "SignituresPUP": 3, "SignedPUP": 3, "SignituresPartner": 3,
  "SignedPartner": 3, "Complete": 3, "Notary": 3, "FFUPCopy": 3,
};

const toDateOrNull = (d) => {
  if (!d) return null;
  const t = Date.parse(d);
  return Number.isFinite(t) ? new Date(t) : null;
};
const daysBetweenUTC = (from, to = new Date()) => {
  if (!from) return 0;
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.max(0, Math.floor((b - a) / (1000 * 60 * 60 * 24)));
};

const slugifyStatus = (s) => {
  if (!s) return 'unknown';
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const mapAgreement = (a) => {
  const firstPoint = Array.isArray(a.point_persons) && a.point_persons.length > 0 ? a.point_persons[0] : null;
  const firstContact = Array.isArray(a.contact_persons) && a.contact_persons.length > 0 ? a.contact_persons[0] : null;
  const stageStartRaw =
    a.last_status_change || a.status_changed_at || a.status_updated_at || a.updated_at ||
    a.date_updated || a.date_received || a.entry_date || a.date_of_signing;

  return {
    _pk: a.agreement_id ?? a.id ?? a.dts_number,
    id: a.dts_number || a.id || a.agreement_id || '',
    dts_no: a.dts_number || '',
    partner_name: a.name || a.partner_name || '',
    entity_type: a.entity_type || '',
    country: a.country || '',
    region: a.region || '',
    address: a.address || '',
    point_position: firstPoint?.position || a.point_position || '',
    point_name: firstPoint?.name || a.point_name || a.point_person || '',
    point_email: firstPoint?.email || a.point_email || '',
    contact_person: firstContact?.name || a.contact_person || '',
    contact_email: firstContact?.email || a.contact_email || '',
    point_people: Array.isArray(a.point_persons) ? a.point_persons : undefined,
    contact_people: Array.isArray(a.contact_persons) ? a.contact_persons : undefined,
    document_type: a.document_type || '',
    partnership_classification: a.partnership_type || a.partnership_classification || '',
    validity_period: a.validity_period ? String(a.validity_period) : '',
    date_of_signing: a.date_signed || a.date_of_signing || '',
    expiry: a.date_expiry || a.expiry || '',
    date_received: a.entry_date || a.date_received || '',
    status: a.agreement_status || a.status || '',
    days_in_stage: typeof a.days_in_stage === 'number' ? a.days_in_stage : 0,
    delayed: typeof a.days_in_stage === 'number' ? a.days_in_stage >= DEFAULT_THRESHOLD_DAYS : false,
    related_mou: a.related_mou || a.MOU_to_MOA_id || a.mou_number || null,
    signatories: Array.isArray(a.signatories) ? a.signatories.map(s => s.name || s).join('; ') : (a.signatories || ''),
    website_link: a.website_link || a.website_url || '',
    event_title: a.event_title || a.event_info || '',
    brief_profile: a.brief_profile || a.description || '',
    hardcopy_locator: a.hardcopy_locator || a.hardcopy_location || '',
    logo: a.logo || a.logo_path || '',
    remarks_list: Array.isArray(a.remarks_list) ? a.remarks_list : undefined,
    remarks: a.remarks || '',
    _stage_start_at: stageStartRaw || null,
  };
};

const computeStageInfo = (row) => {
  const start = toDateOrNull(row._stage_start_at) || toDateOrNull(row.date_received) || toDateOrNull(row.date_of_signing);
  const days = daysBetweenUTC(start);
  const thresh = STATUS_THRESHOLDS[row.status] ?? DEFAULT_THRESHOLD_DAYS;
  const delayed = days >= thresh;
  const delay_level = days > CRITICAL_THRESHOLD_DAYS ? 'critical' : (delayed ? 'high' : 'none');
  return { ...row, days_in_stage: days, delayed, delay_level };
};


/* ---------- Small UI helpers reused from overview1 ---------- */

const SearchableSelect = ({ options = [], value, onChange, placeholder = 'Select...', allowClear = true }) => {
  const normalized = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef();

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const filtered = normalized.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  const selectedLabel = normalized.find(o => String(o.value) === String(value))?.label || '';

  return (
    <div className="searchable-select" ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="ss-toggle" onClick={() => setOpen(v => !v)}>
        <span className={`ss-value ${selectedLabel ? '' : 'placeholder'}`}>{selectedLabel || placeholder}</span>
        <span className="ss-caret">▾</span>
      </button>
      {allowClear && selectedLabel && (
        <button className="ss-clear" onClick={(e) => { e.stopPropagation(); onChange(''); setQuery(''); }}>×</button>
      )}
      {open && (
        <div className="ss-panel" role="dialog" style={{ position: 'absolute', zIndex: 40, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginTop: 6, width: 320, maxHeight: 260, overflow: 'auto' }}>
          <div style={{ padding: 8 }}>
            <input autoFocus className="ss-search" placeholder="Type to search..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: '100%' }} />
          </div>
          <ul className="ss-list" role="listbox" aria-label="options" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {filtered.length === 0 && <li style={{ padding: 8, color: '#666' }}>No results</li>}
            {filtered.map(o => (
              <li key={o.value} className="ss-item" style={{ padding: 8, cursor: 'pointer' }} onClick={() => { onChange(o.value); setOpen(false); setQuery(''); }}>
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* Minimal MultiPersonField and MultiRemarkField compatible with overview1 modal */

const MultiPersonField = ({ listKey, legacyKeys, selected, setSelected }) => {
  const list = Array.isArray(selected?.[listKey]) ? selected[listKey] : [];
  const legacyItem = {
    position: selected?.[legacyKeys?.positionKey] || '',
    name: selected?.[legacyKeys?.nameKey] || '',
    email: selected?.[legacyKeys?.emailKey] || '',
  };
  const value = list.length ? list : (legacyItem.name || legacyItem.position || legacyItem.email ? [legacyItem] : []);

  const updateAt = (idx, key, val) => {
    setSelected(s => {
      const arr = Array.isArray(s?.[listKey]) && s[listKey].length ? [...s[listKey]] : [...value];
      arr[idx] = { ...(arr[idx] || {}), [key]: val };
      return { ...s, [listKey]: arr };
    });
  };
  const add = () => setSelected(s => ({ ...s, [listKey]: [...value, { position: '', name: '', email: '' }] }));
  const remove = (idx) => setSelected(s => ({ ...s, [listKey]: value.filter((_, i) => i !== idx) }));

  return (
    <div className="multi-list">
      {value.map((p, idx) => (
        <div key={idx} className="multi-row">
          <input placeholder="Position" value={p.position || ''} onChange={(e) => updateAt(idx, 'position', e.target.value)} />
          <input placeholder="Name" value={p.name || ''} onChange={(e) => updateAt(idx, 'name', e.target.value)} />
          <input placeholder="Email" value={p.email || ''} onChange={(e) => updateAt(idx, 'email', e.target.value)} />
          <button type="button" className="icon-btn" title="Remove" onClick={() => remove(idx)}>🗑️</button>
        </div>
      ))}
      <button type="button" className="btn" onClick={add}>Add</button>
    </div>
  );
};

const MultiRemarkField = ({ listKey, selected, setSelected }) => {
  const list = Array.isArray(selected?.[listKey]) ? selected[listKey] : (selected?.remarks ? [selected.remarks] : []);
  const updateAt = (idx, val) => setSelected(s => {
    const arr = [...list];
    arr[idx] = typeof arr[idx] === 'object' ? { ...arr[idx], text: val } : val;
    return { ...s, [listKey]: arr };
  });
  const add = () => setSelected(s => ({ ...s, [listKey]: [...list, ''] }));
  const remove = (idx) => setSelected(s => ({ ...s, [listKey]: list.filter((_, i) => i !== idx) }));
  return (
    <div className="multi-list">
      {list.map((r, i) => (
        <div key={i} className="multi-row">
          <input value={typeof r === 'object' ? (r.remark_text || r.text || '') : (r || '')} onChange={(e) => updateAt(i, e.target.value)} />
          <button type="button" className="icon-btn" title="Remove" onClick={() => remove(i)}>🗑️</button>
        </div>
      ))}
      <button type="button" className="btn" onClick={add}>Add</button>
    </div>
  );
};

/* ---------- Main component ---------- */

const OverviewMerged = () => {
  const navigate = useNavigate();
  
  const [agreements, setAgreements] = useState([]);
  const [filterStage, setFilterStage] = useState('');
  const [filterClassification, setFilterClassification] = useState('');
  const [filterValidity, setFilterValidity] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterDelayed, setFilterDelayed] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // tmp filters for panel (Overview1 pattern)
  const [tmpClassification, setTmpClassification] = useState('');
  const [tmpValidity, setTmpValidity] = useState('');
  const [tmpCountry, setTmpCountry] = useState('');

  // modal / detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const originalRef = useRef(null);

  // editing from legacy OverviewDash
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [savingRows, setSavingRows] = useState(new Set());
  const [deletingRows, setDeletingRows] = useState(new Set());

  // upload & docs
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadComment, setUploadComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const containerRef = useRef();
  const filterPanelRef = useRef();
  const modalFirstFieldRef = useRef(null);

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) setCurrentUser(JSON.parse(userStr));
    } catch (e) { /* ignore */ }
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await agreementService.getAgreements();
      const raw = Array.isArray(data) ? data : (data?.items || []);
      const filtered = raw.filter(a => a.agreement_status !== 'Active' && a.agreement_status !== 'Withdrawn');
      const mapped = filtered.map(mapAgreement).map(computeStageInfo);
      setAgreements(mapped);
    } catch (err) {
      console.error('Failed to fetch agreements:', err);
      setError(err.detail || err.message || 'Failed to fetch agreements');
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgreements(); }, []);

  useEffect(() => { setCurrentPage(1); }, [filterStage, filterClassification, filterValidity, filterCountry, searchText, activeTab, agreements]);

  const STAGE_LIST = useMemo(() => LIFECYCLE_OPTIONS.filter(o => o.value), []);
  const classificationOptions = useMemo(
    () => Array.from(new Set(agreements.map(a => a.partnership_classification).filter(Boolean))),
    [agreements]
  );
  const validityOptions = useMemo(
    () => Array.from(new Set(agreements.map(a => a.validity_period).filter(Boolean))),
    [agreements]
  );
  const countryOptions = useMemo(
    () => Array.from(new Set(agreements.map(a => a.country).filter(Boolean))),
    [agreements]
  );

  const baseList = useMemo(() => agreements.filter(a => {
    if (activeTab === 'MOA' && a.document_type !== 'MOA') return false;
    if (activeTab === 'MOU' && a.document_type !== 'MOU') return false;
    if (filterDelayed && !a.delayed) return false;
    if (filterClassification && a.partnership_classification !== filterClassification) return false;
    if (filterCountry && a.country !== filterCountry) return false;
    if (filterValidity && a.validity_period !== filterValidity) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      const fields = [a.id, a.dts_no, a.partner_name, a.contact_person, a.point_name, a.country].filter(Boolean).map(v=>String(v).toLowerCase());
      if (!fields.some(f=>f.includes(s))) return false;
    }
    return true;
  }), [agreements, activeTab, filterClassification, filterCountry, filterValidity, searchText, filterDelayed]);

  const filtered = baseList.filter(a => {
    if (filterStage && a.status !== filterStage) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages, currentPage]);
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPk = (row) => row?._pk ?? row?.agreement_id ?? row?.id ?? row?.dts_no;

  // counts for summary and stage cards (Overview1-style)
  const pendingCount = baseList.length;
  const needsAttention = baseList.filter(a => a.delayed).length;
  const stageCounts = useMemo(() => {
    const map = {};
    for (const s of STAGE_LIST) map[s.value] = 0;
    for (const a of baseList) { if (a.status && map[a.status] !== undefined) map[a.status] += 1; }
    return map;
  }, [baseList, STAGE_LIST]);
  const stageHasDelayed = useMemo(() => {
    const map = {};
    for (const s of STAGE_LIST) map[s.value] = false;
    for (const a of baseList) { if (a.status && a.delayed) map[a.status] = true; }
    return map;
  }, [baseList, STAGE_LIST]);

  /* ---------- Detail modal helpers (open/hydrate/save) ---------- */

  const loadAgreementDetails = async (pk) => {
    if (!pk) return;
    setModalLoading(true);
    setModalError('');
    try {
      const full = await agreementService.getAgreementById(pk);
      const mapped = computeStageInfo(mapAgreement(full));
      setSelected(prev => ({ ...(prev || {}), ...mapped }));
      setAgreements(prev => prev.map(r => (String(getPk(r)) === String(getPk(mapped)) ? mapped : r)));
      if (!isEditing) originalRef.current = mapped;
    } catch (e) {
      console.error('Failed to load details:', e);
      setModalError(e.detail || e.message || 'Failed to load details');
    } finally {
      setModalLoading(false);
    }
  };

  const openDetails = (row) => {
    setSelected({ ...row });
    originalRef.current = { ...row };
    setIsEditing(false);
    setDetailOpen(true);
    loadAgreementDetails(row._pk ?? row.id);
  };

  const closeDetails = () => {
    setDetailOpen(false);
    setSelected(null);
    setModalLoading(false);
    setModalError('');
  };

  const buildPayloadFromSelected = (s) => {
    const toNullIfEmpty = (v) => (v === '' || v === undefined ? null : v);
    const normalizePersons = (list, legacy) => {
      if (Array.isArray(list) && list.length) return list.map(p => ({ position: p.position||'', name: p.name||'', email: p.email||'' }));
      const hasLegacy = s?.[legacy.position] || s?.[legacy.name] || s?.[legacy.email];
      return hasLegacy ? [{ position: s?.[legacy.position]||'', name: s?.[legacy.name]||'', email: s?.[legacy.email]||'' }] : [];
    };
    const payload = {
      dts_number: s.dts_no || s.id || undefined,
      agreement_status: s.status || undefined,
      document_type: s.document_type || undefined,
      partnership_classification: s.partnership_classification || undefined,
      validity_period: s.validity_period ? Number(s.validity_period) : undefined,
      date_signed: toNullIfEmpty(s.date_of_signing),
      date_expiry: toNullIfEmpty(s.expiry),
      entry_date: toNullIfEmpty(s.date_received),
      partner_name: s.partner_name || undefined,
      address: s.address || undefined,
      country: s.country || undefined,
      region: s.region || undefined,
      related_mou: s.related_mou || undefined,
      point_persons: normalizePersons(s.point_people, { position: 'point_position', name: 'point_name', email: 'point_email' }),
      contact_persons: normalizePersons(s.contact_people, { position: 'contact_position', name: 'contact_name', email: 'contact_email' }),
      signatories: s.signatories || undefined,
      website_link: s.website_link || undefined,
      event_title: s.event_title || undefined,
      brief_profile: s.brief_profile || undefined,
      hardcopy_locator: s.hardcopy_locator || undefined,
      remarks_list: Array.isArray(s.remarks_list) ? s.remarks_list : (s.remarks ? [s.remarks] : []),
    };
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
    return payload;
  };

  const saveDetails = async () => {
    if (!selected) return;
    try {
      const payload = buildPayloadFromSelected(selected);
      const updated = await agreementService.updateAgreement(getPk(selected), payload);
      const mapped = computeStageInfo(mapAgreement(updated));
      setAgreements(prev => prev.map(r => (String(getPk(r)) === String(getPk(mapped)) ? mapped : r)));
      setSelected(mapped);
      originalRef.current = mapped;
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert(e.detail || e.message || 'Failed to save');
    }
  };

  /* ---------- Legacy editing functions (from overviewDash) ---------- */
  const startEditing = (agreement) => {
    setEditingRow(agreement._pk ?? agreement.agreement_id ?? agreement.id);
    setEditedData({ ...agreement });
  };
  const cancelEditing = () => { setEditingRow(null); setEditedData({}); };
  const handleInputChange = (field, value) => setEditedData(prev => ({ ...prev, [field]: value }));

  const saveRow = async (agreementId) => {
    try {
      setSavingRows(prev => new Set(prev).add(agreementId));
      await agreementService.updateAgreement(agreementId, editedData);
      setAgreements(prev => prev.map(a => (String(a._pk ?? a.agreement_id ?? a.id) === String(agreementId) ? editedData : a)));
      setEditingRow(null); setEditedData({});
      alert('Agreement updated successfully!');
    } catch (err) {
      console.error('Error saving agreement:', err);
      alert('Failed to save changes: ' + (err.message || err));
    } finally {
      setSavingRows(prev => { const s = new Set(prev); s.delete(agreementId); return s; });
    }
  };

  const deleteRow = async (agreementId) => {
    const proceed = window.confirm('Are you sure you want to delete this agreement? This action cannot be undone.');
    if (!proceed) return;
    try {
      setDeletingRows(prev => new Set(prev).add(agreementId));
      await agreementService.deleteAgreement(agreementId);
      setAgreements(prev => prev.filter(a => String(a._pk ?? a.agreement_id ?? a.id) !== String(agreementId)));
      setEditingRow(prev => prev === agreementId ? null : prev);
      alert('Agreement deleted successfully.');
    } catch (err) {
      console.error('Error deleting agreement:', err);
      alert('Failed to delete agreement: ' + (err.message || err));
    } finally {
      setDeletingRows(prev => { const s = new Set(prev); s.delete(agreementId); return s; });
    }
  };

  const upsertListItem = (field, idx, key, val) => {
    setEditedData(prev => {
      const list = Array.isArray(prev[field]) ? [...prev[field]] : [];
      const item = { ...(list[idx] || {}) };
      item[key] = val;
      list[idx] = item;
      return { ...prev, [field]: list };
    });
  };
  const addListItem = (field, template) => setEditedData(prev => ({ ...prev, [field]: Array.isArray(prev[field]) ? [...prev[field], template] : [template] }));
  const removeListItem = (field, idx) => setEditedData(prev => { const list = Array.isArray(prev[field]) ? [...prev[field]] : []; list.splice(idx,1); return { ...prev, [field]: list }; });

  /* ---------- File viewing/upload and export ---------- */
  const handleViewLatestFile = async (dtsNumber) => {
    try {
      const latest = await documentService.getLatestVersion(dtsNumber);
      if (!latest) { alert("No document versions found for this DTS number."); return; }
      const resp = await fetch(latest.download_url, { headers: { Accept: "application/pdf" } });
      if (!resp.ok) throw new Error(`Failed to fetch file (${resp.status})`);
      const blob = await resp.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error("View failed:", err);
      alert("Failed to open file: " + (err.message || err));
    }
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Agreements");
      const cols = ['Date','DOCUMENT TYPE','STATUS','DTS NO.','DTS LOCATION','SOURCE','POINT PERSON / POSITION','PARTNER\'S NAME','ENTITY TYPE','COUNTRY','REGION','ADDRESS','SIGNATORIES / POSITION','CONTACT PERSON / DETAILS','PARTNERSHIP CLASSIFICATION','EVENT TITLE / OTHER IMPT INFO ABOUT AGREEMENT','VALIDITY PERIOD','DATE / YEAR OF SIGNING','EXPIRY DATE / YEAR','DATE RECEIVED','DATE ENDORSED TO ULCO',"ULCO'S APPROVAL","PUP OFFICIALS' SIGNATURE",'WEBSITE LINK','Brief Profile','LOGO','HARDCOPY LOCATOR','REMARKS'];
      worksheet.columns = cols.map(c => ({ header: c, key: c, width: 30 }));
      const overviewData = agreements.filter(a => a.status !== 'Active' && a.status !== 'Withdrawn');
      const formatPointPersons = (pps) => {
        if (!Array.isArray(pps) || pps.length === 0) return "-";
        return pps.map(pp => `${pp.position||pp.point_person_position||''} ${pp.name||pp.point_person_name||''} ${pp.email?`(${pp.email})`:''}`.trim()).join('; ');
      };
      const formatContactPersons = (cps) => {
        if (!Array.isArray(cps) || cps.length === 0) return "-";
        return cps.map(cp => `${cp.position||cp.contact_person_position||''} ${cp.name||cp.contact_person_name||''} ${cp.email?`(${cp.email})`:''}`.trim()).join('; ');
      };
      const formatSignatories = (list) => {
        if (!Array.isArray(list) || list.length === 0) return "-";
        return list.map(s => `${s.name||s.signatory_name||''} ${s.position?`(${s.position})`:''}`.trim()).join('; ');
      };
      const formatRemarks = (rms) => {
        if (!Array.isArray(rms) || rms.length === 0) return "-";
        return rms.map(r => (r.remark_text || r.text || r)).join('; ');
      };

      for (const a of overviewData) {
        const row = {
          'Date': a.date_received || a.entry_date || '',
          'DOCUMENT TYPE': a.document_type || '',
          'STATUS': a.status || '',
          'DTS NO.': a.dts_no || a.id || '',
          'DTS LOCATION': a.dts_status || '',
          'SOURCE': a.source_unit || '',
          'POINT PERSON / POSITION': formatPointPersons(a.point_people||a.point_persons),
          "PARTNER'S NAME": a.partner_name || a.name || '',
          'ENTITY TYPE': a.entity_type || '',
          'COUNTRY': a.country || '',
          'REGION': a.region || '',
          'ADDRESS': a.address || '',
          'SIGNATORIES / POSITION': formatSignatories(a.signatories || a.signatories_list),
          'CONTACT PERSON / DETAILS': formatContactPersons(a.contact_people||a.contact_persons),
          'PARTNERSHIP CLASSIFICATION': a.partnership_classification || a.partnership_type || '',
          'EVENT TITLE / OTHER IMPT INFO ABOUT AGREEMENT': a.event_title || a.event_info || '',
          'VALIDITY PERIOD': a.validity_period || '',
          'DATE / YEAR OF SIGNING': a.date_of_signing || a.date_signed || '',
          'EXPIRY DATE / YEAR': a.expiry || a.date_expiry || '',
          'DATE RECEIVED': a.date_received || a.entry_date || '',
          'DATE ENDORSED TO ULCO': a.date_endorsed_ulco || '',
          "ULCO'S APPROVAL": a.ulco_approval || '',
          "PUP OFFICIALS' SIGNATURE": a.pup_official_sign || a.date_signed_by_pup || '',
          'WEBSITE LINK': a.website_link || a.website_url || '',
          'Brief Profile': a.brief_profile || a.description || '',
          'LOGO': a.logo ? 'Has Logo' : '',
          'HARDCOPY LOCATOR': a.hardcopy_locator || a.hardcopy_location || '',
          'REMARKS': formatRemarks(a.remarks_list || a.remarks || a.remarks)
        };
        worksheet.addRow(row);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'agreements_overview.xlsx');
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed: ' + (err.message || err));
    }
  };

  /* ---------- UI handlers ---------- */

  const toggleMobileSidebar = () => {};

  const navigateDetail = (dir) => {
    if (!selected) return;
    const idx = filtered.findIndex(f => f.id === selected.id);
    if (idx === -1) return;
    const next = filtered[idx + dir];
    if (next) {
      setSelected({ ...next });
      loadAgreementDetails(next._pk ?? next.id);
    }
  };

  const activateAgreement = (agreement) => {
    if (!window.confirm(`Activate ${agreement.id} as active agreement?`)) return;
    setAgreements(prev => prev.filter(r => r.id !== agreement.id));
    navigate('/active-agreements', { state: { activated: agreement } });
  };

  const toggleMenu = (id) => setMenuOpenId(prev => (prev === id ? null : id));

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setMenuOpenId(null);
      if (showFilterPanel && filterPanelRef.current && !filterPanelRef.current.contains(e.target)) setShowFilterPanel(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFilterPanel]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelected(s => ({ ...(s||{}), logoFile: file, logo: url }));
  };

  /* ---------- Upload modal actions ---------- */
  const openUploadFor = (agreement) => { setSelectedAgreement(agreement); setShowUploadForm(true); };
  const submitUpload = async () => {
    if (!uploadFile || !selectedAgreement) { alert('Please select file'); return; }
    try {
      setUploading(true);
      await documentService.uploadVersion(selectedAgreement.dts_no || selectedAgreement.dts_number || selectedAgreement.id, uploadFile, uploadComment, selectedAgreement.status);
      alert('Upload successful!');
      setShowUploadForm(false); setSelectedAgreement(null); setUploadFile(null); setUploadComment('');
    } catch (err) { console.error(err); alert('Upload failed: ' + (err.message || err)); }
    finally { setUploading(false); }
  };

  if (loading) return (<div className="overview-container"><div className="lloading-container"><div className="spinner"></div><p>Loading Overview...</p></div></div>);
  if (error) return (<div className="overview-container">Error: {error}</div>);

  return (
    <div className="dashboard-container overview1-page">
      <div className="overview1-inner">

        {/* Tabs */}
        <div className="overview1-tabs-row">
          {['All', 'MOA', 'MOU'].map(tab => (
            <button
              key={tab}
              className={`overview1-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'All' ? 'All Agreements' : tab}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="overview1-summary-row">
          <button type="button" className="overview1-summary-card unified" disabled aria-disabled="true">
            <div className="summary-title">Pending Tasks</div>
            <div className="summary-number">{pendingCount}</div>
            <div className="summary-sub">Agreements in progress</div>
          </button>
          <button
            type="button"
            className={`overview1-summary-card unified ${filterDelayed ? 'active' : ''}`}
            onClick={() => { setFilterDelayed(v => !v); setCurrentPage(1); }}
            aria-pressed={filterDelayed}
            title="Show agreements that need attention"
          >
            <div className="summary-title">Needs Attention</div>
            <div className="summary-number">{needsAttention}</div>
            <div className="summary-sub">Overdue Agreements</div>
          </button>
        </div>

        {/* Stage cards */}
        <div className="overview1-stage-cards" role="tablist" aria-label="Lifecycle stages">
          {STAGE_LIST.map(s => (
            <button
              key={s.value}
              className={`stage-card ${filterStage === s.value ? 'active' : ''} ${stageHasDelayed[s.value] ? 'delayed' : ''}`}
              onClick={() => setFilterStage(prev => (prev === s.value ? '' : s.value))}
              title={s.label}
            >
              <div className="stage-label">{s.label}</div>
              <div className="stage-count">{stageCounts[s.value] || 0}</div>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="overview1-controls-row">
          <input
            className="overview1-search-input"
            placeholder="Search by title, partner, or agreement ID..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            className={`overview1-filter-btn ${showFilterPanel ? 'open' : ''}`}
            onClick={(e) => { 
              e.stopPropagation(); 
              setShowFilterPanel(v => {
                if (!v) {
                  setTmpClassification(filterClassification);
                  setTmpValidity(filterValidity);
                  setTmpCountry(filterCountry);
                }
                return !v;
              });
            }}
            aria-expanded={showFilterPanel}
            aria-controls="overview1-filter-panel"
            title="Filters"
          >
            Filters
          </button>
          <button className="btn generate" onClick={exportToExcel}>Generate Report</button>
        </div>

        {/* Filter panel */}
        {showFilterPanel && (
          <div id="overview1-filter-panel" className="overview1-filter-panel" ref={filterPanelRef} role="region" aria-label="Table filters">
            <div className="overview1-panel-row">
              <label className="overview1-panel-field">
                Partnership Classification
                <select value={tmpClassification} onChange={(e) => setTmpClassification(e.target.value)}>
                  <option value="">Select Classification</option>
                  {classificationOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="overview1-panel-field">
                Validity Period
                <select value={tmpValidity} onChange={(e) => setTmpValidity(e.target.value)}>
                  <option value="">Select Validity</option>
                  {validityOptions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>

              <label className="overview1-panel-field">
                Country
                <select value={tmpCountry} onChange={(e) => setTmpCountry(e.target.value)}>
                  <option value="">Select Country</option>
                  {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>

            <div className="overview1-filter-actions">
              <button className="btn clear" onClick={() => {
                setTmpClassification(''); setTmpValidity(''); setTmpCountry('');
                setFilterClassification(''); setFilterValidity(''); setFilterCountry('');
                setShowFilterPanel(false);
              }}>Clear</button>
              <button className="btn apply" onClick={() => {
                setFilterClassification(tmpClassification);
                setFilterValidity(tmpValidity);
                setFilterCountry(tmpCountry);
                setShowFilterPanel(false);
              }}>Apply</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overview1-table-wrapper" ref={containerRef}>
          <table className="overview1-agreements-table">
            <thead>
              <tr>
                <th>Dts Number</th>
                <th>Partner Name</th>
                <th>Country</th>
                <th>Classification</th>
                <th>Validity Period</th>
                <th>Document Type</th>
                <th>Related MOU</th>
                <th>Current Status</th>
                <th>Days in Lifecycle</th>
                <th>Point Person</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 24 }}>
                    No agreements found
                  </td>
                </tr>
              )}
              {paged.map((row, rowIndex) => (
                <tr key={row._pk || row.id || rowIndex} className={`${row.delayed ? 'delayed-row' : ''} ${row.delay_level ? `delay-${row.delay_level}` : ''}`}>
                {/* Dts Number with warning */}
                  <td className="id-cell">
                    {row.delayed && (
                      <span className={`warning-icon ${row.delay_level}`} title="Delayed">!</span>
                    )}
                    <span className="id-text">{row.id}</span>
                  </td>
                  {/* Partner Name */}
                  <td className="partner-cell">
                    <div className="partner-name">{row.partner_name || '—'}</div>
                    <div className="partner-sub">{row.position || row.entity_type || ''}</div>
                  </td>
                  {/* Country */}
                  <td>{row.country || '—'}</td>
                  {/* Classification */}
                  <td>{row.partnership_classification || '—'}</td>
                  {/* Validity Period */}
                  <td>{row.validity_period || '—'}</td>
                  {/* Document Type */}
                  <td>
                    <span className={`badge doc ${row.document_type === 'MOA' ? 'moa' : 'mou'}`}>
                      {row.document_type || '—'}
                    </span>
                  </td>
                  {/* Related MOU */}
                  <td>
                    {row.related_mou ? (
                      <span className="related-mou">
                        {row.related_mou}
                        <div className="req">Required</div>
                      </span>
                    ) : '—'}
                  </td>
                  {/* Current Status */}
                  <td>
                    <span className={`status-badge status-${slugifyStatus(row.status)}`}>
                      {LIFECYCLE_OPTIONS.find(o => o.value === row.status)?.label || row.status || '—'}
                    </span>
                  </td>
                  {/* Days in Lifecycle */}
                  <td>
                    <div className="days">
                      {row.days_in_stage ?? 0} days {row.delayed && <span className="delay-note">Delayed</span>}
                    </div>
                  </td>
                  {/* Point Person */}
                  <td>
                    <div className="pp-person">
                      {((row.point_position || row.position) ? `${row.point_position || row.position}: ` : '') +
                        (row.point_name || row.point_person || '—') +
                        (row.point_email ? ` (${row.point_email})` : (row.contact_email ? ` (${row.contact_email})` : ''))}
                    </div>
                  </td>
                {/* Actions */}
                  <td className="actions-cell">
                    <button className="icon-btn" title="View" onClick={() => openDetails(row)}>
                      👁️
                    </button>
                    {(row.status && String(row.status).toLowerCase().includes('ffup')) && (
                      <button className="icon-btn activate" title="Activate" onClick={() => activateAgreement(row)}>
                        Activate
                      </button>
                    )}
                    <button className="icon-btn" title="Delete" onClick={() => deleteRow(row._pk ?? row.id)}>
                      🗑️
                    </button>
                    <div className="dots-menu" style={{ display: 'inline-block', position: 'relative' }}>
                      <button className="icon-btn dots" onClick={(e) => { e.stopPropagation(); toggleMenu(row._pk ?? row.id); }}>
                        ⋯
                      </button>
                      {menuOpenId === (row._pk ?? row.id) && (
                        <div className="menu-popup" onClick={(e) => e.stopPropagation()}>
                          <button className="menu-item" onClick={() => handleViewLatestFile(row.dts_no || row.id)}>View File</button>
                          <button className="menu-item" onClick={() => navigate(`/docVer?dts_number=${row.dts_no || row.id}`)}>View Older Files</button>
                          <button className="menu-item" onClick={() => openUploadFor(row)}>Upload New Version</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="overview1-pagination-row">
          <div className="pagination">
            <button className="page-btn" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}>Prev</button>
            {Array.from({length: totalPages}).map((_,i)=>(
              <button key={i} className={`page-btn ${currentPage===i+1?'active':''}`} onClick={()=>setCurrentPage(i+1)}>{i+1}</button>
            ))}
            <button className="page-btn" onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}>Next</button>
          </div>
          <div className="page-info">Showing {filtered.length ? Math.min(filtered.length, (currentPage-1)*itemsPerPage+1) : 0} - {Math.min(filtered.length, currentPage*itemsPerPage)} of {filtered.length}</div>
        </div>

        {/* Detail modal */}
        {detailOpen && selected && (
          <div className="overview1-modal-backdrop" onClick={closeDetails}>
            <div className="overview1-modal" onClick={(e)=>e.stopPropagation()}>
              <div className="overview1-modal-header" role="dialog" aria-labelledby="modal-title">
                <div className="modal-nav">
                  <button className="nav-btn" onClick={() => navigateDetail(-1)} title="Previous">‹</button>
                  <h3 id="modal-title">Agreement Details — {selected.id}</h3>
                  <button className="nav-btn" onClick={() => navigateDetail(1)} title="Next">›</button>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <button className="close" onClick={closeDetails} aria-label="Close">×</button>
                </div>
              </div>

              <div className="overview1-modal-body">
                {modalError && <div style={{ color: '#b00020', margin: '8px 0' }}>{modalError}</div>}
                {modalLoading ? (
                  <div>Loading details...</div>
                ) : (
                  <div className="overview1-details-grid overview1-form-grid">
                    {/* Date */}
                    <label className="field">
                      Date
                      <input
                        ref={modalFirstFieldRef}
                        type="date"
                        value={selected.date || selected.date_received || ''}
                        onChange={(e) => setSelected(s => ({ ...s, date_received: e.target.value }))}
                      />
                    </label>

                    {/* Source */}
                    <label className="field">
                      Source
                      <input
                        value={selected.source_unit || selected.source || ''}
                        onChange={(e) => setSelected(s => ({ ...s, source_unit: e.target.value }))}
                      />
                    </label>

                    {/* Point person / position */}
                    <div className="full-col">
                      <label className="field full">Point person / position
                        <MultiPersonField
                          listKey="point_people"
                          legacyKeys={{ positionKey: 'point_position', nameKey: 'point_name', emailKey: 'point_email' }}
                          selected={selected}
                          setSelected={setSelected}
                        />
                      </label>
                    </div>

                    {/* DTS NO. */}
                    <label className="field">
                      DTS NO.
                      <input
                        value={selected.dts_no || ''}
                        onChange={(e) => setSelected(s => ({ ...s, dts_no: e.target.value }))}
                      />
                    </label>

                    {/* Status */}
                    <label className="field">
                      STATUS
                      <select
                        value={selected.status || ''}
                        onChange={(e) =>
                          setSelected(s => {
                            const nextStatus = e.target.value;
                            if (nextStatus !== s.status) {
                              const now = new Date().toISOString();
                              return {
                                ...s,
                                status: nextStatus,
                                _stage_start_at: now,
                                last_status_change: now,
                                days_in_stage: 0,
                                delayed: false,
                                delay_level: 'none',
                              };
                            }
                            return s;
                          })
                        }
                      >
                        <option value="">Select Status</option>
                        {LIFECYCLE_OPTIONS.filter(o=>o.value).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </label>

                    {/* Partner's name */}
                    <label className="field">
                      Partner's name
                      <input
                        value={selected.partner_name || ''}
                        onChange={(e) => setSelected(s => ({ ...s, partner_name: e.target.value }))}
                      />
                    </label>
                    
                    {/* Address */}
                    <label className="field">
                      Address
                      <input
                        value={selected.address || ''}
                        onChange={(e) => setSelected(s => ({ ...s, address: e.target.value }))}
                      />
                    </label>

                    {/* Country */}
                    <label className="field">
                      Country
                      <SearchableSelect
                        options={countryOptions.map(c => ({ value: c, label: c }))}
                        value={selected.country || ''}
                        onChange={(val) => setSelected(s => ({ ...s, country: val }))}
                        placeholder="Select Country"
                      />
                    </label>

                    {/* Region */}
                    <label className="field">
                      Region
                      <input
                        value={selected.region || ''}
                        onChange={(e) => setSelected(s => ({ ...s, region: e.target.value }))}
                      />
                    </label>

                    {/* Signatories */}
                    <div className="full-col">
                      <label className="field">
                        Signatories
                        <input
                          value={selected.signatories || ''}
                          onChange={(e) => setSelected(s => ({ ...s, signatories: e.target.value }))}
                        />
                      </label>
                    </div>

                    {/* Contact person / details */}
                    <div className="full-col">
                      <label className="field full">Contact person / details
                        <MultiPersonField
                          listKey="contact_people"
                          legacyKeys={{ positionKey: 'contact_position', nameKey: 'contact_name', emailKey: 'contact_email' }}
                          selected={selected}
                          setSelected={setSelected}
                        />
                      </label>
                    </div>

                    {/* Document type */}
                    <label className="field">
                      Document type
                      <select
                        value={selected.document_type || ''}
                        onChange={(e) => setSelected(s => ({ ...s, document_type: e.target.value }))}
                      >
                        <option value="">Select</option>
                        <option value="MOA">MOA</option>
                        <option value="MOU">MOU</option>
                      </select>
                    </label>

                    {/* Partnership classification */}
                    <label className="field">
                      Partnership classification
                      <SearchableSelect
                        options={classificationOptions.map(c => ({ value: c, label: c }))}
                        value={selected.partnership_classification || ''}
                        onChange={(val) => setSelected(s => ({ ...s, partnership_classification: val }))}
                        placeholder="Select Classification"
                      />
                    </label>

                    {/* Validity Period */}
                    <label className="field">
                      Validity Period
                      <select value={selected.validity_period || ''} onChange={(e)=>setSelected(s=>({...s, validity_period: e.target.value}))}>
                        <option value="">Select Validity</option>
                        {validityOptions.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </label>

                    {/* Date / Year of Signing */}
                    <label className="field">
                      DATE / YEAR OF SIGNING
                      <input type="date" value={selected.date_of_signing || ''} onChange={(e)=>setSelected(s=>({...s, date_of_signing: e.target.value}))} />
                    </label>

                    {/* Expiry */}
                    <label className="field">
                      EXPIRY DATE / YEAR
                      <input type="date" value={selected.expiry || ''} onChange={(e)=>setSelected(s=>({...s, expiry: e.target.value}))} />
                    </label>

                    {/* Date Received */}
                    <label className="field">
                      DATE RECEIVED
                      <input
                        type="date"
                        value={selected.date_received || ''}
                        onChange={(e) => setSelected(s => ({ ...s, date_received: e.target.value }))}
                      />
                    </label>

                    {/* Date Endorsed to ULCO */}
                    <label className="field">
                      DATE ENDORSED TO ULCO
                      <input
                        type="date"
                        value={selected.date_endorsed_ulco || ''}
                        onChange={(e) => setSelected(s => ({ ...s, date_endorsed_ulco: e.target.value }))}
                      />
                    </label>

                    {/* ULCO's Approval */}
                    <label className="field">
                      ULCO'S APPROVAL
                      <input
                        type="date"
                        value={selected.ulco_approval || ''}
                        onChange={(e) => setSelected(s => ({ ...s, ulco_approval: e.target.value }))}
                      />
                    </label>

                    {/* PUP Official's Signature */}
                    <label className="field">
                      PUP OFFICIALS' SIGNATURE
                      <input
                        type="date"
                        value={selected.pup_official_sign || ''}
                        onChange={(e) => setSelected(s => ({ ...s, pup_official_sign: e.target.value }))}
                      />
                    </label>

                    {/* Website Link */}
                    <label className="field">
                      WEBSITE LINK
                      <input
                        value={selected.website_link || ''}
                        onChange={(e) => setSelected(s => ({ ...s, website_link: e.target.value }))}
                      />
                    </label>

                    {/* Event title full width */}
                    <div className="full-col">
                      <label className="field full">EVENT TITLE / OTHER IMPT INFO ABOUT AGREEMENT
                        <input
                          value={selected.event_title || ''}
                          onChange={(e) => setSelected(s => ({ ...s, event_title: e.target.value }))}
                        />
                      </label>
                    </div>

                    {/* Brief Profile - full width */}
                    <div className="full-col">
                      <label className="field full">BRIEF PROFILE
                        <input
                          value={selected.brief_profile || ''}
                          onChange={(e) => setSelected(s => ({ ...s, brief_profile: e.target.value }))}
                        />
                      </label>
                    </div>

                    {/* Logo */}
                    <label className="field">
                      LOGO - upload
                      <div className="logo-upload">
                        {selected.logo ? <img src={selected.logo} className="logo-preview" alt="logo"/> : null}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} />
                      </div>
                    </label>

                    {/* Hardcopy locator */}
                    <label className="field">
                      HARDCOPY LOCATOR
                      <input
                        value={selected.hardcopy_locator || ''}
                        onChange={(e) => setSelected(s => ({ ...s, hardcopy_locator: e.target.value }))}
                      />
                    </label>

                    {/* Remarks full width */}
                    <div className="full-col">
                      <label className="field full">REMARKS
                        <MultiRemarkField
                          listKey="remarks_list"
                          selected={selected}
                          setSelected={setSelected}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="overview1-modal-footer">
                <button className="btn cancel" onClick={closeDetails}>Cancel</button>
                {!isEditing ? (
                  <button className="btn save" onClick={()=>setIsEditing(true)}>Edit</button>
                ) : (
                  <>
                    <button className="btn save" onClick={saveDetails}>Save</button>
                    <button className="btn cancel" onClick={() => { setSelected(originalRef.current); setIsEditing(false); }}>Revert</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadForm && (
          <div className="overview-upload-form-overlay">
            <div className="overview-upload-form-modal">
              <h3>Upload New File</h3>
              {selectedAgreement && <p>For: <strong>{selectedAgreement.partner_name || selectedAgreement.name}</strong></p>}
              <div className="overview-upload-form-group">
                <label>Upload File:</label>
                <input type="file" onChange={(e)=>setUploadFile(e.target.files[0])} />
              </div>
              <div className="overview-upload-form-group">
                <label>Comments:</label>
                <textarea placeholder="Enter comments here" value={uploadComment} onChange={(e)=>setUploadComment(e.target.value)}></textarea>
              </div>
              <div className="modal-actions">
                <button className="cancel-button" onClick={()=>{ setShowUploadForm(false); setSelectedAgreement(null); setUploadFile(null); setUploadComment(""); }}>Cancel</button>
                <button className="submit-button" disabled={uploading} onClick={submitUpload}>{uploading ? 'Uploading...' : 'Submit'}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OverviewMerged;