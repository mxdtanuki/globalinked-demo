import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FiEye,
  FiTrash2,
  FiMoreVertical,
  FiFileText,
  FiArchive,
  FiUpload,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiX,
  FiLink,
  FiEdit,
  FiUploadCloud,
  FiFile,
  FiMessageCircle,
  FiInfo,
  FiPrinter,
  FiTag,
  FiCalendar,
  FiMapPin,
  FiChevronDown,
  FiCheck,
  FiBarChart,
  FiSettings,
  FiDownload,
} from "react-icons/fi";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";
import "./layout.css";
import "./overview1.css";
import "../pages/activeAgreement.css";
import { agreementService } from "../services/agreementService";
import { documentService } from "../services/documentService";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/* ---------- Constants & helpers (copied/adapted from uploaded files) ---------- */

import TopBar from "./topbar";
import Sidebar from "./sidebar";

const LIFECYCLE_OPTIONS = [
  { value: "", label: "Select Status" },
  { value: "InitialReview", label: "Initial Review" },
  { value: "Endorse", label: "Endorse to ULCO for Review and Approval" },
  { value: "Revert", label: "Revert To Initiator with Comments" },
  { value: "Consultation", label: "For Consultation" },
  { value: "Replication", label: "Replication of Copies (8 sets)" },
  { value: "SignituresPUP", label: "For Signatures of PUP Officials" },
  { value: "SignedPUP", label: "Signed by PUP Officials" },
  { value: "SignituresPartner", label: "For Signatures of Partner" },
  { value: "SignedPartner", label: "Signed by Partner Institution" },
  { value: "Complete", label: "Completely Signed" },
  { value: "Notary", label: "For Notary" },
  { value: "FFUPCopy", label: "FFUP Copy From College/Campus" },
];

const DEFAULT_THRESHOLD_DAYS = 3;
const CRITICAL_THRESHOLD_DAYS = 7;
const STATUS_THRESHOLDS = {
  InitialReview: 3,
  Endorse: 3,
  Revert: 3,
  Consultation: 3,
  Replication: 3,
  SignituresPUP: 3,
  SignedPUP: 3,
  SignituresPartner: 3,
  SignedPartner: 3,
  Complete: 3,
  Notary: 3,
  FFUPCopy: 3,
};

const normalizeStatusIn = (s) => {
  const raw = String(s || "")
    .replace(/\s+/g, "")
    .toLowerCase();
  const map = {
    initialreview: "InitialReview",
    endorse: "Endorse",
    revert: "Revert",
    consultation: "Consultation",
    replication: "Replication",
    signiturespup: "SignituresPUP",
    signedpup: "SignedPUP",
    signiturespartner: "SignituresPartner",
    signedpartner: "SignedPartner",
    complete: "Complete",
    notary: "Notary",
    ffupcopy: "FFUPCopy",
  };
  return map[raw] || raw;
};

const normalizeRemarks = (r) => {
  if (!r) return [];
  if (Array.isArray(r))
    return r.map((item) =>
      typeof item === "object"
        ? item.remark_text || item.text || item.remark || ""
        : String(item)
    );
  if (typeof r === "string")
    return r
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
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
  if (!s) return "unknown";
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const asDataUrl = (val) => {
  if (!val) return "";
  if (typeof val !== "string") return "";
  if (val.startsWith("http") || val.startsWith("data:")) return val;
  return `data:image/png;base64,${val}`;
};

// REMOVED THE DUPLICATE: Keep only one formatSignatories function
const formatSignatories = (list) => {
  if (!Array.isArray(list) || list.length === 0) return "—";
  return list
    .map((s) => {
      const name = s.signatory_name || s.name || s.person || "";
      const pos = s.signatory_position || s.position || "";
      return [name && name.trim(), pos && `(${pos.trim()})`]
        .filter(Boolean)
        .join(" ");
    })
    .join("; ");
};

const toISODate = (val) => {
  if (!val) return "";
  if (val instanceof Date && !isNaN(val)) return val.toISOString().slice(0, 10);
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already ISO
  // MM/DD/YYYY or DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    let mm = parseInt(m[1], 10),
      dd = parseInt(m[2], 10),
      yyyy = parseInt(m[3], 10);
    // if first part > 12, treat as DD/MM/YYYY
    if (mm > 12) [dd, mm] = [mm, dd];
    const pad = (n) => String(n).padStart(2, "0");
    return `${yyyy}-${pad(mm)}-${pad(dd)}`;
  }
  const t = Date.parse(s);
  if (Number.isFinite(t)) return new Date(t).toISOString().slice(0, 10);
  return ""; // unknown format
};

const mapAgreement = (a = {}) => {
  const stageStartRaw =
    a.last_status_change ||
    a.status_changed_at ||
    a.status_updated_at ||
    a.updated_at ||
    a.date_updated ||
    a.date_received ||
    a.entry_date ||
    a.date_of_signing ||
    a.date_signed;

  // normalize people arrays -> {position,name,email}
  const normalizePeople = (arr = [], kind) =>
    Array.isArray(arr)
      ? arr.map((p) => ({
          position: p.position || p[`${kind}_person_position`] || p.title || "",
          name:
            p.name || p[`${kind}_person_name`] || p.full_name || p.person || "",
          email: p.email || p[`${kind}_person_email`] || p.mail || "",
        }))
      : [];

  const point_people = normalizePeople(a.point_persons, "point");
  const contact_people = normalizePeople(a.contact_persons, "contact");

  // signatories to single-line text
  const sigString =
    a.signatories ||
    a.signatories_text ||
    a.signatories_str ||
    a.signatory_names ||
    a.signatories_names ||
    "";
  const signatories_list = Array.isArray(a.signatories_list)
    ? a.signatories_list
    : Array.isArray(a.signatories)
    ? a.signatories
    : typeof sigString === "string"
    ? sigString
        .split(/[,;\n]+/)
        .map((n) => n.trim())
        .filter(Boolean)
        .map((name) => ({ name }))
    : [];
  const signatoriesText = formatSignatories(signatories_list);

  const _parsed_days = (() => {
    const v = a.days_in_stage;
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)))
      return Number(v);
    if (v && typeof v === "object" && v instanceof Date && !isNaN(v)) {
      const diff = Math.floor(
        (Date.now() - v.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.max(0, diff);
    }
    return 0;
  })();

  return {
    // identifiers
    agreement_id: a.agreement_id || a.id || null,
    _pk: a.agreement_id ?? a.id ?? a.dts_number ?? a.dts_no,
    id: a.dts_number || a.dts_no || a.id || a.agreement_id || "",
    dts_no: a.dts_number || a.dts_no || "",

    // core info
    partner_name: a.name || a.partner_name || "",
    entity_type: a.entity_type || "",
    country: a.country || "",
    region: a.region || "",
    address: a.address || "",
    source_unit: a.source_unit || a.source || a.initiating_unit || "",

    // people (single + list)
    point_position: point_people[0]?.position || a.point_position || "",
    point_name: point_people[0]?.name || a.point_name || a.point_person || "",
    point_email: point_people[0]?.email || a.point_email || "",
    contact_position: contact_people[0]?.position || a.contact_position || "",
    contact_name:
      contact_people[0]?.name || a.contact_name || a.contact_person || "",
    contact_person: contact_people[0]?.name || a.contact_person || "",
    contact_email: contact_people[0]?.email || a.contact_email || "",
    point_people: point_people.length ? point_people : undefined,
    contact_people: contact_people.length ? contact_people : undefined,

    // classification
    document_type: a.document_type || "",
    partnership_classification:
      a.partnership_type || a.partnership_classification || "",
    validity_period: a.validity_period != null ? String(a.validity_period) : "",

    // dates/status
    status: normalizeStatusIn(a.agreement_status || a.status || ""),
    date_of_signing: toISODate(a.date_signed || a.date_of_signing || ""),
    expiry: toISODate(a.date_expiry || a.expiry || ""),
    date_received: toISODate(a.entry_date || a.date_received || a.date || ""),
    date_endorsed_ulco: toISODate(
      a.date_endorsed_ulco || a.date_endorsed_to_ulco || ""
    ),
    ulco_approval: toISODate(a.ulco_approval || a.date_ulco_approved || ""),
    pup_official_sign: toISODate(
      a.pup_official_sign || a.date_signed_by_pup || ""
    ),

    // computed timing
    days_in_stage: _parsed_days,
    delayed: _parsed_days >= DEFAULT_THRESHOLD_DAYS,

    // related documents
    related_mou: a.related_mou || a.MOU_to_MOA_id || a.mou_number || null,
    signatories: signatoriesText,
    signatories_list,
    website_link: a.website_link || a.website_url || "",
    event_title: a.event_title || a.event_info || "",
    brief_profile: a.brief_profile || a.description || "",
    hardcopy_locator: a.hardcopy_locator || a.hardcopy_location || "",
    logo: asDataUrl(a.logo_url) || asDataUrl(a.logo_path) || asDataUrl(a.logo),
    remarks: normalizeRemarks(a.remarks_list || a.remarks),

    _stage_start_at: stageStartRaw || null,
  };
};

// Days in stage is now computed on the backend

const applyBackendStageData = (agreement) => {
  if (!agreement) return agreement;

  const days =
    typeof agreement.days_in_stage === "number" ? agreement.days_in_stage : 0;

  // derive delayed flag and optional delay level when backend omitted these
  const delayed = days >= DEFAULT_THRESHOLD_DAYS;
  const delay_level =
    days >= CRITICAL_THRESHOLD_DAYS
      ? "critical"
      : delayed
      ? "warning"
      : undefined;

  return {
    ...agreement,
    days_in_stage: days,
    // if backend already provided a delayed boolean, prefer it; otherwise fall back
    delayed: agreement.delayed != null ? agreement.delayed : delayed,
    // provide a delay_level used by the UI for styling (warning/critical)
    delay_level: agreement.delay_level || delay_level,
  };
};

const RelatedMou = (row, all = []) => {
  if (!row) return row;
  const rel = row.related_mou;
  if (!rel) return row;
  // if it's already a string that looks like a DTS number, keep it
  if (typeof rel === "string" && rel.trim() && !/^\d+$/.test(rel.trim()))
    return row;
  // build lookup from agreement_id -> dts_no
  try {
    const lookup = (Array.isArray(all) ? all : []).reduce((acc, r) => {
      if (r && r.agreement_id != null)
        acc[String(r.agreement_id)] = r.dts_no || r.id || r._pk || "";
      return acc;
    }, {});
    const key = String(rel);
    if (lookup[key]) return { ...row, related_mou: lookup[key] };
  } catch (e) {
    // ignore resolution errors and return original row
  }
  return row;
};

// Helper to get initials for partner logo fallback
const getInitials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

// Helper to resolve logo path
const LogoSrc = (lp) => {
  if (!lp) return null;
  try {
    if (typeof lp === "string") {
      if (lp.startsWith("data:image")) return lp;
      if (lp.startsWith("iVBORw0")) return `data:image/png;base64,${lp}`;
      if (lp.startsWith("/9j/")) return `data:image/jpeg;base64,${lp}`;
      if (lp.startsWith("http://") || lp.startsWith("https://")) return lp;
      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      return `${API_BASE_URL.replace(/\/$/, "")}/${lp.replace(/^\/+/, "")}`;
    }
  } catch (err) {
    console.warn("LogoSrc error:", err, lp);
  }
  return null;
};

