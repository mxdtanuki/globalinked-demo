
import React, { useState, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./generation.css";

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
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
const CapturePie = ({ data, width = 600, height = 400 }) => {
  const COLORS = [
  "#2E86C1", "#9B59B6", "#27AE60", "#F39C12","#E74C3C","#FFDE21","#16A085","#34495E", "#D35400", "#1ABC9C", "#C0392B", 
  "#117A65", "#BDC3C7","#2C3E50", "#F4D03F","#E67E22"
];

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            outerRadius={130} 
            labelLine={false}
          >
            {data.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
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
  }, [mouFullData, moaFullData, moaActivityFullData, mouData, moaData, moaActivityData]);

  const [fromDay, setFromDay] = useState(1);
  const [fromMonth, setFromMonth] = useState("January");
  const [fromYear, setFromYear] = useState(years[0]);
  const [toDay, setToDay] = useState(31);
  const [toMonth, setToMonth] = useState("December");
  const [toYear, setToYear] = useState(years[years.length - 1]);

  const mouHiddenRef = useRef(null);
  const moaHiddenRef = useRef(null);
  const moaActHiddenRef = useRef(null);

  const rawMouRows = useMemo(() =>
    mouFullData ? flattenNestedByYearMonth(mouFullData) : mouData, [mouFullData, mouData]);
  const rawMoaRows = useMemo(() =>
    moaFullData ? flattenNestedByYearMonth(moaFullData) : moaData, [moaFullData, moaData]);
  const rawMoaActRows = useMemo(() =>
    moaActivityFullData ? flattenNestedByYearMonth(moaActivityFullData) : moaActivityData,
    [moaActivityFullData, moaActivityData]);

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
    const moaActAgg = aggregateByName(filterByDate(rawMoaActRows, fromDate, toDate));
    return { mouAgg, moaAgg, moaActAgg };
  };

  const { mouAgg, moaAgg, moaActAgg } = computeFilteredAggregated();

  const captureElementToPdfImage = async (el, pdf, x, y, w, h) => {
    if (!el) return;
    await new Promise((r) => setTimeout(r, 500)); // wait longer for charts to render
    const canvas = await html2canvas(el, { backgroundColor: "#fff", scale: 2 });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, w, h);
  };

  const handleGeneratePDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    let y = 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Analytics Report", 105, y, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    y += 10;
    pdf.text(`From: ${fromDay} ${fromMonth} ${fromYear}   To: ${toDay} ${toMonth} ${toYear}`, 105, y, { align: "center" });
    y += 15;

    const addSection = async (title, chartRefEl, tableHead, tableBody) => {
      if (y > 200) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, 14, y);

      await captureElementToPdfImage(chartRefEl, pdf, 14, y + 5, 160, 100);

      autoTable(pdf, {
        startY: y + 110,
        head: [tableHead],
        body: tableBody,
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [46, 134, 193] },
      });
      y = pdf.lastAutoTable.finalY + 15;
    };

    await addSection("MOU by Country", mouHiddenRef.current, ["Country", "Count", "Percent"], formatTableData(mouAgg));
    await addSection("MOA by Country", moaHiddenRef.current, ["Country", "Count", "Percent"], formatTableData(moaAgg));
    await addSection("MOA by Activity/Program", moaActHiddenRef.current, ["Activity/Program", "Count"], moaActAgg.map(r => [r.name, r.value]));

    pdf.save(`Analytics_Report_${fromYear}_${fromMonth}_${fromDay}_to_${toYear}_${toMonth}_${toDay}.pdf`);
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
            <select value={fromDay} onChange={(e) => setFromDay(Number(e.target.value))}>
              {Array.from({ length: getDaysInMonth(fromMonth, fromYear) }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select value={fromMonth} onChange={(e) => setFromMonth(e.target.value)}>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="date-group">
            <label>To:</label>
            <select value={toDay} onChange={(e) => setToDay(Number(e.target.value))}>
              {Array.from({ length: getDaysInMonth(toMonth, toYear) }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select value={toMonth} onChange={(e) => setToMonth(e.target.value)}>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select value={toYear} onChange={(e) => setToYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
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
          <div ref={mouHiddenRef}><CapturePie data={mouAgg} /></div>
          <div ref={moaHiddenRef}><CapturePie data={moaAgg} /></div>
          <div ref={moaActHiddenRef}><CapturePie data={moaActAgg} /></div>
        </div>
      </div>
    );
};

export default ReportGenerator;
