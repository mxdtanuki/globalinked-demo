import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import MOUChart from "../components/mouChart";
import MOUTable from "../components/mouTable";
import MOUList from "../components/mouList";
import MOAChart from "../components/moaChart";
import MOATable from "../components/moaTable";
import MOAActivityChart from "../components/moaActChart";
import MOAActivityTable from "../components/moaActTable";
import MOAListPartners from "../components/moaList";
import ReportGenerator from "../components/generation";
import "./analytics.css";

const Analytics = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Mock dataset for MOU
  const SAMPLE_DATA_MOU = {
    2024: {
      January: [
        { name: "Korea", value: 12 },
        { name: "Japan", value: 8 },
        { name: "USA", value: 6 },
        { name: "Australia", value: 4 },
        { name: "Canada", value: 3 },
        { name: "France", value: 2 },
        { name: "Germany", value: 1 },
      ],
      February: [
        { name: "Korea", value: 10 },
        { name: "Japan", value: 6 },
        { name: "USA", value: 7 },
        { name: "Australia", value: 5 },
        { name: "Canada", value: 2 },
        { name: "UK", value: 4 },
        { name: "China", value: 3 },
      ],
    },
    2025: {
      January: [
        { name: "Korea", value: 14 },
        { name: "Japan", value: 7 },
        { name: "USA", value: 9 },
        { name: "Australia", value: 6 },
        { name: "Canada", value: 3 },
        { name: "France", value: 2 },
        { name: "Germany", value: 4 },
      ],
    },
  };

  // Mock dataset for MOA
  const SAMPLE_DATA_MOA = {
    2024: {
      January: [
        { name: "Korea", value: 12 },
        { name: "Japan", value: 8 },
        { name: "USA", value: 6 },
        { name: "Australia", value: 4 },
        { name: "Canada", value: 3 },
        { name: "France", value: 2 },
        { name: "Germany", value: 1 },
      ],
      February: [
        { name: "Korea", value: 10 },
        { name: "Japan", value: 6 },
        { name: "USA", value: 7 },
        { name: "Australia", value: 5 },
        { name: "Canada", value: 2 },
        { name: "UK", value: 4 },
        { name: "China", value: 3 },
      ],
    },
    2025: {
      January: [
        { name: "Korea", value: 14 },
        { name: "Japan", value: 7 },
        { name: "USA", value: 9 },
        { name: "Australia", value: 6 },
        { name: "Canada", value: 3 },
        { name: "France", value: 2 },
        { name: "Germany", value: 4 },
      ],
    },
  };

  // Mock dataset for MOA by Activity/Program 
  const SAMPLE_DATA_MOA_ACTIVITY = {
    2024: {
      January: [
        { name: "Faculty Exchange", value: 2 },
        { name: "Conference", value: 1 },
        { name: "Student Exchange (Short Term)", value: 1 },
        { name: "Academic Exchange", value: 1 },
      ],
      February: [
        { name: "Student Internship", value: 3 },
        { name: "Conference", value: 1 },
        { name: "Service Agreement", value: 2 },
      ],
    },
    2025: {
      January: [
        { name: "Faculty Exchange", value: 1 },
        { name: "Student Internship", value: 4 },
        { name: "Conference", value: 2 },
      ],
    },
  };

  // Get first available year + month
  const firstYearMOU = Object.keys(SAMPLE_DATA_MOU)[0];
  const firstMonthMOU = Object.keys(SAMPLE_DATA_MOU[firstYearMOU])[0];

  const firstYearMOA = Object.keys(SAMPLE_DATA_MOA)[0];
  const firstMonthMOA = Object.keys(SAMPLE_DATA_MOA[firstYearMOA])[0];

  // Initial states
  const [mouData, setMouData] = useState(
    SAMPLE_DATA_MOU[firstYearMOU][firstMonthMOU]
  );
  const [moaData, setMoaData] = useState(
    SAMPLE_DATA_MOA[firstYearMOA][firstMonthMOA]
  );

  // For MOA Activity
  const firstYearMOAAct = Object.keys(SAMPLE_DATA_MOA_ACTIVITY)[0];
  const firstMonthMOAAct = Object.keys(SAMPLE_DATA_MOA_ACTIVITY[firstYearMOAAct])[0];
  const [moaActivityData, setMoaActivityData] = useState(
    SAMPLE_DATA_MOA_ACTIVITY[firstYearMOAAct][firstMonthMOAAct]
  );

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    const handleResize = () => {
      const isNowDesktop = window.innerWidth >= 768;
      setIsDesktop(isNowDesktop);
      if (isNowDesktop) setMobileShow(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const reportRef = useRef();
  const mouChartRef = useRef();
  const moaChartRef = useRef();
  const moaActChartRef = useRef();

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && (
        <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />
      )}
      <div className="content-body">
        <Sidebar
          collapsed={collapsed}
          toggleCollapse={toggleCollapse}
          mobileShow={mobileShow}
        />

        <div
          className="main-content"
          onClick={() => mobileShow && setMobileShow(false)}
        >
          {isDesktop && (
            <div
              className={`floating-toggle-btn ${collapsed ? "collapsed" : ""}`}
              onClick={toggleCollapse}
            >
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </div>
          )}

          {/* Content */}

            <div className="analytics-chart-table">
             <MOUChart ref={mouChartRef} data={SAMPLE_DATA_MOU} onDataUpdate={setMouData} />
              <MOUTable data={mouData} />
            </div>

            <div className="analytics-chart-table">
              <MOAChart ref={moaChartRef} data={SAMPLE_DATA_MOA} onDataUpdate={setMoaData} />
              <MOATable data={moaData} />
            </div>

            <div className="analytics-chart-table">
              <MOAActivityChart
                ref={moaActChartRef}
                data={SAMPLE_DATA_MOA_ACTIVITY}
                onDataUpdate={setMoaActivityData}
              />
              <MOAActivityTable data={moaActivityData} />
            </div>
            
            <div className="analytics-partner-list">  {/* the mock data  is in the components folder moulist */}
              <MOUList />
            </div>

            <div className="analytics-partner-list"> {/* the mock data is in the components folder moalist */}
              <MOAListPartners/>
            </div>
            
            <ReportGenerator
              mouFullData={SAMPLE_DATA_MOU}
              moaFullData={SAMPLE_DATA_MOA}
              moaActivityFullData={SAMPLE_DATA_MOA_ACTIVITY}
            />

          </div>
        </div>
      </div>
  );
};

export default Analytics;
