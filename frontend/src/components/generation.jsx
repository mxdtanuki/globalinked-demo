import React, { useState, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "./generation.css";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// to extract years from various data formats
const extractYearsFlexible = (...datasets) => {
  const s = new Set();
  datasets.forEach((ds) => {
    if (!ds) return;
    if (Array.isArray(ds)) {
      ds.forEach((r) => {
        if (r?.date) {
          const y = new Date(r.date).getFullYear();
          if (!Number.isNaN(y)) s.add(y);
        }
      });
    } else if (typeof ds === "object") {
      Object.keys(ds).forEach((k) => {
        const n = Number(k);
        if (!Number.isNaN(n)) s.add(n);
      });
    }
  });
  return [...s].sort((a, b) => a - b);
};

const flattenNestedByYearMonth = (nested) => {
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) return [];
  const flat = [];
  Object.entries(nested).forEach(([year, monthsObj]) => {
    Object.entries(monthsObj || {}).forEach(([monthName, rows]) => {
      const dateStr = `${monthName} 1, ${year}`;
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        flat.push({ ...row, date: dateStr });
      });
    });
  });
  return flat;
};

const aggregateByName = (rows) => {
  const map = {};
  rows.forEach((r) => {
    const name = r.name ?? "Unknown";
    const value = Number(r.value) || 0;
    map[name] = (map[name] || 0) + value;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

const toDateObj = (day, month, year) => new Date(`${month} ${day}, ${year}`);
const filterByDate = (rows, fromD, toD) =>
  rows.filter((r) => {
    if (!r?.date) return false;
    const d = new Date(r.date);
    return d >= fromD && d <= toD;
  });

const getDaysInMonth = (month, year) => {
  const monthIndex = months.indexOf(month);
  return new Date(year, monthIndex + 1, 0).getDate();
};

// pie chart for PDF capture
const CapturePie = ({ data, width = 700, height = 500 }) => {
  const COLORS = [
    "#2E86C1",
    "#9B59B6",
    "#27AE60",
    "#F39C12",
    "#E74C3C",
    "#FFDE21",
    "#16A085",
    "#34495E",
    "#D35400",
    "#1ABC9C",
    "#C0392B",
    "#117A65",
    "#BDC3C7",
    "#2C3E50",
    "#F4D03F",
    "#E67E22",
  ];

  // wrap long labels
  const wrapText = (text, maxChars) => {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    words.forEach((w) => {
      if ((line + w).length > maxChars) {
        lines.push(line.trim());
        line = w + " ";
      } else {
        line += w + " ";
      }
    });
    lines.push(line.trim());
    return lines;
  };

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={200}
            isAnimationActive={false}
            labelLine={false}
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              percent,
              name,
            }) => {
              const RADIAN = Math.PI / 180;
              const radius = outerRadius + 20;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);

              const lines = wrapText(
                `${name} ${(percent * 100).toFixed(1)}%`,
                18
              );

              return (
                <text
                  x={x}
                  y={y}
                  fill="#000"
                  stroke="#000"
                  strokeWidth={0.5}
                  textAnchor={x > cx ? "start" : "end"}
                  dominantBaseline="central"
                  style={{ fontSize: "16px" }}
                >
                  {lines.map((line, i) => (
                    <tspan key={i} x={x} dy={i === 0 ? 0 : 14}>
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const ReportGenerator = ({
  mouFullData = null,
  moaFullData = null,
  moaActivityFullData = null,
  mouData = [],
  moaData = [],
  moaActivityData = [],
  agreements = [],
  mouAgreements = [],
  moaAgreements = [],
  chartRefs = {},
}) => {
  const years = useMemo(() => {
    const extracted = extractYearsFlexible(
      mouFullData ?? mouData,
      moaFullData ?? moaData,
      moaActivityFullData ?? moaActivityData
    );
    return extracted.length > 0 ? extracted : [new Date().getFullYear()];
  }, [
    mouFullData,
    moaFullData,
    moaActivityFullData,
    mouData,
    moaData,
    moaActivityData,
  ]);

  const [fromDay, setFromDay] = useState(1);
  const [fromMonth, setFromMonth] = useState("January");
  const [fromYear, setFromYear] = useState(years[0]);
  const [toDay, setToDay] = useState(31);
  const [toMonth, setToMonth] = useState("December");
  const [toYear, setToYear] = useState(years[years.length - 1]);

  const mouHiddenRef = useRef(null);
  const moaHiddenRef = useRef(null);
  const moaActHiddenRef = useRef(null);

  const rawMouRows = useMemo(
    () => (mouFullData ? flattenNestedByYearMonth(mouFullData) : mouData),
    [mouFullData, mouData]
  );
  const rawMoaRows = useMemo(
    () => (moaFullData ? flattenNestedByYearMonth(moaFullData) : moaData),
    [moaFullData, moaData]
  );
  const rawMoaActRows = useMemo(
    () =>
      moaActivityFullData
        ? flattenNestedByYearMonth(moaActivityFullData)
        : moaActivityData,
    [moaActivityFullData, moaActivityData]
  );

  const formatTableData = (arr) => {
    const total = arr.reduce((s, r) => s + (Number(r.value) || 0), 0) || 1;
    return arr.map((row) => [
      row.name,
      row.value,
      `${(((Number(row.value) || 0) / total) * 100).toFixed(1)}%`,
    ]);
  };

  const computeFilteredAggregated = () => {
    const fromDate = toDateObj(fromDay, fromMonth, fromYear);
    const toDate = toDateObj(toDay, toMonth, toYear);
    const mouAgg = aggregateByName(filterByDate(rawMouRows, fromDate, toDate));
    const moaAgg = aggregateByName(filterByDate(rawMoaRows, fromDate, toDate));
    const moaActAgg = aggregateByName(
      filterByDate(rawMoaActRows, fromDate, toDate)
    );
    return { mouAgg, moaAgg, moaActAgg };
  };

  const { mouAgg, moaAgg, moaActAgg } = computeFilteredAggregated();

  const captureElementToPdfImage = async (el, pdf, x, y, w, h) => {
    if (!el) return;
    await new Promise((r) => setTimeout(r, 500)); // wait for rendering
    const canvas = await html2canvas(el, { backgroundColor: "#fff", scale: 3 });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, w, h);
  };

  const formatAgreementList = (agreements, type) => {
    if (!Array.isArray(agreements)) return [];

    return agreements.map((a) => {
      if (type === "MOU") {
        return [
          a.unit_name || "N/A",
          a.name || "N/A",
          a.country || "N/A",
          a.date_signed
            ? new Date(a.date_signed).toLocaleDateString()
            : a.entry_date
            ? new Date(a.entry_date).toLocaleDateString()
            : "N/A",
        ];
      } else if (type === "MOA") {
        return [
          a.unit_name || "N/A",
          a.name || "N/A",
          a.country || "N/A",
          a.partnership_type || "N/A",
          a.date_signed
            ? new Date(a.date_signed).toLocaleDateString()
            : a.entry_date
            ? new Date(a.entry_date).toLocaleDateString()
            : "N/A",
        ];
      }
      return [];
    });
  };

  const handleGeneratePDF = async () => {
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Define header function
    const addHeader = async () => {
      // Add header with logos and title
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      let yPos = 10;

      // Try to add PUP logo on the left
      try {
        const pupLogoUrl = "/pup-logo.png";
        pdf.addImage(pupLogoUrl, "PNG", 14, yPos - 2, 12, 12);
      } catch (e) {
        console.warn("Could not load PUP logo:", e);
      }

      // Try to add Bagong Pilipinas logo on the right
      try {
        const bagongPilipinasUrl = "/Bagong_Pilipinas_logo.png";
        pdf.addImage(
          bagongPilipinasUrl,
          "PNG",
          pageWidth - 26,
          yPos - 2,
          12,
          12
        );
      } catch (e) {
        console.warn("Could not load Bagong Pilipinas logo:", e);
      }

      // Text offset to accommodate logos
      const textX = 28;

      pdf.text("Republic of the Philippines", textX, yPos);

      yPos += 3;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("POLYTECHNIC UNIVERSITY OF THE PHILIPPINES", textX, yPos);

      yPos += 3;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text("Office of the President", textX, yPos);

      yPos += 3;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text("OFFICE OF INTERNATIONAL AFFAIRS", textX, yPos);

      // Draw horizontal line
      yPos += 5;
      pdf.setDrawColor(31, 77, 179);
      pdf.setLineWidth(0.5);
      pdf.line(14, yPos, pageWidth - 14, yPos);

      return yPos + 3;
    };

    // Define footer function
    const addFooter = async () => {
      const footerY = pageHeight - 20;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(51, 51, 51);

      // Add footer text
      pdf.text(
        "PUP A. Mabini Campus, Anonas Street, Sta. Mesa, Manila 1016",
        14,
        footerY
      );
      pdf.text(
        "Direct Line: 5335-1752 | Trunk Line: 5335-1787 or 5335-1777 local 622",
        14,
        footerY + 3
      );
      pdf.text(
        "Website: www.pup.edu.ph | Email: yourofficeemail@pup.edu.ph",
        14,
        footerY + 6
      );
      pdf.setFont("helvetica", "bold");
      pdf.text("THE COUNTRY'S 1st POLYTECHNIC", 14, footerY + 10);

      // Try to add WURI logo on the right
      try {
        const wuriLogoUrl = "/wurilogo.png";
        pdf.addImage(wuriLogoUrl, "PNG", pageWidth - 40, footerY - 5, 25, 15);
      } catch (e) {
        console.warn("Could not load WURI logo:", e);
      }
    };

    const fromDate = toDateObj(fromDay, fromMonth, fromYear);
    const toDate = toDateObj(toDay, toMonth, toYear);

    // Filter agreements by selected date range
    const filterAgreementByDate = (arr) => {
      return arr.filter((a) => {
        const dateStr = a.date_signed || a.entry_date;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return !isNaN(d) && d >= fromDate && d <= toDate;
      });
    };

    const filteredMouAgreements = filterAgreementByDate(mouAgreements);
    const filteredMoaAgreements = filterAgreementByDate(moaAgreements);
    const centerX = pageWidth / 2;

    // Add header and footer to first page
    await addHeader();
    await addFooter();

    let currentY = pageHeight / 2 - 20;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("Memorandum of Understanding", centerX, currentY, {
      align: "center",
    });

    currentY += 15;
    pdf.text("and", centerX, currentY, { align: "center" });

    currentY += 15;
    pdf.text("Memorandum of Agreement", centerX, currentY, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    currentY += 20;

    pdf.text(
      `From ${fromMonth} ${fromDay}, ${fromYear} to ${toMonth} ${toDay}, ${toYear}`,
      centerX,
      currentY,
      { align: "center" }
    );

    const plural = (val, singular, plural) => (val === 1 ? singular : plural);

    const listNames = (arr) =>
      arr.length === 1
        ? arr[0]
        : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];

    const addChartTableSection = async (
      title,
      chartRefEl,
      tableHead,
      tableBody
    ) => {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      const wrappedTitle = pdf.splitTextToSize(title, pageWidth - 60);
      pdf.text(wrappedTitle, pageWidth / 2, 35, { align: "center" });

      let finalY = 30;
      let tableX = 25;
      let total = 0;

      if (chartRefEl) {
        await captureElementToPdfImage(chartRefEl, pdf, 14, 45, 120, 100);

        total = tableBody.reduce((sum, row) => sum + (Number(row[1]) || 0), 0);

        if (tableHead.length === 2) {
          // Activity/Program case
          tableHead.push("Percent");
          tableBody = tableBody.map((r) => {
            const val = Number(r[1]) || 0;
            return [r[0], val, ((val / total) * 100).toFixed(1) + "%"];
          });
        }
        tableBody.push([
          "TOTAL",
          total,
          tableHead.includes("Percent") ? "100.0%" : "",
        ]);

        autoTable(pdf, {
          margin: { left: 140, top: 45 },
          head: [tableHead],
          body: tableBody,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [46, 134, 193] },
          tableWidth: 100,
          didDrawPage: (data) => {
            finalY = data.cursor.y;
            tableX = data.settings.margin.left;
          },
        });
      } else {
        // agreements list
        autoTable(pdf, {
          startY: 45,
          head: [tableHead],
          body: tableBody,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [46, 134, 193] },
          margin: { horizontal: "center" },
          didDrawPage: (data) => {
            finalY = data.cursor.y;
            tableX = data.settings.margin.left;
          },
        });
      }

      // Add insights
      if (tableBody.length > 0 && chartRefEl) {
        const values = tableBody
          .filter((r) => r[0] !== "TOTAL")
          .map((r) => Number(r[1]) || 0);

        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);

        const topItems = tableBody
          .filter((r) => Number(r[1]) === maxVal)
          .map((r) => r[0]);
        const leastItems = tableBody
          .filter((r) => Number(r[1]) === minVal)
          .map((r) => r[0]);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);

        const insightText = `Among ${title.toLowerCase()}, ${listNames(
          topItems
        )} ${
          topItems.length > 1 ? "tie for the highest" : "has the highest"
        } number with ${maxVal} ${plural(
          maxVal,
          "agreement",
          "agreements"
        )} out of a total of ${total}. In contrast, ${listNames(leastItems)} ${
          leastItems.length > 1 ? "tie for the lowest" : "has the lowest"
        } with ${minVal} ${plural(minVal, "agreement", "agreements")}.`;

        pdf.text(insightText, tableX, finalY + 10, { maxWidth: 100 });
      }
    };

    // Sections (control page breaks here)
    pdf.addPage();
    await addHeader();
    await addFooter();
    await addChartTableSection(
      "Memorandum Of Understanding by Country",
      mouHiddenRef.current,
      ["Country", "Count", "Percent"],
      formatTableData(mouAgg)
    );

    pdf.addPage();
    await addHeader();
    await addFooter();
    await addChartTableSection(
      "Memorandum Of Agreements by Country",
      moaHiddenRef.current,
      ["Country", "Count", "Percent"],
      formatTableData(moaAgg)
    );

    pdf.addPage();
    await addHeader();
    await addFooter();
    await addChartTableSection(
      "Memorandum Of Agreements by Activity/Program",
      moaActHiddenRef.current,
      ["Activity/Program", "Count"],
      moaActAgg.map((r) => [r.name, r.value])
    );

    pdf.addPage();
    await addHeader();
    await addFooter();
    await addChartTableSection(
      "Memorandum Of Understanding List",
      null,
      ["Source", "Partner", "Country", "Date Signed"],
      formatAgreementList(filteredMouAgreements, "MOU")
    );

    pdf.addPage();
    await addHeader();
    await addFooter();
    await addChartTableSection(
      "Memorandum Of Agreements List",
      null,
      ["Source", "Partner", "Country", "Partnership", "Date Signed"],
      formatAgreementList(filteredMoaAgreements, "MOA")
    );

    // Save file
    pdf.save(
      `Analytics_Report_${fromYear}_${fromMonth}_${fromDay}_to_${toYear}_${toMonth}_${toDay}.pdf`
    );
  };

  const hiddenChartContainerStyle = {
    position: "absolute",
    left: "-9999px",
    top: 0,
    width: 800,
    height: 500,
    opacity: 0,
    pointerEvents: "none",
  };

  return (
    <div className="report-generator">
      <h3>Generate Reports</h3>

      {/* Date pickers */}
      <div className="date-filters">
        <div className="date-group">
          <label>From:</label>
          <select
            value={fromDay}
            onChange={(e) => setFromDay(Number(e.target.value))}
          >
            {Array.from(
              { length: getDaysInMonth(fromMonth, fromYear) },
              (_, i) => i + 1
            ).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={fromMonth}
            onChange={(e) => setFromMonth(e.target.value)}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={fromYear}
            onChange={(e) => setFromYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="date-group">
          <label>To:</label>
          <select
            value={toDay}
            onChange={(e) => setToDay(Number(e.target.value))}
          >
            {Array.from(
              { length: getDaysInMonth(toMonth, toYear) },
              (_, i) => i + 1
            ).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select value={toMonth} onChange={(e) => setToMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={toYear}
            onChange={(e) => setToYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate button */}
      <button className="analytic-generate-btn" onClick={handleGeneratePDF}>
        Generate PDF
      </button>

      {/* Hidden charts */}
      <div style={hiddenChartContainerStyle}>
        <div ref={mouHiddenRef}>
          <CapturePie data={mouAgg} title="MOU by Country" />
        </div>
        <div ref={moaHiddenRef}>
          <CapturePie data={moaAgg} title="MOA by Country" />
        </div>
        <div ref={moaActHiddenRef}>
          <CapturePie data={moaActAgg} title="MOA by Activity/Program" />
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