// Helper to format contact persons for display
const formatContactPersons = (v) => {
  if (!v) return "N/A";
  if (Array.isArray(v)) {
    return v
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item;
        return (
          item.point_person_name ||
          item.contact_person_name ||
          item.name ||
          item.full_name ||
          item.displayName ||
          item.person_name ||
          ""
        );
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof v === "object") {
    return (
      v.point_person_name ||
      v.contact_person_name ||
      v.name ||
      v.full_name ||
      v.displayName ||
      JSON.stringify(v)
    );
  }
  return String(v);
};

const formatContactEmails = (v) => {
  if (!v) return "";
  if (Array.isArray(v)) {
    return v
      .map((item) =>
        typeof item === "string"
          ? item
          : item.point_person_email ||
            item.email ||
            item.contact_person_email ||
            ""
      )
      .filter(Boolean)
      .join(", ");
  }
  if (typeof v === "object")
    return v.point_person_email || v.email || v.contact_person_email || "";
  return String(v);
};

// REMOVED THE DUPLICATE formatSignatories function that was here

// Helper to remove agreements that should not appear in the overview
// NOTE: exclude only 'Active' status from the overview; keep 'Withdrawn' visible
const excludeActive = (list = []) => {
  if (!Array.isArray(list)) return [];
  return list.filter((a) => {
    const s = String(a?.status || a?.agreement_status || "").toLowerCase();
    return s !== "active" && s !== "withdrawn";
  });
};

