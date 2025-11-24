
export function generatePrintableReport({
  items = [],
  reportKey = "all",
  reportLabelMap = {},
  allAgreements = [],
  getLinkedId = () => undefined,
} = {}) {
  const escapeHtml = (str = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const total = Array.isArray(items) ? items.length : 0;
  const activeCount = (items || []).filter((a) => {
    if (!a) return false;
    if (
      a.agreement_status === "Active" ||
      String(a.status).toLowerCase() === "active"
    )
      return true;
    if (!a.date_expiry) return true;
    const exp = new Date(a.date_expiry);
    return exp > new Date();
  }).length;
  const expiringCount = (items || []).filter((a) => {
    if (!a || !a.date_expiry) return false;
    const days = Math.ceil(
      (new Date(a.date_expiry) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 && days <= 90;
  }).length;

  const formatDateTime = (d) => new Date(d).toLocaleString();

  const renderCard = (r) => {
    const daysLeft =
      r && r.date_expiry
        ? Math.ceil(
            (new Date(r.date_expiry) - new Date()) / (1000 * 60 * 60 * 24)
          )
        : null;
    const docType = escapeHtml(r?.document_type || "");
    const title = escapeHtml(r?.event_title || r?.event || r?.title || "");
    const subtitle = escapeHtml(r?.partnership_type || r?.brief_profile || "");
    const partner = escapeHtml(r?.name || r?.partnerName || "");
    const country = escapeHtml(r?.country || "");
    const region = escapeHtml(r?.region || "");
    const address = escapeHtml(r?.address || r?.location || "");
    const formatContact = (c) => {
      if (!c) return "";

      const extractPerson = (o) => {
        if (!o || typeof o !== "object") return null;
        const keyMatch = (pattern) => {
          const re = new RegExp(pattern, "i");
          for (const k of Object.keys(o)) {
            try {
              if (re.test(k) && o[k]) return o[k];
            } catch (e) {
            }
          }
          return null;
        };

        const position = keyMatch(
          "(^|_)position$|role|title|point_person_position|contact_person_position"
        );
        const name = keyMatch(
          "(^|_)name$|full_name|fullName|displayName|point_person_name|contact_person_name"
        );
        const email = keyMatch(
          "email|email_address|point_person_email|contact_person_email"
        );

        if (position || name || email) {
          const parts = [];
          if (position) parts.push(String(position));
          if (name) parts.push(String(name));
          if (email) parts.push(String(email));
          return parts.join(" \u2022 "); 
        }

        const fallbackCandidates = [
          o.name,
          o.full_name,
          o.fullName,
          o.displayName,
          o.title,
          o.position,
          o.email,
          o.phone,
        ];
        for (const v of fallbackCandidates) {
          if (v) return String(v);
        }

        try {
          const s = JSON.stringify(o);
          return s.length > 0 ? s : null;
        } catch (e) {
          return null;
        }
      };

      if (typeof c === "string") return escapeHtml(c);

      if (Array.isArray(c)) {
        const parts = c
          .map((x) => (typeof x === "string" ? x : extractPerson(x) || ""))
          .filter(Boolean);
        return escapeHtml(parts.join(" | "));
      }

      if (typeof c === "object") {
        const res = extractPerson(c);
        return escapeHtml(res || "");
      }

      return escapeHtml(String(c));
    };

    const pupContact = formatContact(
      r?.point_persons || r?.pointPerson || r?.point_person || r?.pup_contact
    );
    const partnerContact = formatContact(
      r?.contact_persons ||
        r?.contactPerson ||
        r?.contact_person ||
        r?.partner_contact
    );
    const dateSigning = r?.date_signed
      ? escapeHtml(new Date(r.date_signed).toLocaleDateString())
      : "";
    const dateExpiry = r?.date_expiry
      ? escapeHtml(new Date(r.date_expiry).toLocaleDateString())
      : "";
    const validity = escapeHtml(r?.validity_period || "");
    const organizationTypeRaw =
      r?.organization_type ||
      r?.entity_type ||
      r?.entityType ||
      r?.organizationType ||
      r?.org_type ||
      "";
    const dts = escapeHtml(r?.dts_number || r?.dtsNumber || "");
    const entryDate = r?.entry_date
      ? escapeHtml(new Date(r.entry_date).toLocaleDateString())
      : escapeHtml(
          r?.created_at ? new Date(r.created_at).toLocaleDateString() : ""
        );
    const hardcopy = escapeHtml(
      r?.hardcopy_location || r?.hardcopyLocator || ""
    );
    const website = escapeHtml(r?.website || r?.website_url || r?.url || "");
    const getBriefText = (obj) => {
      if (!obj) return "";
      const candidates = [
        obj.brief_profile,
        obj.brief,
        obj.summary,
        obj.description,
        obj.overview,
        obj.partnership_type,
        obj.purpose,
        obj.event_description,
      ];
      for (const v of candidates) {
        if (!v) continue;
        if (typeof v === "string") return v;
        if (Array.isArray(v)) return v.join("\n\n");
        try {
          return JSON.stringify(v);
        } catch (e) {
          return String(v);
        }
      }
      return "";
    };

    const brief = escapeHtml(getBriefText(r));
    const remarksArr = (function normalizeRemarks(rr) {
      if (!rr) return [];
      if (Array.isArray(rr))
        return rr
          .map((x) =>
            typeof x === "object"
              ? x.remark_text || x.text || x.remark || JSON.stringify(x)
              : String(x)
          )
          .filter(Boolean);
      if (typeof rr === "string")
        return rr
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);
      return [];
    })(r?.remarks);

    const remarksHtml =
      remarksArr.length > 0
        ? `<div class="remarks"><ul>${remarksArr
            .map((x) => `<li>${escapeHtml(String(x))}</li>`)
            .join("")}</ul></div>`
        : "";

    const typeKey = String(r?.document_type || "").toUpperCase();
    const accentColor =
      typeKey === "MOA" ? "#2f6de0" : typeKey === "MOU" ? "#7a1f2d" : "#2f6de0";
    const statusBg = (r?.agreement_status || r?.status || "")
      .toLowerCase()
      .includes("active")
      ? "#e8f7ea"
      : "#f3f4f6";
    const statusColor = (r?.agreement_status || r?.status || "")
      .toLowerCase()
      .includes("active")
      ? "#2a8a2a"
      : "#333";
    const rawLogo =
      r?.logo_path ||
      r?.logo ||
      r?.partner_logo ||
      r?.logo_url ||
      r?.partnerLogo ||
      "";
    let logoSrc = "";
    try {
      if (rawLogo && typeof rawLogo === "string") {
        if (rawLogo.startsWith("data:image")) {
          logoSrc = rawLogo;
        } else if (rawLogo.startsWith("iVBORw0")) {
          logoSrc = `data:image/png;base64,${rawLogo}`;
        } else if (rawLogo.startsWith("/9j/")) {
          logoSrc = `data:image/jpeg;base64,${rawLogo}`;
        } else if (
          rawLogo.startsWith("http://") ||
          rawLogo.startsWith("https://")
        ) {
          logoSrc = rawLogo;
        } else if (rawLogo.startsWith("/")) {
          try {
            const origin =
              (window && window.location && window.location.origin) || "";
            logoSrc = `${origin.replace(/\/$/, "")}/${rawLogo.replace(
              /^\/+/,
              ""
            )}`;
          } catch (e) {
            logoSrc = rawLogo;
          }
        } else {
          logoSrc = rawLogo;
        }
      }
    } catch (e) {
      console.warn("logo src parse error", e, rawLogo);
      logoSrc = rawLogo || "";
    }
    const logoSrcEsc = escapeHtml(logoSrc || "");

    return `
      <div class="report-card">
        <div class="card-header" style="border-left:6px solid ${accentColor};">
          <div style="display:flex;align-items:center;gap:12px;flex:1">
            <div style="display:flex;flex-direction:column;align-items:flex-start">
              <span class="badge type" style="background:${accentColor}">${docType}</span>
              <small class="dts-small">${escapeHtml(
                r?.dts_number || ""
              )}</small>
            </div>
            <div style="flex:1;padding-left:12px">
              <h2 class="card-title" style="margin:0">${title}</h2>
              ${subtitle ? `<div class="card-sub">${subtitle}</div>` : ""}
            </div>
            <div style="text-align:right;min-width:220px">
              <div class="status-pill" style="background:${statusBg};color:${statusColor};">${escapeHtml(
      r?.agreement_status || r?.status || ""
    )}${
      daysLeft !== null && !isNaN(daysLeft) ? ` - ${daysLeft} days left` : ""
    }</div>
              <div class="small-muted" style="margin-top:6px">${entryDate}</div>
            </div>
          </div>
        </div>

        <div class="card-grid">
          <div class="card-col">
            <div class="section-box">
              <h4 class="section-title">Document Details</h4>
              <div class="doc-grid">
                <div class="doc-item"><div class="label">DTS Number</div><div class="value">${dts}</div></div>
                <div class="doc-item"><div class="label">Expiry Date</div><div class="value">${
                  dateExpiry || "-"
                }</div></div>

                <div class="doc-item"><div class="label">Entry Date</div><div class="value">${entryDate}</div></div>
                <div class="doc-item"><div class="label">Hardcopy Location</div><div class="value">${hardcopy}</div></div>

                <div class="doc-item"><div class="label">Website</div><div class="value"><a href="${website}" target="_blank" rel="noopener">${website}</a></div></div>
                <div class="doc-item"><div class="label">Source</div><div class="value">${escapeHtml(
                  r?.source_unit || r?.source || r?.initiating_unit || "-"
                )}</div></div>
              </div>
            </div>

          <div class="card-col">
            <div class="section-box partner-box">
              <h4 class="section-title">Partner Information</h4>
              <div class="doc-grid">
                <div class="doc-item">
                  <div class="label">Partner</div>
                  <div class="value"><div style="display:flex;align-items:center;gap:12px"><div style="min-width:64px">${
                    logoSrc
                      ? `<img src="${logoSrcEsc}" class="partner-logo" alt="logo" onerror="this.style.display='none'"/>`
                      : `<div class="partner-logo placeholder"></div>`
                  }</div><div style="min-width:0"><div style="font-weight:700">${partner}</div><div class="muted">${region} ${
      country ? `• ${country}` : ""
    }</div></div></div></div>
                </div>

                <div class="doc-item">
                  <div class="label">Organization Type</div>
                  <div class="value">${escapeHtml(
                    organizationTypeRaw || "-"
                  )}</div>
                </div>

                <div class="doc-item">
                  <div class="label">Address</div>
                  <div class="value">${address || "-"}</div>
                </div>

                <div class="doc-item">
                  <div class="label">Website</div>
                  <div class="value"><a href="${website}" target="_blank" rel="noopener">${website}</a></div>
                </div>
              </div>
            </div>

            <div class="section-box" style="margin-top:12px">
              <h4 class="section-title">Contact Information</h4>
              <div class="label">PUP Point Person</div><div class="value">${
                pupContact || "-"
              }</div>
              <div class="label" style="margin-top:8px">Partner Contact</div><div class="value">${
                partnerContact || "-"
              }</div>
            </div>
          </div>

          <div class="card-col">
            <div class="section-box">
              <h4 class="section-title">Agreement Timeline</h4>
              <div class="label">Date of Signing</div><div class="value">${
                dateSigning || "-"
              }</div>
              <div class="label" style="margin-top:8px">Expiry Date</div><div class="value">${
                dateExpiry || "-"
              }</div>
              <div class="label" style="margin-top:8px">Validity Period</div><div class="value">${
                validity || "-"
              }</div>
            </div>

             <div class="section-box" style="margin-top:12px">
              <h4 class="section-title">Brief Profile</h4>
              <div class="brief">${brief}</div>
            </div>
          </div>

            <div class="section-box" style="margin-top:12px">
              <h4 class="section-title">Remarks</h4>
              ${remarksHtml || `<div class="value">-</div>`}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const cardsHtml = (items || []).map((it) => renderCard(it)).join("");

  const html = `
    <html>
      <head>
        <title>${escapeHtml(
          reportLabelMap[reportKey] || reportLabelMap.all || "Agreements Report"
        )}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial;padding:20px;color:#111;background:#fff;line-height:1.35}
          .report-header{text-align:center;margin-bottom:8px}
          .report-header h1{color:#1f4db3;margin:0;font-size:22px;font-weight:700}
          .report-header p{margin:6px 0 0;color:#6b7280}
          .rule{height:3px;background:#1f4db3;margin:16px 0;border-radius:2px}
          .summary{background:#fbfdff;border:1px solid #e8eef8;padding:14px;border-radius:8px;max-width:100%;margin-bottom:18px;box-shadow:0 1px 0 rgba(0,0,0,0.02)}
          .summary div{margin-bottom:6px}
          .report-card{border:1px solid #e9eef6;border-radius:8px;padding:16px;margin:12px 0;background:#fff;box-shadow:0 4px 14px rgba(28,44,70,0.04)}
          .card-header{display:flex;gap:8px;align-items:center;margin-bottom:12px}
          .badge.type{background:#2f6de0;color:#fff;padding:6px 10px;border-radius:8px;font-weight:700;font-size:12px;display:inline-block}
          .dts-small{color:#556;font-size:12px;margin-top:6px}
          .card-title{color:#0f3f91;margin:6px 0;font-size:18px;font-weight:700}
          .card-sub{color:#6b7280;margin-top:6px}
          .card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;align-items:start}
          .card-col{min-width:0}
          .section-box{background:#fbfcff;border:1px solid #eef2f8;padding:14px;border-radius:8px}
          /* Layout: make timeline and simple label/value sections two-column while keeping nested grids full-width */
          .section-box{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
          .section-box > .section-title{grid-column:1 / -1}
          .section-box > .doc-grid, .section-box > .brief, .section-box > .partner-box, .section-box > .remarks{grid-column:1 / -1}
          .section-title{font-size:13px;margin:0 0 8px 0;display:flex;align-items:center;color:#1f2937}
          .doc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
          .doc-item .label{font-size:11px;color:#667;font-weight:700;margin-bottom:6px;text-transform:uppercase}
          .doc-item .value{font-size:14px;color:#111}
          .value a{color:#1f4db3;text-decoration:none}
          .partner-logo{width:72px;height:72px;object-fit:cover;border-radius:8px;background:#fff;border:1px solid #eef2f6}
          .partner-logo.placeholder{width:72px;height:72px;border-radius:8px;background:linear-gradient(180deg,#f3f6fb,#fff);border:1px solid #eef2f6}
          .label{font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase}
          .small-muted{font-size:12px;color:#6b7280}
          .brief{font-size:14px;color:#111;white-space:pre-wrap;margin-top:6px}
          .status-pill{display:inline-block;padding:8px 14px;border-radius:999px;font-weight:700;font-size:13px;box-shadow:0 2px 10px rgba(31,64,128,0.06)}
          .remarks ul{margin:8px 0 0 18px;padding:0}
          .remarks li{margin-bottom:6px;font-size:13px;color:#222}
          @media (max-width:1200px){ .card-grid{grid-template-columns:1fr 1fr;gap:14px} }
          @media (max-width:900px){ .card-grid{grid-template-columns:1fr} .doc-grid{grid-template-columns:repeat(1,1fr)} }
          @media print{ body{padding:8px} .report-card{page-break-inside:avoid} }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>${escapeHtml(
            reportLabelMap[reportKey] ||
              reportLabelMap.all ||
              "Complete Agreements Report"
          )}</h1>
          <p>Polytechnic University of the Philippines - Agreement Management System</p>
        </div>
        <div class="rule"></div>

        <div class="report-container">
        <div class="summary">
          <div><strong>Report Generated:</strong> ${escapeHtml(
            formatDateTime(new Date())
          )}</div>
          <div><strong>Total Agreements:</strong> ${total}</div>
          <div><strong>Active Agreements:</strong> ${activeCount}</div>
          <div><strong>Expiring Soon:</strong> ${expiringCount}</div>
        </div>

        ${cardsHtml}
        </div>

        <script>
          (function(){
            function doPrint(){
              try{ window.print(); }catch(e){}
            }
            const imgs = Array.from(document.images || []);
            if(imgs.length === 0){
              // no images, print immediately
              window.addEventListener('load', doPrint);
              return;
            }
            const promises = imgs.map(img => new Promise(res => {
              if(img.complete) return res();
              img.addEventListener('load', res);
              img.addEventListener('error', res);
              // safety timeout in case load hangs
              setTimeout(res, 2000);
            }));
            Promise.all(promises).then(() => {
              setTimeout(doPrint, 120);
            });
          })();
        </script>
      </body>
    </html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("Unable to open print window. Please allow popups for this site.");
    return;
  }
  w.document.write(html);
  w.document.close();
}

export function downloadCSV({
  items = [],
  reportKey = "all",
  getLinkedId = () => "",
  filenamePrefix = null,
  allAgreements = [],
} = {}) {
  const safeCsv = (v = "") => {
    const s = String(v ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const getBriefText = (obj) => {
    if (!obj) return "";
    const candidates = [
      obj.brief_profile,
      obj.brief,
      obj.summary,
      obj.description,
      obj.overview,
      obj.partnership_type,
      obj.purpose,
      obj.event_description,
    ];
    for (const v of candidates) {
      if (!v) continue;
      if (typeof v === "string") return v;
      if (Array.isArray(v)) return v.join("\n\n");
      try {
        return JSON.stringify(v);
      } catch (e) {
        return String(v);
      }
    }
    return "";
  };

  const formatRemarks = (rr) => {
    if (!rr) return "";
    if (Array.isArray(rr))
      return rr
        .map((x) =>
          typeof x === "object"
            ? x.remark_text || x.text || x.remark || JSON.stringify(x)
            : String(x)
        )
        .filter(Boolean)
        .join(" | ");
    if (typeof rr === "string") return rr.trim();
    return String(rr);
  };

  const formatContactCSV = (c) => {
    if (!c) return "";
    if (typeof c === "string") return c;
    if (Array.isArray(c)) {
      return c
        .map((it) => {
          if (!it) return "";
          if (typeof it === "string") return it;
          return (
            it.point_person_name ||
            it.contact_person_name ||
            it.name ||
            it.full_name ||
            it.displayName ||
            (it.email ? `${it.email}` : "") ||
            JSON.stringify(it)
          );
        })
        .filter(Boolean)
        .join(" | ");
    }
    if (typeof c === "object")
      return (
        c.point_person_name ||
        c.contact_person_name ||
        c.name ||
        c.full_name ||
        c.displayName ||
        c.email ||
        JSON.stringify(c)
      );
    return String(c);
  };

  const headers = [
    "DocumentType",
    "DTSNumber",
    "Title",
    "PartnershipType",
    "PartnerName",
    "OrganizationType",
    "Country",
    "Region",
    "Address",
    "Website",
    "SourceUnit",
    "DateOfSigning",
    "EntryDate",
    "ExpiryDate",
    "ValidityPeriod",
    "Status",
    "DaysLeft",
    "LinkedMouId",
    "PUPPointPerson",
    "PartnerContact",
    "BriefProfile",
    "Remarks",
    "HardcopyLocation",
  ];

  const csvRows = [headers.join(",")];

  (items || []).forEach((r) => {
    const docType = r?.document_type || r?.documentType || "";
    const dts =
      r?.dts_number ||
      r?.dtsNumber ||
      r?.dts_no ||
      r?.id ||
      r?.agreement_id ||
      "";
    const title = r?.event_title || r?.event || r?.title || "";
    const partnership =
      r?.partnership_type ||
      r?.partnership_classification ||
      r?.partnershipType ||
      "";
    const partner = r?.name || r?.partnerName || "";
    const organizationType =
      r?.organization_type ||
      r?.entity_type ||
      r?.entityType ||
      r?.organizationType ||
      r?.org_type ||
      "";
    const country = r?.country || r?.country_name || r?.countryName || "";
    const region = r?.region || "";
    const address = r?.address || r?.location || "";
    const website = r?.website || r?.website_url || r?.url || "";
    const source = r?.source_unit || r?.source || r?.initiating_unit || "";
    const dateSigned = r?.date_signed || r?.dateOfSigning || r?.date || "";
    const entryDate = r?.entry_date || r?.created_at || "";
    const expiryDate = r?.date_expiry || r?.expiryDate || r?.expiry || "";
    const validity = r?.validity_period || r?.validityPeriod || "";
    const status = r?.agreement_status || r?.status || "";
    const daysLeft = expiryDate
      ? Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      : "";
    const linked =
      getLinkedId(r) ||
      r?.linked_mou ||
      r?.linked_mou_id ||
      r?.linkedMouId ||
      "";
    const pup = formatContactCSV(
      r?.point_persons ||
        r?.pointPerson ||
        r?.point_person ||
        r?.point_persons_display ||
        r?.pointPersonDisplay
    );
    const partnerContact = formatContactCSV(
      r?.contact_persons ||
        r?.contactPerson ||
        r?.contact_person ||
        r?.contact_persons_display ||
        r?.contactPersonDisplay
    );
    const brief = getBriefText(r) || "";
    const remarks = formatRemarks(r?.remarks);
    const hardcopy = r?.hardcopy_location || r?.hardcopyLocator || "";

    const row = [
      safeCsv(docType),
      safeCsv(dts),
      safeCsv(title),
      safeCsv(partnership),
      safeCsv(partner),
      safeCsv(organizationType),
      safeCsv(country),
      safeCsv(region),
      safeCsv(address),
      safeCsv(website),
      safeCsv(source),
      safeCsv(dateSigned),
      safeCsv(entryDate),
      safeCsv(expiryDate),
      safeCsv(validity),
      safeCsv(status),
      safeCsv(daysLeft),
      safeCsv(linked),
      safeCsv(pup),
      safeCsv(partnerContact),
      safeCsv(brief),
      safeCsv(remarks),
      safeCsv(hardcopy),
    ];

    csvRows.push(row.join(","));
  });

  const csvString = csvRows.join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix || reportKey || "all"}-agreements-report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadXLSX({
  items = [],
  reportKey = "all",
  getLinkedId = () => "",
  filenamePrefix = null,
  allAgreements = [],
} = {}) {
  try {
    const excelModule = await import("exceljs");
    const ExcelJS = excelModule.default || excelModule;

    const rows = (items || []).map((r) => {
      const docType = r?.document_type || r?.documentType || "";
      const dts =
        r?.dts_number ||
        r?.dtsNumber ||
        r?.dts_no ||
        r?.id ||
        r?.agreement_id ||
        "";
      const title = r?.event_title || r?.event || r?.title || "";
      const partnership =
        r?.partnership_type ||
        r?.partnership_classification ||
        r?.partnershipType ||
        "";
      const partner = r?.name || r?.partnerName || "";
      const organizationType =
        r?.organization_type ||
        r?.entity_type ||
        r?.entityType ||
        r?.organizationType ||
        r?.org_type ||
        "";
      const country = r?.country || r?.country_name || r?.countryName || "";
      const region = r?.region || "";
      const address = r?.address || r?.location || "";
      const website = r?.website || r?.website_url || r?.url || "";
      const source = r?.source_unit || r?.source || r?.initiating_unit || "";
      const dateSigned = r?.date_signed || r?.dateOfSigning || r?.date || "";
      const entryDate = r?.entry_date || r?.created_at || "";
      const expiryDate = r?.date_expiry || r?.expiryDate || r?.expiry || "";
      const validity = r?.validity_period || r?.validityPeriod || "";
      const status = r?.agreement_status || r?.status || "";
      const daysLeft = expiryDate
        ? Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
        : "";
      const linked =
        getLinkedId(r) ||
        r?.linked_mou ||
        r?.linked_mou_id ||
        r?.linkedMouId ||
        "";

      const formatContact = (c) => {
        if (!c) return "";
        if (typeof c === "string") return c;
        if (Array.isArray(c))
          return c
            .map((it) => {
              if (!it) return "";
              if (typeof it === "string") return it;
              return (
                it.point_person_name ||
                it.contact_person_name ||
                it.name ||
                it.full_name ||
                it.displayName ||
                (it.email ? `${it.email}` : "") ||
                JSON.stringify(it)
              );
            })
            .filter(Boolean)
            .join(" | ");
        if (typeof c === "object")
          return (
            c.point_person_name ||
            c.contact_person_name ||
            c.name ||
            c.full_name ||
            c.displayName ||
            c.email ||
            JSON.stringify(c)
          );
        return String(c);
      };

      const pup = formatContact(
        r?.point_persons ||
          r?.pointPerson ||
          r?.point_person ||
          r?.point_persons_display ||
          r?.pointPersonDisplay
      );
      const partnerContact = formatContact(
        r?.contact_persons ||
          r?.contactPerson ||
          r?.contact_person ||
          r?.contact_persons_display ||
          r?.contactPersonDisplay
      );

      const getBrief = (obj) => {
        if (!obj) return "";
        const candidates = [
          obj.brief_profile,
          obj.brief,
          obj.summary,
          obj.description,
          obj.overview,
          obj.partnership_type,
          obj.purpose,
          obj.event_description,
        ];
        for (const v of candidates) {
          if (!v) continue;
          if (typeof v === "string") return v;
          if (Array.isArray(v)) return v.join("\n\n");
          try {
            return JSON.stringify(v);
          } catch (e) {
            return String(v);
          }
        }
        return "";
      };

      const getRemarks = (rr) => {
        if (!rr) return "";
        if (Array.isArray(rr))
          return rr
            .map((x) =>
              typeof x === "object"
                ? x.remark_text || x.text || x.remark || JSON.stringify(x)
                : String(x)
            )
            .filter(Boolean)
            .join(" | ");
        if (typeof rr === "string") return rr.trim();
        return String(rr);
      };

      return {
        DocumentType: docType,
        DTSNumber: dts,
        Title: title,
        PartnershipType: partnership,
        PartnerName: partner,
        OrganizationType: organizationType,
        Country: country,
        Region: region,
        Address: address,
        Website: website,
        SourceUnit: source,
        DateOfSigning: dateSigned,
        EntryDate: entryDate,
        ExpiryDate: expiryDate,
        ValidityPeriod: validity,
        Status: status,
        DaysLeft: daysLeft,
        LinkedMouId: linked,
        PUPPointPerson: pup,
        PartnerContact: partnerContact,
        BriefProfile: getBrief(r),
        Remarks: getRemarks(r?.remarks),
        HardcopyLocation: r?.hardcopy_location || r?.hardcopyLocator || "",
      };
    });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Agreements");

    // Define headers 
    const headers = [
      "DocumentType",
      "DTSNumber",
      "Title",
      "PartnershipType",
      "PartnerName",
      "OrganizationType",
      "Country",
      "Region",
      "Address",
      "Website",
      "SourceUnit",
      "DateOfSigning",
      "EntryDate",
      "ExpiryDate",
      "ValidityPeriod",
      "Status",
      "DaysLeft",
      "LinkedMouId",
      "PUPPointPerson",
      "PartnerContact",
      "BriefProfile",
      "Remarks",
      "HardcopyLocation",
    ];

    ws.columns = headers.map((h) => ({
      header: h,
      key: h,
      width: Math.max(12, h.length + 4),
    }));

    // Add rows
    for (const r of rows) {
      ws.addRow(r);
    }

    // Wrap long text
    ws.eachRow({ includeEmpty: false }, function (row) {
      row.eachCell({ includeEmpty: true }, function (cell) {
        if (typeof cell.value === "string" && cell.value.length > 120) {
          cell.alignment = { wrapText: true };
        }
      });
    });

    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${
      filenamePrefix || reportKey || "all"
    }-agreements-report.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  } catch (err) {
    console.warn("ExcelJS export failed or library not installed:", err);
    alert(
      "XLSX export requires the 'exceljs' package. Falling back to CSV. Install with: npm install exceljs"
    );
    try {
      downloadCSV({
        items,
        reportKey,
        getLinkedId,
        filenamePrefix,
        allAgreements,
      });
    } catch (e) {
      console.error("Fallback CSV failed:", e);
    }
  }
}

const ReportGen = { generatePrintableReport, downloadCSV, downloadXLSX };
export default ReportGen;