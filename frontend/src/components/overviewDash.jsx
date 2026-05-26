/* global API_BASE_URL */
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FiEye,
  FiTrash2,
  FiMoreVertical,
  FiFileText,
  FiArchive,
  FiUpload,
  FiCheckCircle,
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
  FiUsers,
  FiChevronDown,
  FiCheck,
  FiBarChart,
  FiSettings,
  FiDownload,
  FiHash,
  FiXCircle,
  FiArrowRight,
  FiHome,
  FiBookOpen,
  FiClock,
  FiAward,
  FiGrid,
  FiPlus,
  FiSave,
  FiUser,
  FiActivity,
  FiGlobe,
  FiImage,
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
import ReportGen from "./reportGeneration";
import TopBar from "./topbar";
import Sidebar from "./sidebar";

/* ---------- Constants & helpers (copied/adapted from uploaded files) ---------- */

/* Reusable searchable select */
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
    const onDoc = (e) => {
      if (!ref.current) return;
      // Don't close if clicking inside the searchable select component
      if (ref.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
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
        aria-haspopup="listbox"
        aria-expanded={open}
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
            onChange && onChange("");
          }}
          aria-label="Clear selection"
        >
          ×
        </button>
      )}
      {open && (
        <div
          className="ss-panel"
          role="dialog"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            zIndex: 40,
            background: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            marginTop: 6,
            width: "100%",
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
              onClick={(e) => e.stopPropagation()}
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
                  onChange && onChange(o.value);
                  setOpen(false);
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
  { value: "Notary", label: "For Notary" },
  { value: "FFUPCopy", label: "FFUP Copy From College/Campus" },
  { value: "Complete", label: "Completely Signed" },
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

const countryOptionsWithRegions = [
  { value: "Afghanistan", label: "Afghanistan", region: "Southern Asia" },
  { value: "Albania", label: "Albania", region: "Southern Europe" },
  { value: "Algeria", label: "Algeria", region: "Northern Africa" },
  { value: "Andorra", label: "Andorra", region: "Southern Europe" },
  { value: "Angola", label: "Angola", region: "Middle Africa" },
  {
    value: "Antigua and Barbuda",
    label: "Antigua and Barbuda",
    region: "Caribbean",
  },
  { value: "Argentina", label: "Argentina", region: "South America" },
  { value: "Armenia", label: "Armenia", region: "Western Asia" },
  { value: "Australia", label: "Australia", region: "Oceania" },
  { value: "Austria", label: "Austria", region: "Western Europe" },
  { value: "Azerbaijan", label: "Azerbaijan", region: "Western Asia" },
  { value: "Bahamas", label: "Bahamas", region: "Caribbean" },
  { value: "Bahrain", label: "Bahrain", region: "Western Asia" },
  { value: "Bangladesh", label: "Bangladesh", region: "Southern Asia" },
  { value: "Barbados", label: "Barbados", region: "Caribbean" },
  { value: "Belarus", label: "Belarus", region: "Eastern Europe" },
  { value: "Belgium", label: "Belgium", region: "Western Europe" },
  { value: "Belize", label: "Belize", region: "Central America" },
  { value: "Benin", label: "Benin", region: "Western Africa" },
  { value: "Bhutan", label: "Bhutan", region: "Southern Asia" },
  { value: "Bolivia", label: "Bolivia", region: "South America" },
  {
    value: "Bosnia and Herzegovina",
    label: "Bosnia and Herzegovina",
    region: "Southern Europe",
  },
  { value: "Botswana", label: "Botswana", region: "Southern Africa" },
  { value: "Brazil", label: "Brazil", region: "South America" },
  { value: "Brunei", label: "Brunei", region: "South-Eastern Asia" },
  { value: "Bulgaria", label: "Bulgaria", region: "Eastern Europe" },
  { value: "Burkina Faso", label: "Burkina Faso", region: "Western Africa" },
  { value: "Burundi", label: "Burundi", region: "Eastern Africa" },
  { value: "Cambodia", label: "Cambodia", region: "South-Eastern Asia" },
  { value: "Cameroon", label: "Cameroon", region: "Middle Africa" },
  { value: "Canada", label: "Canada", region: "North America" },
  { value: "Cape Verde", label: "Cape Verde", region: "Western Africa" },
  {
    value: "Central African Republic",
    label: "Central African Republic",
    region: "Middle Africa",
  },
  { value: "Chad", label: "Chad", region: "Middle Africa" },
  { value: "Chile", label: "Chile", region: "South America" },
  { value: "China", label: "China", region: "Eastern Asia" },
  { value: "Colombia", label: "Colombia", region: "South America" },
  { value: "Comoros", label: "Comoros", region: "Eastern Africa" },
  { value: "Congo", label: "Congo", region: "Middle Africa" },
  { value: "Costa Rica", label: "Costa Rica", region: "Central America" },
  { value: "Croatia", label: "Croatia", region: "Southern Europe" },
  { value: "Cuba", label: "Cuba", region: "Caribbean" },
  { value: "Cyprus", label: "Cyprus", region: "Western Asia" },
  {
    value: "Czech Republic",
    label: "Czech Republic",
    region: "Eastern Europe",
  },
  { value: "Denmark", label: "Denmark", region: "Northern Europe" },
  { value: "Djibouti", label: "Djibouti", region: "Eastern Africa" },
  { value: "Dominica", label: "Dominica", region: "Caribbean" },
  {
    value: "Dominican Republic",
    label: "Dominican Republic",
    region: "Caribbean",
  },
  { value: "Ecuador", label: "Ecuador", region: "South America" },
  { value: "Egypt", label: "Egypt", region: "Northern Africa" },
  { value: "El Salvador", label: "El Salvador", region: "Central America" },
  {
    value: "Equatorial Guinea",
    label: "Equatorial Guinea",
    region: "Middle Africa",
  },
  { value: "Eritrea", label: "Eritrea", region: "Eastern Africa" },
  { value: "Estonia", label: "Estonia", region: "Northern Europe" },
  { value: "Eswatini", label: "Eswatini", region: "Southern Africa" },
  { value: "Ethiopia", label: "Ethiopia", region: "Eastern Africa" },
  { value: "Fiji", label: "Fiji", region: "Oceania" },
  { value: "Finland", label: "Finland", region: "Northern Europe" },
  { value: "France", label: "France", region: "Western Europe" },
  { value: "Gabon", label: "Gabon", region: "Middle Africa" },
  { value: "Gambia", label: "Gambia", region: "Western Africa" },
  { value: "Georgia", label: "Georgia", region: "Western Asia" },
  { value: "Germany", label: "Germany", region: "Western Europe" },
  { value: "Ghana", label: "Ghana", region: "Western Africa" },
  { value: "Greece", label: "Greece", region: "Southern Europe" },
  { value: "Grenada", label: "Grenada", region: "Caribbean" },
  { value: "Guatemala", label: "Guatemala", region: "Central America" },
  { value: "Guinea", label: "Guinea", region: "Western Africa" },
  { value: "Guinea-Bissau", label: "Guinea-Bissau", region: "Western Africa" },
  { value: "Guyana", label: "Guyana", region: "South America" },
  { value: "Haiti", label: "Haiti", region: "Caribbean" },
  { value: "Honduras", label: "Honduras", region: "Central America" },
  { value: "HongKong", label: "HongKong", region: "Eastern Asia" },
  { value: "Hungary", label: "Hungary", region: "Eastern Europe" },
  { value: "Iceland", label: "Iceland", region: "Northern Europe" },
  { value: "India", label: "India", region: "Southern Asia" },
  { value: "Indonesia", label: "Indonesia", region: "South-Eastern Asia" },
  { value: "Iran", label: "Iran", region: "Southern Asia" },
  { value: "Iraq", label: "Iraq", region: "Western Asia" },
  { value: "Ireland", label: "Ireland", region: "Northern Europe" },
  { value: "Israel", label: "Israel", region: "Western Asia" },
  { value: "Italy", label: "Italy", region: "Southern Europe" },
  { value: "Jamaica", label: "Jamaica", region: "Caribbean" },
  { value: "Japan", label: "Japan", region: "Eastern Asia" },
  { value: "Jordan", label: "Jordan", region: "Western Asia" },
  { value: "Kazakhstan", label: "Kazakhstan", region: "Central Asia" },
  { value: "Kenya", label: "Kenya", region: "Eastern Africa" },
  { value: "Kiribati", label: "Kiribati", region: "Oceania" },
  { value: "Kuwait", label: "Kuwait", region: "Western Asia" },
  { value: "Kyrgyzstan", label: "Kyrgyzstan", region: "Central Asia" },
  { value: "Laos", label: "Laos", region: "South-Eastern Asia" },
  { value: "Latvia", label: "Latvia", region: "Northern Europe" },
  { value: "Lebanon", label: "Lebanon", region: "Western Asia" },
  { value: "Lesotho", label: "Lesotho", region: "Southern Africa" },
  { value: "Liberia", label: "Liberia", region: "Western Africa" },
  { value: "Libya", label: "Libya", region: "Northern Africa" },
  { value: "Liechtenstein", label: "Liechtenstein", region: "Western Europe" },
  { value: "Lithuania", label: "Lithuania", region: "Northern Europe" },
  { value: "Luxembourg", label: "Luxembourg", region: "Western Europe" },
  { value: "Macao", label: "Macao", region: "Eastern Asia" },
  { value: "Madagascar", label: "Madagascar", region: "Eastern Africa" },
  { value: "Malawi", label: "Malawi", region: "Eastern Africa" },
  { value: "Malaysia", label: "Malaysia", region: "South-Eastern Asia" },
  { value: "Maldives", label: "Maldives", region: "Southern Asia" },
  { value: "Mali", label: "Mali", region: "Western Africa" },
  { value: "Malta", label: "Malta", region: "Southern Europe" },
  { value: "Marshall Islands", label: "Marshall Islands", region: "Oceania" },
  { value: "Mauritania", label: "Mauritania", region: "Western Africa" },
  { value: "Mauritius", label: "Mauritius", region: "Eastern Africa" },
  { value: "Mexico", label: "Mexico", region: "Central America" },
  { value: "Micronesia", label: "Micronesia", region: "Oceania" },
  { value: "Moldova", label: "Moldova", region: "Eastern Europe" },
  { value: "Monaco", label: "Monaco", region: "Western Europe" },
  { value: "Mongolia", label: "Mongolia", region: "Eastern Asia" },
  { value: "Montenegro", label: "Montenegro", region: "Southern Europe" },
  { value: "Morocco", label: "Morocco", region: "Northern Africa" },
  { value: "Mozambique", label: "Mozambique", region: "Eastern Africa" },
  { value: "Myanmar", label: "Myanmar", region: "South-Eastern Asia" },
  { value: "Namibia", label: "Namibia", region: "Southern Africa" },
  { value: "Nauru", label: "Nauru", region: "Oceania" },
  { value: "Nepal", label: "Nepal", region: "Southern Asia" },
  { value: "Netherlands", label: "Netherlands", region: "Western Europe" },
  { value: "New Zealand", label: "New Zealand", region: "Oceania" },
  { value: "Nicaragua", label: "Nicaragua", region: "Central America" },
  { value: "Niger", label: "Niger", region: "Western Africa" },
  { value: "Nigeria", label: "Nigeria", region: "Western Africa" },
  { value: "North Korea", label: "North Korea", region: "Eastern Asia" },
  {
    value: "North Macedonia",
    label: "North Macedonia",
    region: "Southern Europe",
  },
  { value: "Norway", label: "Norway", region: "Northern Europe" },
  { value: "Oman", label: "Oman", region: "Western Asia" },
  { value: "Pakistan", label: "Pakistan", region: "Southern Asia" },
  { value: "Palau", label: "Palau", region: "Oceania" },
  { value: "Palestine", label: "Palestine", region: "Western Asia" },
  { value: "Panama", label: "Panama", region: "Central America" },
  { value: "Papua New Guinea", label: "Papua New Guinea", region: "Oceania" },
  { value: "Paraguay", label: "Paraguay", region: "South America" },
  { value: "Peru", label: "Peru", region: "South America" },
  { value: "Philippines", label: "Philippines", region: "South-Eastern Asia" },
  { value: "Poland", label: "Poland", region: "Eastern Europe" },
  { value: "Portugal", label: "Portugal", region: "Southern Europe" },
  { value: "Qatar", label: "Qatar", region: "Western Asia" },
  { value: "Romania", label: "Romania", region: "Eastern Europe" },
  { value: "Russia", label: "Russia", region: "Eastern Europe" },
  { value: "Rwanda", label: "Rwanda", region: "Eastern Africa" },
  {
    value: "Saint Kitts and Nevis",
    label: "Saint Kitts and Nevis",
    region: "Caribbean",
  },
  { value: "Saint Lucia", label: "Saint Lucia", region: "Caribbean" },
  {
    value: "Saint Vincent and the Grenadines",
    label: "Saint Vincent and the Grenadines",
    region: "Caribbean",
  },
  { value: "Samoa", label: "Samoa", region: "Oceania" },
  { value: "San Marino", label: "San Marino", region: "Southern Europe" },
  {
    value: "Sao Tome and Principe",
    label: "Sao Tome and Principe",
    region: "Middle Africa",
  },
  { value: "Saudi Arabia", label: "Saudi Arabia", region: "Western Asia" },
  { value: "Senegal", label: "Senegal", region: "Western Africa" },
  { value: "Serbia", label: "Serbia", region: "Southern Europe" },
  { value: "Seychelles", label: "Seychelles", region: "Eastern Africa" },
  { value: "Sierra Leone", label: "Sierra Leone", region: "Western Africa" },
  { value: "Singapore", label: "Singapore", region: "South-Eastern Asia" },
  { value: "Slovakia", label: "Slovakia", region: "Eastern Europe" },
  { value: "Slovenia", label: "Slovenia", region: "Southern Europe" },
  { value: "Solomon Islands", label: "Solomon Islands", region: "Oceania" },
  { value: "Somalia", label: "Somalia", region: "Eastern Africa" },
  { value: "South Africa", label: "South Africa", region: "Southern Africa" },
  { value: "South Korea", label: "South Korea", region: "Eastern Asia" },
  { value: "South Sudan", label: "South Sudan", region: "Eastern Africa" },
  { value: "Spain", label: "Spain", region: "Southern Europe" },
  { value: "Sri Lanka", label: "Sri Lanka", region: "Southern Asia" },
  { value: "Sudan", label: "Sudan", region: "Northern Africa" },
  { value: "Suriname", label: "Suriname", region: "South America" },
  { value: "Sweden", label: "Sweden", region: "Northern Europe" },
  { value: "Switzerland", label: "Switzerland", region: "Western Europe" },
  { value: "Syria", label: "Syria", region: "Western Asia" },
  { value: "Taiwan", label: "Taiwan", region: "Eastern Asia" },
  { value: "Tajikistan", label: "Tajikistan", region: "Central Asia" },
  { value: "Tanzania", label: "Tanzania", region: "Eastern Africa" },
  { value: "Thailand", label: "Thailand", region: "South-Eastern Asia" },
  { value: "Timor-Leste", label: "Timor-Leste", region: "South-Eastern Asia" },
  { value: "Togo", label: "Togo", region: "Western Africa" },
  { value: "Tonga", label: "Tonga", region: "Oceania" },
  {
    value: "Trinidad and Tobago",
    label: "Trinidad and Tobago",
    region: "Caribbean",
  },
  { value: "Tunisia", label: "Tunisia", region: "Northern Africa" },
  { value: "Turkey", label: "Turkey", region: "Western Asia" },
  { value: "Turkmenistan", label: "Turkmenistan", region: "Central Asia" },
  { value: "Tuvalu", label: "Tuvalu", region: "Oceania" },
  { value: "Uganda", label: "Uganda", region: "Eastern Africa" },
  { value: "Ukraine", label: "Ukraine", region: "Eastern Europe" },
  {
    value: "United Arab Emirates",
    label: "United Arab Emirates",
    region: "Western Asia",
  },
  {
    value: "United Kingdom",
    label: "United Kingdom",
    region: "Northern Europe",
  },
  { value: "United States", label: "United States", region: "North America" },
  { value: "Uruguay", label: "Uruguay", region: "South America" },
  { value: "Uzbekistan", label: "Uzbekistan", region: "Central Asia" },
  { value: "Vanuatu", label: "Vanuatu", region: "Oceania" },
  { value: "Vatican City", label: "Vatican City", region: "Southern Europe" },
  { value: "Venezuela", label: "Venezuela", region: "South America" },
  { value: "Vietnam", label: "Vietnam", region: "South-Eastern Asia" },
  { value: "Yemen", label: "Yemen", region: "Western Asia" },
  { value: "Zambia", label: "Zambia", region: "Eastern Africa" },
  { value: "Zimbabwe", label: "Zimbabwe", region: "Eastern Africa" },
];

const regionOptions = [
  "Central Asia",
  "Eastern Asia",
  "Southern Asia",
  "South-Eastern Asia",
  "Western Asia",
  "Northern Europe",
  "Western Europe",
  "Eastern Europe",
  "Southern Europe",
  "North America",
  "Caribbean",
  "Central America",
  "South America",
  "Oceania",
  "Eastern Africa",
  "Middle Africa",
  "Northern Africa",
  "Southern Africa",
  "Western Africa",
];

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
      const isStr = typeof s === "string";
      const name = isStr ? s : s.signatory_name || s.name || s.person || "";
      const pos = !isStr ? s.signatory_position || s.position || "" : "";
      return [name && name.trim(), pos && `(${pos.trim()})`]
        .filter(Boolean)
        .join(" ");
    })
    .filter((x) => x && x.trim())
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

  const signatories_list = (() => {
    // Helper to coerce various input shapes into an array of objects
    const makeListFromArray = (arr) =>
      Array.isArray(arr)
        ? arr
            .map((x) => {
              if (!x) return null;
              if (typeof x === "string") return { name: x };
              // handle objects that already have signatory_name/name fields
              return x;
            })
            .filter(Boolean)
        : [];

    // 1) Try explicit array fields (may be actual arrays or JSON-encoded strings)
    if (Array.isArray(a.signatories_list))
      return makeListFromArray(a.signatories_list);
    if (Array.isArray(a.signatories)) return makeListFromArray(a.signatories);

    // 2) If fields are strings, try parsing JSON; otherwise fall back to using the raw string
    const tryParse = (val) => {
      if (typeof val !== "string" || !val.trim()) return null;
      const trimmed = val.trim();
      // ignore em-dash placeholder
      if (trimmed === "—" || trimmed === "-" || /^\u2014+$/.test(trimmed))
        return null;
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return makeListFromArray(parsed);
      } catch (e) {
        // not JSON, continue
      }
      return trimmed
        .split(/[,;\n]+/)
        .map((n) => n.trim())
        .filter(Boolean)
        .map((name) => ({ name }));
    };

    const fromSignatoriesListStr = tryParse(a.signatories_list);
    if (fromSignatoriesListStr && fromSignatoriesListStr.length)
      return fromSignatoriesListStr;

    const fromSignatoriesStr = tryParse(a.signatories);
    if (fromSignatoriesStr && fromSignatoriesStr.length)
      return fromSignatoriesStr;

    const fromSigString = tryParse(sigString);
    if (fromSigString && fromSigString.length) return fromSigString;

    return [];
  })();
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
    dts_number: a.dts_number || a.dts_no || "", // alias for report

    // core info
    partner_name: a.name || a.partner_name || "",
    name: a.name || a.partner_name || "", // alias for report
    entity_type: a.entity_type || "",
    organization_type: a.entity_type || a.organization_type || "", // alias for report
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
    // Add aliases for report generation compatibility
    point_persons: point_people.length ? point_people : undefined,
    contact_persons: contact_people.length ? contact_people : undefined,

    // classification
    document_type: a.document_type || "",
    partnership_classification:
      a.partnership_type || a.partnership_classification || "",
    partnership_type: a.partnership_type || a.partnership_classification || "", // alias for report
    validity_period: a.validity_period != null ? String(a.validity_period) : "",

    // dates/status
    status: normalizeStatusIn(a.agreement_status || a.status || ""),
    agreement_status: a.agreement_status || a.status || "", // preserve original for report
    date_of_signing: toISODate(a.date_signed || a.date_of_signing || ""),
    date_signed: toISODate(a.date_signed || a.date_of_signing || ""), // alias for report
    expiry: toISODate(a.date_expiry || a.expiry || ""),
    date_expiry: toISODate(a.date_expiry || a.expiry || ""), // alias for report
    date_received: toISODate(a.entry_date || a.date_received || a.date || ""),
    entry_date: toISODate(a.entry_date || a.date_received || a.date || ""), // alias for report
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

    // related documents (store parent id under MOU_to_MOA_id)
    // Accept legacy `related_mou` as a fallback so older payloads still resolve
    MOU_to_MOA_id: a.MOU_to_MOA_id ?? a.related_mou ?? a.mou_number ?? null,
    // preserve original mou_number when present
    mou_number: a.mou_number ?? null,
    signatories: signatoriesText,
    signatories_list,
    website_link: a.website_link || a.website_url || "",
    website: a.website_link || a.website_url || a.website || "", // alias for report
    website_url: a.website_link || a.website_url || a.website || "", // alias for report
    event_title: a.event_title || a.event_info || "",
    brief_profile: a.brief_profile || a.description || "",
    hardcopy_locator: a.hardcopy_locator || a.hardcopy_location || "",
    hardcopy_location: a.hardcopy_locator || a.hardcopy_location || "", // alias for report
    logo: asDataUrl(a.logo_url) || asDataUrl(a.logo_path) || asDataUrl(a.logo),
    logo_path: a.logo_path || a.logo_url || a.logo || "", // preserve original for report
    logo_url: a.logo_url || a.logo_path || a.logo || "", // alias for report
    remarks: normalizeRemarks(a.remarks_list || a.remarks || a.initial_remarks),

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

