    import React, { useState, useEffect, useMemo, useRef } from "react";
    import { createPortal } from "react-dom";
    import Sidebar from "../components/sidebar";
    import TopBar from "../components/topbar";
    import "../components/layout.css";
    import "../components/overview1.css";
    import "./activeAgreement.css";
    import useDebounce from "../hooks/useDebounce";
    import { useNavigate } from "react-router-dom";
    import {
    FiEye,
    FiLink,
    FiArrowRight,
    FiClock,
    FiPrinter,
    FiDownload,
    FiX,
    FiEdit,
    FiAlertCircle,
    FiTag,
    FiGlobe,
    FiCalendar,
    FiBarChart,
    FiFilter,
    FiSettings,
    FiFile,
    FiInfo,
    FiMapPin,
    FiMoreVertical,
    FiFileText,
    FiArchive,
    FiCheck,
    FiCheckCircle,
    FiUsers,
    FiMessageCircle,
    FiHash,
    FiXCircle,
    FiHome,
    FiBookOpen,
    FiAward,
    FiSave,
    FiTrash2,
    FiPlus,
    } from "react-icons/fi";
    import { agreementService } from "../services/agreementService";
    import axios from "axios";
    import { documentService } from "../services/documentService";
    import {
    generatePrintableReport as generatePrintableReportShared,
    downloadCSV as downloadCSVShared,
    downloadXLSX as downloadXLSXShared,
    } from "../components/reportGeneration";

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
        if (!ref.current.contains(e.target)) setOpen(false);
        };
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
    const [filterSource, setFilterSource] = useState("");

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

    const selectedDts =
        selectedAgreement?.dts_number ||
        selectedAgreement?.dtsNumber ||
        selectedAgreement?.dts_no ||
        selectedAgreement?.id ||
        selectedAgreement?.agreement_id ||
        null;

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
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);
    // ref to the "Nearing Expiration" section so summary card can scroll to it
    const expiringRef = useRef(null);
    const goToExpiringSection = () => {
        try {
        if (expiringRef && expiringRef.current) {
            expiringRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
            });
            // also focus for keyboard users
            if (typeof expiringRef.current.focus === "function")
            expiringRef.current.focus();
        }
        } catch (e) {
        console.warn("Scrolling to expiring section failed", e);
        }
    };
    const navigate = useNavigate();

    // close menu on outside click or scroll
    useEffect(() => {
        const handler = () => setMenuOpenId(null);
        const scrollHandler = () => setMenuOpenId(null);
        document.addEventListener("click", handler);
        window.addEventListener("scroll", scrollHandler, true);
        return () => {
        document.removeEventListener("click", handler);
        window.removeEventListener("scroll", scrollHandler, true);
        };
    }, []);

    const toggleRowMenu = (id, e) => {
        if (e && e.stopPropagation) e.stopPropagation();

        if (menuOpenId === id) {
        setMenuOpenId(null);
        return;
        }

        // Calculate position relative to button
        try {
        const rect = e.currentTarget.getBoundingClientRect();
        const top = rect.bottom + 4;
        const left = rect.right - 160; // align right edge of menu with button
        setMenuPos({ top, left });
        } catch (err) {
        setMenuPos({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
        }

        setMenuOpenId(id);
    };

    // mirror overviewDash behavior: use documentService.getLatestVersion and open blob URL
    const handleViewLatestFile = async (dtsNumber) => {
        try {
        if (!dtsNumber) {
            alert("No DTS number provided for this agreement.");
            return;
        }
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

    const viewAgreementFile = async (agreement, which = "latest") => {
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

        // Fast path: direct URL on agreement/attachment
        if (url) {
        window.open(url, "_blank");
        return;
        }

        // If user requested older versions, open the versions viewer / docVer page
        const dts =
        agreement?.dts_number ||
        agreement?.dtsNumber ||
        agreement?.dts_no ||
        agreement?.id ||
        agreement?.agreement_id;
        if (which === "older") {
        if (dts) {
            // navigate in-app to docVer (do not open a new tab)
            navigate(`/docVer?dts_number=${encodeURIComponent(dts)}`);
            return;
        }
        }

        // Fallback: try documentService to find latest/signed URL or download blob (like overviewDash)
        try {
        // 1) Try service helper to get latest version by DTS number (preferred)
        if (
            dts &&
            documentService &&
            typeof documentService.getLatestVersion === "function"
        ) {
            const latest = await documentService.getLatestVersion(dts);
            const downloadUrl =
            latest?.download_url ||
            latest?.url ||
            latest?.signedUrl ||
            latest?.downloadUrl;
            if (downloadUrl) {
            // fetch as blob and open (better cross-origin support & consistent behavior)
            const resp = await fetch(downloadUrl, {
                headers: { Accept: "application/pdf" },
            });
            if (!resp.ok)
                throw new Error(`Failed to fetch file (${resp.status})`);
            const blob = await resp.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
            return;
            }
            // if service returned an id instead of URL, try getDownloadUrl
            if (
            latest &&
            (latest.id || latest.version_id) &&
            typeof documentService.getDownloadUrl === "function"
            ) {
            const signed = await documentService.getDownloadUrl(
                latest.id || latest.version_id
            );
            const dl = signed?.download_url || signed?.url || signed;
            if (dl) {
                window.open(dl, "_blank");
                return;
            }
            }
        }

        // 2) Try to locate a version id from attachments / agreement and request a signed url
        const findVersionId = () => {
            return (
            agreement?.latest_version_id ||
            agreement?.version_id ||
            agreement?.file_version_id ||
            agreement?.file_id ||
            (Array.isArray(attachments) &&
                (() => {
                const a =
                    which === "latest"
                    ? attachments[0]
                    : attachments[1] || attachments[0];
                return a?.version_id || a?.id || a?.file_id || a?.versionId;
                })())
            );
        };

        const versionId = findVersionId();
        if (
            versionId &&
            documentService &&
            typeof documentService.getDownloadUrl === "function"
        ) {
            const signed = await documentService.getDownloadUrl(versionId);
            const downloadUrl = signed?.download_url || signed?.url || signed;
            if (downloadUrl) {
            // open signed URL directly (server usually sets correct headers)
            window.open(downloadUrl, "_blank");
            return;
            }
        }
        } catch (err) {
        console.warn("documentService / file fetch failed:", err);
        }

        // final fallback message
        alert("No file found for this agreement.");
    };

    const [isModalEdit, setIsModalEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        hardcopy_location: "",
        remarks: [],
    });
    const [initialEditForm, setInitialEditForm] = useState({
        hardcopy_location: "",
        remarks: [],
    });
    const [initialRemarksCount, setInitialRemarksCount] = useState(0);
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    // Generate report modal state (behaves like OverviewDash)
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateDocType, setGenerateDocType] = useState("All");
    const [generateStatus, setGenerateStatus] = useState("All");
    const [generateSource, setGenerateSource] = useState("All");

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

    const navigateAgreement = (dir) => {
        if (!selectedAgreement) return;
        const idx = filteredAgreementsWithFilters.findIndex(
        (a) =>
            (a.id || a.agreement_id || a.dts_number) ===
            (selectedAgreement.id ||
            selectedAgreement.agreement_id ||
            selectedAgreement.dts_number)
        );
        if (idx === -1) return;
        const next = filteredAgreementsWithFilters[idx + dir];
        if (next) setSelectedAgreement(next);
    };

    const startModalEdit = () => {
        // Only allow administrators to edit
        const isAdminUser = (user = currentUser) => {
        const u = user || currentUser;
        if (!u) return false;
        if (u.is_admin || u.isAdmin) return true;
        if (typeof u.role === "string" && /admin|administrator/i.test(u.role))
            return true;
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
        if (
            Array.isArray(u.roles) &&
            u.roles.some((r) => /admin/i.test(String(r)))
        )
            return true;
        if (Array.isArray(u.permissions) && u.permissions.includes("admin"))
            return true;
        return false;
        };
        if (!isAdminUser()) {
        alert("Only administrators may edit agreements.");
        return;
        }

        setIsModalEdit(true);
        const initialRemarks = normalizeRemarks(selectedAgreement?.remarks);
        const initialValues = {
        hardcopy_location:
            selectedAgreement?.hardcopy_location ||
            selectedAgreement?.hardcopyLocator ||
            "",
        remarks: initialRemarks,
        };
        setEditForm(initialValues);
        setInitialEditForm(initialValues);
        setInitialRemarksCount(initialRemarks.length);
    };

    // small helper used by header to decide whether to show admin controls
    const headerIsAdmin = (user = currentUser) => {
        const u = user || currentUser;
        if (!u) return false;
        if (u.is_admin || u.isAdmin) return true;
        if (typeof u.role === "string" && /admin|administrator/i.test(u.role))
        return true;
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
        if (typeof u.role === "string" && /admin|administrator/i.test(u.role))
            return true;
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
        if (
            Array.isArray(u.roles) &&
            u.roles.some((r) => /admin/i.test(String(r)))
        )
            return true;
        if (Array.isArray(u.permissions) && u.permissions.includes("admin"))
            return true;
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

        // Show confirmation messages for remark changes
        const currentRemarksCount = editForm.remarks.filter(
            (r) => r && r.trim()
        ).length;
        if (currentRemarksCount > initialRemarksCount) {
            const added = currentRemarksCount - initialRemarksCount;
            alert(
            `Changes saved successfully. ${added} remark${
                added > 1 ? "s" : ""
            } added.`
            );
        } else if (currentRemarksCount < initialRemarksCount) {
            const removed = initialRemarksCount - currentRemarksCount;
            alert(
            `Changes saved successfully. ${removed} remark${
                removed > 1 ? "s" : ""
            } removed.`
            );
        } else {
            alert("Changes saved successfully.");
        }
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
        for (const a of activeAgreements)
        if (a.validity_period) s.add(String(a.validity_period));
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
        if (v !== null && v !== undefined && String(v).trim() !== "")
            s.add(String(v));
        }
        return Array.from(s).sort();
    }, [activeAgreements]);

    // derived options for country (from activeAgreements)
    const countryOptions = useMemo(() => {
        const s = new Set();
        for (const a of activeAgreements) {
        const c =
            a.country || a.country_name || a.countryName || a.location || "";
        if (c != null && String(c).trim() !== "") s.add(String(c).trim());
        }
        return Array.from(s).sort((x, y) => x.localeCompare(y));
    }, [activeAgreements]);

    // derived options for source (from activeAgreements)
    const sourceOptions = useMemo(() => {
        const s = new Set();
        for (const a of activeAgreements) {
        const source = a.source_unit || a.source || a.initiating_unit || "";
        if (source && String(source).trim() !== "") s.add(String(source).trim());
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
            if (!fields.some((f) => f && f.toString().toLowerCase().includes(q)))
                return false;
            }
            // apply partnership classification filter if set (check multiple possible fields)
            if (filterClassification) {
            const classific = (
                a.partnership_classification ??
                a.partnership_type ??
                a.partnershipClassification ??
                a.partnershipType ??
                ""
            ).toString();
            if (classific !== String(filterClassification)) return false;
            }
            // apply validity period filter if set
            if (filterValidityPeriod) {
            if (String(a.validity_period) !== String(filterValidityPeriod))
                return false;
            }
            // apply country filter: when not 'all', match selected country string
            if (filterCountryScope && filterCountryScope !== "all") {
            const selected = String(filterCountryScope).trim().toLowerCase();
            const country = String(a.country || "")
                .trim()
                .toLowerCase();
            if (!country || country !== selected) return false;
            }
            // apply source filter if set
            if (filterSource) {
            const source = a.source_unit || a.source || a.initiating_unit || "";
            if (String(source) !== String(filterSource)) return false;
            }
            return true;
        });
    }, [
        activeAgreements,
        filter,
        debouncedSearchQuery,
        filterClassification,
        filterValidityPeriod,
        filterCountryScope,
        filterSource,
    ]);

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

    // Ensure href has a protocol; allow protocol-relative and mailto
    const normalizeHref = (raw) => {
        if (!raw) return null;
        const s = String(raw).trim();
        if (/^(https?:|mailto:|tel:|\/\/)/i.test(s)) return s;
        return `https://${s}`;
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

    // Helper: return a brief profile string from an agreement object
    // Checks multiple common field names and handles possible shapes (string, array, object)
    const getBriefProfileFromAgreement = (a) => {
        if (!a) return null;
        const keys = [
        "brief_profile",
        "briefProfile",
        "brief",
        "summary",
        "description",
        "overview",
        "abstract",
        "profile",
        "short_profile",
        "shortProfile",
        "partner_profile",
        "organization_profile",
        "org_profile",
        ];

        for (const k of keys) {
        const val = a[k];
        if (val == null) continue;
        // If array, join text pieces
        if (Array.isArray(val)) {
            const joined = val
            .map((x) =>
                typeof x === "object"
                ? x.text || x.remark_text || x.remark || ""
                : String(x)
            )
            .map((s) => String(s || "").trim())
            .filter(Boolean)
            .join(" \n\n");
            if (joined) return joined;
            continue;
        }

        // If object, try to locate likely text fields
        if (typeof val === "object") {
            const candidates = [
            "text",
            "value",
            "brief",
            "summary",
            "description",
            "remark_text",
            "remark",
            ];
            for (const c of candidates) {
            if (val[c]) {
                const s = String(val[c]).trim();
                if (s) return s;
            }
            }
            // Fallback to JSON string if it looks useful
            try {
            const s = JSON.stringify(val);
            if (s && s !== "{}") return s;
            } catch (e) {}
            continue;
        }

        // If string, return trimmed text
        if (typeof val === "string") {
            const s = val.trim();
            if (s) return s;
        }
        }
        return null;
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

    // Normalize reportType for comparisons (select options may use mixed case)
    // Prefer the modal's generateDocType when present so the modal preview/count
    // updates when the user changes the Document Type select inside the modal.
    const reportKey = String(
        typeof generateDocType !== "undefined" && generateDocType
        ? generateDocType
        : reportType || ""
    ).toLowerCase();

    const reportItems = (() => {
        // Start from all agreements and apply document-type filter first
        let items = agreements.slice();

        if (reportKey === "mou") {
        items = items.filter(
            (a) =>
            String(a.document_type || a.documentType || "").toUpperCase() ===
            "MOU"
        );
        } else if (reportKey === "moa") {
        items = items.filter(
            (a) =>
            String(a.document_type || a.documentType || "").toUpperCase() ===
            "MOA"
        );
        } else if (reportKey === "linked") {
        items = items.filter((a) => Boolean(getLinkedId(a)));
        }

        // Apply status filter from the modal (if set). generateStatus is kept for
        // backward compatibility even if the UI control was removed.
        try {
        const statusKey = String(generateStatus || "")
            .trim()
            .toLowerCase();
        if (statusKey && statusKey !== "all") {
            items = items.filter((a) => {
            const s = String(a.agreement_status || a.status || "")
                .trim()
                .toLowerCase();
            // allow partial matches for flexible status naming
            return (
                s === statusKey ||
                s.replace(/\s+/g, "").includes(statusKey.replace(/\s+/g, ""))
            );
            });
        }
        } catch (e) {
        // if anything goes wrong, fall back to current items without status filtering
        console.warn("report status filter error", e);
        }

        // Apply Source Unit filter from the modal (if set)
        try {
        const sourceKey = String(generateSource || "").trim();
        if (sourceKey && sourceKey !== "All") {
            items = items.filter((a) => {
            const s = String(
                a.source_unit || a.source || a.initiating_unit || ""
            ).trim();
            return s === sourceKey;
            });
        }
        } catch (e) {
        console.warn("report source filter error", e);
        }

        return items;
    })();

    // Use shared report generation helpers
    const generatePrintableReport = () =>
        generatePrintableReportShared({
        items: reportItems,
        reportKey,
        reportLabelMap,
        allAgreements: agreements,
        getLinkedId,
        });

    const downloadCSV = () =>
        downloadCSVShared({
        items: reportItems,
        reportKey,
        getLinkedId,
        filenamePrefix: reportKey,
        allAgreements: agreements,
        });

    const downloadXLSX = () =>
        downloadXLSXShared({
        items: reportItems,
        reportKey,
        getLinkedId,
        filenamePrefix: reportKey,
        allAgreements: agreements,
        });

    if (error) {
        return <div className="overview-container">Error: {error}</div>;
    }

    if (loading) {
        return (
        <div className="dashboard-container active-agreements-page">
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
                <div
                    className="activeAgreement-card expiring"
                    role="button"
                    tabIndex={0}
                    onClick={goToExpiringSection}
                    onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") goToExpiringSection();
                    }}
                    aria-label={`Expiring soon: ${expiringSoon.length} agreements.`}
                >
                    <h4>Expiring Soon</h4>
                    <p className="count">{expiringSoon.length}</p>
                    <span>Within 90 days</span>
                </div>
                </div>

                {/* === Agreement Table Section === */}
                <div className="activeAgreement-table-section">
                <div className="table-controls">
                    {/* Top row: filter tabs (All / MOA / MOU / Linked) */}
                    <div
                    className="table-controls-top"
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        justifyContent: "flex-start",
                    }}
                    >
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

                    {/* Bottom row: search, filters button and generate */}
                    <div
                    className="table-controls-bottom"
                    style={{
                        marginTop: 12,
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                    >
                    <div
                        className="table-search-wrapper"
                        style={{ position: "relative", flex: 1 }}
                    >
                        <div
                        className="table-search"
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                        >
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
                        </div>
                    </div>

                    <div
                        style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                        <button
                        type="button"
                        className={`btn generate ${
                            showFilterPanel ? "active" : ""
                        }`}
                        onClick={() => setShowFilterPanel((v) => !v)}
                        aria-expanded={showFilterPanel}
                        >
                        <FiFilter className="filter-icon" />
                        Filters
                        </button>

                        {/* Generate Report */}
                        <button
                        type="button"
                        className={`btn generate ${
                            showGenerateModal ? "active" : ""
                        }`}
                        onClick={() => {
                            setShowGenerateModal(true);
                        }}
                        >
                        <FiPrinter className="icon" />
                        Generate Report
                        </button>
                    </div>
                    </div>
                </div>

                {/* Inline filter panel (rendered below search + tabs when open) */}
                {showFilterPanel && (
                    <div
                    className="overview1-filter-panel"
                    style={{ marginTop: 12 }}
                    >
                    {/* Header: Filter Agreements + close */}
                    <div className="overview1-panel-header">
                        <FiFilter className="panel-header-icon" />
                        <h4>Filter Agreements</h4>
                        <button
                        className="panel-close-btn"
                        onClick={() => setShowFilterPanel(false)}
                        aria-label="Close filter panel"
                        >
                        <FiX className="icon" />
                        </button>
                    </div>

                    <div
                        style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "12px",
                        padding: "16px",
                        }}
                    >
                        <div className="overview1-panel-field">
                        <label className="filter-label">
                            <FiTag className="filter-icon" /> Classification
                        </label>
                        <SearchableSelect
                            options={[
                            { value: "", label: "All" },
                            ...classificationOptions.map((c) => ({
                                value: c,
                                label: c,
                            })),
                            ]}
                            value={filterClassification}
                            onChange={(v) => {
                            setFilterClassification(v || "");
                            setCurrentPage(1);
                            }}
                            placeholder="All"
                            allowClear={false}
                        />
                        </div>

                        <div className="overview1-panel-field">
                        <label className="filter-label">
                            <FiClock className="filter-icon" /> Validity Period
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
                            value={filterValidityPeriod}
                            onChange={(v) => {
                            setFilterValidityPeriod(v || "");
                            setCurrentPage(1);
                            }}
                            placeholder="All"
                            allowClear={false}
                        />
                        </div>

                        <div className="overview1-panel-field">
                        <label className="filter-label">
                            <FiMapPin className="filter-icon" /> Country
                        </label>
                        <SearchableSelect
                            options={[
                            { value: "all", label: "All" },
                            ...countryOptions.map((c) => ({
                                value: c,
                                label: c,
                            })),
                            ]}
                            value={filterCountryScope}
                            onChange={(v) => {
                            setFilterCountryScope(v || "all");
                            setCurrentPage(1);
                            }}
                            placeholder="All"
                            allowClear={false}
                        />
                        </div>

                        <div className="overview1-panel-field">
                        <label className="filter-label">
                            <FiHome className="filter-icon" /> Source Unit
                        </label>
                        <SearchableSelect
                            options={[
                            { value: "", label: "All" },
                            ...sourceOptions.map((s) => ({
                                value: s,
                                label: s,
                            })),
                            ]}
                            value={filterSource}
                            onChange={(v) => {
                            setFilterSource(v || "");
                            setCurrentPage(1);
                            }}
                            placeholder="All"
                            allowClear={false}
                        />
                        </div>
                    </div>

                    <div className="overview1-filter-actions">
                        <button
                        className="btn clear"
                        onClick={() => {
                            setFilterClassification("");
                            setFilterValidityPeriod("");
                            setFilterCountryScope("all");
                            setFilterSource("");
                            setShowFilterPanel(false);
                            setCurrentPage(1);
                        }}
                        >
                        <FiXCircle className="btn-icon" />
                        Clear All
                        </button>
                        <button
                        className="btn apply"
                        onClick={() => setShowFilterPanel(false)}
                        >
                        <FiCheck className="btn-icon" />
                        Apply Filters
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
                        // Only consider linked MOAs as children. Exclude other MOUs or unrelated records.
                        const children = activeAgreements.filter(
                            (c) =>
                            String(
                                c.document_type || c.documentType || ""
                            ).toUpperCase() === "MOA" &&
                            (getLinkedId(c) === mid || c.linkedMouId === mid)
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
                                title="View Details"
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

                        {/* Add button for creating a new MOU (if user has permission) */}
                        {/* 'Create new MOU' action removed from Linked Agreements view per request */}
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
                                        title="More Actions"
                                    >
                                        <FiMoreVertical className="icon" />
                                    </button>

                                    {menuOpenId === (a.id || i) &&
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
                                            boxShadow:
                                                "0 8px 24px rgba(0,0,0,0.12)",
                                            padding: 6,
                                            minWidth: 160,
                                            }}
                                        >
                                            <button
                                            type="button"
                                            className="menu-item"
                                            role="menuitem"
                                            onClick={() => {
                                                handleViewLatestFile(
                                                a.dts_number ||
                                                    a.dtsNumber ||
                                                    a.dts_no ||
                                                    a.id
                                                );
                                                setMenuOpenId(null);
                                            }}
                                            >
                                            <FiFileText
                                                style={{ marginRight: 4 }}
                                            />{" "}
                                            View latest file
                                            </button>

                                            <button
                                            type="button"
                                            className="menu-item"
                                            role="menuitem"
                                            onClick={() => {
                                                // navigate in-app to docVer (no new tab)
                                                navigate(
                                                `/docVer?dts_number=${
                                                    a.dts_number ||
                                                    a.dtsNumber ||
                                                    a.dts_no ||
                                                    a.id
                                                }`
                                                );
                                                setMenuOpenId(null);
                                            }}
                                            >
                                            <FiArchive
                                                style={{ marginRight: 4 }}
                                            />{" "}
                                            View Older Files
                                            </button>
                                        </div>,
                                        document.body
                                        )}
                                    </div>
                                </div>
                                </td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    </div>
                )}

                {/* Pagination controls (rendered below the table) */}
                {filter !== "linked" && totalPages > 1 && (
                    <div className="pagination" style={{ marginTop: 12 }}>
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

                {/* Nearing Expiration Section */}
                <div
                className="activeAgreement-expiring"
                ref={expiringRef}
                tabIndex={-1}
                aria-label="Nearing expiration list"
                >
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

                {/* Report Generator (now shown in modal) */}
            </div>
            </div>
        </div>

        {/* Details modal */}
        {selectedAgreement && (
            <div
            className="overview1-modal-backdrop agreement-modal-backdrop"
            onClick={closeModal}
            >
            {/* Overview-styled modal to match OverviewDash design */}
            <div
                className="overview1-modal agreement-modal force-overview"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`Agreement details for ${
                selectedAgreement.name ||
                selectedAgreement.partnerName ||
                selectedAgreement.event_title ||
                "agreement"
                }`}
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
                        selectedAgreement.document_type ||
                        selectedAgreement.documentType ||
                        ""
                    ).toLowerCase()}`}
                    >
                    <FiFileText className="badge-icon" />
                    {selectedAgreement.document_type ||
                        selectedAgreement.documentType ||
                        "—"}
                    </span>
                    <h3 id="modal-title" className="modal-title white-title">
                    {selectedAgreement.name ||
                        selectedAgreement.partnerName ||
                        "Agreement Details"}
                    </h3>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {!isModalEdit && (
                    <>
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
                    </>
                    )}
                    <button
                    className="modal-close"
                    onClick={closeModal}
                    aria-label="Close"
                    >
                    <FiX className="icon" />
                    </button>
                </div>
                </div>

                <div className="overview1-modal-body agreement-modal-body">
                {!isModalEdit ? (
                    <>
                    {/* Details Summary Card with View File Actions */}
                    <div className="details-summary-card">
                        <div className="details-header">
                        <div className="details-icon-container">
                            <FiFileText className="details-main-icon" />
                        </div>
                        <div className="details-titles">
                            <div className="details-title">
                            {selectedAgreement.name ||
                                selectedAgreement.partnerName ||
                                "Agreement Details"}
                            </div>
                            <div className="details-sub">
                            {selectedAgreement.document_type ||
                                selectedAgreement.documentType ||
                                "—"}{" "}
                            •{" "}
                            {selectedAgreement.agreement_status ||
                                selectedAgreement.status ||
                                "Active"}
                            </div>
                        </div>
                        <div
                            className="file-actions"
                            style={{ marginLeft: "auto" }}
                        >
                            <button
                            className="btn action view-file"
                            onClick={() => handleViewLatestFile(selectedDts)}
                            title="View Latest File"
                            aria-label="View Latest File"
                            >
                            <FiEye className="icon" />
                            View File
                            </button>
                            <button
                            className="btn action older-files"
                            onClick={() => {
                                if (selectedDts)
                                navigate(
                                    `/docVer?dts_number=${encodeURIComponent(
                                    selectedDts
                                    )}`
                                );
                                else
                                alert(
                                    "No DTS number available for this agreement."
                                );
                            }}
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
                            {selectedAgreement.dts_number ||
                                selectedAgreement.dtsNumber}
                            </div>
                        </div>

                        <div>
                            <div className="label">
                            <FiFileText className="label-icon" />
                            Document Type
                            </div>
                            <div className="value">
                            {selectedAgreement.document_type ||
                                selectedAgreement.documentType ||
                                "—"}
                            </div>
                        </div>

                        <div>
                            <div className="label">
                            <FiCalendar className="label-icon" />
                            Date Received
                            </div>
                            <div className="value">
                            {selectedAgreement.date ||
                            selectedAgreement.date_received ||
                            selectedAgreement.date_signed
                                ? new Date(
                                    selectedAgreement.date ||
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
                            {selectedAgreement.source_unit ||
                                selectedAgreement.source ||
                                selectedAgreement.initiating_unit ||
                                "—"}
                            </div>
                        </div>

                        <div>
                            <div className="label">
                            <FiMapPin className="label-icon" />
                            Hardcopy Locator
                            </div>
                            <div className="value">
                            {selectedAgreement.hardcopy_location ||
                                selectedAgreement.hardcopyLocation ||
                                "—"}
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
                                selectedAgreement.agreement_status ||
                                    selectedAgreement.status ||
                                    "Active"
                                ).toLowerCase()}`}
                            >
                                {selectedAgreement.agreement_status ||
                                selectedAgreement.status ||
                                "Active"}
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
                        {getBriefProfileFromAgreement(selectedAgreement) || "—"}
                        </div>
                    </section>

                    <section className="modal-section partner">
                        <div className="section-header">
                        <FiTag className="header-icon" />
                        <h4>Partner Information</h4>
                        </div>
                        <div className="partner-top">
                        <div className="partner-logo">
                            {LogoSrc(
                            selectedAgreement.logo_path || selectedAgreement.logo
                            ) ? (
                            <img
                                src={LogoSrc(
                                selectedAgreement.logo_path ||
                                    selectedAgreement.logo
                                )}
                                alt={`${
                                selectedAgreement.name ||
                                selectedAgreement.partnerName
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
                                selectedAgreement.name ||
                                    selectedAgreement.partnerName
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
                                {selectedAgreement.name ||
                                    selectedAgreement.partnerName}
                                </div>
                            </div>
                            <div>
                                <div className="label">
                                <FiSettings className="label-icon" />
                                Entity Type
                                </div>
                                <div className="value">
                                {selectedAgreement.entity_type || "—"}
                                </div>
                            </div>
                            <div>
                                <div className="label">
                                <FiMapPin className="label-icon" />
                                Country
                                </div>
                                <div className="value">
                                {selectedAgreement.country || "—"}
                                </div>
                            </div>
                            <div>
                                <div className="label">
                                <FiMapPin className="label-icon" />
                                Region
                                </div>
                                <div className="value">
                                {selectedAgreement.region || "—"}
                                </div>
                            </div>
                            <div>
                                <div className="label">
                                <FiMapPin className="label-icon" />
                                Address
                                </div>
                                <div className="value">
                                {selectedAgreement.address || "—"}
                                </div>
                            </div>
                            <div>
                                <div className="label">
                                <FiLink className="label-icon" />
                                Website
                                </div>
                                <div className="value">
                                {(() => {
                                    const raw =
                                    getWebsiteFromAgreement(selectedAgreement);
                                    const href = normalizeHref(raw);
                                    if (!raw) return "—";
                                    return (
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                        color: "#3b82f6",
                                        textDecoration: "none",
                                        }}
                                    >
                                        {raw}
                                    </a>
                                    );
                                })()}
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </section>

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
                                selectedAgreement.point_persons_display ||
                                selectedAgreement.pointPerson ||
                                selectedAgreement.point_persons
                            )}
                            </div>
                            <div className="contact-org">
                            {selectedAgreement.source_unit ||
                                selectedAgreement.source ||
                                selectedAgreement.initiating_unit ||
                                "—"}
                            </div>
                            {pupEmail ? (
                            <a
                                className="contact-email"
                                href={`mailto:${pupEmail}`}
                            >
                                <FiMessageCircle className="inline-icon" />{" "}
                                {pupEmail}
                            </a>
                            ) : null}
                        </div>

                        <div className="contact-card alt">
                            <div className="contact-role">
                            <FiUsers className="inline-icon" /> Partner Contact
                            Person
                            </div>
                            <div className="contact-name">
                            {formatContactPersons(
                                selectedAgreement.contact_persons_display ||
                                selectedAgreement.contactPerson ||
                                selectedAgreement.contact_persons
                            )}
                            </div>
                            <div className="contact-org">
                            {selectedAgreement.name ||
                                selectedAgreement.partnerName ||
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

                    {/* ===== Linked MOU ===== */}
                    {linkedAgreement && (
                        <section className="modal-section linked-mou">
                        <div className="section-header">
                            <FiLink className="header-icon" />
                            <h4>Linked MOU</h4>
                        </div>

                        <div className="linked-mou-card">
                            <div className="linked-mou-left">
                            <span className="badge mou">MOU</span>
                            </div>

                            <div className="linked-mou-body">
                            <strong className="linked-mou-title">
                                {linkedAgreement.event_title ||
                                linkedAgreement.eventTitle ||
                                linkedAgreement.partner_name ||
                                linkedAgreement.name ||
                                "—"}
                            </strong>
                            <div className="linked-mou-sub">
                                {linkedAgreement.partnership_type ||
                                linkedAgreement.partnership_classification ||
                                linkedAgreement.partnershipClassification ||
                                "—"}
                            </div>
                            <div className="linked-mou-valid">
                                Valid until:{" "}
                                {linkedAgreement.date_expiry ||
                                linkedAgreement.expiry ||
                                linkedAgreement.expiryDate
                                ? new Date(
                                    linkedAgreement.date_expiry ||
                                        linkedAgreement.expiry ||
                                        linkedAgreement.expiryDate
                                    ).toLocaleDateString()
                                : "—"}
                            </div>
                            <div className="linked-mou-dts">
                                {linkedAgreement.dts_number ||
                                linkedAgreement.dts_no ||
                                linkedAgreement.dtsNumber ||
                                linkedAgreement.id ||
                                "—"}
                            </div>
                            </div>
                        </div>
                        </section>
                    )}

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
                            {selectedAgreement.date_signed ||
                            selectedAgreement.date_of_signing ||
                            selectedAgreement.dateOfSigning
                                ? new Date(
                                    selectedAgreement.date_signed ||
                                    selectedAgreement.date_of_signing ||
                                    selectedAgreement.dateOfSigning
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
                            {selectedAgreement.date_expiry ||
                            selectedAgreement.expiry ||
                            selectedAgreement.expiryDate
                                ? new Date(
                                    selectedAgreement.date_expiry ||
                                    selectedAgreement.expiry ||
                                    selectedAgreement.expiryDate
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
                            {selectedAgreement.validity_period ||
                            selectedAgreement.validityPeriod
                                ? `${
                                    selectedAgreement.validity_period ||
                                    selectedAgreement.validityPeriod
                                } years`
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
                                selectedAgreement.partnershipClassification ||
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
                        // Accept multiple possible shapes from the API:
                        // - selectedAgreement.signatories_list (array or string)
                        // - selectedAgreement.signatories (array or string)
                        // - selectedAgreement.signatories_text (string)
                        const raw =
                            selectedAgreement.signatories_list ??
                            selectedAgreement.signatories ??
                            selectedAgreement.signatories_text ??
                            selectedAgreement.signatoriesList ??
                            "";

                        let signatoriesText = "";
                        if (Array.isArray(raw)) {
                            // Map array items to readable strings (handle objects)
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
                        } else if (
                            typeof remarks === "string" &&
                            remarks.trim()
                        ) {
                            return <div className="value">{remarks}</div>;
                        }
                        return (
                            <div className="empty-state">
                            <FiMessageCircle className="empty-icon" />
                            <div className="empty-content">
                                <div className="empty-title">No remarks</div>
                                <div className="empty-sub">
                                Add remarks using Edit
                                </div>
                            </div>
                            </div>
                        );
                        })()}
                    </section>

                    {/* Admin Edit Button */}
                    {headerIsAdmin() && (
                        <div
                        className="modal-edit-actions"
                        style={{
                            marginTop: 24,
                            display: "flex",
                            justifyContent: "flex-end",
                        }}
                        >
                        <button
                            className="btn action edit"
                            onClick={startModalEdit}
                        >
                            <FiEdit className="icon" /> Edit
                        </button>
                        </div>
                    )}
                    </>
                ) : (
                    <div className="modal-edit-panel">
                    <div className="edit-section-header">
                        <FiEdit className="section-icon" />
                        <h4>Edit Agreement Details</h4>
                    </div>

                    <div className="edit-form-grid">
                        <div className="edit-field">
                        <label className="edit-label">
                            <FiMapPin className="label-icon" />
                            Hardcopy Locator
                        </label>
                        <input
                            className="edit-input"
                            type="text"
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

                        <div className="edit-field full-width">
                        <label className="edit-label">
                            <FiMessageCircle className="label-icon" />
                            Remarks
                        </label>
                        {Array.isArray(editForm.remarks) &&
                        editForm.remarks.length > 0 ? (
                            <>
                            {editForm.remarks.map((rm, idx) => (
                                <div key={idx} className="remark-item">
                                <input
                                    type="text"
                                    className="edit-input remark-input"
                                    value={rm}
                                    onChange={(e) =>
                                    updateEditRemark(idx, e.target.value)
                                    }
                                    placeholder="Enter remark"
                                />
                                <button
                                    className="btn-icon add"
                                    onClick={addEditRemark}
                                    title="Add remark"
                                    type="button"
                                >
                                    <FiPlus />
                                </button>
                                <button
                                    className="btn-icon remove"
                                    onClick={() => removeEditRemark(idx)}
                                    title="Remove remark"
                                    type="button"
                                >
                                    <FiTrash2 />
                                </button>
                                </div>
                            ))}
                            </>
                        ) : (
                            <div className="remark-item empty">
                            <button
                                className="btn-icon add"
                                onClick={addEditRemark}
                                title="Add remark"
                                type="button"
                            >
                                <FiPlus />
                            </button>
                            <span className="empty-text">
                                No remarks yet - click + to add
                            </span>
                            </div>
                        )}
                        </div>
                    </div>

                    <div className="edit-actions">
                        <button
                        className="btn cancel"
                        onClick={cancelModalEdit}
                        disabled={saving}
                        type="button"
                        >
                        <FiX className="icon" />
                        Cancel
                        </button>
                        <button
                        className="btn save"
                        onClick={saveModalEdits}
                        disabled={
                            saving ||
                            (editForm.hardcopy_location ===
                            initialEditForm.hardcopy_location &&
                            JSON.stringify(
                                editForm.remarks.filter((r) => r && r.trim())
                            ) ===
                                JSON.stringify(
                                initialEditForm.remarks.filter(
                                    (r) => r && r.trim()
                                )
                                ))
                        }
                        type="button"
                        >
                        <FiSave className="icon" />
                        {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                    </div>
                )}
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
                        <div className="report-title">
                        Agreement Report Generator
                        </div>
                        <div className="report-sub">
                        Generate comprehensive reports for agreements in Excel,
                        CSV or PDF
                        </div>
                    </div>
                    </div>

                    <div className="report-stats">
                    <div className="stat-item">
                        <div className="stat-label">Total Agreements</div>
                        <div className="stat-number">{reportItems.length}</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-label">Document Type</div>
                        <div className="stat-value">
                        {generateDocType === "All"
                            ? "All Agreements"
                            : generateDocType + " only"}
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
                            onChange={(e) => setGenerateDocType(e.target.value)}
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
                            <FiHome className="label-icon" />
                            Source Unit
                        </label>
                        <select
                            value={generateSource}
                            onChange={(e) => setGenerateSource(e.target.value)}
                            className="config-select"
                        >
                            <option value="All">All Sources</option>
                            {sourceOptions.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                            ))}
                        </select>
                        </div>

                        {/* Status filter removed per request */}
                    </div>
                    </div>

                    {/* Preview Section */}
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
                        information, and timeline data.
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
                                Comprehensive spreadsheet with all agreement details
                                and formatting
                            </div>
                            </div>
                        </div>
                        <button
                            className="btn export-btn excel-btn"
                            onClick={async () => {
                            try {
                                await downloadXLSX();
                            } catch (e) {
                                console.error(e);
                                alert(
                                "Failed to download Excel/CSV: " +
                                    (e?.message || e)
                                );
                            }
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
                    <FiX className="icon" /> Close
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
    };

    export default ActiveAgreement;
