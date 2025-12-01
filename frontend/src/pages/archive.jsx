import React, { useEffect, useState, useRef } from "react";
import { agreementService } from "../services/agreementService";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "./archive.css";
import "../components/overview1.css";
import { documentService } from "../services/documentService";
import /* useNavigate */ "react-router-dom";

import {
  FiAlertCircle,
  FiArchive,
  FiBarChart,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiFile,
  FiFileText,
  FiFilter,
  FiHash,
  FiInfo,
  FiMapPin,
  FiPrinter,
  FiRefreshCw,
  FiSettings,
  FiTag,
  FiTrash2,
  FiUsers,
  FiMessageCircle,
  FiX,
  FiXCircle,
  FiLink,
  FiEdit,
  FiAward,
  FiHome,
  FiGrid,
} from "react-icons/fi";
import ReportGen from "../components/reportGeneration";

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

const Archive = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [filterClassification, setFilterClassification] = useState("");
  const [filterValidity, setFilterValidity] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [allArchiveData, setAllArchiveData] = useState([]);
  const [withdrawnData, setWithdrawnData] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [tmpClassification, setTmpClassification] = useState("");
  const [tmpValidity, setTmpValidity] = useState("");
  const [tmpCountry, setTmpCountry] = useState("");
  const [tmpSource, setTmpSource] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [displayData, setDisplayData] = useState([]);
  const [activeTab, setActiveTab] = useState("Expired");
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);

  const [deletingRows, setDeletingRows] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [reportType, setReportType] = useState("all");

  const filterPanelRef = useRef();
  const modalRequestRef = useRef(0);
  const itemsPerPage = 10;

  useEffect(() => {
    function handleClickOutside(e) {
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Expired rows come from the dedicated archive endpoint which
        // returns fully populated agreement objects (contacts, remarks, website).
        // Withdrawn rows still come from the list endpoint using a status filter.
        const expiredAgreements =
          await agreementService.getArchivedAgreements();
        const withdrawnAgreements = await agreementService.getAgreements({
          status_filter: "WITHDRAWN",
        });

        const expiredList = Array.isArray(expiredAgreements)
          ? expiredAgreements
          : expiredAgreements?.items || [];

        // Ensure we only keep truly expired items: either explicit status or
        // a past expiry date. This guarantees the Expired tab contains only
        // expired agreements even if the backend returns a broader set.
        const parseDateOnly = (v) => {
          if (!v) return null;
          if (v instanceof Date) return v;
          if (typeof v !== "string") return null;
          // Prefer YYYY-MM-DD parsing (avoid timezone shifts)
          const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
          if (iso)
            return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
          const d = new Date(v);
          return isNaN(d.getTime()) ? null : d;
        };

        const isExpiredItem = (a) => {
          if (!a) return false;
          const status = String(a?.agreement_status ?? a?.status ?? "")
            .trim()
            .toLowerCase();
          if (status && status.includes("expir")) return true; // matches 'expired' and variants

          const raw = a?.date_expiry ?? a?.expiry_date ?? a?.dateExpiry ?? null;
          const d = parseDateOnly(raw);
          if (d) {
            const today = new Date();
            const startOfToday = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate()
            );
            // treat expiry on or before today as expired
            if (d <= startOfToday) return true;
          }
          return false;
        };

        const expiredListFiltered = expiredList.filter(isExpiredItem);
        const withdrawnList = Array.isArray(withdrawnAgreements)
          ? withdrawnAgreements
          : withdrawnAgreements?.items || [];

        console.log(
          "Expired agreements: original=",
          expiredList.length,
          "filtered=",
          expiredListFiltered.length
        );
        console.log(
          "Expired sample (filtered, up to 5):",
          expiredListFiltered.slice(0, 5).map((x) => ({
            agreement_id: x?.agreement_id ?? x?.id,
            dts: x?.dts_number,
            status: x?.agreement_status ?? x?.status,
            date_expiry: x?.date_expiry,
          }))
        );
        console.log("Withdrawn agreements (normalized):", withdrawnList.length);

        setAllArchiveData(expiredListFiltered);
        setWithdrawnData(withdrawnList);
        setDisplayData(expiredListFiltered);

        setStats([
          { label: "Expired", count: expiredListFiltered.length },
          { label: "Withdrawn", count: withdrawnList.length },
        ]);
      } catch (err) {
        console.error("Failed to load archive data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const classificationOptions = Array.from(
    new Set(
      [...allArchiveData, ...withdrawnData]
        .map((a) => a.partnership_type)
        .filter(Boolean)
    )
  );

  const validityOptions = Array.from(
    new Set(
      [...allArchiveData, ...withdrawnData]
        .map((a) => a.validity_period)
        .filter(Boolean)
    )
  ).sort((a, b) => parseInt(a) - parseInt(b));

  const countryOptions = Array.from(
    new Set(
      [...allArchiveData, ...withdrawnData]
        .map((a) => a.country)
        .filter(Boolean)
    )
  );

  const sourceOptions = Array.from(
    new Set(
      [...allArchiveData, ...withdrawnData]
        .map((a) => a.source_unit)
        .filter(Boolean)
    )
  ).sort();

  const filterByStat = (label) => {
    setActiveTab(label);
    setCurrentPage(1);
    setSearchTerm("");
    setFilterClassification("");
    setFilterValidity("");
    setFilterCountry("");
    setFilterSource("");
    setSelectedIds(new Set());

    const key = String(label || "").toLowerCase();
    if (key === "expired") {
      setDisplayData(allArchiveData || []);
    } else if (key === "withdrawn") {
      setDisplayData(withdrawnData || []);
    }
  };

  const filteredData = displayData.filter((item) => {
    // Search filter
    const searchMatch = searchTerm
      ? [item.agreement_title, item.partner_name, item.name, item.dts_number]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
      : true;

    // Agreement type filter
    let typeMatch = true;
    switch (selectedFilter) {
      case "moa":
        typeMatch = String(item.document_type).toUpperCase() === "MOA";
        break;
      case "mou":
        typeMatch = String(item.document_type).toUpperCase() === "MOU";
        break;
      case "linked":
        typeMatch = Boolean(item.linked_mou_id || item.parent_agreement_id);
        break;
      default:
        typeMatch = true;
    }

    // Apply additional filters
    if (filterClassification && item.partnership_type !== filterClassification)
      return false;
    if (filterValidity && item.validity_period !== filterValidity) return false;
    if (filterCountry && item.country !== filterCountry) return false;
    if (filterSource && item.source_unit !== filterSource) return false;

    return searchMatch && typeMatch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleViewLatestFile = async (dtsNumber, isDownload = false) => {
    try {
      const latest = await documentService.getLatestVersion(dtsNumber);
      if (!latest) {
        alert(`No document versions found for DTS number: ${dtsNumber}`);
        return;
      }

      const resp = await fetch(latest.download_url);
      if (!resp.ok) throw new Error(`Failed to fetch file (${resp.status})`);

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);

      if (isDownload) {
        // Force download the file
        const a = document.createElement("a");
        a.href = url;
        a.download = latest.filename || `${dtsNumber}.pdf`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // View file in new tab
        window.open(url, "_blank");
        setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      }
    } catch (err) {
      console.error("Action failed:", err);
      alert(
        "Failed to " +
          (isDownload ? "download" : "open") +
          " file: " +
          (err.message || err)
      );
    }
  };

  const handleMassDownload = async () => {
    if (selectedIds.size === 0) {
      alert("Please select agreements to download.");
      return;
    }

    setIsDownloading(true);
    try {
      for (const id of selectedIds) {
        const item = filteredData.find((a) => a.agreement_id === id);
        if (item && item.dts_number) {
          await handleViewLatestFile(item.dts_number, true);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error("Error downloading documents:", error);
      alert("Error downloading some documents. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) setCurrentUser(JSON.parse(userStr));
    } catch (err) {
      console.error("Error parsing user:", err);
    }
  }, []);

  // Mirror activeAgreement behaviour: lock document scrolling while modal is open
  useEffect(() => {
    if (selectedAgreement) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedAgreement]);

  const cancelEditing = () => {
    setEditingRow(null);
  };

  const deleteRow = async (agreementId) => {
    if (!window.confirm("Delete this agreement?")) return;
    try {
      setDeletingRows((prev) => new Set(prev).add(agreementId));
      await agreementService.deleteAgreement(agreementId);

      const removeData = (data) =>
        data.filter((a) => a.agreement_id !== agreementId);

      if (activeTab === "Withdrawn") {
        setWithdrawnData(removeData);
        setDisplayData(removeData);
      } else {
        setAllArchiveData(removeData);
        setDisplayData(removeData);
      }

      if (editingRow === agreementId) cancelEditing();
      alert("Deleted successfully.");
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally {
      setDeletingRows((prev) => {
        const s = new Set(prev);
        s.delete(agreementId);
        return s;
      });
    }
  };

  const handleMassDelete = async () => {
    if (selectedIds.size === 0) {
      alert("Please select agreements to delete.");
      return;
    }
    if (
      !window.confirm(
        `WARNING: This action cannot be undone!\n\nAre you sure you want to permanently delete ${selectedIds.size} selected agreement(s)?`
      )
    )
      return;

    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        agreementService.deleteAgreement(id)
      );
      await Promise.all(deletePromises);

      const removeData = (data) =>
        data.filter((a) => !selectedIds.has(a.agreement_id));

      if (activeTab === "Withdrawn") {
        setWithdrawnData(removeData);
        setDisplayData(removeData);
      } else {
        setAllArchiveData(removeData);
        setDisplayData(removeData);
      }

      setSelectedIds(new Set());
      alert(`${selectedIds.size} agreement(s) deleted successfully.`);
    } catch (err) {
      alert("Mass delete failed: " + err.message);
    }
  };

  const handleReactivate = async (agreementId) => {
    if (activeTab !== "Withdrawn") {
      alert("Only withdrawn agreements can be reactivated.");
      return;
    }

    if (!window.confirm("Reactivate this agreement?")) return;
    try {
      await agreementService.updateAgreement(agreementId, {
        agreement_status: "Initial Review",
      });

      const removeData = (data) =>
        data.filter((a) => a.agreement_id !== agreementId);
      setWithdrawnData(removeData(withdrawnData));
      setDisplayData(removeData(displayData));

      alert("Agreement reactivated successfully!");
    } catch (err) {
      alert("Reactivate failed: " + err.message);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentData.map((item) => item.agreement_id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const closeModal = () => setSelectedAgreement(null);

  const navigateAgreement = (dir) => {
    if (!selectedAgreement) return;
    const idx = filteredData.findIndex(
      (a) =>
        (a.agreement_id || a.id) ===
        (selectedAgreement.agreement_id || selectedAgreement.id)
    );
    if (idx === -1) return;
    const next = filteredData[idx + dir];
    if (next) setSelectedAgreement(next);
  };

  // Open agreement modal: prefer the simple activeAgreement behaviour of
  // displaying the passed item immediately and letting modal effects
  // normalize or enrich it. This mirrors `activeAgreement`'s approach which
  // sets the selected agreement directly.
  const openAgreementModal = async (item) => {
    try {
      // guard: increment request id to allow ignoring stale responses
      modalRequestRef.current += 1;
      const requestId = modalRequestRef.current;

      if (!item) {
        setSelectedAgreement(null);
        return;
      }

      // Immediately show a shallow clone so the user sees the row right away
      const shallow = { ...(item || {}) };
      try {
        const pp =
          shallow.point_persons ??
          shallow.pointPerson ??
          shallow.point_persons_display ??
          shallow.pointPersonDisplay ??
          shallow.point_person;
        shallow.point_persons_display =
          shallow.point_persons_display || formatContactPersons(pp);

        const cp =
          shallow.contact_persons ??
          shallow.contactPerson ??
          shallow.partner_contact_persons ??
          shallow.partnerContactPersons ??
          shallow.contact_persons_display ??
          shallow.contactPersonDisplay ??
          shallow.contact_person;
        shallow.contact_persons_display =
          shallow.contact_persons_display || formatContactPersons(cp);

        shallow.website_url =
          shallow.website_url ||
          getWebsiteFromAgreement(shallow) ||
          shallow.website ||
          (shallow.partner && shallow.partner.website) ||
          (shallow.organization && shallow.organization.website);

        const rawRemarks =
          shallow.remarks ?? shallow.remark ?? shallow.notes ?? null;
        const norm = normalizeRemarks(rawRemarks ?? shallow.remarks);
        if (Array.isArray(norm) && norm.length > 0) shallow.remarks = norm;
      } catch (e) {
        /* ignore normalization errors for shallow display */
      }

      setSelectedAgreement(shallow);

      // Helpers to extract canonical identifiers
      const getCanonicalId = (a) =>
        a?.agreement_id ??
        a?.id ??
        a?.agreementId ??
        a?.agreementID ??
        a?.pk ??
        null;
      const getCanonicalDts = (a) =>
        a?.dts_number ??
        a?.dts_no ??
        a?.dtsNumber ??
        a?.document_no ??
        a?.doc_no ??
        a?.reference_no ??
        a?.ref_no ??
        a?.dts ??
        null;

      // keep a copy of original identifiers to match results from list-style responses
      const requestedId = getCanonicalId(item);
      const requestedDts = getCanonicalDts(item);

      // Helper to normalize various API shapes into a single agreement object
      const normalize = (resp) => {
        if (!resp) return null;

        const matchItem = (r) =>
          String(r?.agreement_id ?? r?.id) === String(requestedId) ||
          String(r?.dts_number ?? r?.dts_no) === String(requestedDts);

        // Unwrap common envelopes first
        try {
          if (resp && typeof resp === "object") {
            if (resp.agreement && typeof resp.agreement === "object") {
              resp = resp.agreement;
            } else if (
              resp.data &&
              typeof resp.data === "object" &&
              resp.data.agreement &&
              typeof resp.data.agreement === "object"
            ) {
              resp = resp.data.agreement;
            } else if (resp.result && typeof resp.result === "object") {
              resp = resp.result;
            } else if (resp.payload && typeof resp.payload === "object") {
              resp = resp.payload;
            }
          }
        } catch (_e) {}

        if (Array.isArray(resp)) {
          const found = resp.find(matchItem);
          if (found) return found;
          return null;
        }

        if (resp.items && Array.isArray(resp.items)) {
          const found = resp.items.find(matchItem);
          if (found) return found;
          return null;
        }

        if (resp.item && typeof resp.item === "object") return resp.item;

        if (resp.data) {
          if (Array.isArray(resp.data)) {
            const found = resp.data.find(matchItem);
            if (found) return found;
            if (!requestedId && !requestedDts) return resp.data[0] || null;
            return null;
          }
          if (typeof resp.data === "object") return resp.data;
        }

        if (typeof resp === "object") {
          const looksLikeAgreement = Boolean(
            resp.agreement_id || resp.id || resp.dts_number || resp.dts_no
          );
          if (looksLikeAgreement) {
            if (requestedId || requestedDts) {
              if (matchItem(resp)) return resp;
              return null;
            }
            return resp;
          }
          return null;
        }

        return null;
      };

      // Attempt DTS-based fetch first (some backends expose read endpoints by dts)
      let details = item;
      const dts = requestedDts;
      const id = requestedId;

      if (dts && typeof agreementService.getAgreementByDts === "function") {
        try {
          const resp = await agreementService.getAgreementByDts(dts);
          const norm = normalize(resp);
          if (norm) details = norm;
        } catch (e) {
          console.warn("getAgreementByDts failed for dts", dts, e);
        }
      }

      // Try id-based endpoint if available
      if (
        (details === item || !details?.agreement_id) &&
        id &&
        typeof agreementService.getAgreementById === "function"
      ) {
        try {
          const resp = await agreementService.getAgreementById(id);
          const norm = normalize(resp);
          if (norm) details = norm;
        } catch (e) {
          const status = e?.response?.status || e?.status || null;
          if (status === 405) {
            console.warn(
              "getAgreementById returned 405 — treating as non-readable endpoint",
              id,
              e
            );
          } else {
            console.warn("getAgreementById failed for id", id, e);
          }
        }
      }

      // legacy getAgreement
      if (
        (details === item || !details?.agreement_id) &&
        typeof agreementService.getAgreement === "function"
      ) {
        try {
          const resp = await agreementService.getAgreement(id || dts);
          const norm = normalize(resp);
          if (norm) details = norm;
        } catch (e) {
          console.warn("legacy getAgreement failed", e);
        }
      }

      // list-based lookup as last resort
      if (
        (details === item || !details?.agreement_id) &&
        typeof agreementService.getAgreements === "function" &&
        (requestedDts || requestedId)
      ) {
        try {
          const query = {};
          if (dts) query.dts_number = dts;
          if (id) query.agreement_id = id;
          const listResp = await agreementService.getAgreements(query);
          const norm = normalize(listResp);
          if (norm) details = norm;
        } catch (e) {
          console.warn("list-based lookup via getAgreements failed", e);
        }
      }

      // Merge fetched details into modal only if this is still the latest request
      if (modalRequestRef.current === requestId) {
        setSelectedAgreement((prev) => {
          const merged = { ...(prev || {}), ...(details || {}) };
          // preserve identifiers from the visible row if the fetched payload omits them
          merged.agreement_id = getCanonicalId(merged) ?? getCanonicalId(item);
          merged.dts_number = getCanonicalDts(merged) ?? getCanonicalDts(item);
          try {
            const pp =
              merged.point_persons ??
              merged.pointPerson ??
              merged.point_persons_display ??
              merged.pointPersonDisplay ??
              merged.point_person;
            merged.point_persons_display =
              merged.point_persons_display || formatContactPersons(pp);

            const cp =
              merged.contact_persons ??
              merged.contactPerson ??
              merged.partner_contact_persons ??
              merged.partnerContactPersons ??
              merged.contact_persons_display ??
              merged.contactPersonDisplay ??
              merged.contact_person;
            merged.contact_persons_display =
              merged.contact_persons_display || formatContactPersons(cp);

            merged.point_persons_email =
              merged.point_persons_email || merged.pointPersonEmail || null;
            merged.contact_persons_email =
              merged.contact_persons_email || merged.contactPersonEmail || null;

            merged.website_url =
              merged.website_url ||
              getWebsiteFromAgreement(merged) ||
              merged.website ||
              (merged.partner && merged.partner.website) ||
              (merged.organization && merged.organization.website);

            merged.date_signed =
              merged.date_signed ||
              merged.date_of_signing ||
              merged.dateSigning ||
              merged.signed_date ||
              merged.signing_date;

            merged.date_expiry =
              merged.date_expiry ||
              merged.expiry_date ||
              merged.dateExpiry ||
              merged.expiration_date;

            merged.brief_profile =
              merged.brief_profile ||
              merged.partner_profile ||
              merged.profile ||
              (merged.partner && merged.partner.profile) ||
              (merged.organization && merged.organization.profile) ||
              merged.description;

            merged.country =
              merged.country ||
              merged.partner_country ||
              merged.organization_country ||
              merged.country_name ||
              (merged.partner &&
                (merged.partner.country || merged.partner.country_name)) ||
              (merged.organization &&
                (merged.organization.country ||
                  merged.organization.country_name));

            merged.region =
              merged.region ||
              merged.partner_region ||
              merged.organization_region ||
              merged.region_name ||
              merged.province ||
              (merged.partner &&
                (merged.partner.region ||
                  merged.partner.region_name ||
                  merged.partner.province)) ||
              (merged.organization &&
                (merged.organization.region ||
                  merged.organization.region_name ||
                  merged.organization.province));

            merged.address =
              merged.address ||
              merged.partner_address ||
              merged.organization_address ||
              merged.location ||
              (merged.partner &&
                (merged.partner.address || merged.partner.location)) ||
              (merged.organization &&
                (merged.organization.address || merged.organization.location));

            merged.hardcopy_location =
              merged.hardcopy_location ||
              merged.hardcopy_locator ||
              merged.hardcopyShelf ||
              merged.storage_location;

            const rawRemarks =
              merged.remarks ?? merged.remark ?? merged.notes ?? null;
            const norm = normalizeRemarks(rawRemarks ?? merged.remarks);
            if (Array.isArray(norm) && norm.length > 0) merged.remarks = norm;
          } catch (e) {
            console.warn("Failed to normalize merged agreement for modal:", e);
          }
          return merged;
        });
      } else {
        console.debug("openAgreementModal: ignoring stale response", {
          requestId,
          current: modalRequestRef.current,
        });
      }
    } catch (err) {
      console.error(
        "Failed to load agreement details, falling back to passed item:",
        err
      );
      setSelectedAgreement({ ...(item || {}) });
    }
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

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  const LogoSrc = (lp) => {
    if (!lp) return null;
    try {
      if (typeof lp === "string") {
        if (lp.startsWith("data:image")) return lp;
        if (lp.startsWith("iVBORw0")) return `data:image/png;base64,${lp}`;
        if (lp.startsWith("/9j/")) return `data:image/jpeg;base64,${lp}`;
        if (lp.startsWith("http://") || lp.startsWith("https://")) return lp;
        return `${API_BASE_URL.replace(/\/$/, "")}/${lp.replace(/^\/+/, "")}`;
      }
    } catch (err) {
      console.warn("LogoSrc error:", err, lp);
    }
    return null;
  };

  // normalize remarks into an array of plain strings (compatible with activeAgreement)
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

  // Helpers to safely format contact person fields for rendering
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

  // Helpers to format contact email fields
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

  // Prepare contact email values from several possible shapes on the selectedAgreement
  const pupEmailRaw = selectedAgreement
    ? selectedAgreement.point_persons_email ??
      selectedAgreement.pointPersonEmail ??
      selectedAgreement.point_persons ??
      selectedAgreement.pointPerson ??
      null
    : null;
  const pupEmail = formatContactEmails(pupEmailRaw);

  const partnerEmailRaw = selectedAgreement
    ? selectedAgreement.contact_persons_email ??
      selectedAgreement.contactPersonEmail ??
      selectedAgreement.contact_persons ??
      selectedAgreement.contactPerson ??
      null
    : null;
  const partnerEmail = formatContactEmails(partnerEmailRaw);

  // Helper: find website string on agreement using common field names
  const getWebsiteFromAgreement = (a) => {
    if (!a) return null;
    const keys = [
      "website",
      "website_link",
      "websiteLink",
      "website_url",
      "websiteUrl",
      "url",
      "website_link_url",
      "websiteLinkUrl",
    ];
    for (const k of keys) {
      const v = a[k];
      if (v) return String(v).trim();
    }
    return null;
  };

  const reportLabelMap = {
    all: "Complete Archives Report",
    expired: "Expired Agreements Report",
    withdrawn: "Withdrawn Agreements Report",
  };

  const reportItems = (() => {
    if (reportType === "expired") return allArchiveData;
    if (reportType === "withdrawn") return withdrawnData;
    return [...allArchiveData, ...withdrawnData];
  })();

  const escapeHtml = (str = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const generatePrintableReport = () => {
    ReportGen.generatePrintableReport({
      items: reportItems,
      reportKey: reportType,
      reportLabelMap,
      allAgreements: [...allArchiveData, ...withdrawnData],
      getLinkedId: (r) =>
        r?.linked_mou_id ||
        r?.parent_agreement_id ||
        r?.linked_mou ||
        r?.linkedMouId ||
        "",
    });
  };

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={() => setMobileShow(!mobileShow)} />
      {mobileShow && (
        <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />
      )}
      <div className="content-body">
        <Sidebar
          collapsed={collapsed}
          toggleCollapse={() => setCollapsed(!collapsed)}
          mobileShow={mobileShow}
        />
        <div
          className="main-content"
          onClick={() => mobileShow && setMobileShow(false)}
        >
          {loading ? (
            <div className="lloading-container">
              <div className="spinner"></div>
              <p>Loading archives...</p>
            </div>
          ) : (
            <>
              <div className="archive-main">
                <div className="archive-stats-row-full">
                  {stats.map((s, i) => (
                    <button
                      key={i}
                      className={`archive-stat-card-full ${
                        activeTab === s.label ? "archive-active" : ""
                      }`}
                      onClick={() => filterByStat(s.label)}
                    >
                      <div className="archive-stat-icon-full-centered">
                        {s.label === "Expired" ? (
                          <FiArchive size={24} />
                        ) : (
                          <FiAlertCircle size={24} />
                        )}
                      </div>
                      <div className="archive-stat-content-full-centered">
                        <div className="archive-summary-title">
                          Total {s.label} Agreements
                        </div>
                        <div className="archive-summary-number">{s.count}</div>
                        <div className="archive-summary-sub">
                          {s.label === "Expired"
                            ? "Agreements past expiry"
                            : "Agreements marked withdrawn"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="archive-table-section">
                  {/* First row: filter tabs */}
                  <div
                    className="archive-filter-tabs"
                    style={{ marginBottom: 12 }}
                  >
                    <button
                      className={
                        selectedFilter === "all" ? "archive-active" : ""
                      }
                      onClick={() => setSelectedFilter("all")}
                    >
                      All {activeTab} Agreements
                    </button>
                    <button
                      className={
                        selectedFilter === "moa" ? "archive-active" : ""
                      }
                      onClick={() => setSelectedFilter("moa")}
                    >
                      MOA
                    </button>
                    <button
                      className={
                        selectedFilter === "mou" ? "archive-active" : ""
                      }
                      onClick={() => setSelectedFilter("mou")}
                    >
                      MOU
                    </button>
                    <button
                      className={
                        selectedFilter === "linked" ? "archive-active" : ""
                      }
                      onClick={() => setSelectedFilter("linked")}
                    >
                      Linked Agreements
                    </button>
                  </div>

                  {/* Second row: search, filters and actions */}
                  <div className="archive-table-controls">
                    <div className="archive-table-search-wrapper">
                      <div className="archive-table-search">
                        <input
                          type="search"
                          placeholder="Search DTS, partner, type..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                        {searchTerm && (
                          <button
                            className="archive-clear-search"
                            onClick={() => setSearchTerm("")}
                          >
                            <FiX />
                          </button>
                        )}
                      </div>

                      <button
                        className={`archive-filter-btn ${
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
                        aria-controls="archive-filter-panel"
                        title="Filters"
                      >
                        <FiFilter className="filter-icon" />
                        Filters
                      </button>

                      <button
                        className={`btn archive-generate ${
                          showGenerateModal ? "active" : ""
                        }`}
                        onClick={() => {
                          setReportType("all");
                          setShowGenerateModal(true);
                        }}
                      >
                        <FiPrinter className="icon" />
                        Generate Report
                      </button>
                    </div>

                    {showFilterPanel && (
                      <div
                        id="archive-filter-panel"
                        className="archive-filter-panel"
                        ref={filterPanelRef}
                        role="region"
                        aria-label="Table filters"
                      >
                        <div className="archive-panel-header">
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
                          className="archive-panel-row"
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "12px",
                          }}
                        >
                          <div className="archive-panel-field">
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

                          <div className="archive-panel-field">
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
                                    ? `${v} ${
                                        parseInt(v) === 1 ? "Year" : "Years"
                                      }`
                                    : v,
                                })),
                              ]}
                              value={tmpValidity}
                              onChange={(v) => setTmpValidity(v || "")}
                              placeholder="All"
                              allowClear={false}
                            />
                          </div>

                          <div className="archive-panel-field">
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

                          <div className="archive-panel-field">
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

                        <div className="archive-filter-actions">
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

                    <div className="archive-table-actions">
                      {selectedIds.size > 0 && (
                        <>
                          <button
                            className="archive-mass-download-btn"
                            onClick={handleMassDownload}
                            disabled={isDownloading}
                          >
                            <FiDownload />
                            Download Selected ({selectedIds.size})
                          </button>

                          {currentUser?.user_role?.toLowerCase() ===
                            "admin" && (
                            <button
                              className="archive-mass-delete-btn archive-clean-btn"
                              onClick={handleMassDelete}
                            >
                              <FiTrash2
                                style={{
                                  marginRight: 6,
                                  verticalAlign: "middle",
                                }}
                              />
                              <span style={{ verticalAlign: "middle" }}>
                                Delete Selected ({selectedIds.size})
                              </span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="archive-table">
                    <table>
                      <thead>
                        <tr>
                          {currentUser?.user_role?.toLowerCase() ===
                            "admin" && (
                            <th>
                              <input
                                type="checkbox"
                                checked={
                                  selectedIds.size === currentData.length &&
                                  currentData.length > 0
                                }
                                onChange={toggleSelectAll}
                              />
                            </th>
                          )}
                          <th>TYPE</th>
                          <th>DTS NUMBER</th>
                          <th>PARTNER NAME</th>
                          <th>CLASSIFICATION</th>
                          <th>EXPIRE DATE</th>
                          <th>POINT PERSON</th>
                          <th>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentData.length > 0 ? (
                          currentData.map((item, index) => (
                            <tr
                              key={
                                item.agreement_id ||
                                item.id ||
                                item.dts_number ||
                                index
                              }
                            >
                              {currentUser?.user_role?.toLowerCase() ===
                                "admin" && (
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.has(item.agreement_id)}
                                    onChange={() =>
                                      toggleSelect(item.agreement_id)
                                    }
                                  />
                                </td>
                              )}
                              <td>
                                <span
                                  className={`archive-badge ${String(
                                    item.document_type || ""
                                  ).toLowerCase()}`}
                                >
                                  {item.document_type}
                                </span>
                              </td>
                              <td className="archive-dts-number">
                                {item.dts_number}
                              </td>
                              <td>
                                <b>{item.partner_name || item.name}</b>
                              </td>
                              <td>{item.partnership_type}</td>
                              <td>{item.date_expiry}</td>
                              <td>{item.point_persons_display}</td>
                              <td>
                                <div style={{ display: "flex", gap: "4px" }}>
                                  <button
                                    className="archive-icon-btn archive-view"
                                    onClick={() => openAgreementModal(item)}
                                    title="View Details"
                                  >
                                    <FiEye className="archive-icon" />
                                  </button>
                                  <button
                                    className="archive-icon-btn archive-download"
                                    onClick={() =>
                                      handleViewLatestFile(
                                        item.dts_number,
                                        true
                                      )
                                    }
                                    title="Download File"
                                  >
                                    <FiDownload className="archive-icon" />
                                  </button>
                                  {currentUser?.user_role?.toLowerCase() ===
                                    "admin" && (
                                    <>
                                      {activeTab === "Withdrawn" && (
                                        <button
                                          className="archive-icon-btn archive-reactivate"
                                          onClick={() =>
                                            handleReactivate(item.agreement_id)
                                          }
                                          title="Reactivate to Initial Review"
                                        >
                                          <FiRefreshCw className="archive-icon" />
                                        </button>
                                      )}
                                      <button
                                        className="archive-icon-btn archive-delete"
                                        onClick={() =>
                                          deleteRow(item.agreement_id)
                                        }
                                        disabled={deletingRows.has(
                                          item.agreement_id
                                        )}
                                        title="Delete Permanently"
                                      >
                                        <FiTrash2 className="archive-icon" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={
                                currentUser?.user_role?.toLowerCase() ===
                                "admin"
                                  ? "8"
                                  : "7"
                              }
                              style={{ textAlign: "center" }}
                            >
                              No results found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="archive-pagination">
                      <button
                        className="archive-page-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Prev
                      </button>
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index}
                          className={`archive-page-btn ${
                            currentPage === index + 1 ? "archive-active" : ""
                          }`}
                          onClick={() => handlePageChange(index + 1)}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        className="archive-page-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedAgreement && (
        <div className="overview1-modal-backdrop" onClick={closeModal}>
          <div
            className="overview1-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="overview1-modal-header"
              role="dialog"
              aria-labelledby="modal-title"
            >
              <div className="modal-badge-row">
                <span
                  className={`header-badge doc ${String(
                    selectedAgreement.document_type || ""
                  ).toLowerCase()}`}
                >
                  <FiFileText className="badge-icon" />
                  {selectedAgreement.document_type || "—"}
                </span>
                <h3 id="modal-title" className="modal-title white-title">
                  {selectedAgreement.event_title ||
                    selectedAgreement.partner_name ||
                    selectedAgreement.name ||
                    "Agreement Details"}
                </h3>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="nav-btn"
                  onClick={() => navigateAgreement(-1)}
                  title="Previous"
                  aria-label="Previous agreement"
                >
                  ‹
                </button>
                <button
                  className="nav-btn"
                  onClick={() => navigateAgreement(1)}
                  title="Next"
                  aria-label="Next agreement"
                >
                  ›
                </button>
                <button
                  className="modal-close"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <FiX className="icon" />
                </button>
              </div>
            </div>

            <div className="overview1-modal-body details-modal-body">
              {/* Details Summary Card */}
              <div className="details-summary-card">
                <div className="details-header">
                  <div className="details-icon-container">
                    <FiFileText className="details-main-icon" />
                  </div>
                  <div className="details-titles">
                    <div className="details-title">
                      {selectedAgreement.event_title ||
                        selectedAgreement.partner_name ||
                        selectedAgreement.name ||
                        "Agreement Details"}
                    </div>
                    <div className="details-sub">
                      {selectedAgreement.document_type || "—"} •{" "}
                      {selectedAgreement.agreement_status || activeTab}
                    </div>
                  </div>
                  <div className="file-actions" style={{ marginLeft: "auto" }}>
                    <button
                      className="btn action view-file"
                      onClick={() =>
                        handleViewLatestFile(selectedAgreement.dts_number)
                      }
                      title="Download File"
                      aria-label="Download File"
                    >
                      <FiDownload className="icon" />
                      Download File
                    </button>
                    {currentUser?.user_role?.toLowerCase() === "admin" &&
                      (activeTab === "Withdrawn" ||
                        String(selectedAgreement?.agreement_status || "")
                          .toLowerCase()
                          .includes("withdrawn")) && (
                        <button
                          className="btn action reactivate"
                          onClick={() => {
                            handleReactivate(selectedAgreement.agreement_id);
                            closeModal();
                          }}
                          title="Reactivate Agreement"
                          aria-label="Reactivate Agreement"
                        >
                          <FiRefreshCw className="icon" />
                          Reactivate
                        </button>
                      )}
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
                      {selectedAgreement?.dts_number || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="label">
                      <FiFileText className="label-icon" />
                      Document Type
                    </div>
                    <div className="value">
                      {selectedAgreement?.document_type || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="label">
                      <FiCalendar className="label-icon" />
                      Date Received
                    </div>
                    <div className="value">
                      {selectedAgreement?.date_received ||
                      selectedAgreement?.date_signed
                        ? new Date(
                            selectedAgreement.date_received ||
                              selectedAgreement.date_signed
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
                      {selectedAgreement?.source_unit ||
                        selectedAgreement?.source ||
                        "—"}
                    </div>
                  </div>

                  <div>
                    <div className="label">
                      <FiMapPin className="label-icon" />
                      Hardcopy Locator
                    </div>
                    <div className="value">
                      {selectedAgreement?.hardcopy_location || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="label">
                      <FiCheckCircle className="label-icon" />
                      Current Status
                    </div>
                    <div className="value">
                      <span
                        className={`status-badge ${String(
                          selectedAgreement.agreement_status || activeTab
                        ).toLowerCase()}`}
                      >
                        {selectedAgreement.agreement_status || activeTab}
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
                  {selectedAgreement?.brief_profile ||
                    selectedAgreement?.description ||
                    "—"}
                </div>
              </section>

              {/* Partner Information */}
              <section className="modal-section partner">
                <div className="section-header">
                  <FiTag className="header-icon" />
                  <h4>Partner Information</h4>
                </div>
                <div className="partner-top">
                  <div className="partner-logo">
                    {LogoSrc(
                      selectedAgreement?.logo_path ||
                        selectedAgreement?.logo_url
                    ) ? (
                      <img
                        src={LogoSrc(
                          selectedAgreement?.logo_path ||
                            selectedAgreement?.logo_url
                        )}
                        alt={`${
                          selectedAgreement?.partner_name ||
                          selectedAgreement?.name ||
                          "Partner"
                        } logo`}
                        onError={(e) => {
                          console.warn("Logo failed to load:", e.target.src);
                          e.target.onerror = null;
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="partner-fallback">
                        {getInitials(
                          selectedAgreement?.partner_name ||
                            selectedAgreement?.name
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
                          {selectedAgreement?.partner_name ||
                            selectedAgreement?.name ||
                            "—"}
                        </div>
                      </div>
                      <div>
                        <div className="label">
                          <FiSettings className="label-icon" />
                          Entity Type
                        </div>
                        <div className="value">
                          {selectedAgreement?.entity_type || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="label">
                          <FiMapPin className="label-icon" />
                          Country
                        </div>
                        <div className="value">
                          {selectedAgreement?.country || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="label">
                          <FiMapPin className="label-icon" />
                          Region
                        </div>
                        <div className="value">
                          {selectedAgreement?.region || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="label">
                          <FiMapPin className="label-icon" />
                          Address
                        </div>
                        <div className="value">
                          {selectedAgreement?.address || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="label">
                          <FiLink className="label-icon" />
                          Website
                        </div>
                        <div className="value">
                          {selectedAgreement?.website_url ? (
                            <a
                              href={selectedAgreement.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#3b82f6",
                                textDecoration: "none",
                              }}
                            >
                              {selectedAgreement.website_url}
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
                      <FiUsers className="inline-icon" /> PUP Point Person
                    </div>
                    <div className="contact-name">
                      {formatContactPersons(
                        selectedAgreement?.point_persons_display ||
                          selectedAgreement?.point_persons
                      )}
                    </div>
                    <div className="contact-org">
                      {selectedAgreement?.source_unit ||
                        selectedAgreement?.source ||
                        "—"}
                    </div>
                    {pupEmail ? (
                      <a className="contact-email" href={`mailto:${pupEmail}`}>
                        <FiMessageCircle className="inline-icon" /> {pupEmail}
                      </a>
                    ) : null}
                  </div>

                  <div className="contact-card alt">
                    <div className="contact-role">
                      <FiUsers className="inline-icon" /> Partner Contact Person
                    </div>
                    <div className="contact-name">
                      {formatContactPersons(
                        selectedAgreement?.contact_persons_display ||
                          selectedAgreement?.contact_persons
                      )}
                    </div>
                    <div className="contact-org">
                      {selectedAgreement?.partner_name ||
                        selectedAgreement?.name ||
                        "—"}
                    </div>
                    {partnerEmail ? (
                      <a
                        className="contact-email"
                        href={`mailto:${partnerEmail}`}
                      >
                        <FiMessageCircle className="inline-icon" />{" "}
                        {partnerEmail}
                      </a>
                    ) : null}
                  </div>
                </div>
              </section>

              {/* Linked MOU */}
              <section className="modal-section linked-mou">
                <div className="section-header">
                  <FiLink className="header-icon" />
                  <h4>Linked MOU</h4>
                </div>
                <div className="empty-state">
                  <FiLink className="empty-icon" />
                  <div className="empty-content">
                    <div className="empty-title">No linked MOU</div>
                    <div className="empty-sub">
                      This agreement has no linked MOU
                    </div>
                  </div>
                </div>
              </section>

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
                      {selectedAgreement.date_signed
                        ? new Date(
                            selectedAgreement.date_signed
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
                      {selectedAgreement.date_expiry
                        ? new Date(
                            selectedAgreement.date_expiry
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
                      {selectedAgreement.date_endorsed_ulco ||
                      selectedAgreement.date_endorsed_to_ulco
                        ? new Date(
                            selectedAgreement.date_endorsed_ulco ||
                              selectedAgreement.date_endorsed_to_ulco
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
                      {selectedAgreement.ulco_approval ||
                      selectedAgreement.date_ulco_approved
                        ? new Date(
                            selectedAgreement.ulco_approval ||
                              selectedAgreement.date_ulco_approved
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
                      {selectedAgreement.pup_official_sign ||
                      selectedAgreement.date_signed_by_pup
                        ? new Date(
                            selectedAgreement.pup_official_sign ||
                              selectedAgreement.date_signed_by_pup
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
                      {selectedAgreement.validity_period
                        ? `${selectedAgreement.validity_period} years`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="label">
                      <FiTag className="label-icon" />
                      Partnership Classification
                    </div>
                    <div className="value">
                      {selectedAgreement.partnership_classification ||
                        selectedAgreement.partnership_type ||
                        "—"}
                    </div>
                  </div>
                  <div>
                    <div className="label">
                      <FiAward className="label-icon" />
                      Event Title
                    </div>
                    <div className="value">
                      {selectedAgreement.event_title ||
                        selectedAgreement.eventTitle ||
                        "—"}
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
                  const raw =
                    selectedAgreement.signatories_list ??
                    selectedAgreement.signatories ??
                    selectedAgreement.signatories_text ??
                    selectedAgreement.signatoriesList ??
                    "";

                  let signatoriesText = "";
                  if (Array.isArray(raw)) {
                    signatoriesText = raw
                      .map((it) => {
                        if (!it && it !== 0) return "";
                        if (typeof it === "string") return it;
                        if (typeof it === "object")
                          return (
                            it.signatory_name ||
                            it.name ||
                            it.text ||
                            it.signatory ||
                            it.remark_text ||
                            JSON.stringify(it)
                          );
                        return String(it);
                      })
                      .filter(Boolean)
                      .join("; ");
                  } else if (typeof raw === "string" && raw.trim()) {
                    signatoriesText = raw.trim();
                  }

                  if (signatoriesText) {
                    return <div className="value">{signatoriesText}</div>;
                  }

                  return (
                    <div className="empty-state">
                      <FiEdit className="empty-icon" />
                      <div className="empty-content">
                        <div className="empty-title">
                          No signatories recorded
                        </div>
                        <div className="empty-sub">
                          No signatories available for this agreement
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
                {(() => {
                  const remarks = selectedAgreement.remarks;
                  if (Array.isArray(remarks) && remarks.length > 0) {
                    return (
                      <div className="value">
                        {remarks.map((r, idx) => (
                          <div key={idx}>
                            {typeof r === "object"
                              ? r.remark_text || r.text || r.remark || ""
                              : r}
                          </div>
                        ))}
                      </div>
                    );
                  } else if (typeof remarks === "string" && remarks.trim()) {
                    return <div className="value">{remarks}</div>;
                  }
                  return (
                    <div className="empty-state">
                      <FiMessageCircle className="empty-icon" />
                      <div className="empty-content">
                        <div className="empty-title">No remarks</div>
                        <div className="empty-sub">
                          No remarks recorded for this agreement
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </section>
            </div>
          </div>
        </div>
      )}

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
                    <div className="report-title">Archive Report Generator</div>
                    <div className="report-sub">
                      Generate comprehensive reports for archived agreements in
                      Excel format
                    </div>
                  </div>
                </div>

                <div className="report-stats">
                  <div className="stat-item">
                    <div className="stat-label">Total Agreements</div>
                    <div className="stat-number">{reportItems.length}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Report Type</div>
                    <div className="stat-value">
                      {reportType === "all"
                        ? "All Archived Agreements"
                        : reportType === "expired"
                        ? "Expired Only"
                        : "Withdrawn Only"}
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
                        <FiFilter className="label-icon" />
                        Report Type
                      </label>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="config-select"
                      >
                        <option value="all">All Archived Agreements</option>
                        <option value="expired">Expired Only</option>
                        <option value="withdrawn">Withdrawn Only</option>
                      </select>
                    </div>
                  </div>
                </div>

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
                          Total records: <strong>{reportItems.length}</strong>
                        </span>
                      </div>
                      <div className="preview-stat">
                        <FiCalendar className="stat-icon" />
                        <span>
                          Generated:{" "}
                          <strong>{new Date().toLocaleDateString()}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="preview-note">
                      <FiInfo className="note-icon" />
                      The report will include all agreement details, contact
                      information, and archive status.
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="export-section">
                  <h4 className="config-title">
                    <FiDownload className="config-icon" />
                    Export Options
                  </h4>

                  <div className="export-options">
                    <div className="export-option">
                      <div className="option-header">
                        <FiFileText className="option-icon pdf" />
                        <div className="option-info">
                          <div className="option-title">PDF Report</div>
                          <div className="option-desc">
                            Printable PDF formatted report
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn export-btn pdf-btn"
                        onClick={async () => {
                          try {
                            await generatePrintableReport();
                          } catch (e) {
                            console.error(e);
                            alert(
                              "PDF generation failed: " + (e?.message || e)
                            );
                          }
                          setShowGenerateModal(false);
                        }}
                      >
                        <FiPrinter className="icon" />
                        Download PDF
                      </button>
                    </div>

                    <div className="export-option">
                      <div className="option-header">
                        <FiFile className="option-icon excel" />
                        <div className="option-info">
                          <div className="option-title">Excel Report</div>
                          <div className="option-desc">
                            Comprehensive spreadsheet with all archive details
                            and formatting
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn export-btn excel-btn"
                        onClick={async () => {
                          await ReportGen.downloadXLSX({
                            items: reportItems,
                            reportKey: reportType,
                            getLinkedId: (r) =>
                              r?.linked_mou_id ||
                              r?.parent_agreement_id ||
                              r?.linked_mou ||
                              r?.linkedMouId ||
                              "",
                            filenamePrefix: `${reportType}-archive`,
                            allAgreements: [
                              ...allArchiveData,
                              ...withdrawnData,
                            ],
                          });
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
    </div>
  );
};

export default Archive;
