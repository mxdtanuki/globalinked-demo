import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "../components/layout.css";
import "./activeAgreement.css";
import useDebounce from "../hooks/useDebounce";
import {
  FiEye,
  FiLink,
  FiArrowRight,
  FiPrinter,
  FiDownload,
  FiX,
  FiEdit,
  FiAlertCircle,
  FiGlobe,
  FiCalendar,
} from "react-icons/fi";
import { TbFileText } from "react-icons/tb";
import { agreementService } from "../services/agreementService";
import axios from "axios";

const ActiveAgreement = () => {
  const [mobileShow, setMobileShow] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [reportType, setReportType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterValidityPeriod, setFilterValidityPeriod] = useState("");
  const [filterClassification, setFilterClassification] = useState("");
  const [filterCountryScope, setFilterCountryScope] = useState("all"); // all | local | international

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const createAuditLog = async (description) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_BASE_URL}/audit/logs`,
        { audit_description: description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to create audit log:", err);
    }
  };

  const fetchAgreements = async () => {
    try {
      const data = await agreementService.getActiveAgreements();
      console.log("ActiveAgreement fetched agreements:", data);
      const arr = Array.isArray(data) ? data.slice() : [];
      const timeOf = (item) => {
        const cand =
          item?.updated_at ||
          item?.date_signed ||
          item?.date ||
          item?.created_at ||
          item?.dateOfSigning ||
          item?.date_expiry;
        const t = new Date(cand).getTime();
        return isNaN(t) ? 0 : t;
      };
      arr.sort((a, b) => timeOf(b) - timeOf(a));
      setAgreements(arr);
      return arr;
    } catch (err) {
      console.error("Failed to fetch active agreements:", err);
      setError("Failed to fetch agreements: " + (err.message || err));
      setAgreements([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, agreements]);

  useEffect(() => {
    fetchAgreements();
    const onActivated = (e) => {
      const mapped = e?.detail;
      if (mapped && (mapped.agreement_id || mapped.id)) {
        setAgreements((prev) => {
          const key = String(mapped.agreement_id ?? mapped.id);
          const filtered = Array.isArray(prev)
            ? prev.filter((a) => String(a.agreement_id ?? a.id) !== key)
            : [];
          return [mapped, ...filtered];
        });
        fetchAgreements();
        return;
      }
      fetchAgreements();
    };
    window.addEventListener("agreementActivated", onActivated);
    return () => window.removeEventListener("agreementActivated", onActivated);
  }, []);

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  // three-dot row menu
  const [menuOpenId, setMenuOpenId] = useState(null);

  // close menu on outside click
  useEffect(() => {
    const handler = () => setMenuOpenId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const toggleRowMenu = (id, e) => {
    // stop the event from bubbling up (prevents row-level click handlers)
    if (e && e.stopPropagation) e.stopPropagation();
    setMenuOpenId((prev) => (prev === id ? null : id));
  };

  const viewAgreementFile = (agreement, which = "latest") => {
    setMenuOpenId(null);
    // attempt common fields used in the app to reference files
    const attachments =
      agreement?.files || agreement?.attachments || agreement?.documents || [];

    let url = null;
    if (which === "latest") {
      url =
        agreement?.latest_file_url ||
        agreement?.file_url ||
        (Array.isArray(attachments) &&
          attachments[0] &&
          (attachments[0].url || attachments[0].file_url));
    } else {
      url =
        agreement?.older_file_url ||
        (Array.isArray(attachments) &&
          attachments[1] &&
          (attachments[1].url || attachments[1].file_url));
    }

    if (url) {
      window.open(url, "_blank");
    } else {
      // basic user feedback if no file is available
      alert("No file found for this agreement.");
    }
  };

  const [isModalEdit, setIsModalEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    hardcopy_location: "",
    remarks: [],
  });
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) setCurrentUser(JSON.parse(userStr));
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (selectedAgreement) {
      setIsModalEdit(false);
      setEditForm({
        hardcopy_location:
          selectedAgreement.hardcopy_location ||
          selectedAgreement.hardcopyLocator ||
          "",
        remarks: normalizeRemarks(selectedAgreement.remarks),
      });
    } else {
      setIsModalEdit(false);
      setEditForm({ hardcopy_location: "", remarks: [] });
    }
  }, [selectedAgreement]);

  const toggleMobileSidebar = () => setMobileShow(!mobileShow);
  const closeModal = () => setSelectedAgreement(null);

  const startModalEdit = () => {
    // Only allow administrators to edit
    const isAdminUser = (user = currentUser) => {
      const u = user || currentUser;
      if (!u) return false;
      if (u.is_admin || u.isAdmin) return true;
      if (typeof u.role === "string" && /admin|administrator/i.test(u.role)) return true;
      if (typeof u.user_role === "string" && /admin|administrator/i.test(u.user_role)) return true;
      if (typeof u.role_name === "string" && /admin|administrator/i.test(u.role_name)) return true;
      if (Array.isArray(u.roles) && u.roles.some((r) => /admin/i.test(String(r)))) return true;
      if (Array.isArray(u.permissions) && u.permissions.includes("admin")) return true;
      return false;
    };
    if (!isAdminUser()) {
      alert("Only administrators may edit agreements.");
      return;
    }

    setIsModalEdit(true);
    setEditForm({
      hardcopy_location:
        selectedAgreement?.hardcopy_location ||
        selectedAgreement?.hardcopyLocator ||
        "",
      remarks: normalizeRemarks(selectedAgreement?.remarks),
    });
  };

  const cancelModalEdit = () => {
    setIsModalEdit(false);
    setEditForm({
      hardcopy_location:
        selectedAgreement?.hardcopy_location ||
        selectedAgreement?.hardcopyLocator ||
        "",
      remarks: normalizeRemarks(selectedAgreement?.remarks),
    });
  };

  const saveModalEdits = async () => {
    if (!selectedAgreement) return;
    // admin-only
    const isAdminUser = (user = currentUser) => {
      const u = user || currentUser;
      if (!u) return false;
      if (u.is_admin || u.isAdmin) return true;
      if (typeof u.role === "string" && /admin|administrator/i.test(u.role)) return true;
      if (typeof u.user_role === "string" && /admin|administrator/i.test(u.user_role)) return true;
      if (typeof u.role_name === "string" && /admin|administrator/i.test(u.role_name)) return true;
      if (Array.isArray(u.roles) && u.roles.some((r) => /admin/i.test(String(r)))) return true;
      if (Array.isArray(u.permissions) && u.permissions.includes("admin")) return true;
      return false;
    };
    if (!isAdminUser()) {
      alert("Only administrators may save changes.");
      return;
    }
    const id = selectedAgreement.agreement_id ?? selectedAgreement.id;
    // Build remarks payload to match existing server shape when possible
    const existingRemarks = selectedAgreement?.remarks;
    let remarksPayload = editForm.remarks;
    try {
      if (
        Array.isArray(existingRemarks) &&
        existingRemarks.length > 0 &&
        typeof existingRemarks[0] === "object"
      ) {
        // detect likely key name used by server for remark text
        const sampleKeys = Object.keys(existingRemarks[0] || {});
        const key =
          sampleKeys.find((k) =>
            ["remark_text", "text", "remark"].includes(k)
          ) || "remark_text";
        remarksPayload = editForm.remarks.map((s) => ({ [key]: s }));
      } else if (typeof existingRemarks === "string") {
        // server stores remarks as a single string
        remarksPayload = editForm.remarks.join("\n");
      } else {
        // default: array of strings
        remarksPayload = editForm.remarks;
      }
    } catch (e) {
      console.warn(
        "Failed to detect existing remarks shape, sending as array of strings",
        e
      );
      remarksPayload = editForm.remarks;
    }

    const payload = {
      hardcopy_location: editForm.hardcopy_location,
      remarks: remarksPayload,
    };

    // update server-side then update local UI state
    setSaving(true);
    try {
      // try to persist to backend (agreementService will throw on error)
      console.debug("Saving agreement payload:", id, payload);
      const updatedFromServer = await agreementService.updateAgreement(
        id,
        payload
      );
      console.debug("Server response for updateAgreement:", updatedFromServer);

      // decide what to display for remarks:
      // - prefer server-returned remarks when present
      // - but if server returns fewer/empty remarks than we expect, merge local edits so user sees their additions
      const serverRemarksNorm = updatedFromServer?.remarks
        ? normalizeRemarks(updatedFromServer.remarks)
        : null;
      const localRemarksNorm = normalizeRemarks(remarksPayload);
      let displayRemarks;
      if (serverRemarksNorm === null) {
        displayRemarks = localRemarksNorm;
      } else {
        // merge: start with server remarks then append any local remarks not present
        const seen = new Set(serverRemarksNorm);
        displayRemarks = [...serverRemarksNorm];
        localRemarksNorm.forEach((r) => {
          if (r && !seen.has(r)) {
            seen.add(r);
            displayRemarks.push(r);
          }
        });
      }

      // merge returned object into local list, but ensure we keep normalized remarks for display
      const merged = agreements.map((a) =>
        String(a.agreement_id ?? a.id) === String(id)
          ? {
              ...a,
              ...updatedFromServer,
              hardcopy_location:
                updatedFromServer?.hardcopy_location ??
                payload.hardcopy_location,
              remarks: displayRemarks,
            }
          : a
      );
      setAgreements(merged);

      setSelectedAgreement((prev) => ({
        ...(prev || {}),
        ...updatedFromServer,
        hardcopy_location:
          updatedFromServer?.hardcopy_location ?? payload.hardcopy_location,
        remarks: displayRemarks,
      }));

      // refresh from server to verify persistence (helps detect backend shape/validation issues)
      try {
        const refreshed = await fetchAgreements();
        const refreshedAgreement = (refreshed || []).find(
          (x) => String(x.agreement_id ?? x.id) === String(id)
        );
        const persistedRemarks = normalizeRemarks(refreshedAgreement?.remarks);
        const localNorm = normalizeRemarks(remarksPayload);
        const missing = localNorm.some(
          (r) => r && !persistedRemarks.includes(r)
        );

        // if server did not persist our remarks, try one retry using object-shaped remarks (common API shape)
        if (missing) {
          console.warn(
            "Remarks not persisted, retrying with object-shaped remarks payload"
          );
          const retryPayload = {
            ...payload,
            remarks: localNorm.map((s) => ({ remark_text: s })),
          };
          try {
            await agreementService.updateAgreement(id, retryPayload);
            const refreshed2 = await fetchAgreements();
            // update selectedAgreement from latest refreshed data
            const latest = (refreshed2 || []).find(
              (x) => String(x.agreement_id ?? x.id) === String(id)
            );
            if (latest)
              setSelectedAgreement((prev) => ({ ...(prev || {}), ...latest }));
          } catch (e) {
            console.warn("Retry to persist remarks failed", e);
          }
        }
      } catch (e) {
        console.warn("Failed to refresh agreements after save", e);
      }

      // optionally create an audit log entry
      try {
        await createAuditLog(
          `Updated agreement ${id}: hardcopy_location and remarks updated`
        );
      } catch (e) {
        // non-fatal
        console.warn("Audit log failed", e);
      }

      setIsModalEdit(false);
    } catch (err) {
      console.error("Failed to save agreement edits:", err);
      // surface error to the user (simple fallback)
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const activeAgreements = agreements.filter(
    (a) =>
      a.agreement_status === "Active" ||
      a.status === "active" ||
      a.status === "expiring-soon" ||
      !a.date_expiry ||
      new Date(a.date_expiry) > new Date()
  );
  const activeMOAs = activeAgreements.filter(
    (a) => String(a.document_type).toUpperCase() === "MOA"
  );
  const activeMOUs = activeAgreements.filter(
    (a) => String(a.document_type).toUpperCase() === "MOU"
  );
  const expiringSoon = activeAgreements.filter((a) => {
    if (!a.date_expiry) return false;
    const daysDiff =
      (new Date(a.date_expiry) - new Date()) / (1000 * 60 * 60 * 24);
    return daysDiff > 0 && daysDiff <= 90;
  });

  

  // derived options for validity period select (from activeAgreements)
  const validityOptions = useMemo(() => {
    const s = new Set();
    for (const a of activeAgreements) if (a.validity_period) s.add(String(a.validity_period));
    return Array.from(s).sort();
  }, [activeAgreements]);

  // derived options for partnership classification (from activeAgreements)
  // Accept multiple possible field names that may come from the API/schema
  const classificationOptions = useMemo(() => {
    const s = new Set();
    for (const a of activeAgreements) {
      const v =
        a.partnership_classification ??
        a.partnership_type ??
        a.partnershipClassification ??
        a.partnershipType ??
        null;
      if (v !== null && v !== undefined && String(v).trim() !== "") s.add(String(v));
    }
    return Array.from(s).sort();
  }, [activeAgreements]);

  // recompute filteredAgreements with the additional filters (validity period and country scope)
  const filteredAgreementsWithFilters = useMemo(() => {
    return activeAgreements
      .filter((a) => {
        if (filter === "moa")
          return String(a.document_type).toUpperCase() === "MOA";
        if (filter === "mou")
          return String(a.document_type).toUpperCase() === "MOU";
        if (filter === "linked") {
          return Boolean(
            a.related_mou ||
              a.MOU_to_MOA_id ||
              a.mou_number ||
              a.linked_mou ||
              a.linkedMouId
          );
        }
        return true;
      })
      .filter((a) => {
        const q = debouncedSearchQuery.trim().toLowerCase(); // Use debounced value
        if (q) {
          const fields = [
            a.dts_number,
            a.event_title,
            a.name,
            a.source_unit || a.source || a.initiating_unit,
            a.country,
            a.document_type,
            a.partnership_type,
            a.brief_profile,
            Array.isArray(a.remarks) ? a.remarks.join(" ") : a.remarks,
          ];
          if (!fields.some((f) => f && f.toString().toLowerCase().includes(q))) return false;
        }
        // apply partnership classification filter if set (check multiple possible fields)
        if (filterClassification) {
          const classific =
            (a.partnership_classification ?? a.partnership_type ?? a.partnershipClassification ?? a.partnershipType ?? "").toString();
          if (classific !== String(filterClassification)) return false;
        }
        // apply validity period filter if set
        if (filterValidityPeriod) {
          if (String(a.validity_period) !== String(filterValidityPeriod)) return false;
        }
        // apply country scope
        if (filterCountryScope && filterCountryScope !== "all") {
          const country = (a.country || "").toString().toLowerCase();
          const isPH = country.includes("philipp") || country === "ph" || country === "philippines";
          if (filterCountryScope === "local" && !isPH) return false;
          if (filterCountryScope === "international" && isPH) return false;
        }
        return true;
      });
  }, [activeAgreements, filter, debouncedSearchQuery, filterClassification, filterValidityPeriod, filterCountryScope]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAgreementsWithFilters.length / itemsPerPage)
  );
  const paginatedAgreements = filteredAgreementsWithFilters.slice(
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

  const LogoSrc = (lp) => {
    if (!lp) return null;
    try {
      if (typeof lp === "string") {
        if (lp.startsWith("data:image")) return lp;
        if (lp.startsWith("iVBORw0")) return `data:image/png;base64,${lp}`;
        if (lp.startsWith("/9j/")) return `data:image/jpeg;base64,${lp}`;
        if (lp.startsWith("http://") || lp.startsWith("https://")) return lp;
        // otherwise treat as a server-relative path
        return `${API_BASE_URL.replace(/\/$/, "")}/${lp.replace(/^\/+/, "")}`;
      }
    } catch (err) {
      console.warn("LogoSrc error:", err, lp);
    }
    return null;
  };

  // normalize remarks into an array of plain strings
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

  const addEditRemark = () =>
    setEditForm((prev) => ({
      ...prev,
      remarks: [...(prev.remarks || []), ""],
    }));
  const updateEditRemark = (idx, val) =>
    setEditForm((prev) => {
      const arr = Array.isArray(prev.remarks) ? [...prev.remarks] : [];
      arr[idx] = val;
      return { ...prev, remarks: arr };
    });
  const removeEditRemark = (idx) =>
    setEditForm((prev) => {
      const arr = Array.isArray(prev.remarks) ? [...prev.remarks] : [];
      arr.splice(idx, 1);
      return { ...prev, remarks: arr };
    });

  const linkedAgreement = (() => {
    if (!selectedAgreement) return null;
    const lid = getLinkedId(selectedAgreement) || selectedAgreement.linkedMouId;
    if (!lid) return null;
    return (
      agreements.find(
        (a) => a.id === lid || a.agreement_id === lid || a.linkedMouId === lid
      ) || null
    );
  })();

  const reportLabelMap = {
    all: "Complete Agreements Report",
    mou: "MOU Only Report",
    moa: "MOA Only Report",
    linked: "Linked MOU → MOA Report",
  };

  // helper: find the linked MOU id/key on an agreement object
  function getLinkedId(a) {
    if (!a) return undefined;
    return (
      a.related_mou ||
      a.MOU_to_MOA_id ||
      a.mou_number ||
      a.linked_mou ||
      a.linked_mou_id ||
      a.linkedMouId
    );
  }

  const reportItems = (() => {
    if (reportType === "mou")
      return agreements.filter(
        (a) => String(a.document_type).toUpperCase() === "MOU"
      );
    if (reportType === "moa")
      return agreements.filter(
        (a) => String(a.document_type).toUpperCase() === "MOA"
      );
    if (reportType === "linked")
      return agreements.filter((a) => Boolean(getLinkedId(a)));
    return agreements.slice();
  })();

  const escapeHtml = (str = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const safeCsv = (v = "") => {
    const s = String(v ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const generatePrintableReport = () => {
    const rows = reportItems
      .map((r) => {
        const parentId = getLinkedId(r);
        const parent = parentId
          ? agreements.find(
              (x) => x.id === parentId || x.agreement_id === parentId
            )
          : null;
        return `<tr>
            <td>${escapeHtml(r.document_type)}</td>
            <td>${escapeHtml(r.dts_number)}</td>
            <td>${escapeHtml(r.event_title || r.event || r.title || "")}</td>
            <td>${escapeHtml(r.name || r.partnerName || "")}</td>
            <td>${escapeHtml(
              r.source_unit || r.source || r.initiating_unit || ""
            )}</td>
            <td>${escapeHtml(
              r.date_signed ? new Date(r.date_signed).toLocaleDateString() : ""
            )}</td>
            <td>${escapeHtml(
              r.date_expiry ? new Date(r.date_expiry).toLocaleDateString() : ""
            )}</td>
            <td>${
              parent
                ? escapeHtml(parent.event_title || parent.eventTitle || "")
                : ""
            }</td>
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
    const headers = [
      "Type",
      "DTS Number",
      "Title",
      "Partner",
      "Country",
      "Source",
      "DateOfSigning",
      "ExpiryDate",
      "LinkedMouId",
      "Remarks",
    ];
    const csvRows = [headers.join(",")];

    reportItems.forEach((r) => {
      const row = [
        safeCsv(r.document_type),
        safeCsv(r.dts_number),
        safeCsv(r.event_title || r.event || r.title || ""),
        safeCsv(r.name || r.partnerName || ""),
        safeCsv(r.country),
        safeCsv(r.source_unit || r.source || r.initiating_unit),
        safeCsv(r.date_signed || ""),
        safeCsv(r.date_expiry || ""),
        safeCsv(getLinkedId(r) || ""),
        safeCsv(
          Array.isArray(r.remarks) ? r.remarks.join(" | ") : r.remarks || ""
        ),
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

  if (error) {
    return <div className="overview-container">Error: {error}</div>;
  }

  if (loading) {
    return (
      <div className="dashboard-container active-agreements-page">
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
            <div className="lloading-container" style={{ padding: 40, textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto 12px" }} />
              <p>Loading agreements...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container active-agreements-page">
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
                <div className="table-search-wrapper" style={{ position: "relative" }}>
                  <div className="table-search" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="search"
                      placeholder="Search DTS, partner, type..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      aria-label="Search agreements"
                      style={{ flex: 1 }}
                    />
                    {searchQuery && (
                      <button
                        className="clear-search"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search"
                      >
                        <FiX />
                      </button>
                    )}
                    <button
                      type="button"
                      className={`btn ${showFilterPanel ? "active" : ""}`}
                      onClick={() => setShowFilterPanel((v) => !v)}
                      aria-expanded={showFilterPanel}
                    >
                      Filters
                    </button>
                  </div>
                </div>
                <div className="table-actions">
                  <div className="filter-tabs">
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
                      MOA
                    </button>
                    <button
                      className={filter === "mou" ? "active" : ""}
                      onClick={() => setFilter("mou")}
                    >
                      MOU
                    </button>
                    <button
                      className={filter === "linked" ? "active" : ""}
                      onClick={() => setFilter("linked")}
                    >
                      Linked Agreements
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline filter panel (rendered below search + tabs when open) */}
              {showFilterPanel && (
                <div className="overview1-filter-panel" style={{ marginTop: 12 }}>
                  <div className="overview1-panel-row">
                    <div className="overview1-panel-field">
                      <label>Partnership Classification</label>
                      <select
                        value={filterClassification}
                        onChange={(e) => { setFilterClassification(e.target.value); setCurrentPage(1); }}
                      >
                        <option value="">Select Classification</option>
                        {classificationOptions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="overview1-panel-field">
                      <label>Validity Period</label>
                      <select
                        value={filterValidityPeriod}
                        onChange={(e) => { setFilterValidityPeriod(e.target.value); setCurrentPage(1); }}
                      >
                        <option value="">Select Validity</option>
                        {validityOptions.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div className="overview1-panel-field">
                      <label>Country</label>
                      <select
                        value={filterCountryScope}
                        onChange={(e) => { setFilterCountryScope(e.target.value); setCurrentPage(1); }}
                      >
                        <option value="all">Select Country</option>
                        <option value="local">Local (Philippines)</option>
                        <option value="international">International</option>
                      </select>
                    </div>
                  </div>

                  <div className="overview1-filter-actions">
                    <button
                      className="btn clear"
                      onClick={() => { setFilterClassification(""); setFilterValidityPeriod(""); setFilterCountryScope("all"); setShowFilterPanel(false); setCurrentPage(1); }}
                    >
                      Clear
                    </button>
                    <button
                      className="btn apply"
                      onClick={() => setShowFilterPanel(false)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              <h3 className="section-title">
                Agreements ({filteredAgreementsWithFilters.length})
              </h3>
              {filter === "linked" ? (
                (() => {
                  const mouList = activeAgreements.filter(
                    (a) =>
                      String(
                        a.document_type || a.documentType
                      ).toUpperCase() === "MOU"
                  );

                  const mouWithChildren = mouList
                    .map((mou) => {
                      const mid = mou.id || mou.agreement_id;
                      const children = activeAgreements.filter(
                        (c) => getLinkedId(c) === mid || c.linkedMouId === mid
                      );
                      return { mou, children };
                    })
                    .filter((item) => item.children.length > 0);

                  if (mouWithChildren.length === 0) {
                    return (
                      <div className="no-linked">
                        No linked agreements found.
                      </div>
                    );
                  }

                  return (
                    <div className="mou-relationships">
                      {mouWithChildren.map(({ mou, children }) => (
                        <div className="mou-relationship" key={mou.id}>
                          <div className="mou-relationship-header">
                            <span className="mou-dot" />
                            <span className={`badge mou`}>MOU</span>
                            <div className="mou-meta">
                              <strong className="mou-title">
                                {mou.event_title || mou.eventTitle}
                              </strong>
                              <div className="mou-sub">
                                Partner: {mou.name || mou.partnerName} (
                                {mou.country})
                              </div>
                              <div className="mou-sub small">
                                Valid:{" "}
                                {new Date(
                                  mou.date_signed || mou.dateOfSigning
                                ).toLocaleDateString()}{" "}
                                →{" "}
                                {new Date(
                                  mou.date_expiry || mou.expiryDate
                                ).toLocaleDateString()}
                              </div>
                              <div className="mou-dts small">
                                {mou.dts_number || mou.dtsNumber}
                              </div>
                            </div>
                            {/* View details button for the MOU */}
                            <button
                              className="mou-view-btn"
                              onClick={() => setSelectedAgreement(mou)}
                              aria-label={`View details for ${
                                mou.dts_number ||
                                mou.dtsNumber ||
                                mou.event_title ||
                                "MOU"
                              }`}
                              title="View details"
                            >
                              <FiEye className="icon" />
                            </button>
                          </div>

                          <div className="mou-based">
                            <div className="mou-based-title">
                              <FiLink className="link-inline" /> Agreements
                              based on this MOU ({children.length})
                            </div>

                            <div className="mou-children">
                              {children.map((c) => (
                                <div className="moa-child-card" key={c.id}>
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
                                      {new Date(
                                        c.date_signed || c.dateOfSigning
                                      ).toLocaleDateString()}{" "}
                                      →{" "}
                                      {new Date(
                                        c.date_expiry || c.expiryDate
                                      ).toLocaleDateString()}
                                    </div>
                                    <div className="moa-dts small">
                                      {c.dts_number || c.dtsNumber}
                                    </div>
                                  </div>

                                  {/* View details button for each linked child */}
                                  <button
                                    className="moa-view-btn"
                                    onClick={() => setSelectedAgreement(c)}
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
                      {paginatedAgreements.map((a, i) => {
                        const parentId = getLinkedId(a);
                        const parent = parentId
                          ? agreements.find(
                              (x) =>
                                x.id === parentId ||
                                x.agreement_id === parentId ||
                                x.linkedMouId === parentId
                            )
                          : null;
                        // find children (MOAs) that link to this agreement (useful when this row is an MOU)
                        const keyId = a.id || a.agreement_id;
                        const childrenOfThis = Array.isArray(agreements)
                          ? agreements.filter(
                              (c) =>
                                getLinkedId(c) === keyId ||
                                c.linkedMouId === keyId ||
                                c.MOU_to_MOA_id === keyId
                            )
                          : [];
                        return (
                          <tr key={a.id || i}>
                            <td>
                              <span
                                className={`badge ${String(
                                  a.document_type || a.documentType || ""
                                ).toLowerCase()}`}
                              >
                                {a.document_type || a.documentType}
                              </span>
                            </td>

                            <td className="dts-number">
                              {a.dts_number || a.dtsNumber}
                            </td>

                            <td>
                              <div>
                                <b>{a.event_title || a.eventTitle}</b>
                                <div className="small">
                                  {a.partnership_type ||
                                    a.partnershipClassification}
                                </div>
                              </div>
                            </td>

                            <td>
                              <div>
                                <b>{a.name || a.partnerName}</b>
                                <div
                                  className="small"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <FiGlobe className="inline-icon" />
                                  {a.country}
                                </div>
                              </div>
                            </td>

                            <td>
                              {a.source_unit || a.source || a.initiating_unit}
                            </td>

                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <FiCalendar className="inline-icon" />
                                {new Date(
                                  a.date_expiry || a.expiryDate
                                ).toDateString()}
                              </div>
                            </td>

                            <td>
                              <span className="days-pill">
                                {calculateDaysLeft(
                                  a.date_expiry || a.expiryDate
                                )}{" "}
                                days
                              </span>
                            </td>

                            {/* Connection column */}
                            <td className="connection">
                              {parentId ? (
                                <span className="agreement-tooltip">
                                  <button
                                    type="button"
                                    className="linked linked-child parent-dts-button"
                                    aria-describedby={`agreement-tooltip-${
                                      a.id || i
                                    }`}
                                    onClick={() => setSelectedAgreement(parent)}
                                    aria-label={`View linked MOU ${
                                      parent?.dts_number ||
                                      parent?.dtsNumber ||
                                      parentId
                                    }`}
                                    title={
                                      parent?.dts_number ||
                                      parent?.dtsNumber ||
                                      parentId
                                    }
                                  >
                                    <FiLink className="link-icon" />
                                    <span className="parent-dts">
                                      {parent?.dts_number ||
                                        parent?.dtsNumber ||
                                        parentId}
                                    </span>
                                  </button>

                                  <div
                                    id={`agreement-tooltip-${a.id || i}`}
                                    className="agreement-tooltip-content"
                                    role="tooltip"
                                  >
                                    <div className="agreement-dts">
                                      DTS:{" "}
                                      <strong>
                                        {parent?.dts_number ||
                                          parent?.dtsNumber ||
                                          parentId}
                                      </strong>
                                    </div>
                                    <div className="agreement-title">
                                      {parent?.event_title ||
                                        parent?.eventTitle ||
                                        "No title available"}
                                    </div>
                                    <div className="agreement-expiry">
                                      Expires:{" "}
                                      <strong>
                                        {parent?.date_expiry
                                          ? new Date(
                                              parent.date_expiry
                                            ).toLocaleDateString()
                                          : parent?.expiryDate
                                          ? new Date(
                                              parent.expiryDate
                                            ).toLocaleDateString()
                                          : "—"}
                                      </strong>
                                    </div>
                                  </div>
                                </span>
                              ) : String(
                                  a.document_type || a.documentType
                                ).toUpperCase() === "MOU" &&
                                childrenOfThis.length > 0 ? (
                                // This row is an MOU and it has linked MOAs — render each child as its own clickable button
                                <div
                                  className="mou-children-inline"
                                  role="group"
                                  aria-label={`${childrenOfThis.length} linked MOAs`}
                                >
                                  {childrenOfThis.map((ch, idx) => (
                                    <button
                                      key={ch.id || ch.agreement_id || idx}
                                      type="button"
                                      className="linked linked-child"
                                      onClick={() => setSelectedAgreement(ch)}
                                      aria-label={`View linked MOA ${
                                        ch.dts_number ||
                                        ch.event_title ||
                                        idx + 1
                                      }`}
                                      title={
                                        ch.event_title ||
                                        ch.dts_number ||
                                        `MOA ${idx + 1}`
                                      }
                                    >
                                      <FiLink className="link-icon" />
                                      <span className="child-label">
                                        {ch.dts_number ||
                                          ch.event_title ||
                                          `MOA ${idx + 1}`}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ) : String(
                                  a.document_type || a.documentType
                                ).toUpperCase() === "MOA" ? (
                                <span className="independent">Independent</span>
                              ) : (
                                <span className="dash">—</span>
                              )}
                            </td>

                            <td>
                              <div
                                className="row-actions"
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                }}
                              >
                                <button
                                  className="icon-btn"
                                  onClick={() => setSelectedAgreement(a)}
                                  aria-label="View details"
                                  title="View details"
                                >
                                  <FiEye className="icon" />
                                </button>

                                {/* three-dot menu button */}
                                <div
                                  className="row-menu"
                                  style={{ position: "relative" }}
                                >
                                  <button
                                    className="icon-btn menu-toggle"
                                    onClick={(e) => toggleRowMenu(a.id || i, e)}
                                    aria-haspopup="true"
                                    aria-expanded={menuOpenId === (a.id || i)}
                                    title="More"
                                  >
                                    {/* Use a simple ellipsis glyph; CSS can replace with an icon */}
                                    <span style={{ fontSize: 18 }}>⋯</span>
                                  </button>

                                  {menuOpenId === (a.id || i) && (
                                    <div
                                      className="row-menu-panel"
                                      role="menu"
                                      style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "28px",
                                        background: "#fff",
                                        border: "1px solid rgba(0,0,0,0.08)",
                                        boxShadow:
                                          "0 6px 18px rgba(0,0,0,0.08)",
                                        zIndex: 60,
                                        minWidth: 160,
                                        padding: 6,
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        className="menu-item"
                                        role="menuitem"
                                        onClick={() =>
                                          viewAgreementFile(a, "latest")
                                        }
                                        style={{
                                          display: "block",
                                          width: "100%",
                                          padding: "8px 10px",
                                          textAlign: "left",
                                          background: "transparent",
                                          border: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        View file
                                      </button>

                                      <button
                                        type="button"
                                        className="menu-item"
                                        role="menuitem"
                                        onClick={() =>
                                          viewAgreementFile(a, "older")
                                        }
                                        style={{
                                          display: "block",
                                          width: "100%",
                                          padding: "8px 10px",
                                          textAlign: "left",
                                          background: "transparent",
                                          border: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        View older file
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="page-btn"
                        onClick={prevPage}
                        disabled={currentPage === 1}
                      >
                        Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => {
                        const page = idx + 1;
                        return (
                          <button
                            key={page}
                            className={`page-btn ${
                              page === currentPage ? "active" : ""
                            }`}
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
              <h3>
                <FiAlertCircle className="inline-icon" /> Nearing Expiration
              </h3>
              <p className="subtext">
                These agreements will expire within the next 90 days
              </p>

              {expiringSoon.map((a, i) => (
                <div key={i} className="activeAgreement-expiring-card">
                  <div className="activeAgreement-expiring-header">
                    <span
                      className={`badge ${String(
                        a.document_type || a.documentType || ""
                      ).toLowerCase()}`}
                    >
                      {a.document_type || a.documentType}
                    </span>
                    <h4>{a.event_title || a.eventTitle}</h4>
                    <div className="days-left">
                      <button
                        className="eye-btn"
                        onClick={() => setSelectedAgreement(a)}
                        aria-label="View details"
                      >
                        <FiEye className="icon" />
                      </button>
                      <span>
                        {calculateDaysLeft(a.date_expiry || a.expiryDate)} days
                        left
                      </span>
                    </div>
                  </div>
                  <p>
                    <b>Partner:</b>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        marginLeft: "4px",
                      }}
                    >
                      <FiGlobe className="inline-icon" />
                      {a.name || a.partnerName}
                    </span>
                    <br />
                    <b>Expires:</b>{" "}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        marginLeft: "4px",
                      }}
                    >
                      <FiCalendar className="inline-icon" />
                      {new Date(a.date_expiry || a.expiryDate).toDateString()}
                    </span>
                    <br />
                    <b>Source:</b>{" "}
                    {a.source_unit || a.source || a.initiating_unit} •{" "}
                    <span>{a.dts_number || a.dtsNumber}</span>
                  </p>

                  {getLinkedId(a) && (
                    <p className="linked">
                      <FiLink className="inline-icon" /> Requires MOU:{" "}
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
                <div className="report-icon">
                  <TbFileText size={24} />
                </div>
                <div>
                  <h4>Report Generator</h4>
                  <div className="report-sub">
                    Generate comprehensive reports for agreements in various
                    formats
                  </div>
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
                    <FiPrinter className="btn-icon" />
                    <span>Generate Report</span>
                  </button>

                  <button
                    className="btn btn-outline btn-csv"
                    onClick={downloadCSV}
                    aria-label="Download CSV"
                  >
                    <FiDownload className="btn-icon" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              <div className="report-meta">
                <div>
                  <strong>Selected:</strong>{" "}
                  <span className="muted">{reportLabelMap[reportType]}</span>
                </div>
                <div>
                  <strong>Total records:</strong>{" "}
                  <span className="muted">{reportItems.length}</span>
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
                <span
                  className={`badge ${String(
                    selectedAgreement.document_type ||
                      selectedAgreement.documentType ||
                      ""
                  ).toLowerCase()}`}
                >
                  {selectedAgreement.document_type ||
                    selectedAgreement.documentType}
                </span>
                <h2 className="modal-title">
                  {selectedAgreement.event_title ||
                    selectedAgreement.eventTitle}
                </h2>
              </div>
              <button
                className="modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                <FiX className="icon" />
              </button>
            </header>

            <div className="agreement-modal-body">
              {/* Document Information */}
              <section className="modal-section docinfo">
                <h4>Document Information</h4>
                <div className="row two-col">
                  <div>
                    <div className="label">DTS Number</div>
                    <div className="value mono">
                      {selectedAgreement.dts_number ||
                        selectedAgreement.dtsNumber}
                    </div>
                  </div>

                  <div>
                    <div className="label">Hardcopy Locator</div>
                    <div className="value">
                      {selectedAgreement.hardcopy_location ||
                        selectedAgreement.hardcopyLocator ||
                        "—"}
                    </div>
                  </div>

                  <div>
                    <div className="label">Entry Date</div>
                    <div className="value">
                      {new Date(
                        selectedAgreement.date ||
                          selectedAgreement.date_signed ||
                          selectedAgreement.dateOfSigning
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="label">Brief Profile</div>
                <div className="brief">
                  {selectedAgreement.brief_profile ||
                    selectedAgreement.briefProfile}
                </div>
              </section>

              <section className="modal-section partner">
                <h4>Partner Information</h4>

                <div className="partner-top">
                  <div className="partner-logo">
                    {LogoSrc(
                      selectedAgreement.logo_path || selectedAgreement.logo
                    ) ? (
                      <img
                        src={LogoSrc(
                          selectedAgreement.logo_path || selectedAgreement.logo
                        )}
                        alt={`${
                          selectedAgreement.name ||
                          selectedAgreement.partnerName
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
                          selectedAgreement.name ||
                            selectedAgreement.partnerName
                        )}
                      </div>
                    )}
                  </div>

                  <div className="partner-details">
                    <div className="row two-col">
                      <div>
                        <div className="label">Organization</div>
                        <div className="value">
                          {selectedAgreement.name ||
                            selectedAgreement.partnerName}
                        </div>
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
                        <div className="value">
                          <a
                            href={
                              selectedAgreement.website_link ||
                              selectedAgreement.websiteLink
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            {selectedAgreement.website_link ||
                              selectedAgreement.websiteLink}
                          </a>
                        </div>
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
                    <div className="contact-name">
                      {formatContactPersons(
                        selectedAgreement.point_persons_display ||
                          selectedAgreement.pointPerson ||
                          selectedAgreement.point_persons
                      )}
                    </div>
                    <div className="contact-org">
                      {selectedAgreement.source_unit ||
                        selectedAgreement.source ||
                        selectedAgreement.initiating_unit}
                    </div>
                    {formatContactEmails(
                      selectedAgreement.point_persons_email ||
                        selectedAgreement.pointPersonEmail
                    ) ? (
                      <a
                        className="contact-email"
                        href={`mailto:${formatContactEmails(
                          selectedAgreement.point_persons_email ||
                            selectedAgreement.pointPersonEmail
                        )}`}
                      >
                        {formatContactEmails(
                          selectedAgreement.point_persons_email ||
                            selectedAgreement.pointPersonEmail
                        )}
                      </a>
                    ) : null}
                  </div>

                  <div className="contact-card alt">
                    <div className="contact-role">Partner Contact Person</div>
                    <div className="contact-name">
                      {formatContactPersons(
                        selectedAgreement.contact_persons_display ||
                          selectedAgreement.contactPerson ||
                          selectedAgreement.contact_persons
                      )}
                    </div>
                    <div className="contact-org">
                      {selectedAgreement.name || selectedAgreement.partnerName}
                    </div>
                    {formatContactEmails(
                      selectedAgreement.contact_persons_email ||
                        selectedAgreement.contactPersonEmail
                    ) ? (
                      <a
                        className="contact-email"
                        href={`mailto:${formatContactEmails(
                          selectedAgreement.contact_persons_email ||
                            selectedAgreement.contactPersonEmail
                        )}`}
                      >
                        {formatContactEmails(
                          selectedAgreement.contact_persons_email ||
                            selectedAgreement.contactPersonEmail
                        )}
                      </a>
                    ) : null}
                  </div>
                </div>
              </section>

              {/* ===== Linked MOU ===== */}
              {linkedAgreement && (
                <section className="modal-section linked-mou">
                  <h4>
                    <FiLink
                      style={{ marginRight: 8 }}
                      className="inline-icon"
                    />{" "}
                    Linked MOU
                  </h4>

                  <div className="linked-mou-card">
                    <div className="linked-mou-left">
                      <span className="badge mou">MOU</span>
                    </div>

                    <div className="linked-mou-body">
                      <strong className="linked-mou-title">
                        {linkedAgreement.event_title ||
                          linkedAgreement.eventTitle}
                      </strong>
                      <div className="small linked-mou-sub">
                        {linkedAgreement.partnership_type ||
                          linkedAgreement.partnershipClassification}
                      </div>
                      <div className="small linked-mou-valid">
                        Valid until:{" "}
                        {new Date(
                          linkedAgreement.date_expiry ||
                            linkedAgreement.expiryDate
                        ).toLocaleDateString()}
                      </div>
                      <div className="linked-mou-dts small">
                        {linkedAgreement.dts_number ||
                          linkedAgreement.dtsNumber}
                      </div>
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
                    <div className="value">
                      {new Date(
                        selectedAgreement.date_signed ||
                          selectedAgreement.dateOfSigning
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="label">Expiry Date</div>
                    <div className="value">
                      {new Date(
                        selectedAgreement.date_expiry ||
                          selectedAgreement.expiryDate
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="label">Validity Period</div>
                    <div className="value">
                      {selectedAgreement.validity_period ||
                        selectedAgreement.validityPeriod}{" "}
                      years
                    </div>
                  </div>
                  <div>
                    <div className="label">Status</div>
                    <div className="value status-pill">
                      {(selectedAgreement.agreement_status ||
                        selectedAgreement.status) === "expiring-soon"
                        ? "Expiring soon"
                        : "Active"}
                    </div>
                  </div>
                </div>
              </section>

              <section className="modal-section remarks">
                <div className="label">Remarks</div>
                <div className="brief">
                  {Array.isArray(selectedAgreement.remarks) ? (
                    selectedAgreement.remarks.map((r, idx) => (
                      <div key={idx}>
                        {typeof r === "object"
                          ? r.remark_text || r.text || r.remark || ""
                          : r}
                      </div>
                    ))
                  ) : selectedAgreement.remarks ? (
                    <div>{selectedAgreement.remarks}</div>
                  ) : (
                    "—"
                  )}
                </div>
              </section>
            </div>

            <footer className="agreement-modal-footer">
              {!isModalEdit ? (
                <>
                  {/** Show Edit only to admins */}
                  {(() => {
                    const isAdminUser = (user = currentUser) => {
                      const u = user || currentUser;
                      if (!u) return false;
                      if (u.is_admin || u.isAdmin) return true;
                      if (typeof u.role === "string" && /admin|administrator/i.test(u.role)) return true;
                      if (typeof u.user_role === "string" && /admin|administrator/i.test(u.user_role)) return true;
                      if (typeof u.role_name === "string" && /admin|administrator/i.test(u.role_name)) return true;
                      if (Array.isArray(u.roles) && u.roles.some((r) => /admin/i.test(String(r)))) return true;
                      if (Array.isArray(u.permissions) && u.permissions.includes("admin")) return true;
                      return false;
                    };
                    return isAdminUser() ? (
                      <button className="btn edit" onClick={startModalEdit}>
                        <FiEdit className="icon" /> Edit
                      </button>
                    ) : null;
                  })()}
                </>
              ) : (
                <div style={{ width: "100%" }} className="modal-edit-panel">
                  <div
                    className="row two-col"
                    style={{ gap: 12, alignItems: "flex-start" }}
                  >
                    <div>
                      <div className="label">Hardcopy Locator</div>
                      <input
                        className="edit-input"
                        value={editForm.hardcopy_location}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            hardcopy_location: e.target.value,
                          })
                        }
                        placeholder="Enter hardcopy locator"
                      />
                    </div>

                    <div>
                      <div className="label">Remarks</div>
                      <div style={{ background: "#fff8dc", padding: "5px" }}>
                        {Array.isArray(editForm.remarks) &&
                        editForm.remarks.length > 0 ? (
                          editForm.remarks.map((rm, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "5px",
                              }}
                            >
                              <input
                                type="text"
                                value={rm}
                                onChange={(e) =>
                                  updateEditRemark(idx, e.target.value)
                                }
                                style={{ flex: 1 }}
                              />
                              <button
                                onClick={() => removeEditRemark(idx)}
                                style={{ marginLeft: 8 }}
                              >
                                x
                              </button>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: "#666", fontStyle: "italic" }}>
                            No remarks
                          </div>
                        )}
                        <div>
                          <button onClick={addEditRemark}>+ Add</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 12,
                      gap: 8,
                    }}
                  >
                    <button
                      className="btn save"
                      onClick={saveModalEdits}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="btn cancel"
                      onClick={cancelModalEdit}
                      disabled={saving}
                    >
                      Cancel
                    </button>
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
