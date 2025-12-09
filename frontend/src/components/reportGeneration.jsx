export function generatePrintableReport({
  items = [],
  reportKey = "all",
  reportLabelMap = {},
  allAgreements = [],
  getLinkedId = () => undefined,
  wuriLogo = null,
} = {}) {
  const escapeHtml = (str = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const total = Array.isArray(items) ? items.length : 0;

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
            } catch (e) {}
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
            <div style="display:flex;flex-direction:column;align-items:flex-start;gap:2px">
              <span class="badge type" style="background:${accentColor}">${docType}</span>
              <small class="dts-small">${escapeHtml(
                r?.dts_number || ""
              )}</small>
            </div>
            <div style="flex:1;padding-left:6px">
              <h2 class="card-title" style="margin:0">${title}</h2>
              ${subtitle ? `<div class="card-sub">${subtitle}</div>` : ""}
            </div>
            <div style="text-align:right;min-width:140px">
              <div class="status-pill" style="background:${statusBg};color:${statusColor};">${escapeHtml(
      r?.agreement_status || r?.status || ""
    )}${daysLeft !== null && !isNaN(daysLeft) ? ` - ${daysLeft}d` : ""}</div>
              <div class="small-muted" style="margin-top:2px">${entryDate}</div>
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
                  <div class="value"><div style="display:flex;align-items:center;gap:6px"><div style="min-width:40px">${
                    logoSrc
                      ? `<img src="${logoSrcEsc}" class="partner-logo" alt="logo" onerror="this.style.display='none'"/>`
                      : `<div class="partner-logo placeholder"></div>`
                  }</div><div style="min-width:0"><div style="font-weight:700;font-size:9px">${partner}</div><div class="muted" style="font-size:8px">${region} ${
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

            <div class="section-box" style="margin-top:6px">
              <h4 class="section-title">Contact Information</h4>
              <div class="label">PUP Point Person</div><div class="value">${
                pupContact || "-"
              }</div>
              <div class="label" style="margin-top:4px">Partner Contact</div><div class="value">${
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
              <div class="label" style="margin-top:4px">Expiry Date</div><div class="value">${
                dateExpiry || "-"
              }</div>
              <div class="label" style="margin-top:4px">Validity Period</div><div class="value">${
                validity || "-"
              }</div>
            </div>

             <div class="section-box" style="margin-top:6px">
              <h4 class="section-title">Brief Profile</h4>
              <div class="brief">${brief}</div>
            </div>
          </div>

            <div class="section-box" style="margin-top:6px">
              <h4 class="section-title">Remarks</h4>
              ${remarksHtml || `<div class="value">-</div>`}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const origin =
    (typeof window !== "undefined" &&
      window.location &&
      window.location.origin) ||
    "";

  const buildAbsoluteUrl = (path) => {
    if (!origin) return path;
    return `${origin}${path.startsWith("/") ? path : "/" + path}`;
  };

  const pupLogoUrl = buildAbsoluteUrl("/pup-logo.png");
  const bagongPilipinasLogoUrl = buildAbsoluteUrl("/Bagong_Pilipinas_logo.png");

  const encodeSpacesOnce = (url = "") =>
    url.includes("%20") ? url : url.replace(/\s/g, "%20");

  // WURI logo defaults to encoded public file to avoid space-loading issues
  let wuriLogoUrl = buildAbsoluteUrl("/wurilogo%20(1).jpg");
  if (wuriLogo) {
    if (wuriLogo.startsWith("data:image")) {
      wuriLogoUrl = wuriLogo;
    } else if (
      wuriLogo.includes(".png") ||
      wuriLogo.includes(".jpg") ||
      wuriLogo.includes(".jpeg")
    ) {
      if (wuriLogo.startsWith("/static/")) {
        wuriLogoUrl = encodeSpacesOnce(origin + wuriLogo);
      } else if (wuriLogo.startsWith("/")) {
        wuriLogoUrl = encodeSpacesOnce(buildAbsoluteUrl(wuriLogo));
      } else {
        wuriLogoUrl = encodeSpacesOnce(buildAbsoluteUrl("/" + wuriLogo));
      }
    } else if (
      wuriLogo.startsWith("http://") ||
      wuriLogo.startsWith("https://")
    ) {
      wuriLogoUrl = encodeSpacesOnce(wuriLogo);
    } else {
      wuriLogoUrl = `data:image/png;base64,${wuriLogo}`;
    }
  }

  const safeWuriLogoUrl = encodeSpacesOnce(wuriLogoUrl);

  console.log("Report Generation - Logo URLs:", {
    pupLogoUrl,
    bagongPilipinasLogoUrl,
    wuriLogoUrl,
    safeWuriLogoUrl,
    origin,
    wuriLogoInput: wuriLogo || "none",
  });

  const headerHtml = `
    <div class="report-header">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px dotted #999;">
        <div style="display:flex;align-items:center;gap:8px;flex:1">
          <img src="${pupLogoUrl}" alt="PUP Logo" style="height:35px;width:auto;flex-shrink:0" onerror="this.src='/pup-logo.png'" />
          <div style="text-align:left;min-width:0">
            <p style="margin:0;font-size:8px;color:#333;letter-spacing:0.3px">Republic of the Philippines</p>
            <h1 style="margin:1px 0;font-size:11px;font-weight:700;color:#000;letter-spacing:0.2px">POLYTECHNIC UNIVERSITY OF THE PHILIPPINES</h1>
            <p style="margin:0;font-size:8px;color:#333">Office of the President</p>
            <h2 style="margin:1px 0;font-size:9px;font-weight:700;color:#000;letter-spacing:0.2px">OFFICE OF INTERNATIONAL AFFAIRS</h2>
          </div>
        </div>
        <img src="${bagongPilipinasLogoUrl}" alt="Bagong Pilipinas Logo" style="height:35px;width:auto;flex-shrink:0" onerror="this.src='/Bagong_Pilipinas_logo.png'" />
      </div>
    </div>
    <div class="rule"></div>
  `;

  const summaryHtml = `
    <div class="summary">
      <div><strong>Total Agreements:</strong> ${total}</div>
    </div>
  `;

  const footerHtml = `
    <div class="report-footer">
      <div class="footer-left">
        <div>PUP A. Mabini Campus, Anonas Street, Sta. Mesa, Manila 1016</div>
        <div>Direct Line: 5335-1752 | Trunk Line: 5335-1787 or 5335-1777 local 622</div>
        <div>Website: www.pup.edu.ph | Email: yourofficeemail@pup.edu.ph</div>
        <div style="margin-top:4px;font-weight:700;font-size:8px">THE COUNTRY'S 1<sup>st</sup> POLYTECHNICU</div>
      </div>
      <div class="footer-right">
        <img src="${safeWuriLogoUrl}" alt="WURI Logo" class="footer-logo" onerror="if(!this.dataset.tried){this.dataset.tried=1;this.src='/wurilogo%20(1).jpg';return;}this.style.display='none';" />
      </div>
    </div>
  `;

  const cardsHtml = (items || [])
    .map((it, idx) => {
      const card = renderCard(it);
      const isFirst = idx === 0;
      const isLast = idx === items.length - 1;

      if (isFirst) {
        return `${headerHtml}${summaryHtml}${card}${
          !isLast ? '<div class="page-break"></div>' : ""
        }`;
      }

      return `${headerHtml}${card}${
        !isLast ? '<div class="page-break"></div>' : ""
      }`;
    })
    .join("");

  const html = `
    <html>
      <head>
        <title>Agreements Report</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial;padding:12px;color:#111;background:#fff;line-height:1.2;font-size:10px;padding-bottom:120px}
          .report-header{text-align:center;margin-bottom:4px;margin-top:20px}
          .report-header h1{color:#1f4db3;margin:0;font-size:14px;font-weight:700}
          .report-header p{margin:2px 0 0;color:#6b7280;font-size:9px}
          .rule{height:2px;background:#1f4db3;margin:8px 0;border-radius:1px}
          .summary{background:#fbfdff;border:1px solid #e8eef8;padding:8px;border-radius:4px;max-width:100%;margin-bottom:10px;box-shadow:0 1px 0 rgba(0,0,0,0.02);font-size:10px}
          .summary div{margin-bottom:3px}
          .report-card{border:1px solid #e9eef6;border-radius:4px;padding:8px;margin:6px 0;background:#fff;box-shadow:0 2px 6px rgba(28,44,70,0.04)}
          .card-header{display:flex;gap:6px;align-items:center;margin-bottom:6px}
          .badge.type{background:#2f6de0;color:#fff;padding:3px 6px;border-radius:4px;font-weight:700;font-size:9px;display:inline-block}
          .dts-small{color:#556;font-size:8px;margin-top:2px}
          .card-title{color:#0f3f91;margin:2px 0;font-size:12px;font-weight:700}
          .card-sub{color:#6b7280;margin-top:2px;font-size:9px}
          .card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;align-items:start}
          .card-col{min-width:0}
          .section-box{background:#fbfcff;border:1px solid #eef2f8;padding:6px;border-radius:4px}
          .section-box{display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:start}
          .section-box > .section-title{grid-column:1 / -1}
          .section-box > .doc-grid, .section-box > .brief, .section-box > .partner-box, .section-box > .remarks{grid-column:1 / -1}
          .section-title{font-size:10px;margin:0 0 4px 0;display:flex;align-items:center;color:#1f2937;font-weight:700}
          .doc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
          .doc-item .label{font-size:8px;color:#667;font-weight:700;margin-bottom:2px;text-transform:uppercase}
          .doc-item .value{font-size:9px;color:#111}
          .value a{color:#1f4db3;text-decoration:none;font-size:9px}
          .partner-logo{width:40px;height:40px;object-fit:cover;border-radius:4px;background:#fff;border:1px solid #eef2f6}
          .partner-logo.placeholder{width:40px;height:40px;border-radius:4px;background:linear-gradient(180deg,#f3f6fb,#fff);border:1px solid #eef2f6}
          .label{font-size:8px;color:#6b7280;font-weight:700;text-transform:uppercase}
          .small-muted{font-size:9px;color:#6b7280}
          .brief{font-size:9px;color:#111;white-space:pre-wrap;margin-top:3px;max-height:80px;overflow:hidden}
          .status-pill{display:inline-block;padding:4px 8px;border-radius:999px;font-weight:700;font-size:9px;box-shadow:0 1px 4px rgba(31,64,128,0.06)}
          .remarks ul{margin:4px 0 0 12px;padding:0}
          .remarks li{margin-bottom:2px;font-size:9px;color:#222}
          .page-break{page-break-before: always;}
          .report-footer{margin-top:10px;padding-top:8px;padding-bottom:20px;border-top:1px solid #ddd;display:flex;align-items:center;justify-content:space-between;gap:10px;position:fixed;left:0;right:0;bottom:0;background:#fff;padding-left:12px;padding-right:12px;z-index:1000}
          .footer-left{display:flex;flex-direction:column;font-size:7px;line-height:1.3;color:#333;flex:1}
          .footer-right{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-shrink:0;padding:0 8px}
          .footer-logo{height:80px;width:auto;max-width:200px;object-fit:contain}
          @media (max-width:1200px){ .card-grid{grid-template-columns:1fr 1fr;gap:8px} }
          @media (max-width:900px){ .card-grid{grid-template-columns:1fr} .doc-grid{grid-template-columns:repeat(1,1fr)} }
          @media print{
            body{padding:6px 12px 80px 12px;font-size:9px}
            .report-card{page-break-inside:avoid}
            .report-header{display:block;}
            .page-break{display:block;page-break-before:always;}
            .card-grid{gap:6px}
            .section-box{padding:5px}
            .report-footer{display:flex;position:fixed;left:0;right:0;bottom:0;padding-left:12px;padding-right:12px;background:#fff;}
          }
          @page {
            margin: 0;
            size: auto;
          }
          @media print {
            html, body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          ${cardsHtml}
        </div>

        ${footerHtml}

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
            
            // Filter out the WURI footer logo from the loading wait (it's optional)
            const criticalImgs = imgs.filter(img => !img.classList.contains('footer-logo'));
            
            if(criticalImgs.length === 0){
              // Only footer logo present, don't wait for it
              setTimeout(doPrint, 200);
              return;
            }
            
            const promises = criticalImgs.map(img => new Promise(res => {
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

    for (const r of rows) {
      ws.addRow(r);
    }

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