const fetchAgreementPreferQuery = async (key) => {
  if (key == null) return null;
  const k = String(key);
  try {
    if (
      agreementService &&
      typeof agreementService.getAgreements === "function"
    ) {
      const res = await agreementService.getAgreements({ agreement_id: k });
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      if (Array.isArray(list) && list.length > 0) return list[0];
    }
  } catch (e) {}

  try {
    if (
      agreementService &&
      typeof agreementService.getAgreementById === "function"
    ) {
      return await agreementService.getAgreementById(k);
    }
  } catch (e) {}
  try {
    if (
      agreementService &&
      typeof agreementService.getAgreementByDts === "function"
    ) {
      return await agreementService.getAgreementByDts(k);
    }
  } catch (e) {
    // ignore
  }

  try {
    if (
      agreementService &&
      typeof agreementService.getAgreements === "function"
    ) {
      try {
        const res = await agreementService.getAgreements({
          agreement_id: k,
          status_filter: "ACTIVE",
        });
        const list = Array.isArray(res) ? res : res?.items || res?.data || [];
        if (Array.isArray(list) && list.length > 0) return list[0];
      } catch (e) {}
      try {
        const res2 = await agreementService.getAgreements({
          dts_number: k,
          status_filter: "ACTIVE",
        });
        const list2 = Array.isArray(res2)
          ? res2
          : res2?.items || res2?.data || [];
        if (Array.isArray(list2) && list2.length > 0) return list2[0];
      } catch (e) {}
      try {
        if (typeof agreementService.getActiveAgreements === "function") {
          const act = await agreementService.getActiveAgreements();
          const list3 = Array.isArray(act)
            ? act
            : act?.items || act?.data || [];
          if (Array.isArray(list3) && list3.length > 0) {
            const found = list3.find((it) => {
              if (!it) return false;
              const candidates = [
                it.agreement_id,
                it._pk,
                it.id,
                it.dts_no,
                it.dts_number,
              ];
              return candidates.some((c) => String(c) === k);
            });
            if (found) return found;
          }
        }
      } catch (e) {}
    }
  } catch (e) {
    // ignore
  }
  return null;
};