/* ---------- Small UI helpers reused from overview1 ---------- */

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  allowClear = true,
}) => {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef();

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const filtered = normalized.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );
  const selectedLabel =
    normalized.find((o) => String(o.value) === String(value))?.label || "";

  return (
    <div
      className="searchable-select"
      ref={ref}
      style={{ position: "relative" }}
    >
      <button
        type="button"
        className="ss-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`ss-value ${selectedLabel ? "" : "placeholder"}`}>
          {selectedLabel || placeholder}
        </span>
        <span className="ss-caret">▾</span>
      </button>
      {allowClear && selectedLabel && (
        <button
          className="ss-clear"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
            setQuery("");
          }}
        >
          ×
        </button>
      )}
      {open && (
        <div
          className="ss-panel"
          role="dialog"
          style={{
            position: "absolute",
            zIndex: 40,
            background: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            marginTop: 6,
            width: 320,
            maxHeight: 260,
            overflow: "auto",
          }}
        >
          <div style={{ padding: 8 }}>
            <input
              autoFocus
              className="ss-search"
              placeholder="Type to search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <ul
            className="ss-list"
            role="listbox"
            aria-label="options"
            style={{ listStyle: "none", margin: 0, padding: 0 }}
          >
            {filtered.length === 0 && (
              <li style={{ padding: 8, color: "#666" }}>No results</li>
            )}
            {filtered.map((o) => (
              <li
                key={o.value}
                className="ss-item"
                style={{ padding: 8, cursor: "pointer" }}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQuery("");
                }}
              >
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

const MultiPersonField = ({
  listKey,
  legacyKeys,
  selected,
  setSelected,
  disabled = false,
}) => {
  const list = Array.isArray(selected?.[listKey]) ? selected[listKey] : [];
  const legacyItem = {
    position: selected?.[legacyKeys?.positionKey] || "",
    name: selected?.[legacyKeys?.nameKey] || "",
    email: selected?.[legacyKeys?.emailKey] || "",
  };
  const value = list.length
    ? list
    : legacyItem.name || legacyItem.position || legacyItem.email
    ? [legacyItem]
    : [];

  const updateAt = (idx, key, val) => {
    if (disabled) return;
    setSelected((s) => {
      const arr =
        Array.isArray(s?.[listKey]) && s[listKey].length
          ? [...s[listKey]]
          : [...value];
      arr[idx] = { ...(arr[idx] || {}), [key]: val };
      return { ...s, [listKey]: arr };
    });
  };
  const add = () => {
    if (disabled) return;
    setSelected((s) => ({
      ...s,
      [listKey]: [...value, { position: "", name: "", email: "" }],
    }));
  };
  const remove = (idx) => {
    if (disabled) return;
    setSelected((s) => ({
      ...s,
      [listKey]: value.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="multi-list">
      {value.map((p, idx) => (
        <div key={idx} className="multi-row">
          <input
            placeholder="Position"
            value={p.position || ""}
            onChange={(e) => updateAt(idx, "position", e.target.value)}
            disabled={disabled}
          />
          <input
            placeholder="Name"
            value={p.name || ""}
            onChange={(e) => updateAt(idx, "name", e.target.value)}
            disabled={disabled}
          />
          <input
            placeholder="Email"
            value={p.email || ""}
            onChange={(e) => updateAt(idx, "email", e.target.value)}
            disabled={disabled}
          />
          <button
            type="button"
            className="icon-btn"
            title="Remove"
            onClick={() => remove(idx)}
            disabled={disabled}
          >
            🗑️
          </button>
        </div>
      ))}
      <button type="button" className="btn" onClick={add} disabled={disabled}>
        Add
      </button>
    </div>
  );
};

const MultiRemarkField = ({
  listKey,
  selected,
  setSelected,
  disabled = false,
}) => {
  const list = Array.isArray(selected?.[listKey])
    ? selected[listKey]
    : selected?.remarks
    ? [selected.remarks]
    : [];
  const updateAt = (idx, val) => {
    if (disabled) return;
    setSelected((s) => {
      const arr = [...list];
      arr[idx] =
        typeof arr[idx] === "object" ? { ...arr[idx], text: val } : val;
      return { ...s, [listKey]: arr };
    });
  };
  const add = () => {
    if (disabled) return;
    setSelected((s) => ({ ...s, [listKey]: [...list, ""] }));
  };
  const remove = (idx) => {
    if (disabled) return;
    setSelected((s) => ({ ...s, [listKey]: list.filter((_, i) => i !== idx) }));
  };
  return (
    <div className="multi-list">
      {list.map((r, i) => (
        <div key={i} className="multi-row">
          <input
            value={
              typeof r === "object" ? r.remark_text || r.text || "" : r || ""
            }
            onChange={(e) => updateAt(i, e.target.value)}
            disabled={disabled}
          />
          <button
            type="button"
            className="icon-btn"
            title="Remove"
            onClick={() => remove(i)}
            disabled={disabled}
          >
            <FiX className="icon" />
          </button>
        </div>
      ))}
      <button type="button" className="btn" onClick={add} disabled={disabled}>
        Add
      </button>
    </div>
  );
};

/* ---------- Main component ---------- */

const OverviewMerged = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileShow, setMobileShow] = useState(false);

  const [filterStage, setFilterStage] = useState("");
  const [filterClassification, setFilterClassification] = useState("");
  const [filterValidity, setFilterValidity] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterDelayed, setFilterDelayed] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const [activeTab, setActiveTab] = useState("All");

  // tmp filters for panel (Overview1 pattern)
  const [tmpClassification, setTmpClassification] = useState("");
  const [tmpValidity, setTmpValidity] = useState("");
  const [tmpCountry, setTmpCountry] = useState("");

  // modal / detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
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

  // Helper to check admin privileges. Accepts an optional user object, defaults
  // to the currentUser state. This is intentionally permissive in what it
  // recognizes as an "admin" flag to support different backends (is_admin,
  // isAdmin, role string, roles array, permissions array).
  const isAdminUser = (user = currentUser) => {
    const u = user || currentUser;
    if (!u) return false;
    if (u.is_admin || u.isAdmin) return true;
    if (typeof u.role === "string" && /admin|administrator/i.test(u.role))
      return true;
    // some payloads use `user_role` or `role_name`
    if (
      typeof u.user_role === "string" &&
      /admin|administrator/i.test(u.user_role)
    )
      return true;
    if (
      typeof u.role_name === "string" &&
      /admin|administrator/i.test(u.role_name)
    )
      return true;
    if (Array.isArray(u.roles) && u.roles.some((r) => /admin/i.test(String(r))))
      return true;
    if (Array.isArray(u.permissions) && u.permissions.includes("admin"))
      return true;
    return false;
  };

  // generate report modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateDocType, setGenerateDocType] = useState("All");
  const [generateStatus, setGenerateStatus] = useState("All");

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const containerRef = useRef();
  const filterPanelRef = useRef();
  const modalFirstFieldRef = useRef(null);

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) setCurrentUser(JSON.parse(userStr));
    } catch (e) {
      /* ignore */
    }
  }, []);

  const {
    data: rawAgreements,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["agreements"], // Unique key for caching/deduplication
    queryFn: async () => {
      const data = await agreementService.getAgreements();
      const raw = Array.isArray(data) ? data : data?.items || [];
      // agreements with status 'Active' or 'Withdrawn'
      const filtered = raw.filter((a) => {
        const s = String(a?.agreement_status || a?.status || "").toLowerCase();
        return s !== "active" && s !== "withdrawn";
      });
      let mapped = filtered.map(mapAgreement).map(applyBackendStageData);
      // Replace related_mou ids with the related agreement's DTS number when available
      try {
        const lookup = Object.fromEntries(
          mapped.map((m) => [String(m.agreement_id), m.dts_no || m.id || ""])
        );
        mapped = mapped.map((m) => {
          if (!m?.related_mou) return m;
          const k = String(m.related_mou);
          if (lookup[k]) return { ...m, related_mou: lookup[k] };
          return m;
        });
      } catch (e) {
        // ignore resolution errors
      }
      return mapped;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to prevent refetches
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const agreements = rawAgreements || [];

  // map of related agreement id -> dts_no (populated on-demand when related agreement
  // isn't already present in the fetched agreements list)
  const [relatedDtsMap, setRelatedDtsMap] = useState({});

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterStage,
    filterClassification,
    filterValidity,
    filterCountry,
    searchText,
    activeTab,
    agreements,
  ]);

  // Resolve any numeric related_mou ids that weren't matched when mapping.
  useEffect(() => {
    // collect numeric ids that need resolution
    const needs = new Set();
    const presentLookup = Object.fromEntries(
      agreements.map((a) => [String(a.agreement_id), a.dts_no || a.id || ""])
    );
    for (const a of agreements) {
      const rel = a?.related_mou;
      if (!rel) continue;
      const key = String(rel);
      // if it's numeric and not already resolved in the present lookup and not already fetched
      if (/^\d+$/.test(key) && !presentLookup[key] && !relatedDtsMap[key])
        needs.add(key);
    }
    if (needs.size === 0) return;

    // fetch each missing related agreement by id
    const fetches = Array.from(needs).map(async (id) => {
      try {
        if (typeof agreementService.getAgreementById === "function") {
          const full = await agreementService.getAgreementById(Number(id));
          const dts = full?.dts_number || full?.dts_no || full?.id || "";
          // set either the found dts or empty string to mark attempted resolution
          setRelatedDtsMap((prev) => ({ ...prev, [id]: dts || "" }));
        } else {
          setRelatedDtsMap((prev) => ({ ...prev, [id]: "" }));
        }
      } catch (e) {
        // mark as attempted (empty) so we don't retry forever
        setRelatedDtsMap((prev) => ({ ...prev, [id]: "" }));
      }
    });
    // run fetches, no need to await here
    Promise.all(fetches).catch(() => {});
  }, [agreements, relatedDtsMap]);

  const STAGE_LIST = useMemo(
    () => LIFECYCLE_OPTIONS.filter((o) => o.value),
    []
  );
  const classificationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          agreements.map((a) => a.partnership_classification).filter(Boolean)
        )
      ),
    [agreements]
  );
  const validityOptions = useMemo(
    () =>
      Array.from(
        new Set(agreements.map((a) => a.validity_period).filter(Boolean))
      ),
    [agreements]
  );
  const countryOptions = useMemo(
    () => Array.from(new Set(agreements.map((a) => a.country).filter(Boolean))),
    [agreements]
  );

  const baseList = useMemo(
    () =>
      agreements.filter((a) => {
        if (activeTab === "MOA" && a.document_type !== "MOA") return false;
        if (activeTab === "MOU" && a.document_type !== "MOU") return false;
        if (filterDelayed && !a.delayed) return false;
        if (
          filterClassification &&
          a.partnership_classification !== filterClassification
        )
          return false;
        if (filterCountry && a.country !== filterCountry) return false;
        if (filterValidity && a.validity_period !== filterValidity)
          return false;
        if (debouncedSearchText) {
          // Use debounced value
          const s = debouncedSearchText.toLowerCase();
          const fields = [
            a.id,
            a.dts_no,
            a.partner_name,
            a.contact_person,
            a.point_name,
            a.country,
          ]
            .filter(Boolean)
            .map((v) => String(v).toLowerCase());
          if (!fields.some((f) => f.includes(s))) return false;
        }
        return true;
      }),
    [
      agreements,
      activeTab,
      filterClassification,
      filterCountry,
      filterValidity,
      debouncedSearchText,
      filterDelayed,
    ]
  );

  const filtered = baseList.filter((a) => {
    if (filterStage && a.status !== filterStage) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);
  const paged = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPk = (row) =>
    row?.agreement_id ?? row?._pk ?? row?.id ?? row?.dts_no;

  // counts for summary and stage cards (Overview1-style)
  // pendingCount should represent the total pending agreements (ignoring the
  // "filterDelayed" toggle) so it doesn't change when the user clicks
  // the "Needs Attention" summary card. We still respect other filters like
  // activeTab / classification / country / validity / search text.
  const pendingCount = useMemo(
    () =>
      agreements.filter((a) => {
        if (activeTab === "MOA" && a.document_type !== "MOA") return false;
        if (activeTab === "MOU" && a.document_type !== "MOU") return false;
        // NOTE: intentionally do NOT filter by filterDelayed here
        if (
          filterClassification &&
          a.partnership_classification !== filterClassification
        )
          return false;
        if (filterCountry && a.country !== filterCountry) return false;
        if (filterValidity && a.validity_period !== filterValidity)
          return false;
        if (debouncedSearchText) {
          const s = debouncedSearchText.toLowerCase();
          const fields = [
            a.id,
            a.dts_no,
            a.partner_name,
            a.contact_person,
            a.point_name,
            a.country,
          ]
            .filter(Boolean)
            .map((v) => String(v).toLowerCase());
          if (!fields.some((f) => f.includes(s))) return false;
        }
        return true;
      }).length,
    [
      agreements,
      activeTab,
      filterClassification,
      filterCountry,
      filterValidity,
      debouncedSearchText,
    ]
  );

  const needsAttention = baseList.filter((a) => a.delayed).length;
  const stageCounts = useMemo(() => {
    const map = {};
    for (const s of STAGE_LIST) map[s.value] = 0;
    for (const a of baseList) {
      if (a.status && map[a.status] !== undefined) map[a.status] += 1;
    }
    return map;
  }, [baseList, STAGE_LIST]);
  const stageHasDelayed = useMemo(() => {
    const map = {};
    for (const s of STAGE_LIST) map[s.value] = false;
    for (const a of baseList) {
      if (a.status && a.delayed) map[a.status] = true;
    }
    return map;
  }, [baseList, STAGE_LIST]);

  /* ---------- Detail modal helpers (open/hydrate/save) ---------- */

  const loadAgreementDetails = async (rowOrId) => {
    const row = typeof rowOrId === "object" ? rowOrId : null;
    // Prefer canonical PK using helper (agreement_id, _pk, id, or dts_no)
    const byId = row ? getPk(row) : rowOrId;
    const byDts = row ? row.dts_no || row.id || null : null;
    setModalLoading(true);
    setModalError("");
    try {
      let full = null;
      // Debug: log what we're trying to fetch
      // console.debug('loadAgreementDetails: byId=', byId, 'byDts=', byDts, 'row=', row);
      if (byId) {
        // try primary id route first
        try {
          full = await agreementService.getAgreementById(byId);
        } catch (err) {
          // If getAgreementById fails (404 or other), try sensible fallbacks:
          // 1) if row has a displayed DTS (row.id or row.dts_no) try getAgreementByDts
          // 2) if not, try getAgreementByDts using the byId value as a last resort
          const tryDts = (row && (row.dts_no || row.id)) || null;
          if (
            tryDts &&
            typeof agreementService.getAgreementByDts === "function"
          ) {
            try {
              full = await agreementService.getAgreementByDts(tryDts);
            } catch (e2) {
              // second fallback: if byId might actually be a DTS string, try it
              if (typeof agreementService.getAgreementByDts === "function") {
                full = await agreementService.getAgreementByDts(String(byId));
              } else {
                throw err;
              }
            }
          } else if (typeof agreementService.getAgreementByDts === "function") {
            // try using byId as a DTS when nothing else available
            full = await agreementService.getAgreementByDts(String(byId));
          } else {
            throw err;
          }
        }
      } else if (byDts) {
        if (typeof agreementService.getAgreementByDts === "function") {
          full = await agreementService.getAgreementByDts(byDts);
        } else {
          full = await agreementService.getAgreementById(byDts);
        }
      }

      let mapped = applyBackendStageData(mapAgreement(full));
      // try to resolve related MOU id -> DTS number using the current agreements list
      mapped = RelatedMou(mapped, agreements);
      setSelected(mapped);
      if (!isEditing) originalRef.current = mapped;
    } catch (e) {
      console.error("Failed to load details:", e);
      setModalError(e.detail || e.message || "Failed to load details");
    } finally {
      setModalLoading(false);
    }
  };

  // Open details for a row. Immediately show the overview row (fast) like ActiveAgreement.
  // Also launch a background fetch to enrich the modal with full details when available.
  const openDetails = (row) => {
    if (!row) return;
    // create a mapped shallow copy of the row so modal fields render consistently
    try {
      const mapped = applyBackendStageData(mapAgreement(row));
      // attempt to resolve related MOU from in-memory lists
      const resolved = RelatedMou(mapped, agreements);
      setSelected(resolved);
    } catch (e) {
      // fallback: set the raw row
      setSelected(row);
    }
    setIsEditing(false);
    setModalError("");
    // open modal immediately (same UX as ActiveAgreement)
    setDetailOpen(true);
    // NOTE: intentionally do NOT fetch full details from the server here.
    // We keep the modal data strictly tied to the overview row that was clicked
    // to avoid the UI jumping to different records when a background fetch completes.
    // If you later want to fetch richer data on demand, add an explicit "Load details" button.
  };

  const closeDetails = () => {
    setDetailOpen(false);
    setSelected(null);
    setModalLoading(false);
    setModalError("");
  };

  const buildPayloadFromSelected = (s) => {
    const toNullIfEmpty = (v) => (v === "" || v === undefined ? null : v);

    const transformPointPersons = (list = [], legacyKeys = {}) => {
      const arr = Array.isArray(list) ? list : [];
      if (arr.length)
        return arr.map((p) => ({
          point_person_position: p.position || p.point_person_position || "",
          point_person_name: p.name || p.point_person_name || "",
          point_person_email: p.email || p.point_person_email || "",
        }));
      const hasLegacy =
        s?.[legacyKeys.positionKey] ||
        s?.[legacyKeys.nameKey] ||
        s?.[legacyKeys.emailKey];
      if (hasLegacy)
        return [
          {
            point_person_position: s?.[legacyKeys.positionKey] || "",
            point_person_name: s?.[legacyKeys.nameKey] || "",
            point_person_email: s?.[legacyKeys.emailKey] || "",
          },
        ];
      return [];
    };

    const transformContactPersons = (list = [], legacyKeys = {}) => {
      const arr = Array.isArray(list) ? list : [];
      if (arr.length)
        return arr.map((p) => ({
          contact_person_position:
            p.position || p.contact_person_position || "",
          contact_person_name: p.name || p.contact_person_name || "",
          contact_person_email: p.email || p.contact_person_email || "",
        }));
      const hasLegacy =
        s?.[legacyKeys.positionKey] ||
        s?.[legacyKeys.nameKey] ||
        s?.[legacyKeys.emailKey];
      if (hasLegacy)
        return [
          {
            contact_person_position: s?.[legacyKeys.positionKey] || "",
            contact_person_name: s?.[legacyKeys.nameKey] || "",
            contact_person_email: s?.[legacyKeys.emailKey] || "",
          },
        ];
      return [];
    };

    // Remarks should be an array of objects with remark_text per backend expectations
    const transformRemarks = (r = []) => {
      const arr = Array.isArray(r) ? r : r ? [r] : [];
      return arr.map((item) =>
        typeof item === "object"
          ? { remark_text: item.remark_text || item.text || item }
          : { remark_text: item }
      );
    };

    // signatories_list: backend stores this as a list; convert simple string into array when needed
    const normalizeSignatoriesList = (sigs, list) => {
      if (Array.isArray(list) && list.length) return list;
      if (Array.isArray(sigs)) return sigs;
      if (typeof sigs === "string" && sigs.trim())
        return sigs
          .split(/[,;\n]+/)
          .map((x) => x.trim())
          .filter(Boolean);
      return undefined;
    };

    const payload = {
      dts_number: s.dts_no || s.id || undefined,
      agreement_status: s.status || undefined,
      document_type: s.document_type || undefined,
      // frontend uses "partnership_classification" but backend expects "partnership_type"
      partnership_type:
        s.partnership_classification || s.partnership_type || undefined,
      validity_period: s.validity_period
        ? Number(s.validity_period)
        : undefined,
      date_signed: toNullIfEmpty(s.date_of_signing),
      date_expiry: toNullIfEmpty(s.expiry),
      // backend accepts either entry_date or date_received; we'll set entry_date
      entry_date: toNullIfEmpty(s.date_received),
      // partner fields (backend expects 'name' not 'partner_name')
      name: s.partner_name || s.name || undefined,
      address: s.address || undefined,
      country: s.country || undefined,
      region: s.region || undefined,
      // related agreement id
      MOU_to_MOA_id: s.related_mou || undefined,
      // persons transformed to backend keys
      point_persons: transformPointPersons(s.point_people, {
        positionKey: "point_position",
        nameKey: "point_name",
        emailKey: "point_email",
      }),
      contact_persons: transformContactPersons(s.contact_people, {
        positionKey: "contact_position",
        nameKey: "contact_name",
        emailKey: "contact_email",
      }),
      // signatories as list
      signatories_list: normalizeSignatoriesList(
        s.signatories,
        s.signatories_list
      ),
      // partner metadata
      website_url: s.website_link || s.website_url || undefined,
      event_info: s.event_title || s.event_info || undefined,
      description: s.brief_profile || s.description || undefined,
      hardcopy_location: s.hardcopy_locator || s.hardcopy_location || undefined,
      // remarks array of objects
      remarks: transformRemarks(s.remarks || s.remarks_list || []),
    };
    Object.keys(payload).forEach(
      (k) => payload[k] === undefined && delete payload[k]
    );
    return payload;
  };

  const saveDetails = async () => {
    if (!selected) return;
    if (!isAdminUser()) {
      setModalError("Only administrators may save changes.");
      alert("Only administrators may save changes.");
      return;
    }
    try {
      const payload = buildPayloadFromSelected(selected);
      const updated = await agreementService.updateAgreement(
        getPk(selected),
        payload
      );
      let mapped = applyBackendStageData(mapAgreement(updated));
      mapped = RelatedMou(mapped, agreements);
      // if the status changed compared to the original loaded row, reset stage start so days show from now
      try {
        const origStatus = originalRef.current?.status;
        if (origStatus && mapped.status && origStatus !== mapped.status) {
          mapped._stage_start_at = new Date().toISOString();
          mapped = applyBackendStageData(mapped);
        }
      } catch (e) {
        /* ignore */
      }
      setSelected(mapped);
      originalRef.current = mapped;
      setIsEditing(false);
      // ensure overview list excludes Active after save (but keep Withdrawn)
      queryClient.invalidateQueries(["agreements"]);
    } catch (e) {
      console.error("Failed to save details:", e);
      alert("Failed to save changes: " + (e.detail || e.message || e));
    }
  };

  /* ---------- Legacy editing functions (from overviewDash) ---------- */
  const startEditing = (agreement) => {
    if (!isAdminUser()) {
      setModalError("Only administrators may edit agreements.");
      alert("Only administrators may edit agreements.");
      return;
    }
    setEditingRow(agreement._pk ?? agreement.agreement_id ?? agreement.id);
    setEditedData({ ...agreement });
  };
  const cancelEditing = () => {
    setEditingRow(null);
    setEditedData({});
  };
  const handleInputChange = (field, value) =>
    setEditedData((prev) => ({ ...prev, [field]: value }));

  const saveRow = async (agreementId) => {
    if (!isAdminUser()) {
      setModalError("Only administrators may save changes.");
      alert("Only administrators may save changes.");
      return;
    }
    try {
      setSavingRows((prev) => new Set(prev).add(agreementId));
      await agreementService.updateAgreement(agreementId, editedData);
      queryClient.invalidateQueries(["agreements"]);
      setEditingRow(null);
      setEditedData({});
      alert("Agreement updated successfully!");
    } catch (err) {
      console.error("Error saving agreement:", err);
      alert("Failed to save changes: " + (err.message || err));
    } finally {
      setSavingRows((prev) => {
        const s = new Set(prev);
        s.delete(agreementId);
        return s;
      });
    }
  };

  const deleteRow = async (agreementId) => {
    if (!isAdminUser()) {
      setModalError("Only administrators may delete agreements.");
      alert("Only administrators may delete agreements.");
      return;
    }
    const proceed = window.confirm(
      "Are you sure you want to delete this agreement? This action cannot be undone."
    );
    if (!proceed) return;
    try {
      setDeletingRows((prev) => new Set(prev).add(agreementId));
      await agreementService.deleteAgreement(agreementId);
      queryClient.invalidateQueries(["agreements"]);
      setEditingRow((prev) => (prev === agreementId ? null : prev));
      alert("Agreement deleted successfully.");
    } catch (err) {
      console.error("Error deleting agreement:", err);
      alert("Failed to delete agreement: " + (err.message || err));
    } finally {
      setDeletingRows((prev) => {
        const s = new Set(prev);
        s.delete(agreementId);
        return s;
      });
    }
  };

  const upsertListItem = (field, idx, val) => {
    setEditedData((prev) => {
      const list = Array.isArray(prev[field]) ? [...prev[field]] : [];
      list[idx] = val; // Directly set the string value
      return { ...prev, [field]: list };
    });
  };

  // add an empty string
  const addListItem = (field, template) => {
    setEditedData((prev) => {
      const list = Array.isArray(prev[field]) ? [...prev[field]] : [];
      return { ...prev, [field]: [...list, ""] }; // Add empty string
    });
  };
  const removeListItem = (field, idx) =>
    setEditedData((prev) => {
      const list = Array.isArray(prev[field]) ? [...prev[field]] : [];
      list.splice(idx, 1);
      return { ...prev, [field]: list };
    });

  /* ---------- File viewing/upload and export ---------- */
  const handleViewLatestFile = async (dtsNumber) => {
    try {
      const latest = await documentService.getLatestVersion(dtsNumber);
      if (!latest) {
        alert("No document versions found for this DTS number.");
        return;
      }
      const resp = await fetch(latest.download_url, {
        headers: { Accept: "application/pdf" },
      });
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

  const exportToExcel = async (docFilter = "All", statusFilter = "All") => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Agreements");
      const cols = [
        "Date",
        "DOCUMENT TYPE",
        "STATUS",
        "DTS NO.",
        "DTS LOCATION",
        "SOURCE",
        "POINT PERSON / POSITION",
        "PARTNER'S NAME",
        "ENTITY TYPE",
        "COUNTRY",
        "REGION",
        "ADDRESS",
        "SIGNATORIES",
        "CONTACT PERSON / DETAILS",
        "PARTNERSHIP CLASSIFICATION",
        "EVENT TITLE / OTHER IMPT INFO ABOUT AGREEMENT",
        "VALIDITY PERIOD",
        "DATE / YEAR OF SIGNING",
        "EXPIRY DATE / YEAR",
        "DATE RECEIVED",
        "DATE ENDORSED TO ULCO",
        "ULCO'S APPROVAL",
        "PUP OFFICIALS' SIGNATURE",
        "WEBSITE LINK",
        "Brief Profile",
        "LOGO",
        "HARDCOPY LOCATOR",
        "REMARKS",
      ];
      worksheet.columns = cols.map((c) => ({ header: c, key: c, width: 30 }));
      const overviewData = agreements.filter((a) => {
        if (!a || String(a.status || "").toLowerCase() === "active")
          return false;
        if (
          docFilter !== "All" &&
          String(a.document_type || "").toUpperCase() !==
            String(docFilter).toUpperCase()
        )
          return false;
        if (statusFilter !== "All" && String(a.status) !== String(statusFilter))
          return false;
        return true;
      });
      const formatPointPersons = (pps) => {
        if (!Array.isArray(pps) || pps.length === 0) return "-";
        return pps
          .map((pp) =>
            `${pp.position || pp.point_person_position || ""} ${
              pp.name || pp.point_person_name || ""
            } ${pp.email ? `(${pp.email})` : ""}`.trim()
          )
          .join("; ");
      };
      const formatContactPersons = (cps) => {
        if (!Array.isArray(cps) || cps.length === 0) return "-";
        return cps
          .map((cp) =>
            `${cp.position || cp.contact_person_position || ""} ${
              cp.name || cp.contact_person_name || ""
            } ${cp.email ? `(${cp.email})` : ""}`.trim()
          )
          .join("; ");
      };
      const formatRemarks = (rms) => {
        if (!Array.isArray(rms) || rms.length === 0) return "-";
        return rms.map((r) => r.remark_text || r.text || r).join("; ");
      };

      for (const a of overviewData) {
        const row = {
          Date: a.date_received || a.entry_date || "",
          "DOCUMENT TYPE": a.document_type || "",
          STATUS: a.status || "",
          "DTS NO.": a.dts_no || a.id || "",
          SOURCE: a.source_unit || "",
          "POINT PERSON / POSITION": formatPointPersons(
            a.point_people || a.point_persons
          ),
          "PARTNER'S NAME": a.partner_name || a.name || "",
          "ENTITY TYPE": a.entity_type || "",
          COUNTRY: a.country || "",
          REGION: a.region || "",
          ADDRESS: a.address || "",
          SIGNATORIES: formatSignatories(a.signatories_list),
          "CONTACT PERSON / DETAILS": formatContactPersons(
            a.contact_people || a.contact_persons
          ),
          "PARTNERSHIP CLASSIFICATION":
            a.partnership_classification || a.partnership_type || "",
          "EVENT TITLE / OTHER IMPT INFO ABOUT AGREEMENT":
            a.event_title || a.event_info || "",
          "VALIDITY PERIOD": a.validity_period || "",
          "DATE / YEAR OF SIGNING": a.date_of_signing || a.date_signed || "",
          "EXPIRY DATE / YEAR": a.expiry || a.date_expiry || "",
          "DATE RECEIVED": a.date_received || a.entry_date || "",
          "DATE ENDORSED TO ULCO": a.date_endorsed_ulco || "",
          "ULCO'S APPROVAL": a.ulco_approval || "",
          "PUP OFFICIALS' SIGNATURE":
            a.pup_official_sign || a.date_signed_by_pup || "",
          "WEBSITE LINK": a.website_link || a.website_url || "",
          "Brief Profile": a.brief_profile || a.description || "",
          LOGO: a.logo ? "Has Logo" : "",
          "HARDCOPY LOCATOR": a.hardcopy_locator || a.hardcopy_location || "",
          REMARKS: formatRemarks(a.remarks),
        };
        worksheet.addRow(row);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `agreements_overview${docFilter === "All" ? "" : "_" + docFilter}${
          statusFilter === "All" ? "" : "_" + statusFilter
        }.xlsx`
      );
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed: " + (err.message || err));
    }
  };

  /* ---------- UI handlers ---------- */

  const toggleMobileSidebar = () => setMobileShow((v) => !v);

  const navigateDetail = (dir) => {
    if (!selected) return;
    const idx = filtered.findIndex((f) => f.id === selected.id);
    if (idx === -1) return;
    const next = filtered[idx + dir];
    if (next) openDetails(next);
  };

  const activateAgreement = (agreement) => {
    if (!window.confirm(`Activate ${agreement.id} as active agreement?`))
      return;
    // Update backend and UI status to 'Active'
    (async () => {
      try {
        // Use the same update method used elsewhere in this component
        const payload = { agreement_status: "Active" };
        const updated = await agreementService.updateAgreement(
          getPk(agreement),
          payload
        );
        let mapped = applyBackendStageData(mapAgreement(updated));
        mapped = RelatedMou(mapped, agreements);
        // Ensure stage start/time is reset when switching to Active so days show from now
        try {
          mapped._stage_start_at = new Date().toISOString();
          mapped = applyBackendStageData(mapped);
        } catch (e) {
          /* ignore */
        }
        // Remove the activated agreement from the current overview list so it no longer appears here
        queryClient.invalidateQueries(["agreements"]);
        // Notify other parts of the app (ActiveAgreement page) that an agreement was activated
        try {
          window.dispatchEvent(
            new CustomEvent("agreementActivated", { detail: mapped })
          );
        } catch (e) {
          // ignore if dispatch fails in some environments
        }
      } catch (err) {
        console.error("Failed to activate agreement:", err);
        alert("Failed to activate agreement: " + (err?.message || err));
      }
    })();
  };

  // Mark an agreement as Withdrawn when user confirms. Used for long-delayed items.
  const withdrawAgreement = (agreement) => {
    if (!window.confirm(`Mark ${agreement.id} as Withdrawn?`)) return;
    (async () => {
      try {
        const payload = { agreement_status: "Withdrawn" };
        const updated = await agreementService.updateAgreement(
          getPk(agreement),
          payload
        );
        let mapped = applyBackendStageData(mapAgreement(updated));
        mapped = RelatedMou(mapped, agreements);
        // ensure stage start reset so days show from now if needed
        try {
          mapped._stage_start_at = new Date().toISOString();
          mapped = applyBackendStageData(mapped);
        } catch (e) {}
        queryClient.invalidateQueries(["agreements"]);
        try {
          window.dispatchEvent(
            new CustomEvent("agreementWithdrawn", { detail: mapped })
          );
        } catch (e) {}
        alert("Agreement marked as Withdrawn.");
      } catch (err) {
        console.error("Failed to withdraw agreement:", err);
        alert(
          "Failed to mark agreement as Withdrawn: " + (err?.message || err)
        );
      }
    })();
  };

  //menu toggle, lumalagpas, so ginawa kong di na sa utmost right part
  const toggleMenu = (id, evt) => {
    // if closing same menu
    if (menuOpenId === id) {
      setMenuOpenId(null);
      return;
    }
    // compute a fixed position for the popup based on the button
    try {
      const rect = evt.currentTarget.getBoundingClientRect();
      let top = rect.bottom + 8;
      let left = rect.left;

      // Adjust if menu would go off-screen
      const menuWidth = 160; // minWidth of menu
      const menuHeight = 100; // approximate height

      // Check right edge
      if (left + menuWidth > window.innerWidth) {
        left = rect.right - menuWidth;
      }

      // Check bottom edge
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 8; // show above button instead
      }

      setMenuPos({ top, left });
    } catch (e) {
      // fallback: center of viewport
      setMenuPos({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
    }
    setMenuOpenId(id);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      // if click is inside the floating menu, ignore
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      // close menu when clicking anywhere outside the menu
      if (menuOpenId) setMenuOpenId(null);
      if (
        showFilterPanel &&
        filterPanelRef.current &&
        !filterPanelRef.current.contains(e.target)
      )
        setShowFilterPanel(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showFilterPanel]);

  const handleLogoUpload = (e) => {
    // only allow admins to upload/change the logo
    if (!isAdminUser()) {
      setModalError("Only administrators may upload/change the logo.");
      alert("Only administrators may upload/change the logo.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";
      setSelected((s) => ({ ...(s || {}), logo: dataUrl, logo_path: base64 }));
    };
    reader.readAsDataURL(file);
  };

  /* ---------- Upload modal actions ---------- */
  const openUploadFor = (agreement) => {
    if (!isAdminUser()) {
      setModalError("Only administrators may upload files.");
      alert("Only administrators may upload files.");
      return;
    }
    setSelectedAgreement(agreement);
    setShowUploadForm(true);
  };
  const submitUpload = async () => {
    if (!isAdminUser()) {
      setModalError("Only administrators may upload files.");
      alert("Only administrators may upload files.");
      return;
    }
    if (!uploadFile || !selectedAgreement) {
      alert("Please select file");
      return;
    }
    try {
      setUploading(true);
      await documentService.uploadVersion(
        selectedAgreement.dts_no ||
          selectedAgreement.dts_number ||
          selectedAgreement.id,
        uploadFile,
        uploadComment,
        selectedAgreement.status
      );
      alert("Upload successful!");
      setShowUploadForm(false);
      setSelectedAgreement(null);
      setUploadFile(null);
      setUploadComment("");
    } catch (err) {
      console.error(err);
      alert("Upload failed: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  if (error) {
    return <div className="overview-container">Error: {error.message}</div>;
  }

  if (isLoading) {
    return (
      <div className="dashboard-container overview1-page">
        <TopBar toggleSidebar={toggleMobileSidebar} />
        {mobileShow && (
          <div
            className="mobile-backdrop"
            onClick={() => setMobileShow(false)}
          />
        )}

        <div className="content-body">
          <Sidebar mobileShow={mobileShow} />

          <div
            className="main-content"
            onClick={() => mobileShow && setMobileShow(false)}
          >
            <div
              className="lloading-container"
              style={{ padding: 40, textAlign: "center" }}
            >
              <div className="spinner" style={{ margin: "0 auto 12px" }} />
              <p>Loading Overview...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container overview1-page">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && (
        <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />
      )}

      <div className="content-body">
        <Sidebar mobileShow={mobileShow} />

        <div
          className="main-content"
          onClick={() => mobileShow && setMobileShow(false)}
        >
          <div className="overview1-inner">
            {/* Tabs */}
            <div className="overview1-tabs-row">
              {["All", "MOA", "MOU"].map((tab) => (
                <button
                  key={tab}
                  className={`overview1-tab ${
                    activeTab === tab ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "All" ? "All Agreements" : tab}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="overview1-summary-row">
              <button
                type="button"
                className={`overview1-summary-card unified pending ${
                  !filterDelayed &&
                  !filterStage &&
                  !filterClassification &&
                  !filterValidity &&
                  !filterCountry &&
                  activeTab === "All"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  // Reset filters to show the pending agreements list
                  setFilterDelayed(false);
                  setFilterStage("");
                  setFilterClassification("");
                  setFilterValidity("");
                  setFilterCountry("");
                  setActiveTab("All");
                  setCurrentPage(1);
                }}
                aria-pressed={
                  !filterDelayed &&
                  !filterStage &&
                  !filterClassification &&
                  !filterValidity &&
                  !filterCountry &&
                  activeTab === "All"
                }
                title="Show pending agreements"
              >
                <div className="summary-title">Pending Tasks</div>
                <div className="summary-number">{pendingCount}</div>
                <div className="summary-sub">Agreements in progress</div>
              </button>
              <button
                type="button"
                className={`overview1-summary-card unified needs-attention ${
                  filterDelayed ? "active" : ""
                }`}
                onClick={() => {
                  setFilterDelayed((v) => !v);
                  setCurrentPage(1);
                }}
                aria-pressed={filterDelayed}
                title="Show agreements that need attention"
              >
                <div className="summary-title">Needs Attention</div>
                <div className="summary-number">{needsAttention}</div>
                <div className="summary-sub">Overdue Agreements</div>
              </button>
            </div>

            {/* Stage cards */}
            <div
              className="overview1-stage-cards"
              role="tablist"
              aria-label="Lifecycle stages"
            >
              {STAGE_LIST.map((s) => (
                <button
                  key={s.value}
                  className={`stage-card ${
                    filterStage === s.value ? "active" : ""
                  } ${stageHasDelayed[s.value] ? "delayed" : ""}`}
                  onClick={() =>
                    setFilterStage((prev) => (prev === s.value ? "" : s.value))
                  }
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
                className={`overview1-filter-btn ${
                  showFilterPanel ? "open" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilterPanel((v) => {
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
                <FiFilter className="filter-icon" />
                Filters
              </button>
              <button
                className={`btn generate ${showGenerateModal ? "active" : ""}`}
                onClick={() => {
                  setGenerateDocType("All");
                  setGenerateStatus("All");
                  setShowGenerateModal(true);
                }}
              >
                <FiPrinter className="icon" />
                Generate Report
              </button>
            </div>

            {showFilterPanel && (
              <div
                id="overview1-filter-panel"
                className="overview1-filter-panel"
                ref={filterPanelRef}
                role="region"
                aria-label="Table filters"
              >
                <div className="overview1-panel-header">
                  <FiFilter className="panel-header-icon" />
                  <h4>Filter Agreements</h4>
                  <button
                    className="panel-close-btn"
                    onClick={() => setShowFilterPanel(false)}
                    aria-label="Close filters"
                  >
                    <FiX className="icon" />
                  </button>
                </div>

                <div className="overview1-panel-row">
                  <div className="overview1-panel-field">
                    <label className="filter-label">
                      <FiTag className="filter-icon" />
                      Partnership Classification
                    </label>
                    <div className="filter-select-wrapper">
                      <select
                        value={tmpClassification}
                        onChange={(e) => setTmpClassification(e.target.value)}
                        className="filter-select"
                      >
                        <option value="">All Classifications</option>
                        {classificationOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown className="select-chevron" />
                    </div>
                  </div>

                  <div className="overview1-panel-field">
                    <label className="filter-label">
                      <FiCalendar className="filter-icon" />
                      Validity Period
                    </label>
                    <div className="filter-select-wrapper">
                      <select
                        value={tmpValidity}
                        onChange={(e) => setTmpValidity(e.target.value)}
                        className="filter-select"
                      >
                        <option value="">All Periods</option>
                        {validityOptions.map((v) => (
                          <option key={v} value={v}>
                            {v} {v ? "years" : ""}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown className="select-chevron" />
                    </div>
                  </div>

                  <div className="overview1-panel-field">
                    <label className="filter-label">
                      <FiMapPin className="filter-icon" />
                      Country
                    </label>
                    <div className="filter-select-wrapper">
                      <select
                        value={tmpCountry}
                        onChange={(e) => setTmpCountry(e.target.value)}
                        className="filter-select"
                      >
                        <option value="">All Countries</option>
                        {countryOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown className="select-chevron" />
                    </div>
                  </div>
                </div>

                <div className="overview1-filter-actions">
                  <button
                    className="btn clear"
                    onClick={() => {
                      setTmpClassification("");
                      setTmpValidity("");
                      setTmpCountry("");
                    }}
                  >
                    <FiXCircle className="btn-icon" />
                    Clear All
                  </button>
                  <button
                    className="btn apply"
                    onClick={() => {
                      setFilterClassification(tmpClassification);
                      setFilterValidity(tmpValidity);
                      setFilterCountry(tmpCountry);
                      setShowFilterPanel(false);
                    }}
                  >
                    <FiCheck className="btn-icon" />
                    Apply Filters
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overview1-table-wrapper" ref={containerRef}>
              <table className="overview1-agreements-table">
                <thead>
                  <tr>
                    <th>DTS Number</th>
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
                      <td
                        colSpan={11}
                        style={{ textAlign: "center", padding: 24 }}
                      >
                        No agreements found
                      </td>
                    </tr>
                  )}
                  {paged.map((row, rowIndex) => (
                    <tr
                      key={row._pk || row.id || rowIndex}
                      className={`${row.delayed ? "delayed-row" : ""} ${
                        row.delay_level ? `delay-${row.delay_level}` : ""
                      }`}
                    >
                      {/* Dts Number with warning */}
                      <td className="id-cell">
                        {row.delayed && (
                          <span
                            className={`warning-icon ${row.delay_level}`}
                            title="Delayed"
                          >
                            !
                          </span>
                        )}
                        <span className="id-text">{row.id}</span>
                      </td>
                      {/* Partner Name */}
                      <td className="partner-cell">
                        <div className="partner-name">
                          {row.partner_name || "—"}
                        </div>
                        <div className="partner-sub">
                          {row.position || row.entity_type || ""}
                        </div>
                      </td>
                      {/* Country */}
                      <td>{row.country || "—"}</td>
                      {/* Classification */}
                      <td>{row.partnership_classification || "—"}</td>
                      {/* Validity Period */}
                      <td>{row.validity_period || "—"}</td>
                      {/* Document Type */}
                      <td>
                        <span
                          className={`badge doc ${
                            row.document_type === "MOA" ? "moa" : "mou"
                          }`}
                        >
                          {row.document_type || "—"}
                        </span>
                      </td>
                      {/* Related MOU */}
                      <td>
                        {row.related_mou ? (
                          <span className="related-mou">
                            <div className="req">
                              <button
                                type="button"
                                className="linked-mou-btn"
                                onClick={(e) => {
                                  // prevent row click bubbling
                                  if (e && e.stopPropagation)
                                    e.stopPropagation();
                                  const raw = row.related_mou;
                                  const key = String(raw);
                                  // Try to find the related agreement in-memory first
                                  let found = null;
                                  if (/^\d+$/.test(key)) {
                                    // numeric id
                                    found = agreements.find(
                                      (a) =>
                                        String(a.agreement_id) === key ||
                                        String(a._pk) === key ||
                                        String(a.id) === key
                                    );
                                    if (found) {
                                      openDetails(found);
                                      return;
                                    }
                                    // not found locally -> load by id
                                    loadAgreementDetails(Number(key));
                                    setDetailOpen(true);
                                    return;
                                  }

                                  // treat as a DTS string
                                  found = agreements.find(
                                    (a) =>
                                      (a.dts_no &&
                                        String(a.dts_no) === String(raw)) ||
                                      (a.id && String(a.id) === String(raw)) ||
                                      (a._pk && String(a._pk) === String(raw))
                                  );
                                  if (found) {
                                    openDetails(found);
                                    return;
                                  }
                                  // fallback: try to load by DTS or id
                                  loadAgreementDetails(raw);
                                  setDetailOpen(true);
                                }}
                                title={`View linked MOU ${
                                  relatedDtsMap[String(row.related_mou)] ||
                                  String(row.related_mou)
                                }`}
                                aria-label={`View linked MOU ${
                                  relatedDtsMap[String(row.related_mou)] ||
                                  String(row.related_mou)
                                }`}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#5a1522",
                                  cursor: "pointer",
                                  padding: 0,
                                  fontWeight: 700,
                                }}
                              >
                                {relatedDtsMap[String(row.related_mou)] ||
                                  String(row.related_mou)}
                              </button>
                            </div>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      {/* Current Status */}
                      <td>
                        <span
                          className={`status-badge status-${slugifyStatus(
                            row.status
                          )}`}
                        >
                          {LIFECYCLE_OPTIONS.find((o) => o.value === row.status)
                            ?.label ||
                            row.status ||
                            "—"}
                        </span>
                      </td>
                      {/* Days in Lifecycle */}
                      <td>
                        <div className="days">
                          {row.days_in_stage ?? 0} days{" "}
                          {row.delayed && (
                            <span className="delay-note">Delayed</span>
                          )}
                        </div>
                      </td>
                      {/* Point Person */}
                      <td>
                        <div className="pp-person">
                          {(row.point_position || row.position
                            ? `${row.point_position || row.position}: `
                            : "") +
                            (row.point_name || row.point_person || "—") +
                            (row.point_email
                              ? ` (${row.point_email})`
                              : row.contact_email
                              ? ` (${row.contact_email})`
                              : "")}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="actions-cell">
                        {/* First row - Regular action buttons */}
                        <div
                          className="action-buttons"
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <button
                            className="icon-btn"
                            title="View Details"
                            onClick={() => openDetails(row)}
                            aria-label="View Details"
                          >
                            <FiEye className="icon" />
                          </button>
                          <button
                            className="icon-btn"
                            title="Delete"
                            onClick={() => deleteRow(row._pk ?? row.id)}
                            aria-label="Delete"
                          >
                            <FiTrash2 className="icon" />
                          </button>

                          {/* More options menu */}
                          <div
                            className="dots-menu"
                            style={{ display: "inline-block" }}
                          >
                            <button
                              className="icon-btn dots"
                              title="More Actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMenu(row._pk ?? row.id, e);
                              }}
                              aria-label="More actions"
                            >
                              <FiMoreVertical className="icon" />
                            </button>
                          </div>

                          {menuOpenId === (row._pk ?? row.id) &&
                            createPortal(
                              <div
                                ref={menuRef}
                                className="menu-popup"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: "fixed",
                                  top: menuPos.top,
                                  left: menuPos.left,
                                  zIndex: 2000,
                                  background: "#fff",
                                  border: "1px solid #eee",
                                  borderRadius: 6,
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                  padding: 6,
                                  minWidth: 160,
                                }}
                              >
                                {/* View Latest File - for all users */}
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    handleViewLatestFile(row.dts_no || row.id);
                                    setMenuOpenId(null);
                                  }}
                                >
                                  <FiFile style={{ marginRight: 4 }} />
                                  View Latest File
                                </button>

                                {/* View Older Files - for all users */}
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    navigate(
                                      `/docVer?dts_number=${
                                        row.dts_no || row.id
                                      }`
                                    );
                                    setMenuOpenId(null);
                                  }}
                                >
                                  <FiArchive style={{ marginRight: 4 }} /> View
                                  Older Files
                                </button>

                                {/* Upload New Version - admin only */}
                                {isAdminUser() && (
                                  <button
                                    className="menu-item"
                                    onClick={() => {
                                      openUploadFor(row);
                                      setMenuOpenId(null);
                                    }}
                                  >
                                    <FiUpload style={{ marginRight: 4 }} />{" "}
                                    Upload New Version
                                  </button>
                                )}
                              </div>,
                              document.body
                            )}
                        </div>

                        {/* Second row - Activate and Withdrawn buttons with text AND icons */}
                        <div
                          className="action-buttons-secondary"
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          {/* Activate button - shown for FFUP status */}
                          {row.status &&
                            String(row.status).toLowerCase().includes("ffup") &&
                            isAdminUser() && (
                              <button
                                className="btn-action activate-btn"
                                title={`Activate This ${
                                  row.document_type || "Agreement"
                                }`}
                                onClick={() => {
                                  activateAgreement(row);
                                  setMenuOpenId(null);
                                }}
                                aria-label={`Activate ${
                                  row.document_type || "Agreement"
                                }`}
                              >
                                <FiCheckCircle style={{ marginRight: 6 }} />
                                Activate {row.document_type || "Agreement"}
                              </button>
                            )}

                          {/* Withdrawn button - for items delayed 30+ days */}
                          {typeof row.days_in_stage === "number" &&
                            row.days_in_stage >= 30 &&
                            !String(row.status || "")
                              .toLowerCase()
                              .includes("withdrawn") && (
                              <button
                                className="btn-action withdraw-btn"
                                title="Mark as Withdrawn"
                                onClick={() => {
                                  withdrawAgreement(row);
                                  setMenuOpenId(null);
                                }}
                                aria-label="Withdraw"
                              >
                                <FiXCircle style={{ marginRight: 6 }} />
                                Mark as Withdrawn
                              </button>
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
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`page-btn ${
                      currentPage === i + 1 ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="page-btn"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
              <div className="page-info">
                Showing{" "}
                {filtered.length
                  ? Math.min(
                      filtered.length,
                      (currentPage - 1) * itemsPerPage + 1
                    )
                  : 0}{" "}
                - {Math.min(filtered.length, currentPage * itemsPerPage)} of{" "}
                {filtered.length}
              </div>
            </div>

            {/* Detail modal */}
            {detailOpen && selected && (
              <div className="overview1-modal-backdrop" onClick={closeDetails}>
                <div
                  className="overview1-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="overview1-modal-header"
                    role="dialog"
                    aria-labelledby="modal-title"
                  >
                    <div className="modal-badge-row">
                      <span
                        className={`badge ${String(
                          selected.document_type || ""
                        ).toLowerCase()}`}
                      >
                        {selected.document_type || "—"}
                      </span>
                      <h3 id="modal-title" className="modal-title">
                        {selected.partner_name ||
                          selected.name ||
                          "Agreement Details"}
                      </h3>
                    </div>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      {!isEditing && (
                        <>
                          <button
                            className="nav-btn"
                            onClick={() => navigateDetail(-1)}
                            title="Previous"
                            aria-label="Previous agreement"
                          >
                            ‹
                          </button>
                          <button
                            className="nav-btn"
                            onClick={() => navigateDetail(1)}
                            title="Next"
                            aria-label="Next agreement"
                          >
                            ›
                          </button>
                        </>
                      )}
                      <button
                        className="modal-close"
                        onClick={closeDetails}
                        aria-label="Close"
                      >
                        <FiX className="icon" />
                      </button>
                    </div>
                  </div>

                  <div className="overview1-modal-body">
                    {modalError && (
                      <div style={{ color: "#b00020", margin: "8px 0" }}>
                        {modalError}
                      </div>
                    )}
                    {modalLoading && (
                      <div style={{ color: "#666", margin: "4px 0 10px" }}>
                        Loading details from database…
                      </div>
                    )}

                    {!isEditing ? (
                      /* === VIEW MODE - Match ActiveAgreement === */
                      <>
                        {/* Document Information */}
                        <section className="modal-section docinfo">
                          <h4>Document Information</h4>
                          <div className="row two-col">
                            <div>
                              <div className="label">DTS Number</div>
                              <div className="value mono">
                                {selected.dts_no || selected.id || "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">Document Type</div>
                              <div className="value">
                                {selected.document_type || "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">Date Received</div>
                              <div className="value">
                                {selected.date_received
                                  ? new Date(
                                      selected.date_received
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">Source Unit</div>
                              <div className="value">
                                {selected.source_unit || "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">Hardcopy Locator</div>
                              <div className="value">
                                {selected.hardcopy_locator || "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">Current Status</div>
                              <div className="value">
                                <span
                                  className={`status-badge status-${slugifyStatus(
                                    selected.status
                                  )}`}
                                >
                                  {LIFECYCLE_OPTIONS.find(
                                    (o) => o.value === selected.status
                                  )?.label ||
                                    selected.status ||
                                    "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="label" style={{ marginTop: 12 }}>
                            Brief Profile
                          </div>
                          <div className="brief">
                            {selected.brief_profile ||
                              selected.description ||
                              "—"}
                          </div>
                        </section>

                        {/* Partner Information */}
                        <section className="modal-section partner">
                          <h4>Partner Information</h4>
                          <div className="partner-top">
                            <div className="partner-logo">
                              {LogoSrc(selected.logo_path || selected.logo) ? (
                                <img
                                  src={LogoSrc(
                                    selected.logo_path || selected.logo
                                  )}
                                  alt={`${
                                    selected.partner_name || selected.name
                                  } logo`}
                                  onError={(e) => {
                                    console.warn(
                                      "Logo failed to load:",
                                      e.target.src
                                    );
                                    e.target.onerror = null;
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="partner-fallback">
                                  {getInitials(
                                    selected.partner_name || selected.name
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="partner-details">
                              <div className="row two-col">
                                <div>
                                  <div className="label">Organization</div>
                                  <div className="value">
                                    {selected.partner_name ||
                                      selected.name ||
                                      "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="label">Entity Type</div>
                                  <div className="value">
                                    {selected.entity_type || "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="label">Country</div>
                                  <div className="value">
                                    {selected.country || "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="label">Region</div>
                                  <div className="value">
                                    {selected.region || "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="label">Address</div>
                                  <div className="value">
                                    {selected.address || "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="label">Website</div>
                                  <div className="value">
                                    {selected.website_link ? (
                                      <a
                                        href={selected.website_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          color: "#3b82f6",
                                          textDecoration: "none",
                                        }}
                                      >
                                        {selected.website_link}
                                      </a>
                                    ) : (
                                      "—"
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Contact Persons */}
                        <section className="modal-section contacts">
                          <h4>Contact Persons</h4>
                          <div className="contacts-grid">
                            <div className="contact-card">
                              <div className="contact-role">
                                PUP Point Person
                              </div>
                              <div className="contact-name">
                                {formatContactPersons(
                                  selected.point_people ||
                                    selected.point_persons ||
                                    selected.point_name ||
                                    selected.point_person
                                )}
                              </div>
                              <div className="contact-org">
                                {selected.source_unit || "—"}
                              </div>
                              {formatContactEmails(
                                selected.point_people ||
                                  selected.point_persons ||
                                  selected.point_email
                              ) ? (
                                <a
                                  className="contact-email"
                                  href={`mailto:${formatContactEmails(
                                    selected.point_people ||
                                      selected.point_persons ||
                                      selected.point_email
                                  )}`}
                                >
                                  {formatContactEmails(
                                    selected.point_people ||
                                      selected.point_persons ||
                                      selected.point_email
                                  )}
                                </a>
                              ) : null}
                            </div>

                            <div className="contact-card alt">
                              <div className="contact-role">
                                Partner Contact Person
                              </div>
                              <div className="contact-name">
                                {formatContactPersons(
                                  selected.contact_people ||
                                    selected.contact_persons ||
                                    selected.contact_name ||
                                    selected.contact_person
                                )}
                              </div>
                              <div className="contact-org">
                                {selected.partner_name || selected.name || "—"}
                              </div>
                              {formatContactEmails(
                                selected.contact_people ||
                                  selected.contact_persons ||
                                  selected.contact_email
                              ) ? (
                                <a
                                  className="contact-email"
                                  href={`mailto:${formatContactEmails(
                                    selected.contact_people ||
                                      selected.contact_persons ||
                                      selected.contact_email
                                  )}`}
                                >
                                  {formatContactEmails(
                                    selected.contact_people ||
                                      selected.contact_persons ||
                                      selected.contact_email
                                  )}
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </section>

                        {/* Linked MOU */}
                        {(() => {
                          const relatedId =
                            selected.related_mou || selected.MOU_to_MOA_id;
                          if (!relatedId) return null;
                          const linkedAgreement = agreements.find(
                            (a) =>
                              a.id === relatedId ||
                              a.agreement_id === relatedId ||
                              a.dts_no === relatedId
                          );
                          if (!linkedAgreement) return null;
                          return (
                            <section className="modal-section linked-mou">
                              <h4>
                                <FiLink
                                  style={{ marginRight: 8 }}
                                  className="inline-icon"
                                />
                                Linked MOU
                              </h4>
                              <div
                                className="linked-mou-card"
                                onClick={() => openDetails(linkedAgreement)}
                              >
                                <div className="linked-mou-left">
                                  <span className="badge mou">MOU</span>
                                </div>
                                <div className="linked-mou-body">
                                  <strong className="linked-mou-title">
                                    {linkedAgreement.partner_name ||
                                      linkedAgreement.name ||
                                      "—"}
                                  </strong>
                                  <div className="linked-mou-sub">
                                    {linkedAgreement.partnership_classification ||
                                      linkedAgreement.partnership_type ||
                                      "—"}
                                  </div>
                                  <div className="linked-mou-valid">
                                    Valid until:{" "}
                                    {linkedAgreement.expiry
                                      ? new Date(
                                          linkedAgreement.expiry
                                        ).toLocaleDateString()
                                      : "—"}
                                  </div>
                                  <div className="linked-mou-dts">
                                    {linkedAgreement.dts_no ||
                                      linkedAgreement.id ||
                                      "—"}
                                  </div>
                                </div>
                              </div>
                            </section>
                          );
                        })()}

                        {/* Agreement Timeline */}
                        <section className="modal-section timeline">
                          <h4>Agreement Timeline</h4>
                          <div className="row two-col">
                            <div>
                              <div className="label">Date of Signing</div>
                              <div className="value">
                                {selected.date_of_signing
                                  ? new Date(
                                      selected.date_of_signing
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">Expiry Date</div>
                              <div className="value">
                                {selected.expiry
                                  ? new Date(
                                      selected.expiry
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">Date Endorsed to ULCO</div>
                              <div className="value">
                                {selected.date_endorsed_ulco
                                  ? new Date(
                                      selected.date_endorsed_ulco
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">ULCO's Approval</div>
                              <div className="value">
                                {selected.ulco_approval
                                  ? new Date(
                                      selected.ulco_approval
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                PUP Officials' Signature
                              </div>
                              <div className="value">
                                {selected.pup_official_sign
                                  ? new Date(
                                      selected.pup_official_sign
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">Validity Period</div>
                              <div className="value">
                                {selected.validity_period
                                  ? `${selected.validity_period} years`
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                Partnership Classification
                              </div>
                              <div className="value">
                                {selected.partnership_classification ||
                                  selected.partnership_type ||
                                  "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">Event Title</div>
                              <div className="value">
                                {selected.event_title || "—"}
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Signatories */}
                        <section className="modal-section">
                          <h4>Signatories</h4>
                          <div className="value">
                            {selected.signatories_list
                              ? formatSignatories(selected.signatories_list)
                              : selected.signatories || "—"}
                          </div>
                        </section>

                        {/* Remarks */}
                        <section className="modal-section remarks">
                          <h4>Remarks</h4>
                          <div className="brief">
                            {Array.isArray(selected.remarks) ? (
                              selected.remarks.map((r, idx) => (
                                <div key={idx} style={{ marginBottom: 6 }}>
                                  {typeof r === "object"
                                    ? r.remark_text || r.text || r.remark || ""
                                    : r}
                                </div>
                              ))
                            ) : selected.remarks ? (
                              <div>{selected.remarks}</div>
                            ) : (
                              "—"
                            )}
                          </div>
                        </section>
                      </>
                    ) : (
                      /* === EDIT MODE - Form Fields === */
                      <div className="overview1-details-grid overview1-form-grid">
                        {/* Keep existing form fields from your current implementation */}
                        {/* Date */}
                        <label className="field">
                          Date
                          <input
                            ref={modalFirstFieldRef}
                            type="date"
                            value={
                              selected.date || selected.date_received || ""
                            }
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                date_received: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Source */}
                        <label className="field">
                          Source
                          <input
                            value={
                              selected.source_unit || selected.source || ""
                            }
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                source_unit: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Point person / position */}
                        <div className="full-col">
                          <label className="field full">
                            Point person / position
                            <MultiPersonField
                              listKey="point_people"
                              legacyKeys={{
                                positionKey: "point_position",
                                nameKey: "point_name",
                                emailKey: "point_email",
                              }}
                              selected={selected}
                              setSelected={setSelected}
                              disabled={false}
                            />
                          </label>
                        </div>

                        {/* DTS NO. */}
                        <label className="field">
                          DTS NO.
                          <input
                            value={selected.dts_no || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                dts_no: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Status */}
                        <label className="field">
                          STATUS
                          <select
                            value={selected.status || ""}
                            onChange={(e) => {
                              setSelected((s) => {
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
                                    delay_level: "none",
                                  };
                                }
                                return s;
                              });
                            }}
                          >
                            <option value="">Select Status</option>
                            {LIFECYCLE_OPTIONS.filter((o) => o.value).map(
                              (o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              )
                            )}
                            {selected.status &&
                              !LIFECYCLE_OPTIONS.some(
                                (o) => o.value === selected.status
                              ) && (
                                <option value={selected.status}>
                                  {selected.status}
                                </option>
                              )}
                          </select>
                        </label>

                        {/* Partner's name */}
                        <label className="field">
                          Partner's name
                          <input
                            value={selected.partner_name || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                partner_name: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Entity Type */}
                        <label className="field">
                          Entity Type
                          <input
                            value={selected.entity_type || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                entity_type: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Address */}
                        <label className="field">
                          Address
                          <input
                            value={selected.address || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                address: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Country */}
                        <label className="field">
                          Country
                          <SearchableSelect
                            options={countryOptions.map((c) => ({
                              value: c,
                              label: c,
                            }))}
                            value={selected.country || ""}
                            onChange={(val) => {
                              setSelected((s) => ({ ...s, country: val }));
                            }}
                            placeholder="Select Country"
                            allowClear={true}
                          />
                        </label>

                        {/* Region */}
                        <label className="field">
                          Region
                          <input
                            value={selected.region || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                region: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Signatories */}
                        <div className="full-col">
                          <label className="field">
                            Signatories
                            <input
                              value={selected.signatories || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  signatories: e.target.value,
                                }));
                              }}
                            />
                          </label>
                        </div>

                        {/* Contact person / details */}
                        <div className="full-col">
                          <label className="field full">
                            Contact person / details
                            <MultiPersonField
                              listKey="contact_people"
                              legacyKeys={{
                                positionKey: "contact_position",
                                nameKey: "contact_name",
                                emailKey: "contact_email",
                              }}
                              selected={selected}
                              setSelected={setSelected}
                              disabled={false}
                            />
                          </label>
                        </div>

                        {/* Document type */}
                        <label className="field">
                          Document type
                          <select
                            value={selected.document_type || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                document_type: e.target.value,
                              }));
                            }}
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
                            options={classificationOptions.map((c) => ({
                              value: c,
                              label: c,
                            }))}
                            value={selected.partnership_classification || ""}
                            onChange={(val) => {
                              setSelected((s) => ({
                                ...s,
                                partnership_classification: val,
                              }));
                            }}
                            placeholder="Select Classification"
                            allowClear={true}
                          />
                        </label>

                        {/* Validity Period */}
                        <label className="field">
                          Validity Period
                          <select
                            value={selected.validity_period || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                validity_period: e.target.value,
                              }));
                            }}
                          >
                            <option value="">Select Validity</option>
                            {validityOptions.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </label>

                        {/* Event Title */}
                        <div className="full-col">
                          <label className="field">
                            Event Title
                            <input
                              value={selected.event_title || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  event_title: e.target.value,
                                }));
                              }}
                            />
                          </label>
                        </div>

                        {/* Date / Year of Signing */}
                        <label className="field">
                          DATE / YEAR OF SIGNING
                          <input
                            type="date"
                            value={selected.date_of_signing || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                date_of_signing: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Expiry */}
                        <label className="field">
                          EXPIRY DATE / YEAR
                          <input
                            type="date"
                            value={selected.expiry || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                expiry: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Date Received */}
                        <label className="field">
                          DATE RECEIVED
                          <input
                            type="date"
                            value={selected.date_received || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                date_received: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Date Endorsed to ULCO */}
                        <label className="field">
                          DATE ENDORSED TO ULCO
                          <input
                            type="date"
                            value={selected.date_endorsed_ulco || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                date_endorsed_ulco: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* ULCO's Approval */}
                        <label className="field">
                          ULCO'S APPROVAL
                          <input
                            type="date"
                            value={selected.ulco_approval || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                ulco_approval: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* PUP Official's Signature */}
                        <label className="field">
                          PUP OFFICIALS' SIGNATURE
                          <input
                            type="date"
                            value={selected.pup_official_sign || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                pup_official_sign: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Website Link */}
                        <label className="field">
                          WEBSITE LINK
                          <input
                            value={selected.website_link || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                website_link: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Brief Profile - full width */}
                        <div className="full-col">
                          <label className="field full">
                            BRIEF PROFILE
                            <textarea
                              value={selected.brief_profile || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  brief_profile: e.target.value,
                                }));
                              }}
                              rows={3}
                            />
                          </label>
                        </div>

                        {/* Logo */}
                        <label className="field">
                          LOGO - upload
                          <div className="logo-upload">
                            {selected.logo ? (
                              <img
                                src={selected.logo}
                                className="logo-preview"
                                alt="logo"
                              />
                            ) : null}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                          </div>
                        </label>

                        {/* Hardcopy locator */}
                        <label className="field">
                          HARDCOPY LOCATOR
                          <input
                            value={selected.hardcopy_locator || ""}
                            onChange={(e) => {
                              setSelected((s) => ({
                                ...s,
                                hardcopy_locator: e.target.value,
                              }));
                            }}
                          />
                        </label>

                        {/* Remarks full width */}
                        <div className="full-col">
                          <label className="field full">
                            REMARKS
                            <MultiRemarkField
                              listKey="remarks"
                              selected={selected}
                              setSelected={setSelected}
                              disabled={false}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="overview1-modal-footer">
                    <button className="btn cancel" onClick={closeDetails}>
                      Close
                    </button>
                    {!isEditing ? (
                      isAdminUser() ? (
                        <button
                          className="btn edit"
                          onClick={() => setIsEditing(true)}
                        >
                          <FiEdit className="icon" />
                          Edit
                        </button>
                      ) : null
                    ) : (
                      <>
                        <button
                          className="btn cancel"
                          onClick={() => {
                            setSelected(originalRef.current);
                            setIsEditing(false);
                          }}
                        >
                          Cancel
                        </button>
                        <button className="btn save" onClick={saveDetails}>
                          Save
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Generate Report Modal */}
            {showGenerateModal && (
              <div
                className="overview1-modal-backdrop"
                onClick={() => setShowGenerateModal(false)}
              >
                <div
                  className="overview1-modal report-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="overview1-modal-header">
                    <div className="modal-badge-row">
                      <FiFileText className="header-icon" />
                      <h3 className="modal-title">Generate Report</h3>
                    </div>
                    <button
                      className="modal-close"
                      onClick={() => setShowGenerateModal(false)}
                      aria-label="Close"
                    >
                      <FiX className="icon" />
                    </button>
                  </div>

                  <div className="overview1-modal-body">
                    {/* Report Summary Card */}
                    <div className="report-summary-card">
                      <div className="report-header">
                        <div className="report-icon-container">
                          <FiBarChart className="report-main-icon" />
                        </div>
                        <div className="report-titles">
                          <div className="report-title">
                            Agreement Report Generator
                          </div>
                          <div className="report-sub">
                            Generate comprehensive reports for agreements in
                            Excel or CSV format
                          </div>
                        </div>
                      </div>

                      <div className="report-stats">
                        <div className="stat-item">
                          <div className="stat-label">Total Agreements</div>
                          <div className="stat-number">{filtered.length}</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Document Type</div>
                          <div className="stat-value">
                            {generateDocType === "All"
                              ? "All Agreements"
                              : generateDocType + " only"}
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Status Filter</div>
                          <div className="stat-value">
                            {generateStatus === "All"
                              ? "All statuses"
                              : LIFECYCLE_OPTIONS.find(
                                  (o) => o.value === generateStatus
                                )?.label || generateStatus}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Report Configuration */}
                    <div className="report-configuration">
                      <div className="config-section">
                        <h4 className="config-title">
                          <FiSettings className="config-icon" />
                          Report Configuration
                        </h4>

                        <div className="config-rows">
                          <div className="config-row">
                            <label className="config-label">
                              <FiFile className="label-icon" />
                              Document Type
                            </label>
                            <select
                              value={generateDocType}
                              onChange={(e) =>
                                setGenerateDocType(e.target.value)
                              }
                              className="config-select"
                            >
                              <option value="All">All Agreements</option>
                              <option value="MOU">MOU only</option>
                              <option value="MOA">MOA only</option>
                            </select>
                          </div>

                          <div className="config-row">
                            <label className="config-label">
                              <FiFilter className="label-icon" />
                              Status Filter
                            </label>
                            <select
                              value={generateStatus}
                              onChange={(e) =>
                                setGenerateStatus(e.target.value)
                              }
                              className="config-select"
                            >
                              <option value="All">All statuses</option>
                              <option value="SignedPUP">
                                Signed by PUP Officials
                              </option>
                              <option value="SignedPartner">
                                Signed by Partner Institution
                              </option>
                              <option value="Complete">
                                Completely Signed
                              </option>
                              <option value="InitialReview">
                                Initial Review
                              </option>
                              <option value="Endorse">Endorsed to ULCO</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Report Preview - MOVED BEFORE EXPORT OPTIONS */}
                      <div className="preview-section">
                        <h4 className="config-title">
                          <FiEye className="config-icon" />
                          Report Preview
                        </h4>
                        <div className="preview-info">
                          <div className="preview-stats">
                            <div className="preview-stat">
                              <FiFile className="stat-icon" />
                              <span>
                                Total records:{" "}
                                <strong>{filtered.length}</strong>
                              </span>
                            </div>
                            <div className="preview-stat">
                              <FiCalendar className="stat-icon" />
                              <span>
                                Generated:{" "}
                                <strong>
                                  {new Date().toLocaleDateString()}
                                </strong>
                              </span>
                            </div>
                          </div>
                          <div className="preview-note">
                            <FiInfo className="note-icon" />
                            The report will include all agreement details,
                            contact information, and timeline data.
                          </div>
                        </div>
                      </div>

                      {/* Export Options - MOVED AFTER PREVIEW */}
                      <div className="export-section">
                        <h4 className="config-title">
                          <FiDownload className="config-icon" />
                          Export Options
                        </h4>

                        <div className="export-options">
                          <div className="export-option">
                            <div className="option-header">
                              <FiFile className="option-icon excel" />
                              <div className="option-info">
                                <div className="option-title">Excel Report</div>
                                <div className="option-desc">
                                  Comprehensive spreadsheet with all agreement
                                  details and formatting
                                </div>
                              </div>
                            </div>
                            <button
                              className="btn export-btn excel-btn"
                              onClick={async () => {
                                await exportToExcel(
                                  generateDocType,
                                  generateStatus
                                );
                                setShowGenerateModal(false);
                              }}
                            >
                              <FiDownload className="icon" />
                              Download Excel
                            </button>
                          </div>

                          <div className="export-option">
                            <div className="option-header">
                              <FiFileText className="option-icon csv" />
                              <div className="option-info">
                                <div className="option-title">CSV Export</div>
                                <div className="option-desc">
                                  Simple comma-separated values for quick data
                                  analysis
                                </div>
                              </div>
                            </div>
                            <button
                              className="btn export-btn csv-btn"
                              onClick={async () => {
                                try {
                                  const header = [
                                    "DTS NO",
                                    "Partner",
                                    "Document Type",
                                    "Status",
                                    "Date Received",
                                    "Country",
                                    "Classification",
                                  ];
                                  const rows = agreements
                                    .filter((a) => {
                                      if (
                                        !a ||
                                        String(a.status || "").toLowerCase() ===
                                          "active"
                                      )
                                        return false;
                                      if (
                                        generateDocType !== "All" &&
                                        String(
                                          a.document_type || ""
                                        ).toUpperCase() !==
                                          String(generateDocType).toUpperCase()
                                      )
                                        return false;
                                      if (
                                        generateStatus !== "All" &&
                                        String(a.status) !==
                                          String(generateStatus)
                                      )
                                        return false;
                                      return true;
                                    })
                                    .map((a) => [
                                      a.dts_no || a.id || "",
                                      a.partner_name || "",
                                      a.document_type || "",
                                      a.status || "",
                                      a.date_received || "",
                                      a.country || "",
                                      a.partnership_classification || "",
                                    ]);
                                  const csv = [header, ...rows]
                                    .map((r) =>
                                      r
                                        .map(
                                          (v) =>
                                            '"' +
                                            String(v).replace(/"/g, '""') +
                                            '"'
                                        )
                                        .join(",")
                                    )
                                    .join("\n");
                                  const blob = new Blob([csv], {
                                    type: "text/csv;charset=utf-8;",
                                  });
                                  saveAs(
                                    blob,
                                    `agreements_${generateDocType.toLowerCase()}_${generateStatus.toLowerCase()}.csv`
                                  );
                                } catch (e) {
                                  console.error("CSV export failed", e);
                                  alert(
                                    "CSV export failed: " + (e?.message || e)
                                  );
                                }
                                setShowGenerateModal(false);
                              }}
                            >
                              <FiDownload className="icon" />
                              Download CSV
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overview1-modal-footer">
                    <button
                      className="btn cancel"
                      onClick={() => setShowGenerateModal(false)}
                    >
                      <FiX className="icon" />
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload New Version Modal */}
            {showUploadForm && (
              <div
                className="overview1-modal-backdrop"
                onClick={() => setShowUploadForm(false)}
              >
                <div
                  className="overview1-modal upload-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="overview1-modal-header">
                    <div className="modal-badge-row">
                      <FiUpload className="header-icon" />
                      <h3 className="modal-title">
                        Upload New Document Version
                      </h3>
                    </div>
                    <button
                      className="modal-close"
                      onClick={() => {
                        setShowUploadForm(false);
                        setSelectedAgreement(null);
                        setUploadFile(null);
                        setUploadComment("");
                      }}
                      aria-label="Close"
                    >
                      <FiX className="icon" />
                    </button>
                  </div>

                  <div className="overview1-modal-body">
                    {/* Agreement Info Card */}
                    {selectedAgreement && (
                      <div className="upload-agreement-info">
                        <div className="agreement-badge">
                          <span
                            className={`badge doc ${
                              selectedAgreement.document_type?.toLowerCase() ===
                              "moa"
                                ? "moa"
                                : "mou"
                            }`}
                          >
                            {selectedAgreement.document_type || "DOC"}
                          </span>
                        </div>
                        <div className="agreement-details">
                          <div className="agreement-title">
                            {selectedAgreement.partner_name ||
                              selectedAgreement.name ||
                              "Unknown Agreement"}
                          </div>
                          <div className="agreement-meta">
                            <span className="dts-number">
                              <FiFileText className="meta-icon" />
                              DTS:{" "}
                              {selectedAgreement.dts_no ||
                                selectedAgreement.id ||
                                "—"}
                            </span>
                            <span className="current-status">
                              <FiCheckCircle className="meta-icon" />
                              Status: {selectedAgreement.status || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upload Form */}
                    <div className="upload-form-section">
                      <div className="form-row">
                        <label className="form-label">
                          <FiFile className="label-icon" />
                          Select Document File
                          <span className="required">*</span>
                        </label>
                        <div className="file-upload-area">
                          <input
                            type="file"
                            id="document-upload"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => setUploadFile(e.target.files[0])}
                            className="file-input"
                          />
                          <label
                            htmlFor="document-upload"
                            className="file-upload-label"
                          >
                            <div className="upload-placeholder">
                              <FiUploadCloud className="upload-icon" />
                              <div className="upload-text">
                                <strong>Choose file to upload</strong>
                                <span>
                                  PDF, DOC, DOCX, JPG, PNG (Max: 10MB)
                                </span>
                              </div>
                            </div>
                          </label>
                          {uploadFile && (
                            <div className="file-preview">
                              <FiFileText className="file-icon" />
                              <span className="file-name">
                                {uploadFile.name}
                              </span>
                              <span className="file-size">
                                ({(uploadFile.size / (1024 * 1024)).toFixed(2)}{" "}
                                MB)
                              </span>
                              <button
                                type="button"
                                className="remove-file"
                                onClick={() => setUploadFile(null)}
                              >
                                <FiX className="icon" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="form-row">
                        <label className="form-label">
                          <FiMessageCircle className="label-icon" />
                          Version Comments
                        </label>
                        <div className="textarea-container">
                          <textarea
                            placeholder="Enter comments about this version (e.g., 'Updated signatures', 'Revised terms', etc.)"
                            value={uploadComment}
                            onChange={(e) => setUploadComment(e.target.value)}
                            className="comment-textarea"
                            rows={4}
                          />
                          <div className="character-count">
                            {uploadComment.length}/500 characters
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overview1-modal-footer">
                    <button
                      className="btn cancel"
                      onClick={() => {
                        setShowUploadForm(false);
                        setSelectedAgreement(null);
                        setUploadFile(null);
                        setUploadComment("");
                      }}
                    >
                      <FiX className="icon" />
                      Cancel
                    </button>
                    <button
                      className="btn save upload-btn"
                      onClick={submitUpload}
                      disabled={uploading || !uploadFile}
                    >
                      {uploading ? (
                        <>
                          <div className="upload-spinner"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FiUpload className="icon" />
                          Upload New Version
                        </>
                      )}
                    </button>
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

export default OverviewMerged;
