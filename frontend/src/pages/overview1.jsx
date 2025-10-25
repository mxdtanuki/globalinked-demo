import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import '../components/layout.css';
import './overview1.css';
import { agreementService } from '../services/agreementService';


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

const slugifyStatus = (s) => {
  if (!s) return 'unknown';
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const PARTNERSHIP_TYPE_OPTIONS = [
  { value: 'Agreement', label: 'Agreement' },
  { value: 'Contract Agreement', label: 'Contract Agreement' },
  { value: 'Cooperation Agreement', label: 'Cooperation Agreement' },
  { value: 'Implementation Agreement', label: 'Implementation Agreement' },
  { value: 'Online Study Tour Agreement', label: 'Online Study Tour Agreement' },
  { value: 'License and Cooperation Agreement', label: 'License and Cooperation Agreement' },
  { value: 'Agreement of International Faculty Exchanges for Academic Training Program', label: 'Agreement of International Faculty Exchanges for Academic Training Program' },
  { value: 'Due Diligence', label: 'Due Diligence' },
  { value: 'Joint Education Programs and Training Cooperation', label: 'Joint Education Programs and Training Cooperation' },
  { value: 'MOA on Academic Exchange', label: 'MOA on Academic Exchange' },
  { value: 'MOA on Faculty Exchange', label: 'MOA on Faculty Exchange' },
  { value: 'MOA on Student Exchange', label: 'MOA on Student Exchange' },
  { value: 'MOA on Cultural Exchange', label: 'MOA on Cultural Exchange' },
  { value: 'MOA on Research', label: 'MOA on Research' },
  { value: 'MOA on Internship', label: 'MOA on Internship' },
  { value: 'MOA on Training and Research Collaboration', label: 'MOA on Training and Research Collaboration' },
  { value: 'MOA on Conferences', label: 'MOA on Conferences' },
  { value: 'MOA on International Competition', label: 'MOA on International Competition' },
  { value: 'MOA Global Leadership', label: 'MOA Global Leadership' },
  { value: 'MOA for Donation', label: 'MOA for Donation' },
  { value: 'MOA on English Class', label: 'MOA on English Class' },
  { value: 'MOA on English Camp', label: 'MOA on English Camp' },
  { value: 'MOA on Academic Partnership', label: 'MOA on Academic Partnership' },
  { value: 'MOA (RMO)', label: 'MOA (RMO)' },
  { value: 'MOA (VPRED)', label: 'MOA (VPRED)' },
  { value: 'MOA with PUP Sta.Rosa', label: 'MOA with PUP Sta.Rosa' },
  { value: 'MOA with PACA', label: 'MOA with PACA' },
  { value: 'MOA CITAA', label: 'MOA CITAA' },
  { value: 'MOA CAH', label: 'MOA CAH' },
  { value: 'MOA with College of Science', label: 'MOA with College of Science' },
  { value: 'MOA with College of Engineering', label: 'MOA with College of Engineering' },
  { value: 'MOA on Career Orientation Services', label: 'MOA on Career Orientation Services' },
  { value: 'MOA on International Educational Cooperation', label: 'MOA on International Educational Cooperation' },
  { value: 'MOA on Promotion and Collaboration on International Academic and Research', label: 'MOA on Promotion and Collaboration on International Academic and Research' },
  { value: 'MOA for Academic Exchange: Joint Development Agreement for Railway-Related Programs Academic Documents', label: 'MOA for Academic Exchange: Joint Development Agreement for Railway-Related Programs Academic Documents' },
  { value: 'MOA on Extension Project', label: 'MOA on Extension Project' },
  { value: 'MOA Tripartite', label: 'MOA Tripartite' },
  { value: 'MOA on English and Cultural Program', label: 'MOA on English and Cultural Program' },
  { value: 'MOA on Student Competition', label: 'MOA on Student Competition' },
  { value: 'MOA on Faculty and Student Exchange', label: 'MOA on Faculty and Student Exchange' },
];

const VALIDITY_OPTIONS_STATIC = ['1','2','3','4','5'];

const STATUS_OPTIONS = [
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
];

const COUNTRY_LIST = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Congo-Brazzaville)","Costa Rica",
  "Croatia","Cuba","Cyprus","Czechia","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador",
  "Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
  "Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar",
  "Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia",
  "Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal",
  "Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan",
  "Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia",
  "Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa",
  "South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan",
  "Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan",
  "Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe","HongKong","Macao"
];

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
      <button
        type="button"
        className="ss-toggle"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`ss-value ${selectedLabel ? '' : 'placeholder'}`}>{selectedLabel || placeholder}</span>
        <span className="ss-caret">▾</span>
      </button>

      {allowClear && selectedLabel && (
        <button className="ss-clear" onClick={(e) => { e.stopPropagation(); onChange(''); setQuery(''); }}>
          ×
        </button>
      )}

      {open && (
        <div className="ss-panel" role="dialog" style={{ position: 'absolute', zIndex: 40, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginTop: 6, width: 320, maxHeight: 260, overflow: 'auto' }}>
          <div style={{ padding: 8 }}>
            <input
              autoFocus
              className="ss-search"
              placeholder="Type to search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
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

const MultiPersonField = ({ listKey, legacyKeys = {}, selected, setSelected }) => {
  const derive = () => {
    if (selected && Array.isArray(selected[listKey])) return selected[listKey];
    if (selected && (selected[legacyKeys.nameKey] || selected[legacyKeys.emailKey] || selected[legacyKeys.positionKey])) {
      return [{
        position: selected[legacyKeys.positionKey] || '',
        name: selected[legacyKeys.nameKey] || '',
        email: selected[legacyKeys.emailKey] || ''
      }];
    }
    return [];
  };

  const [localList, setLocalList] = useState(derive());
  const prevLenRef = useRef(localList.length);

  useEffect(() => {
    setLocalList(derive());
  }, [selected?.[listKey], selected?.[legacyKeys.nameKey], selected?.[legacyKeys.emailKey], selected?.[legacyKeys.positionKey]]);

  const syncAndPersist = (next) => {
    setLocalList(next);
    const first = next && next[0];
    setSelected(s => ({
      ...s,
      [listKey]: next,
      [legacyKeys.positionKey]: first?.position || '',
      [legacyKeys.nameKey]: first?.name || '',
      [legacyKeys.emailKey]: first?.email || '',
    }));
  };

  useEffect(() => {
    if (localList.length > prevLenRef.current) {
      setTimeout(() => {
        const lastInput = document.querySelector('.multi-person-field-rows .person-row:last-child input');
        lastInput?.focus();
      }, 60);
    }
    prevLenRef.current = localList.length;
  }, [localList.length]);

  const handleAdd = () => {
    const next = [...localList, { position: '', name: '', email: '' }];
    syncAndPersist(next);
  };

  const handleRemove = (idx) => {
    const next = localList.filter((_, i) => i !== idx);
    syncAndPersist(next);
  };

  const handleChange = (idx, field, value) => {
    const next = localList.slice();
    next[idx] = { ...(next[idx] || {}), [field]: value };
    syncAndPersist(next);
  };

  return (
    <div className="multi-person-field-rows">
      {localList.map((p, i) => (
        <div key={i} className="person-row">
          <input
            type="text"
            className="person-input person-input-pos"
            placeholder="Position"
            value={p.position || ''}
            onChange={(e) => handleChange(i, 'position', e.target.value)}
            aria-label={`position-${i}`}
          />
          <input
            type="text"
            className="person-input person-input-name"
            placeholder="Name"
            value={p.name || ''}
            onChange={(e) => handleChange(i, 'name', e.target.value)}
            aria-label={`name-${i}`}
          />
          <input
            type="email"
            className="person-input person-input-email"
            placeholder="Email"
            value={p.email || ''}
            onChange={(e) => handleChange(i, 'email', e.target.value)}
            aria-label={`email-${i}`}
          />
          <button
            type="button"
            className="person-remove"
            onClick={() => handleRemove(i)}
            aria-label={`remove-${i}`}
            title="Remove"
          >×</button>
        </div>
      ))}

      <div className="add-row">
        <button type="button" className="btn add-small" onClick={handleAdd}>+ Add</button>
      </div>
    </div>
  );
};

const MultiRemarkField = ({ listKey = 'remarks_list', selected, setSelected }) => {
  const derive = () => {
    if (selected && Array.isArray(selected[listKey])) return selected[listKey];
    if (selected && selected.remarks) return [selected.remarks];
    return [];
  };

  const [list, setList] = useState(derive());
  const [editIdx, setEditIdx] = useState(-1);
  const containerRef = useRef(null);

  useEffect(() => {
    setList(derive());
  }, [selected?.[listKey], selected?.remarks]);

  useEffect(() => {
    if (editIdx < 0) return;
    const t = setTimeout(() => {
      const sel = containerRef.current?.querySelector(`.remark-row[data-idx="${editIdx}"] input`);
      sel?.focus();
      if (sel && typeof sel.selectionStart === 'number') {
        const len = sel.value?.length || 0;
        sel.setSelectionRange(len, len);
      }
    }, 40);
    return () => clearTimeout(t);
  }, [editIdx]);

  const sync = (next) => {
    setList(next);
    const first = next && next[0];
    setSelected(s => ({ ...s, [listKey]: next, remarks: first || '' }));
  };

  const handleAdd = () => {
    const next = [...list, ''];
    sync(next);
    setEditIdx(next.length - 1);
  };

  const handleRemove = (idx) => {
    const next = list.filter((_, i) => i !== idx);
    sync(next);
    setEditIdx(-1);
  };

  const handleChange = (idx, val) => {
    const next = list.slice();
    next[idx] = val;
    sync(next);
  };

  const startEdit = (idx) => setEditIdx(idx);

  return (
    <div className="multi-remark" ref={containerRef}>
      <div className="remark-list">
        {list.length === 0 && <div className="no-remarks">No remarks</div>}

        {list.map((r, i) => (
          <div key={i} className="remark-item">
            {editIdx === i ? (
              <div className="remark-row" data-idx={i}>
                <input
                  type="text"
                  placeholder="Remark"
                  value={r || ''}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onBlur={() => setEditIdx(-1)}
                />
                <button type="button" className="remark-remove" onClick={() => handleRemove(i)} title="Remove">×</button>
              </div>
            ) : (
              <div className="remark-pill" onClick={() => startEdit(i)}>
                <span className="remark-text">{r || '—'}</span>
                <button type="button" className="remark-remove" onClick={(e) => { e.stopPropagation(); handleRemove(i); }} title="Remove">×</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="remark-add-row">
        <button type="button" className="btn add-small" onClick={handleAdd}>+ Add</button>
      </div>
    </div>
  );
};

const DEFAULT_THRESHOLD_DAYS = 3;
const CRITICAL_THRESHOLD_DAYS = 7;

const STATUS_THRESHOLDS = {
  // status -> days before the alert
  "InitialReview": 3,    
  "Endorse": 3,
  "Revert": 3,
  "Consultation": 3,        
  "Replication": 3,
  "SignituresPUP": 3,
  "SignedPUP": 3,
  "SignituresPartner": 3,
  "SignedPartner": 3,
  "Complete": 3,
  "Notary": 3,
  "FFUPCopy": 3,
}

// Date helpers
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

const mapAgreement = (a) => {
  const firstPoint = Array.isArray(a.point_persons) && a.point_persons.length > 0 ? a.point_persons[0] : null;
  const firstContact = Array.isArray(a.contact_persons) && a.contact_persons.length > 0 ? a.contact_persons[0] : null;

  // Determine stage start date without using Timer table
  const stageStartRaw =
    a.last_status_change ||
    a.status_changed_at ||
    a.status_updated_at ||
    a.updated_at ||
    a.date_updated ||
    a.date_received ||
    a.entry_date ||
    a.date_of_signing;

  return {
    // IDs and identifiers
    id: a.dts_number || a.id || a.agreement_id || '',    
    dts_no: a.dts_number || '',

    // Partner and org
    partner_name: a.name || a.partner_name || '',
    entity_type: a.entity_type || '',
    country: a.country || '',
    region: a.region || '',
    address: a.address || '',

    // People
    point_position: firstPoint?.position || a.point_position || '',
    point_name: firstPoint?.name || a.point_name || a.point_person || '',
    point_email: firstPoint?.email || a.point_email || '',
    contact_person: firstContact?.name || a.contact_person || '',
    contact_email: firstContact?.email || a.contact_email || '',

    // Document meta
    document_type: a.document_type || '',
    partnership_classification: a.partnership_type || a.partnership_classification || '',
    validity_period: a.validity_period ? String(a.validity_period) : '',
    date_of_signing: a.date_signed || a.date_of_signing || '',
    expiry: a.date_expiry || a.expiry || '',
    date_received: a.entry_date || a.date_received || '',

    // Lifecycle
    status: a.agreement_status || a.status || '',
    // days_in_stage and delayed are not computed from any timer; keep safe defaults
    days_in_stage: typeof a.days_in_stage === 'number' ? a.days_in_stage : 0,
    delayed: typeof a.days_in_stage === 'number' ? a.days_in_stage >= 3 : false,

    // Relations
    related_mou: a.related_mou || a.MOU_to_MOA_id || a.mou_number || null,

    // Misc (for modal fields)
    signatories: Array.isArray(a.signatories) ? a.signatories.map(s => s.name || s).join('; ') : (a.signatories || ''),
    website_link: a.website_link || '',
    event_title: a.event_title || '',
    brief_profile: a.brief_profile || '',
    hardcopy_locator: a.hardcopy_locator || '',
    logo: a.logo || '',

    // Internal helper for stage computation
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

const Overview1 = () => {
  const [mobileShow, setMobileShow] = useState(false);
  const [agreements, setAgreements] = useState([]);
  const [filterStage, setFilterStage] = useState('');
  const [filterClassification, setFilterClassification] = useState('');
  const [filterValidity, setFilterValidity] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [tmpClassification, setTmpClassification] = useState('');
  const [tmpValidity, setTmpValidity] = useState('');
  const [tmpCountry, setTmpCountry] = useState('');
  const [filterDelayed, setFilterDelayed] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const containerRef = useRef();
  const filterPanelRef = useRef();
  const modalFirstFieldRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

 const fetchAgreements = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await agreementService.getAgreements();
      const filtered = (data || []).filter(
        a => a.agreement_status !== 'Active' && a.agreement_status !== 'Withdrawn'
      );
      const mapped = filtered.map(mapAgreement).map(computeStageInfo);
      setAgreements(mapped);
    } catch (err) {
      console.error('Failed to fetch agreements:', err);
      setError(err.message || 'Failed to fetch agreements');
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStage, filterClassification, filterValidity, filterCountry, searchText, activeTab, agreements]);

  const classificationOptions = useMemo(() => {
    return Array.from(new Set(agreements.map(a => a.partnership_classification).filter(Boolean))).sort();
  }, [agreements]);

  const countryOptions = useMemo(() => {
    return Array.from(new Set(agreements.map(a => a.country).filter(Boolean))).sort();
  }, [agreements]);

  const validityOptions = useMemo(() => {
    return Array.from(new Set(agreements.map(a => a.validity_period).filter(Boolean))).sort();
  }, [agreements]);

  const STAGE_LIST = useMemo(() => LIFECYCLE_OPTIONS.filter(o => o.value), []);

  const baseList = useMemo(() => {
    return agreements.filter(a => {
      if (activeTab === 'MOA' && a.document_type !== 'MOA') return false;
      if (activeTab === 'MOU' && a.document_type !== 'MOU') return false;
      if (filterDelayed && !a.delayed) return false;
      if (filterClassification && a.partnership_classification !== filterClassification) return false;
      if (filterCountry && a.country !== filterCountry) return false;
      if (filterValidity && a.validity_period !== filterValidity) return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        const fields = [
          a.id, a.dts_no,
          a.partner_name,
          a.contact_person,
          a.point_name,
          a.country,
        ].filter(Boolean).map(v => String(v).toLowerCase());
        if (!fields.some(f => f.includes(s))) return false;
      }
      return true;
    });
  }, [agreements, activeTab, filterClassification, filterCountry, filterValidity, searchText]);

  const stageCounts = useMemo(() => {
    const counts = {};
    STAGE_LIST.forEach(s => {
      counts[s.value] = baseList.filter(b => b.status === s.value).length;
    });
    return counts;
  }, [baseList, STAGE_LIST]);

  const stageHasDelayed = useMemo(() => {
    const map = {};
    STAGE_LIST.forEach(s => {
      map[s.value] = baseList.some(b => b.status === s.value && b.delayed);
    });
    return map;
  }, [baseList, STAGE_LIST]);

  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  const openDetails = (row) => {
    setSelected({ ...row });
    setDetailOpen(true);
  };

  const closeDetails = () => {
    setDetailOpen(false);
    setSelected(null);
  };

const saveDetails = () => {
  if (!selected) return;
  setAgreements(prev =>
    prev.map(r => (r.id === selected.id ? computeStageInfo(selected) : r))
  );
  closeDetails();
};

  const deleteRow = (id) => {
    if (!window.confirm('Delete this agreement?')) return;
    setAgreements(prev => prev.filter(r => r.id !== id));
  };

  const toggleMenu = (id) => {
    setMenuOpenId(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
      if (showFilterPanel && filterPanelRef.current && !filterPanelRef.current.contains(e.target)) {
        setShowFilterPanel(false);
        setTmpClassification(filterClassification);
        setTmpValidity(filterValidity);
        setTmpCountry(filterCountry);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFilterPanel, filterClassification, filterValidity, filterCountry]);

  const handleLogoUpload = (e) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const url = URL.createObjectURL(file);
     setSelected(s => ({ ...s, logoFile: file, logo: url }));
   };

  const filtered = agreements.filter(a => {
    if (activeTab === 'MOA' && a.document_type !== 'MOA') return false;
    if (activeTab === 'MOU' && a.document_type !== 'MOU') return false;
    if (filterDelayed && !a.delayed) return false;
    if (filterStage && a.status !== filterStage) return false;
    if (filterClassification && a.partnership_classification !== filterClassification) return false;
    if (filterCountry && a.country !== filterCountry) return false;
    if (filterValidity && a.validity_period !== filterValidity) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      const fields = [
        a.id, a.dts_no,
        a.partner_name,
        a.contact_person,
        a.point_name,
        a.country,
      ].filter(Boolean).map(v => String(v).toLowerCase());
      if (!fields.some(f => f.includes(s))) return false;
    }
    return true;
  });

  const pendingCount = filtered.length; 
  const needsAttention = filtered.filter(a => a.delayed).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);
  const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const showRelated = activeTab !== 'MOU';
  const tableCols = showRelated ? 11 : 10;

  useEffect(() => {
    if (!detailOpen) return;
    setTimeout(() => modalFirstFieldRef.current?.focus(), 80);
    function onKey(e) {
      if (e.key === 'Escape') closeDetails();
      if (e.key === 'ArrowLeft') navigateDetail(-1);
      if (e.key === 'ArrowRight') navigateDetail(1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailOpen]);

  const navigateDetail = (dir) => {
    if (!selected) return;
    const idx = filtered.findIndex(f => f.id === selected.id);
    if (idx === -1) return;
    const next = filtered[idx + dir];
    if (next) setSelected({ ...next });
  };

  const goToPage = (n) => {
    if (n < 1 || n > totalPages) return;
    setCurrentPage(n);
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const activateAgreement = (agreement) => {
    if (!window.confirm(`Activate ${agreement.id} as active agreement?`)) return;
    setAgreements(prev => prev.filter(r => r.id !== agreement.id));
    navigate('/active-agreements', { state: { activated: agreement } });
  };

  return (
    <div className="dashboard-container overview1-page">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}

      <div className="content-body">
        <Sidebar mobileShow={mobileShow} />

        <div className="main-content" onClick={() => mobileShow && setMobileShow(false)}>
          <div className="overview1-inner">

            {error && (
              <div style={{ marginBottom: 12, color: '#b00020' }}>
                {error}
              </div>
            )}
            {loading && (
              <div style={{ marginBottom: 12 }}>
                Loading agreements...
              </div>
            )}

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

            <div className="overview1-controls-row">
              <input
                className="overview1-search-input"
                placeholder="Search by title, partner, or agreement ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <button
                className={`overview1-filter-btn ${showFilterPanel ? 'open' : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowFilterPanel(v => {
                  if (!v) { setTmpClassification(filterClassification); setTmpValidity(filterValidity); setTmpCountry(filterCountry); }
                  return !v;
                }); }}
                aria-expanded={showFilterPanel}
                aria-controls="overview1-filter-panel"
                title="Filters"
              >
                Filters
              </button>
              <button className="btn generate">Generate Report</button>
            </div>
 
             {/* Filter panel (toggle) */}
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
                    {showRelated && <th>Related MOU</th>}
                    <th>Current Status</th>
                    <th>Days in Lifecycle</th>
                    <th>Point Person</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={tableCols} style={{ textAlign: 'center', padding: '24px' }}>
                        No agreements found
                      </td>
                    </tr>
                  )}
                  {paged.map((row) => (
                    <tr
                      key={row.id}
                      className={`${row.delayed ? 'delayed-row' : ''} ${row.delay_level ? `delay-${row.delay_level}` : ''}`}
                    >
                      <td className="id-cell">
                        {row.delayed && (
                          <span className={`warning-icon ${row.delay_level}`} title="Delayed">!</span>
                        )}
                        <span className="id-text">{row.id}</span>
                      </td>
                      <td className="partner-cell">
                        <div className="partner-name">{row.partner_name}</div>
                        <div className="partner-sub">{row.position || row.entity_type}</div>
                      </td>
                     <td>{row.country || '—'}</td>
                     <td>{row.partnership_classification || '—'}</td>
                     <td>{row.validity_period || '—'}</td>
                      <td>
                        <span className={`badge doc ${row.document_type === 'MOA' ? 'moa' : 'mou'}`}>
                          {row.document_type}
                        </span>
                      </td>
                      {showRelated && (
                        <td>
                          {row.related_mou ? (
                            <span className="related-mou">
                              {row.related_mou}
                              <div className="req">Required</div>
                            </span>
                          ) : '—'}
                        </td>
                      )}
                      <td>
                        <span className={`status-badge status-${slugifyStatus(row.status)}`}>
                          {LIFECYCLE_OPTIONS.find(o => o.value === row.status)?.label || row.status}
                        </span>
                      </td>
                      <td>
                        <div className="days">
                          {row.days_in_stage} days {row.delayed && <span className="delay-note">Delayed</span>}
                        </div>
                      </td>
                      <td>
                        <div className="pp-person">
                          {((row.point_position || row.position) ? `${row.point_position || row.position}: ` : '') +
                            (row.point_name || row.point_person || '—') +
                            (row.point_email ? ` (${row.point_email})` : (row.contact_email ? ` (${row.contact_email})` : ''))}
                        </div>
                      </td>
                      <td className="actions-cell">
                        <button className="icon-btn" title="View" onClick={() => openDetails(row)}>
                          👁️
                        </button>
                        {/* show Activate for FFUPCopy status */}
                        {row.status === 'FFUPCopy' && (
                          <button className="icon-btn activate" title="Activate" onClick={() => activateAgreement(row)}>
                            Activate
                          </button>
                        )}
                        <button className="icon-btn" title="Delete" onClick={() => deleteRow(row.id)}>
                          🗑️
                        </button>
                         <div className="dots-menu">
                           <button className="icon-btn dots" onClick={(e) => { e.stopPropagation(); toggleMenu(row.id); }}>
                             ⋯
                           </button>
                           {menuOpenId === row.id && (
                             <div className="menu-popup" onClick={(e) => e.stopPropagation()}>
                               <button className="menu-item">View File</button>
                               <button className="menu-item">View Older Files</button>
                               <button className="menu-item">Upload New Version</button>
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
                <button className="page-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`} onClick={() => goToPage(i + 1)}>{i + 1}</button>
                ))}
                <button className="page-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
              </div>
              <div className="page-info">Showing {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filtered.length, currentPage * itemsPerPage)} of {filtered.length}</div>
            </div>

            {detailOpen && selected && (
              <div className="overview1-modal-backdrop" onClick={closeDetails}>
                <div className="overview1-modal" onClick={(e) => e.stopPropagation()}>
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
                    <div className="overview1-details-grid overview1-form-grid">
                      {/* Date */}
                      <label className="field">
                        Date
                        <input
                          ref={modalFirstFieldRef}
                          type="date"
                          value={selected.date || ''}
                          onChange={(e) => setSelected(s => ({ ...s, date: e.target.value }))}
                        />
                      </label>

                      {/* Source */}
                      <label className="field">
                        Source
                        <input
                          value={selected.source || ''}
                          onChange={(e) => setSelected(s => ({ ...s, source: e.target.value }))}
                        />
                      </label>

                      {/* Point person / position*/}
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
                                  // reset the cycle start so the 3-day grace restarts now
                                  _stage_start_at: now,
                                  last_status_change: now, 
                                  // live UI reset
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
                          {STATUS_OPTIONS.map(o => <option key={o.status} value={o.status}>{o.label}</option>)}
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
                          options={COUNTRY_LIST}
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

                      {/* Contact person / details*/}
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
                          options={[
                            ...PARTNERSHIP_TYPE_OPTIONS,
                            ...classificationOptions
                              .filter(c => !PARTNERSHIP_TYPE_OPTIONS.find(p => p.value === c))
                              .map(c => ({ value: c, label: c })),
                          ]}
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
                          {Array.from(new Set([...VALIDITY_OPTIONS_STATIC, ...validityOptions])).map(v => <option key={v} value={v}>{v}</option>)}
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
                  </div>

                  <div className="overview1-modal-footer">
                    <button className="btn cancel" onClick={closeDetails}>Cancel</button>
                    <button className="btn save" onClick={saveDetails}>Save</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview1;