const RelatedMou = async (row, all = []) => {
  if (!row) return row;
  const rel = row.MOU_to_MOA_id;
  if (!rel) return row;

  const key = String(rel).trim();

  try {
    console.debug &&
      console.debug("RelatedMou (local-only): resolving", {
        rowId: row.id || row._pk || row.agreement_id,
        key,
      });

    // Build quick lookup maps from the provided `all` list (agreements)
    const list = Array.isArray(all) ? all : [];
    const byId = new Map();
    const byDts = new Map();
    for (const r of list) {
      if (!r) continue;
      const aid = r.agreement_id ?? r._pk ?? r.id;
      if (aid != null) byId.set(String(aid), r);
      const d = r.dts_no || r.dts_number || r.dtsNumber || r.id;
      if (d) byDts.set(String(d), r);
    }

    // If key is numeric, it should be the agreement_id of the parent MOU.
    if (/^\d+$/.test(key)) {
      const found = byId.get(key);
      if (found) {
        console.debug &&
          console.debug("RelatedMou: resolved numeric parent from local", {
            key,
            agreement_id: found.agreement_id,
          });
        // Normalize MOU_to_MOA_id to the numeric agreement_id
        return { ...row, MOU_to_MOA_id: found.agreement_id };
      }
      console.debug &&
        console.debug("RelatedMou: numeric key not found locally", key);
      return row;
    }

    // If key looks like a DTS (e.g., starts with DT), try to find the agreement by DTS
    if (/^DT/i.test(key) || /[^0-9]/.test(key)) {
      const foundByDts = byDts.get(key);
      if (foundByDts && foundByDts.agreement_id != null) {
        console.debug &&
          console.debug("RelatedMou: resolved parent by DTS -> agreement_id", {
            key,
            agreement_id: foundByDts.agreement_id,
          });
        return { ...row, MOU_to_MOA_id: foundByDts.agreement_id };
      }
      console.debug &&
        console.debug("RelatedMou: DTS key not found locally", key);
      return row;
    }
  } catch (e) {
    console.error("RelatedMou (local-only) resolution error", e);
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
      // Demo version - API_BASE_URL not used
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

const excludeActive = (list = []) => {
  if (!Array.isArray(list)) return [];
  return list.filter((a) => {
    const s = String(a?.status || a?.agreement_status || "").toLowerCase();
    return s !== "active" && s !== "withdrawn";
  });
};

/* ---------- Small UI helpers reused from overview1 ---------- */

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
      {value.length > 0 ? (
        value.map((p, idx) => (
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
              className="btn-icon add"
              title="Add Point Person"
              onClick={add}
              disabled={disabled}
            >
              <FiPlus />
            </button>
            <button
              type="button"
              className="btn-icon remove"
              title="Remove Point Person"
              onClick={() => remove(idx)}
              disabled={disabled}
            >
              <FiTrash2 />
            </button>
          </div>
        ))
      ) : (
        <div className="multi-row empty">
          <button
            type="button"
            className="btn-icon add"
            title="Add Contact Person"
            onClick={add}
            disabled={disabled}
          >
            <FiPlus />
          </button>
          <span className="empty-text">
            No contact persons yet - click + to add
          </span>
        </div>
      )}
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
      {list.length > 0 ? (
        list.map((r, i) => (
          <div key={i} className="remark-item">
            <input
              className="edit-input remark-input"
              value={
                typeof r === "object" ? r.remark_text || r.text || "" : r || ""
              }
              onChange={(e) => updateAt(i, e.target.value)}
              disabled={disabled}
              placeholder="Enter remark"
            />
            <button
              type="button"
              className="btn-icon add"
              title="Add Remark"
              onClick={add}
              disabled={disabled}
            >
              <FiPlus />
            </button>
            <button
              type="button"
              className="btn-icon remove"
              title="Remove Remark"
              onClick={() => remove(i)}
              disabled={disabled}
            >
              <FiTrash2 />
            </button>
          </div>
        ))
      ) : (
        <div className="remark-item empty">
          <button
            type="button"
            className="btn-icon add"
            title="Add remark"
            onClick={add}
            disabled={disabled}
          >
            <FiPlus />
          </button>
          <span className="empty-text">No remarks yet - click + to add</span>
        </div>
      )}
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
  const [filterSource, setFilterSource] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterDelayed, setFilterDelayed] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const [activeTab, setActiveTab] = useState("All");

  // tmp filters for panel (Overview1 pattern)
  const [tmpClassification, setTmpClassification] = useState("");
  const [tmpValidity, setTmpValidity] = useState("");
  const [tmpCountry, setTmpCountry] = useState("");
  const [tmpSource, setTmpSource] = useState("");

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
  // canonical identifier used throughout the UI (DTS or agreement_id fallback).
  // Mirrors `ActiveAgreement` behavior so related MOU resolution uses the same ids.
  const selectedDts =
    selectedAgreement?.dts_number ||
    selectedAgreement?.dtsNumber ||
    selectedAgreement?.dts_no ||
    selectedAgreement?.id ||
    selectedAgreement?.agreement_id ||
    null;
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadComment, setUploadComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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
  const loadRequestRef = useRef(0);

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
      // Keep `MOU_to_MOA_id` numeric as provided by the backend.
      // Previously this code attempted to replace numeric parent ids with
      // related DTS numbers during the initial fetch, which caused the
      // parent id to be displayed as a DTS string in the UI. That mapping
      // has been removed so `MOU_to_MOA_id` remains the canonical numeric
      // parent `agreement_id` and resolution to DTS for display is done
      // only when needed (e.g. via `relatedDtsMap` lookups elsewhere).
      return mapped;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to prevent refetches
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const agreements = rawAgreements || [];

  // TEMP LOG: when the overview is opened or the fetched agreements change,
  // print a snapshot of the fetched data to help debugging mapping/resolution.
  useEffect(() => {
    try {
      console.log &&
        console.log("Overview opened - fetched agreements:", {
          count: Array.isArray(agreements) ? agreements.length : 0,
          sample: Array.isArray(agreements)
            ? agreements.slice(0, 5)
            : agreements,
        });
    } catch (e) {
      // ignore
    }
  }, [agreements]);

  // map of related agreement id -> dts_no (populated on-demand when related agreement
  // isn't already present in the fetched agreements list)
  const [relatedDtsMap, setRelatedDtsMap] = useState({});

  // Populate relatedDtsMap from the fetched agreements so numeric MOU_to_MOA_id
  // ids can be shown as DTS numbers in the UI. This mirrors the resolution
  // logic used by ActiveAgreement (which looks up by id/agreement_id).
  useEffect(() => {
    try {
      const map = {};
      for (const a of agreements) {
        if (!a) continue;
        // prefer explicit DTS fields; avoid using id/_pk as they may contain numeric ids
        const val = a.dts_no || a.dts_number || a.dtsNumber || null;
        if (!val) continue;
        const keys = [a.agreement_id, a._pk, a.id].filter((k) => k != null);
        for (const k of keys) {
          const kk = String(k);
          if (kk && !map[kk]) map[kk] = String(val);
        }
      }
      // TEMP LOG: show the local map that will be merged into relatedDtsMap
      try {
        console.debug &&
          console.debug("relatedDtsMap: local map built from agreements:", map);
      } catch (e) {}
      if (Object.keys(map).length) {
        // Merge into existing map while preserving previously-resolved keys.
        // Use prev first so new map entries don't accidentally overwrite
        // existing entries with the same key (safeguard for inconsistent backends).
        setRelatedDtsMap((prev) => {
          try {
            console.debug &&
              console.debug("relatedDtsMap: merging prev -> new", prev, map);
          } catch (e) {}
          return { ...prev, ...map };
        });
      }
    } catch (e) {
      // ignore
    }
  }, [agreements]);

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

  // Resolve any numeric MOU_to_MOA_id ids that weren't matched when mapping.
  // NOTE: automatic background resolution of numeric MOU_to_MOA_id -> DTS was
  // disabled per request because it caused multiple rows to display the same
  // DTS value after the async resolution completed in certain scenarios.
  // Keeping the resolution disabled avoids overwriting/mapping surprises.
  useEffect(() => {
    // intentionally no-op: related DTS resolution removed
    return () => {};
  }, [agreements]);

  // Auto-calculate Date Expiry when editing based on Date PUP Signed + Validity Period
  useEffect(() => {
    if (
      isEditing &&
      selected &&
      selected.pup_official_sign &&
      selected.validity_period
    ) {
      const datePupSigned = selected.pup_official_sign;
      const validityPeriod = selected.validity_period;

      const baseDate = new Date(datePupSigned);
      const yearsToAdd = parseInt(validityPeriod, 10);

      if (!isNaN(yearsToAdd) && yearsToAdd > 0) {
        baseDate.setFullYear(baseDate.getFullYear() + yearsToAdd);
        const expiryCandidate = baseDate.toISOString().split("T")[0];

        // Only update if the calculated value is different from current value
        if (selected.expiry !== expiryCandidate) {
          setSelected((s) => ({
            ...s,
            expiry: expiryCandidate,
          }));
        }
      }
    } else if (
      isEditing &&
      selected &&
      (!selected.pup_official_sign || !selected.validity_period)
    ) {
      // Clear expiry if either pup_official_sign or validity_period is empty
      if (selected.expiry) {
        setSelected((s) => ({
          ...s,
          expiry: "",
        }));
      }
    }
  }, [isEditing, selected?.pup_official_sign, selected?.validity_period]);

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
      ).sort((a, b) => parseInt(a) - parseInt(b)),
    [agreements]
  );
  const countryOptions = useMemo(
    () => Array.from(new Set(agreements.map((a) => a.country).filter(Boolean))),
    [agreements]
  );
  const sourceOptions = useMemo(
    () =>
      Array.from(
        new Set(agreements.map((a) => a.source_unit).filter(Boolean))
      ).sort(),
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
        if (filterSource && a.source_unit !== filterSource) return false;
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
      filterSource,
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

  useEffect(() => {
    if (!Array.isArray(paged)) return;
    const keys = [];
    for (const r of paged) {
      const rel = getLinkedId(r) ?? r.MOU_to_MOA_id ?? null;
      if (!rel) continue;
      const k = String(rel).trim();
      if (/^\d+$/.test(k) && !relatedDtsMap[k]) keys.push(k);
    }
    if (keys.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const k of keys) {
        if (cancelled) break;
        try {
          const resp = await fetchAgreementPreferQuery(Number(k));
          const full =
            resp && resp.agreement
              ? resp.agreement
              : resp && resp.data
              ? resp.data
              : resp;
          const dts =
            full && (full.dts_number || full.dts_no || full.dtsNumber)
              ? String(full.dts_number || full.dts_no || full.dtsNumber)
              : null;
          if (dts) {
            setRelatedDtsMap((prev) => ({ ...prev, [k]: dts }));
            continue;
          }
        } catch (e) {
          // ignore
        }

        try {
          if (
            agreementService &&
            typeof agreementService.getAgreementByDts === "function"
          ) {
            const resp2 = await agreementService.getAgreementByDts(k);
            const full2 =
              resp2 && resp2.agreement
                ? resp2.agreement
                : resp2 && resp2.data
                ? resp2.data
                : resp2;
            const dts2 =
              full2 && (full2.dts_number || full2.dts_no || full2.dtsNumber)
                ? String(full2.dts_number || full2.dts_no || full2.dtsNumber)
                : null;
            if (dts2) setRelatedDtsMap((prev) => ({ ...prev, [k]: dts2 }));
          }
        } catch (e) {
          // ignore
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paged]);

  const RelatedMouLabel = ({ row }) => {
    const rel = getLinkedId(row) ?? row.MOU_to_MOA_id ?? null;
    const key = rel != null ? String(rel).trim() : null;

    // Prefer showing the numeric MOU_to_MOA_id. If the stored value is a DTS
    // string, attempt to resolve it to the local agreement's numeric id.
    const computeNumericParentId = () => {
      if (!key) return null;
      // If the stored value is already numeric, show it directly
      if (/^\d+$/.test(key)) return key;

      // If it looks like a DTS (DT... or contains letters), try to find the agreement by DTS
      try {
        const foundByDts = agreements.find((a) => {
          try {
            return (
              equalsKey(a.dts_no, key) ||
              equalsKey(a.dts_number, key) ||
              equalsKey(a.id, key)
            );
          } catch (e) {
            return false;
          }
        });
        if (foundByDts && foundByDts.agreement_id != null)
          return String(foundByDts.agreement_id);
      } catch (e) {
        // ignore
      }

      // As a last resort return the raw key so user can still click it
      return key;
    };

    const label = computeNumericParentId();

    const handleOpen = async (e) => {
      if (e && e.stopPropagation) e.stopPropagation();

      // If key is a DTS, try to find agreement by DTS and use its numeric agreement_id
      if (/^DT/i.test(key)) {
        const byDts = agreements.find((a) => {
          try {
            return (
              equalsKey(a.dts_no, key) ||
              equalsKey(a.dts_number, key) ||
              equalsKey(a.id, key)
            );
          } catch (e) {
            return false;
          }
        });
        if (byDts) {
          setSelected(byDts);
          setDetailOpen(true);
          return;
        }
      }

      // Treat key as numeric agreement_id when possible
      const found = agreements.find((a) => {
        try {
          return (
            equalsKey(a.agreement_id, key) ||
            equalsKey(a._pk, key) ||
            equalsKey(a.id, key)
          );
        } catch (e) {
          return false;
        }
      });
      if (found) {
        setSelected(found);
        setDetailOpen(true);
        return;
      }

      try {
        console.debug &&
          console.debug(
            "RelatedMouLabel.handleOpen: parent not found in agreements (no local parent).",
            { key, row }
          );
      } catch (e) {}

      // Fallback: open a minimal stub so the modal still appears with the key
      setSelected({ id: key, dts_no: key, partner_name: String(key) });
      setDetailOpen(true);
      return;
    };

    return (
      <span className="related-mou">
        <div className="req">
          <button
            type="button"
            className="linked-mou-btn"
            onClick={handleOpen}
            title={`View linked MOU ${label}`}
            aria-label={`View linked MOU ${label}`}
            style={{
              background: "transparent",
              border: "none",
              color: "#5a1522",
              cursor: "pointer",
              padding: 0,
              fontWeight: 700,
            }}
          >
            {label}
          </button>
        </div>
      </span>
    );
  };

  const getPk = (row) =>
    row?.agreement_id ?? row?._pk ?? row?.id ?? row?.dts_no;

  // Compare trimmed strings
  const equalsKey = (a, b) => {
    try {
      const sa = a == null ? "" : String(a).trim();
      const sb = b == null ? "" : String(b).trim();
      return sa !== "" && sb !== "" && sa === sb;
    } catch (e) {
      return false;
    }
  };

  // helper: find the linked MOU id/key on an agreement object (mirror ActiveAgreement)
  const getLinkedId = (a) => {
    if (!a) return undefined;
    const candidates = [
      a.MOU_to_MOA_id,
      a.related_mou,
      a.mou_number,
      a.linked_mou,
      a.linked_mou_id,
      a.linkedMouId,
    ];
    try {
      console.debug &&
        console.debug("getLinkedId called", {
          id: a?.id || a?.dts_no || a?.agreement_id,
          candidates,
        });
    } catch (e) {}
    // return first non-null/undefined candidate
    for (const c of candidates) if (c != null) return c;
    return undefined;
  };

  // Build list of MOU parents and their MOA children (mirrors ActiveAgreement behaviour)
  const buildMouWithChildren = (agreementsList = agreements) => {
    try {
      const mouList = (agreementsList || []).filter(
        (a) =>
          String(a.document_type || a.documentType || "").toUpperCase() ===
          "MOU"
      );
      const mouWithChildren = mouList
        .map((mou) => {
          const mid = mou.id || mou.agreement_id;
          const children = (agreementsList || []).filter((c) => {
            if (
              String(c.document_type || c.documentType || "").toUpperCase() !==
              "MOA"
            )
              return false;
            const linked =
              getLinkedId(c) ??
              c.linkedMouId ??
              c.MOU_to_MOA_id ??
              c.linked_mou ??
              c.linked_mou_id;
            // compare against multiple possible parent identifiers (agreement_id, id, dts fields)
            if (equalsKey(linked, mid)) return true;
            if (equalsKey(c.MOU_to_MOA_id, mid)) return true;
            if (equalsKey(c.linkedMouId, mid)) return true;
            if (equalsKey(c.linked_mou, mid)) return true;
            if (equalsKey(c.linked_mou_id, mid)) return true;
            // also consider matching against parent's DTS number
            if (
              equalsKey(linked, mou.dts_no) ||
              equalsKey(linked, mou.dts_number)
            )
              return true;
            return false;
          });
          return { mou, children };
        })
        .filter((item) => item.children && item.children.length > 0);
      return mouWithChildren;
    } catch (e) {
      return [];
    }
  };

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
  // number of delayed / "needs attention" items per stage
  const stageAttentionCounts = useMemo(() => {
    const map = {};
    for (const s of STAGE_LIST) map[s.value] = 0;
    for (const a of baseList) {
      if (a.status && a.delayed && map[a.status] !== undefined)
        map[a.status] += 1;
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
    const byId = row ? row.agreement_id ?? row._pk ?? null : rowOrId;
    const byDts = row ? row.dts_no || row.id || null : null;
    // mark this load with a unique token so late responses don't overwrite
    const req = ++loadRequestRef.current;
    setModalLoading(true);
    setModalError("");
    try {
      let full = null;
      // If a row object was provided (from the in-memory list), prefer using it
      // rather than issuing a detail GET. This mirrors ActiveAgreement's
      // behavior which avoids calling a missing detail endpoint.
      if (row && typeof row === "object") {
        full = row;
      } else {
        // Debug: log what we're trying to fetch
        // console.debug('loadAgreementDetails: byId=', byId, 'byDts=', byDts, 'row=', row);
        // Prefer a local in-memory lookup from `agreements` before making network calls.
        const lookupKey =
          byId != null ? String(byId) : byDts ? String(byDts) : null;
        if (lookupKey) {
          try {
            const foundLocal = agreements.find((a) => {
              try {
                return (
                  equalsKey(a.agreement_id, lookupKey) ||
                  equalsKey(a._pk, lookupKey) ||
                  equalsKey(a.id, lookupKey) ||
                  equalsKey(a.dts_no, lookupKey) ||
                  equalsKey(a.dts_number, lookupKey)
                );
              } catch (e) {
                return false;
              }
            });
            if (foundLocal) {
              full = foundLocal;
            }
          } catch (e) {
            // ignore and fall back to remote fetch
          }
        }

        // If not available locally, fall back to fetching from the service
        if (!full) {
          const hasNumericId = byId != null && /^\d+$/.test(String(byId));
          if (hasNumericId) {
            try {
              full = await agreementService.getAgreementById(Number(byId));
            } catch (err) {
              const dtsCandidate = String(byId) || null;
              if (
                dtsCandidate &&
                typeof agreementService.getAgreementByDts === "function"
              ) {
                full = await agreementService.getAgreementByDts(dtsCandidate);
              } else {
                throw err;
              }
            }
          } else if (byDts) {
            if (typeof agreementService.getAgreementByDts === "function") {
              full = await agreementService.getAgreementByDts(byDts);
            } else {
              full = await agreementService.getAgreementById(byId);
            }
          } else if (byId) {
            try {
              full = await agreementService.getAgreementById(byId);
            } catch (err) {
              if (typeof agreementService.getAgreementByDts === "function") {
                full = await agreementService.getAgreementByDts(String(byId));
              } else {
                throw err;
              }
            }
          }
        }
      }

      if (full && typeof full === "object") {
        if (full.agreement) full = full.agreement;
        else if (full.data) full = full.data;
      }
      let mapped = applyBackendStageData(mapAgreement(full));
      if (row) {
        mapped = {
          ...mapped,
          id: row.id ?? row.dts_no ?? mapped.id,
          dts_no: row.dts_no ?? mapped.dts_no,
        };
      }
      // try to resolve related MOU id -> DTS number using the current agreements list
      mapped = await RelatedMou(mapped, agreements);
      // Only apply the result if this is the latest outstanding request
      if (loadRequestRef.current === req) {
        setSelected(mapped);
        if (!isEditing) originalRef.current = mapped;
      } else {
        // stale response - ignore
        return;
      }
    } catch (e) {
      console.error("Failed to load details:", e);
      // only set modal error for the active request
      if (loadRequestRef.current === req)
        setModalError(e.detail || e.message || "Failed to load details");
    } finally {
      // only clear loading state for the active request
      if (loadRequestRef.current === req) setModalLoading(false);
    }
  };

  const openDetails = async (row) => {
    if (!row) return;
    try {
      // Prefer loading the authoritative full agreement from the server
      // which includes fields like signatories that may be absent
      // on the summary/list row. `loadAgreementDetails` will set
      // `selected` when successful.
      await loadAgreementDetails(row);
      // If loadAgreementDetails succeeded it already set `selected`.
      if (!selected) {
        // defensive: if selected wasn't set for some reason, fall back
        const mapped = applyBackendStageData(mapAgreement(row));
        const resolved = await RelatedMou(mapped, agreements);
        setSelected(resolved);
      }
    } catch (e) {
      // fallback: map the provided row and use that
      try {
        const mapped = applyBackendStageData(mapAgreement(row));
        const resolved = await RelatedMou(mapped, agreements);
        setSelected(resolved);
      } catch (e2) {
        setSelected(row);
      }
    }
    setIsEditing(false);
    setModalError("");
    setDetailOpen(true);
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

    // signatories_list: backend stores this as a VARCHAR string; always return string
    const normalizeSignatoriesList = (sigs, list) => {
      // If it's already a string, return as-is
      if (typeof list === "string" && list.trim()) return list;
      if (typeof sigs === "string" && sigs.trim()) return sigs;

      // If it's an array, convert to comma-separated string
      if (Array.isArray(list) && list.length) {
        return list
          .map((item) => {
            if (typeof item === "object") {
              // Extract name/person from object
              return item.signatory_name || item.name || item.person || item;
            }
            return String(item).trim();
          })
          .filter(Boolean)
          .join(", ");
      }

      if (Array.isArray(sigs) && sigs.length) {
        return sigs
          .map((item) => {
            if (typeof item === "object") {
              return item.signatory_name || item.name || item.person || item;
            }
            return String(item).trim();
          })
          .filter(Boolean)
          .join(", ");
      }

      return undefined;
    };

    const toSignatoryObjects = (arr) => {
      const list = Array.isArray(arr) ? arr : [];
      return list.map((item) => {
        if (typeof item === "object") {
          return {
            signatory_name:
              item.signatory_name || item.name || item.person || "",
            signatory_position: item.signatory_position || item.position || "",
          };
        }
        const str = String(item);
        const m = str.match(/^\s*(.*?)\s*(?:\((.*?)\))?\s*$/);
        return {
          signatory_name: (m && m[1]) || str,
          signatory_position: (m && m[2]) || "",
        };
      });
    };

    const payload = {
      // DO NOT include dts_number in body payload; it's the path parameter (agreement_id)
      // dts_number is only needed when actually changing the DTS, which is rare
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
      // related agreement id - prefer explicit numeric parent id when present
      // Only send a numeric id to avoid sending DTS strings (which cause a 422/500 on the server)
      MOU_to_MOA_id: (() => {
        const raw =
          s.MOU_to_MOA_id ??
          s.linkedMouId ??
          s.linked_mou ??
          s.related_mou ??
          null;
        if (raw == null || raw === "") return undefined;
        // If it's already a number, return it. If it's a numeric string, coerce to Number.
        if (typeof raw === "number") return raw;
        const str = String(raw).trim();
        if (/^\d+$/.test(str)) return Number(str);
        // Non-numeric values (e.g. DTS strings) are intentionally not sent here.
        return undefined;
      })(),
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
      // signatories for compatibility: send only string list for DB storage
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

      // Try multiple ID candidates
      const rawCandidates = [
        getPk(selected),
        selected?.agreement_id,
        selected?._pk,
        selected?.id,
        selected?.dts_no,
        selected?.dts_number,
      ];
      // Prefer numeric IDs first
      const idCandidates = Array.from(new Set(rawCandidates))
        .filter((x) => x != null && x !== "")
        .sort((a, b) => {
          const na = /^\d+$/.test(String(a));
          const nb = /^\d+$/.test(String(b));
          if (na === nb) return 0;
          return na ? -1 : 1;
        });

      let updated = null;
      let lastErr = null;
      for (const candidate of idCandidates) {
        try {
          updated = await agreementService.updateAgreement(candidate, payload);
          // stop on first successful update
          break;
        } catch (err) {
          lastErr = err;
          // continue to next candidate
        }
      }
      if (!updated) {
        // If none of the candidates worked, surface the last error
        throw lastErr || new Error("Failed to update agreement");
      }
      let mapped = applyBackendStageData(mapAgreement(updated));
      mapped = await RelatedMou(mapped, agreements);
      try {
        const hasServerSigs =
          Array.isArray(mapped.signatories_list) &&
          mapped.signatories_list.length > 0;
        const sentSigs = Array.isArray(payload.signatories_list)
          ? payload.signatories_list
          : [];
        if (!hasServerSigs && sentSigs.length) {
          mapped.signatories_list = sentSigs;
        }
      } catch (e) {}
      try {
        const origStatus = originalRef.current?.status;
        if (origStatus && mapped.status && origStatus !== mapped.status) {
          // Status changed: reset stage start
          mapped._stage_start_at = new Date().toISOString();
          mapped = applyBackendStageData(mapped);
        } else if (originalRef.current?._stage_start_at) {
          // Status did NOT change: always preserve original stage start, ignore backend value
          mapped._stage_start_at = originalRef.current._stage_start_at;
          mapped = applyBackendStageData(mapped);
        }
      } catch (e) {
        /* ignore */
      }
      setSelected(mapped);
      originalRef.current = mapped;
      setIsEditing(false);
      // Update the cached agreements list so the overview updates immediately
      try {
        queryClient.setQueryData(["agreements"], (old) => {
          try {
            if (!Array.isArray(old)) return old;
            const key =
              getPk(mapped) || mapped._pk || mapped.id || mapped.dts_no;
            let found = false;
            const updated = old.map((it) => {
              const itKey = getPk(it) || it._pk || it.id || it.dts_no;
              if (String(itKey) === String(key)) {
                found = true;
                return mapped;
              }
              return it;
            });
            if (!found) {
              // If this agreement isn't in the current list (e.g. newly created), add it to the front
              updated.unshift(mapped);
            }
            return updated;
          } catch (e) {
            return old;
          }
        });
      } catch (e) {}

      // Ensure queries are refreshed from the server; await so UI reflects latest data
      try {
        await queryClient.invalidateQueries(["agreements"]);
      } catch (e) {}
    } catch (e) {
      console.error("Failed to save details:", e);
      alert("Failed to save changes: " + (e.detail || e.message || e));
    }
  };

  // Check if any changes have been made to the selected agreement
  const hasChanges = () => {
    if (!selected || !originalRef.current) return false;

    // Helper to compare arrays
    const arraysEqual = (a, b) => {
      if (!Array.isArray(a) || !Array.isArray(b)) return a === b;
      if (a.length !== b.length) return false;
      return JSON.stringify(a) === JSON.stringify(b);
    };

    // Compare key fields that can be edited
    const fieldsToCheck = [
      "document_type",
      "validity_period",
      "status",
      "dts_no",
      "source_unit",
      "partnership_classification",
      "partner_name",
      "entity_type",
      "country",
      "region",
      "address",
      "logo",
      "logo_path",
      "website_link",
      "brief_profile",
      "signatories",
      "date_received",
      "expiry",
      "pup_official_sign",
      "date_of_signing",
      "date_endorsed_ulco",
      "ulco_approval",
      "hardcopy_locator",
      "event_title",
    ];

    for (const field of fieldsToCheck) {
      const current = selected[field];
      const original = originalRef.current[field];
      if (current !== original) return true;
    }

    // Check complex fields (point_people, contact_people, remarks)
    if (!arraysEqual(selected.point_people, originalRef.current.point_people))
      return true;
    if (
      !arraysEqual(selected.contact_people, originalRef.current.contact_people)
    )
      return true;
    if (!arraysEqual(selected.remarks, originalRef.current.remarks))
      return true;

    return false;
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
      const updated = await agreementService.updateAgreement(
        agreementId,
        editedData
      );
      // update cache immediately if possible
      try {
        const mapped = applyBackendStageData(mapAgreement(updated));
        const pk = agreementId;
        queryClient.setQueryData(["agreements"], (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((it) => {
            const itKey = getPk(it) || it._pk || it.id || it.dts_no;
            if (String(itKey) === String(pk)) return mapped;
            return it;
          });
        });
      } catch (e) {}
      await queryClient.invalidateQueries(["agreements"]);
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
      // Optimistically remove the deleted agreement from the local cache
      try {
        queryClient.setQueryData(["agreements"], (old) => {
          if (!Array.isArray(old)) return old;
          return old.filter((it) => {
            const itKey = getPk(it) || it._pk || it.id || it.dts_no;
            return String(itKey) !== String(agreementId);
          });
        });
      } catch (e) {
        // ignore cache update failures
      }
      // Ensure server-side state is reconciled
      try {
        await queryClient.invalidateQueries(["agreements"]);
      } catch (e) {}
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
      // Use the shared ReportGen helper to produce an XLSX in-browser
      const items = agreements.filter((a) => {
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
      await ReportGen.downloadXLSX({
        items,
        reportKey: String(docFilter || "all").toLowerCase(),
        filenamePrefix: `agreements_overview${
          docFilter === "All" ? "" : "_" + docFilter
        }${statusFilter === "All" ? "" : "_" + statusFilter}`,
        getLinkedId,
        allAgreements: agreements,
      });
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed: " + (err.message || err));
    }
  };

  // Helper to build the items list used by the report generator modal
  const getGenerateItems = (docFilter = "All", statusFilter = "All") => {
    return agreements.filter((a) => {
      if (!a || String(a.status || "").toLowerCase() === "active") return false;
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
        mapped = await RelatedMou(mapped, agreements);
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
        mapped = await RelatedMou(mapped, agreements);
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
    // Calculate position relative to button
    try {
      const rect = evt.currentTarget.getBoundingClientRect();
      const top = rect.bottom + 4;
      const left = rect.right - 160; // align right edge of menu with button
      setMenuPos({ top, left });
    } catch (e) {
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
    const handleScroll = () => {
      // close menu when scrolling
      if (menuOpenId) setMenuOpenId(null);
    };
    document.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showFilterPanel, menuOpenId]);

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
      // Optimistically mark the agreement as having a recent upload in cache
      try {
        queryClient.setQueryData(["agreements"], (old) => {
          if (!Array.isArray(old)) return old;
          const pk =
            selectedAgreement._pk ??
            selectedAgreement.id ??
            selectedAgreement.dts_no;
          return old.map((it) => {
            const itKey = getPk(it) || it._pk || it.id || it.dts_no;
            if (String(itKey) === String(pk)) {
              try {
                // Add a lightweight marker so UI can react immediately
                const updated = {
                  ...it,
                  _last_upload_at: new Date().toISOString(),
                };
                return applyBackendStageData(mapAgreement(updated));
              } catch (e) {
                return { ...it, _last_upload_at: new Date().toISOString() };
              }
            }
            return it;
          });
        });
      } catch (e) {
        // ignore cache update failures
      }
      setSelectedAgreement(null);
      setUploadFile(null);
      setUploadComment("");
      // Reconcile with server state
      try {
        await queryClient.invalidateQueries(["agreements"]);
      } catch (e) {}
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
                  data-attention-count={stageAttentionCounts[s.value] || 0}
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
                      setTmpSource(filterSource);
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

                <div
                  className="overview1-panel-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px",
                  }}
                >
                  <div className="overview1-panel-field">
                    <label className="filter-label">
                      <FiTag className="filter-icon" />
                      Classification
                    </label>
                    <SearchableSelect
                      options={[
                        { value: "", label: "All" },
                        ...classificationOptions.map((c) => ({
                          value: c,
                          label: c,
                        })),
                      ]}
                      value={tmpClassification}
                      onChange={(v) => setTmpClassification(v || "")}
                      placeholder="All"
                      allowClear={false}
                    />
                  </div>

                  <div className="overview1-panel-field">
                    <label className="filter-label">
                      <FiClock className="filter-icon" />
                      Validity Period
                    </label>
                    <SearchableSelect
                      options={[
                        { value: "", label: "All" },
                        ...validityOptions.map((v) => ({
                          value: v,
                          label: v
                            ? `${v} ${parseInt(v) === 1 ? "Year" : "Years"}`
                            : v,
                        })),
                      ]}
                      value={tmpValidity}
                      onChange={(v) => setTmpValidity(v || "")}
                      placeholder="All"
                      allowClear={false}
                    />
                  </div>

                  <div className="overview1-panel-field">
                    <label className="filter-label">
                      <FiMapPin className="filter-icon" />
                      Country
                    </label>
                    <SearchableSelect
                      options={[
                        { value: "", label: "All" },
                        ...countryOptions.map((c) => ({
                          value: c,
                          label: c,
                        })),
                      ]}
                      value={tmpCountry}
                      onChange={(v) => setTmpCountry(v || "")}
                      placeholder="All"
                      allowClear={false}
                    />
                  </div>

                  <div className="overview1-panel-field">
                    <label className="filter-label">
                      <FiHome className="filter-icon" />
                      Source Unit
                    </label>
                    <SearchableSelect
                      options={[
                        { value: "", label: "All" },
                        ...sourceOptions.map((s) => ({
                          value: s,
                          label: s,
                        })),
                      ]}
                      value={tmpSource}
                      onChange={(v) => setTmpSource(v || "")}
                      placeholder="All"
                      allowClear={false}
                    />
                  </div>
                </div>

                <div className="overview1-filter-actions">
                  <button
                    className="btn clear"
                    onClick={() => {
                      setTmpClassification("");
                      setTmpValidity("");
                      setTmpCountry("");
                      setTmpSource("");
                      setFilterClassification("");
                      setFilterValidity("");
                      setFilterCountry("");
                      setFilterSource("");
                      setShowFilterPanel(false);
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
                      setFilterSource(tmpSource);
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
                      {/* Related MOU (match ActiveAgreement 'Connection' column behavior) */}
                      <td>
                        {(() => {
                          const parentId = getLinkedId(row);
                          let parent = null;
                          try {
                            console.debug &&
                              console.debug("overview: resolving parent", {
                                rowId:
                                  row?.id || row?.dts_no || row?.agreement_id,
                                parentId,
                              });
                          } catch (e) {}
                          if (parentId) {
                            parent = agreements.find(
                              (x) =>
                                String(x.id) === String(parentId) ||
                                String(x.agreement_id) === String(parentId) ||
                                String(x.linkedMouId) === String(parentId)
                            );
                            try {
                              console.debug &&
                                console.debug(
                                  "overview: parent lookup result",
                                  {
                                    parentId,
                                    parent: parent
                                      ? {
                                          id: parent.id,
                                          agreement_id: parent.agreement_id,
                                          dts_no: parent.dts_no,
                                        }
                                      : null,
                                  }
                                );
                            } catch (e) {}
                          }

                          if (parentId && parent) {
                            return (
                              <span className="agreement-tooltip">
                                <button
                                  type="button"
                                  className="linked linked-child parent-dts-button"
                                  onClick={() => openDetails(parent)}
                                  aria-label={`View linked MOU ${
                                    parent?.dts_no ||
                                    parent?.dts_number ||
                                    parentId
                                  }`}
                                  title={
                                    parent?.dts_no ||
                                    parent?.dts_number ||
                                    parentId
                                  }
                                >
                                  <FiLink className="link-icon" />
                                  <span className="parent-dts">
                                    {parent?.dts_no ||
                                      parent?.dts_number ||
                                      parentId}
                                  </span>
                                </button>
                              </span>
                            );
                          }

                          // Do not render MOA children in the Related MOU column.
                          if (
                            String(row.document_type || "").toUpperCase() ===
                            "MOA"
                          ) {
                            return (
                              <span className="independent">Independent</span>
                            );
                          }

                          return <span className="dash">—</span>;
                        })()}
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
                            style={{
                              display: "inline-block",
                              position: "relative",
                            }}
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
                                      handleViewLatestFile(
                                        row.dts_no || row.id
                                      );
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
                                    <FiArchive style={{ marginRight: 4 }} />{" "}
                                    View Older Files
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
                          {/* Activate button - shown for Complete status */}
                          {row.status &&
                            String(row.status).toLowerCase() === "complete" &&
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
                      {/* Updated Agreement Type Badge */}
                      <span
                        className={`header-badge doc ${String(
                          selected.document_type || ""
                        ).toLowerCase()}`}
                      >
                        <FiFileText className="badge-icon" />
                        {selected.document_type || "—"}
                      </span>
                      <h3 id="modal-title" className="modal-title white-title">
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

                  <div className="overview1-modal-body details-modal-body">
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
                      <>
                        <div className="details-summary-card">
                          <div className="details-header">
                            <div className="details-icon-container">
                              <FiFileText className="details-main-icon" />
                            </div>
                            <div className="details-titles">
                              <div className="details-title">
                                {selected.partner_name ||
                                  selected.name ||
                                  "Agreement Details"}
                              </div>
                              <div className="details-sub">
                                {selected.document_type || "—"} •{" "}
                                {LIFECYCLE_OPTIONS.find(
                                  (o) => o.value === selected.status
                                )?.label ||
                                  selected.status ||
                                  "—"}
                              </div>
                            </div>
                            <div
                              className="file-actions"
                              style={{ marginLeft: "auto" }}
                            >
                              <button
                                className="btn action view-file"
                                onClick={() =>
                                  handleViewLatestFile(
                                    selected.dts_no || selected.id
                                  )
                                }
                                title="View Latest File"
                                aria-label="View Latest File"
                              >
                                <FiEye className="icon" />
                                View File
                              </button>
                              <button
                                className="btn action older-files"
                                onClick={() =>
                                  navigate(
                                    `/docVer?dts_number=${
                                      selected.dts_no || selected.id
                                    }`
                                  )
                                }
                                title="View Older Files"
                                aria-label="View Older Files"
                              >
                                <FiArchive className="icon" />
                                Older Files
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Document Information */}
                        <section className="modal-section docinfo">
                          <div className="section-header">
                            <FiInfo className="header-icon" />
                            <h4>Document Information</h4>
                          </div>
                          <div className="row two-col">
                            <div>
                              <div className="label">
                                <FiHash className="label-icon" />
                                DTS Number
                              </div>
                              <div className="value mono">
                                {selected.dts_no || selected.id || "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                <FiFileText className="label-icon" />
                                Document Type
                              </div>
                              <div className="value">
                                {selected.document_type || "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                <FiCalendar className="label-icon" />
                                Date Received
                              </div>
                              <div className="value">
                                {selected.date_received
                                  ? new Date(
                                      selected.date_received
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                <FiHome className="label-icon" />
                                Source Unit
                              </div>
                              <div className="value">
                                {selected.source_unit || "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                <FiMapPin className="label-icon" />
                                Hardcopy Locator
                              </div>
                              <div className="value">
                                {selected.hardcopy_locator || "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                <FiCheckCircle className="label-icon" />
                                Current Status
                              </div>
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
                          <div className="label" style={{ marginTop: 20 }}>
                            <FiBookOpen className="label-icon brief-profile-icon" />
                            Brief Profile
                          </div>
                          <div
                            className="brief"
                            style={{ marginTop: 8, lineHeight: 1.6 }}
                          >
                            {selected.brief_profile ||
                              selected.description ||
                              "—"}
                          </div>
                        </section>

                        {/* ===== Linked MOU (placed below Signatories) ===== */}
                        {(() => {
                          // If the currently selected record is an MOU, render it with its MOA children
                          if (
                            String(
                              selected.document_type || ""
                            ).toUpperCase() === "MOU"
                          ) {
                            const mid = selected.id || selected.agreement_id;
                            const children = Array.isArray(agreements)
                              ? agreements.filter(
                                  (c) =>
                                    String(
                                      c.document_type || c.documentType || ""
                                    ).toUpperCase() === "MOA" &&
                                    (getLinkedId(c) === mid ||
                                      c.linkedMouId === mid ||
                                      c.MOU_to_MOA_id === mid)
                                )
                              : [];

                            if (!children || children.length === 0) {
                              // No linked MOAs for this MOU
                              return null;
                            }

                            return (
                              <section className="modal-section linked-mou">
                                <div className="section-header">
                                  <FiLink className="header-icon" />
                                  <h4>Linked Agreements</h4>
                                </div>

                                <div
                                  className="linked-mou-card"
                                  onClick={() => openDetails(selected)}
                                  style={{ cursor: "pointer" }}
                                >
                                  <div className="linked-mou-left">
                                    <span className="badge mou">MOU</span>
                                  </div>
                                  <div className="linked-mou-body">
                                    <strong className="linked-mou-title">
                                      {selected.partner_name ||
                                        selected.name ||
                                        selected.event_title ||
                                        selected.eventTitle ||
                                        "—"}
                                    </strong>
                                    <div className="linked-mou-sub">
                                      {selected.partnership_classification ||
                                        selected.partnership_type ||
                                        selected.partnershipClassification ||
                                        "—"}
                                    </div>
                                    <div className="linked-mou-valid">
                                      Valid until:{" "}
                                      {selected.expiry || selected.date_expiry
                                        ? new Date(
                                            selected.expiry ||
                                              selected.date_expiry
                                          ).toLocaleDateString()
                                        : "—"}
                                    </div>
                                    <div className="linked-mou-dts">
                                      {selected.dts_no ||
                                        selected.dts_number ||
                                        selected.id ||
                                        "—"}
                                    </div>
                                  </div>
                                </div>

                                <div className="mou-based">
                                  <div className="mou-based-title">
                                    <FiLink className="link-inline" />{" "}
                                    Agreements based on this MOU (
                                    {children.length})
                                  </div>

                                  <div className="mou-children">
                                    {children.map((c) => (
                                      <div
                                        className="moa-child-card"
                                        key={c.id || c.agreement_id}
                                      >
                                        <div className="moa-left">
                                          <FiArrowRight className="arrow-icon" />
                                          <span className="badge moa">MOA</span>
                                        </div>

                                        <div className="moa-body">
                                          <strong className="moa-title">
                                            {c.event_title || c.eventTitle}
                                          </strong>
                                          <div className="moa-sub small">
                                            Partner: {c.name || c.partnerName} (
                                            {c.country})
                                          </div>
                                          <div className="moa-sub small">
                                            Source:{" "}
                                            {c.source_unit ||
                                              c.source ||
                                              c.initiating_unit}
                                          </div>
                                          <div className="moa-valid small">
                                            Valid:{" "}
                                            {c.date_signed || c.dateOfSigning
                                              ? new Date(
                                                  c.date_signed ||
                                                    c.dateOfSigning
                                                ).toLocaleDateString()
                                              : "—"}{" "}
                                            →{" "}
                                            {c.date_expiry || c.expiryDate
                                              ? new Date(
                                                  c.date_expiry || c.expiryDate
                                                ).toLocaleDateString()
                                              : "—"}
                                          </div>
                                          <div className="moa-dts small">
                                            {c.dts_number ||
                                              c.dtsNumber ||
                                              c.dts_no ||
                                              c.id}
                                          </div>
                                        </div>

                                        <button
                                          className="moa-view-btn"
                                          onClick={() => openDetails(c)}
                                          aria-label={`View details for ${
                                            c.dts_number ||
                                            c.dtsNumber ||
                                            c.event_title ||
                                            "agreement"
                                          }`}
                                        >
                                          <FiEye className="icon" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </section>
                            );
                          }

                          // Fallback: existing behavior for non-MOU records (show their linked MOU if present)
                          // Normalize & resolve linked id using the same helper as ActiveAgreement
                          const lid =
                            getLinkedId(selected) ||
                            selected.linkedMouId ||
                            selected.linked_mou ||
                            selected.MOU_to_MOA_id;
                          if (!lid) return null;

                          const lidStr = String(lid).trim();

                          // Try to find a matching agreement in-memory with a number of candidate fields
                          let target = agreements.find((a) => {
                            if (!a) return false;
                            const candidates = [
                              a.id,
                              a.agreement_id,
                              a.dts_no,
                              a.dts_number,
                              a.linkedMouId,
                              a.linked_mou,
                              a.mou_number,
                            ];
                            return candidates.some(
                              (c) => c != null && String(c).trim() === lidStr
                            );
                          });

                          // If not found, try relatedDtsMap -> mapped DTS value
                          if (
                            !target &&
                            relatedDtsMap &&
                            relatedDtsMap[lidStr]
                          ) {
                            const mapped = String(relatedDtsMap[lidStr]).trim();
                            target = agreements.find(
                              (a) =>
                                (a.dts_no &&
                                  String(a.dts_no).trim() === mapped) ||
                                (a.dts_number &&
                                  String(a.dts_number).trim() === mapped) ||
                                (a.id && String(a.id).trim() === mapped)
                            );
                          }

                          if (!target) return null;

                          return (
                            <section className="modal-section linked-mou">
                              <div className="section-header">
                                <FiLink className="header-icon" />
                                <h4>Linked MOU</h4>
                              </div>

                              <div
                                className="linked-mou-card"
                                onClick={() => openDetails(target)}
                                style={{ cursor: "pointer" }}
                              >
                                <div className="linked-mou-left">
                                  <span className="badge mou">MOU</span>
                                </div>
                                <div className="linked-mou-body">
                                  <strong className="linked-mou-title">
                                    {target.partner_name ||
                                      target.name ||
                                      target.event_title ||
                                      target.eventTitle ||
                                      "—"}
                                  </strong>
                                  <div className="linked-mou-sub">
                                    {target.partnership_classification ||
                                      target.partnership_type ||
                                      target.partnershipClassification ||
                                      "—"}
                                  </div>
                                  <div className="linked-mou-valid">
                                    Valid until:{" "}
                                    {target.expiry || target.date_expiry
                                      ? new Date(
                                          target.expiry || target.date_expiry
                                        ).toLocaleDateString()
                                      : "—"}
                                  </div>
                                  <div className="linked-mou-dts">
                                    {target.dts_no ||
                                      target.dts_number ||
                                      target.id ||
                                      "—"}
                                  </div>
                                </div>
                              </div>
                            </section>
                          );
                        })()}
                        {/* Partner Information */}
                        <section className="modal-section partner">
                          <div className="section-header">
                            <FiTag className="header-icon" />
                            <h4>Partner Information</h4>
                          </div>
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
                                  <div className="label">
                                    <FiTag className="label-icon" />
                                    Organization
                                  </div>
                                  <div className="value">
                                    {selected.partner_name ||
                                      selected.name ||
                                      "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="label">
                                    <FiSettings className="label-icon" />
                                    Entity Type
                                  </div>
                                  <div className="value">
                                    {selected.entity_type || "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="label">
                                    <FiMapPin className="label-icon" />
                                    Country
                                  </div>
                                  <div className="value">
                                    {selected.country || "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="label">
                                    <FiMapPin className="label-icon" />
                                    Region
                                  </div>
                                  <div className="value">
                                    {selected.region || "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="label">
                                    <FiMapPin className="label-icon" />
                                    Address
                                  </div>
                                  <div className="value">
                                    {selected.address || "—"}
                                  </div>
                                </div>
                                <div>
                                  <div className="label">
                                    <FiLink className="label-icon" />
                                    Website
                                  </div>
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
                          <div className="section-header">
                            <FiUsers className="header-icon" />
                            <h4>Contact Persons</h4>
                          </div>
                          <div className="contacts-grid">
                            <div className="contact-card">
                              <div className="contact-role">
                                <FiUsers className="inline-icon" /> PUP Point
                                Person
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
                                  <FiMessageCircle className="inline-icon" />{" "}
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
                                <FiUsers className="inline-icon" /> Partner
                                Contact Person
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
                                  <FiMessageCircle className="inline-icon" />{" "}
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

                        {/* Linked MOU: moved below Signatories (see below).
                            Old/early render removed so we only show the linked
                            MOU after Signatories to match ActiveAgreement view. */}

                        {/* Agreement Timeline */}
                        <section className="modal-section timeline">
                          <div className="section-header">
                            <FiCalendar className="header-icon" />
                            <h4>Agreement Timeline</h4>
                          </div>
                          <div className="row two-col">
                            <div>
                              <div className="label">
                                <FiCalendar className="label-icon" />
                                Date of Signing
                              </div>
                              <div className="value">
                                {selected.date_of_signing
                                  ? new Date(
                                      selected.date_of_signing
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                <FiClock className="label-icon" />
                                Expiry Date
                              </div>
                              <div className="value">
                                {selected.expiry
                                  ? new Date(
                                      selected.expiry
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                <FiCalendar className="label-icon" />
                                Date Endorsed to ULCO
                              </div>
                              <div className="value">
                                {selected.date_endorsed_ulco
                                  ? new Date(
                                      selected.date_endorsed_ulco
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                <FiCheck className="label-icon" />
                                ULCO's Approval
                              </div>
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
                                <FiEdit className="label-icon" />
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
                              <div className="label">
                                <FiClock className="label-icon" />
                                Validity Period
                              </div>
                              <div className="value">
                                {selected.validity_period
                                  ? `${selected.validity_period} years`
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                <FiTag className="label-icon" />
                                Partnership Classification
                              </div>
                              <div className="value">
                                {selected.partnership_classification ||
                                  selected.partnership_type ||
                                  "—"}
                              </div>
                            </div>
                            <div>
                              <div className="label">
                                <FiAward className="label-icon" />
                                Event Title
                              </div>
                              <div className="value">
                                {selected.event_title || "—"}
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Signatories */}
                        <section className="modal-section">
                          <div className="section-header">
                            <FiEdit className="header-icon" />
                            <h4>Signatories</h4>
                          </div>
                          {(() => {
                            // Try multiple possible shapes: array on signatories_list,
                            // array on signatories, or a string in signatories/signatories_text
                            const maybeArray =
                              Array.isArray(selected.signatories_list) &&
                              selected.signatories_list.length
                                ? selected.signatories_list
                                : Array.isArray(selected.signatories) &&
                                  selected.signatories.length
                                ? selected.signatories
                                : null;

                            let text = "";
                            if (maybeArray) {
                              text = formatSignatories(maybeArray);
                            } else if (
                              typeof selected.signatories === "string" &&
                              selected.signatories.trim()
                            ) {
                              // plain string - use it directly
                              text = selected.signatories.trim();
                            } else if (
                              typeof selected.signatories_text === "string" &&
                              selected.signatories_text.trim()
                            ) {
                              text = selected.signatories_text.trim();
                            }

                            // Debug: if you need to inspect what's present, uncomment:
                            // console.debug('Signatories debug for', selected.id, { maybeArray, signatories: selected.signatories, signatories_text: selected.signatories_text });

                            if (text) {
                              return <div className="value">{text}</div>;
                            }
                            return (
                              <div className="empty-state">
                                <FiEdit className="empty-icon" />
                                <div className="empty-content">
                                  <div className="empty-title">
                                    No signatories recorded
                                  </div>
                                  <div className="empty-sub">
                                    Add signatories using Edit
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </section>

                        {/* Remarks */}
                        <section className="modal-section remarks">
                          <div className="section-header">
                            <FiMessageCircle className="header-icon" />
                            <h4>Remarks</h4>
                          </div>
                          {Array.isArray(selected.remarks) ? (
                            selected.remarks.length ? (
                              <div className="brief">
                                {selected.remarks.map((r, idx) => (
                                  <div key={idx} style={{ marginBottom: 6 }}>
                                    {typeof r === "object"
                                      ? r.remark_text ||
                                        r.text ||
                                        r.remark ||
                                        ""
                                      : r}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="empty-state">
                                <FiMessageCircle className="empty-icon" />
                                <div className="empty-content">
                                  <div className="empty-title">
                                    No remarks added
                                  </div>
                                  <div className="empty-sub">
                                    Add remarks using Edit
                                  </div>
                                </div>
                              </div>
                            )
                          ) : selected.remarks ? (
                            <div className="brief">{selected.remarks}</div>
                          ) : (
                            <div className="empty-state">
                              <FiMessageCircle className="empty-icon" />
                              <div className="empty-content">
                                <div className="empty-title">
                                  No remarks added
                                </div>
                                <div className="empty-sub">
                                  Add remarks using Edit
                                </div>
                              </div>
                            </div>
                          )}
                        </section>
                      </>
                    ) : (
                      /* === EDIT MODE - Form Fields === */
                      <div className="modal-edit-panel">
                        <div className="edit-section-header">
                          <FiEdit className="section-icon" />
                          <h4>Edit Agreement Details</h4>
                        </div>

                        <div className="edit-form-grid">
                          {/* Document type */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiFileText className="label-icon" />
                              Document Type
                            </label>
                            <select
                              ref={modalFirstFieldRef}
                              className="config-select"
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
                          </div>

                          {/* Validity Period */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiClock className="label-icon" />
                              Validity Period
                            </label>
                            <select
                              className="config-select"
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
                          </div>

                          {/* Status */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiCheckCircle className="label-icon" />
                              Agreement Status
                            </label>
                            <select
                              className="config-select"
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
                          </div>

                          {/* DTS NO. */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiHash className="label-icon" />
                              DTS NO.
                            </label>
                            <input
                              className="edit-input"
                              value={selected.dts_no || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  dts_no: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Source */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiHome className="label-icon" />
                              Source (Campus/College Dept)
                            </label>
                            <input
                              className="edit-input"
                              placeholder="e.g., College of Engineering, Main Campus"
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
                          </div>

                          {/* Partnership classification */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiTag className="label-icon" />
                              Partnership Type
                            </label>
                            <select
                              className="config-select"
                              value={selected.partnership_classification || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  partnership_classification: e.target.value,
                                }));
                              }}
                            >
                              <option value="">Select Classification</option>
                              {classificationOptions.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Partner's name */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiUsers className="label-icon" />
                              Partner Name
                            </label>
                            <input
                              className="edit-input"
                              placeholder="Enter partner organization name"
                              value={selected.partner_name || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  partner_name: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Entity Type */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiTag className="label-icon" />
                              Entity Type
                            </label>
                            <input
                              className="edit-input"
                              placeholder="e.g., University, Company, NGO"
                              value={selected.entity_type || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  entity_type: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Country */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiGlobe className="label-icon" />
                              Country
                            </label>
                            <select
                              className="config-select"
                              value={selected.country || ""}
                              onChange={(e) => {
                                const selectedCountryValue = e.target.value;
                                const countryObj =
                                  countryOptionsWithRegions.find(
                                    (c) => c.value === selectedCountryValue
                                  );
                                setSelected((s) => ({
                                  ...s,
                                  country: selectedCountryValue,
                                  region: countryObj
                                    ? countryObj.region
                                    : s.region,
                                }));
                              }}
                            >
                              <option value="">Select Country</option>
                              {countryOptionsWithRegions.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Region */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiMapPin className="label-icon" />
                              Region
                            </label>
                            <input
                              className="edit-input"
                              placeholder="Auto-filled from country"
                              value={selected.region || ""}
                              readOnly
                              style={{
                                backgroundColor: "#f8f9fa",
                                cursor: "not-allowed",
                              }}
                            />
                          </div>

                          {/* Address */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiMapPin className="label-icon" />
                              Address
                            </label>
                            <input
                              className="edit-input"
                              placeholder="Enter partner address"
                              value={selected.address || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  address: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Logo */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiImage className="label-icon" />
                              Logo - Upload
                            </label>
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
                          </div>

                          {/* Website Link */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiLink className="label-icon" />
                              Website
                            </label>
                            <input
                              className="edit-input"
                              placeholder="https://www.example.com"
                              value={selected.website_link || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  website_link: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Brief Profile - full width */}
                          <div className="edit-field full-width">
                            <label className="edit-label">
                              <FiFileText className="label-icon" />
                              Partner Description
                            </label>
                            <textarea
                              className="edit-input"
                              style={{ height: "auto", minHeight: "80px" }}
                              placeholder="Brief description of the partner organization"
                              value={selected.brief_profile || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  brief_profile: e.target.value,
                                }));
                              }}
                              rows={3}
                            />
                          </div>

                          {/* Signatories */}
                          <div className="edit-field full-width">
                            <label className="edit-label">
                              <FiEdit className="label-icon" />
                              Signatories
                            </label>
                            <input
                              className="edit-input"
                              placeholder="Enter signatories"
                              value={selected.signatories || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  signatories: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Point person / position */}
                          <div className="edit-field full-width">
                            <label className="edit-label">
                              <FiUser className="label-icon" />
                              PUP Point Persons
                            </label>
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
                          </div>

                          {/* Contact person / details */}
                          <div className="edit-field full-width">
                            <label className="edit-label">
                              <FiUser className="label-icon" />
                              Partner Contact Persons
                            </label>
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
                          </div>

                          {/* Date Received */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiCalendar className="label-icon" />
                              Date Received
                            </label>
                            <input
                              className="edit-input"
                              type="date"
                              value={selected.date_received || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  date_received: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Expiry */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiClock className="label-icon" />
                              Date Expiry
                            </label>
                            <input
                              className="edit-input"
                              type="date"
                              value={selected.expiry || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  expiry: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* PUP Official's Signature */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiEdit className="label-icon" />
                              Date PUP Signed
                            </label>
                            <input
                              className="edit-input"
                              type="date"
                              value={selected.pup_official_sign || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  pup_official_sign: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Date / Year of Signing */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiCalendar className="label-icon" />
                              Date/Year of Signing
                            </label>
                            <input
                              className="edit-input"
                              type="date"
                              value={selected.date_of_signing || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  date_of_signing: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Date Endorsed to ULCO */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiCalendar className="label-icon" />
                              Date Endorsed to ULCO
                            </label>
                            <input
                              className="edit-input"
                              type="date"
                              value={selected.date_endorsed_ulco || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  date_endorsed_ulco: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* ULCO's Approval */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiCheck className="label-icon" />
                              Date ULCO Approved
                            </label>
                            <input
                              className="edit-input"
                              type="date"
                              value={selected.ulco_approval || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  ulco_approval: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Hardcopy locator */}
                          <div className="edit-field">
                            <label className="edit-label">
                              <FiMapPin className="label-icon" />
                              Hardcopy Locator
                            </label>
                            <input
                              className="edit-input"
                              placeholder="Physical location of document"
                              value={selected.hardcopy_locator || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  hardcopy_locator: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Event Title */}
                          <div className="edit-field full-width">
                            <label className="edit-label">
                              <FiAward className="label-icon" />
                              Event Info
                            </label>
                            <input
                              className="edit-input"
                              placeholder="Related event information"
                              value={selected.event_title || ""}
                              onChange={(e) => {
                                setSelected((s) => ({
                                  ...s,
                                  event_title: e.target.value,
                                }));
                              }}
                            />
                          </div>

                          {/* Remarks full width */}
                          <div className="edit-field full-width">
                            <label className="edit-label">
                              <FiMessageCircle className="label-icon" />
                              Remarks
                            </label>
                            <MultiRemarkField
                              listKey="remarks"
                              selected={selected}
                              setSelected={setSelected}
                              disabled={false}
                            />
                          </div>
                        </div>

                        <div className="edit-actions">
                          <button
                            className="btn cancel"
                            onClick={() => {
                              setSelected(originalRef.current);
                              setIsEditing(false);
                            }}
                            type="button"
                          >
                            <FiX className="icon" />
                            Cancel
                          </button>
                          <button
                            className="btn save"
                            onClick={saveDetails}
                            type="button"
                            disabled={!hasChanges()}
                            style={{
                              opacity: hasChanges() ? 1 : 0.5,
                              cursor: hasChanges() ? "pointer" : "not-allowed",
                            }}
                          >
                            <FiSave className="icon" />
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="overview1-modal-footer">
                      <button className="btn cancel" onClick={closeDetails}>
                        Close
                      </button>
                      {isAdminUser() && (
                        <button
                          className="btn edit"
                          onClick={() => setIsEditing(true)}
                        >
                          <FiEdit className="icon" />
                          Edit
                        </button>
                      )}
                    </div>
                  )}
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
                            Excel format
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
                              : generateDocType === "linked"
                              ? "Linked MOU → MOA"
                              : generateDocType + " Only"}
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
                              <option value="linked">Linked MOU → MOA</option>
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
                              {LIFECYCLE_OPTIONS.filter((o) => o.value).map(
                                (o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                )
                              )}
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
                              <FiPrinter className="option-icon print" />
                              <div className="option-info">
                                <div className="option-title">
                                  Printable Report
                                </div>
                                <div className="option-desc">
                                  Opens a printable HTML view suitable for PDF
                                  export or printing
                                </div>
                              </div>
                            </div>
                            <button
                              className="btn export-btn print-btn"
                              onClick={() => {
                                try {
                                  const items = getGenerateItems(
                                    generateDocType,
                                    generateStatus
                                  );
                                  ReportGen.generatePrintableReport({
                                    items,
                                    reportKey: String(
                                      generateDocType || "all"
                                    ).toLowerCase(),
                                    reportLabelMap: {
                                      all: "Agreements Report",
                                    },
                                    getLinkedId,
                                    allAgreements: agreements,
                                  });
                                } catch (e) {
                                  console.error("Printable report failed", e);
                                  alert(
                                    "Printable report failed: " +
                                      (e?.message || e)
                                  );
                                }
                                setShowGenerateModal(false);
                              }}
                            >
                              <FiPrinter className="icon" />
                              Print / PDF
                            </button>
                          </div>
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
                            accept=".pdf,.doc,.docx"
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
                                <span>PDF, DOC, DOCX (Max: 10MB)</span>
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
                          
