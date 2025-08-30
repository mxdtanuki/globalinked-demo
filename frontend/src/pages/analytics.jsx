
import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import MOUChart from "../components/mouChart";
import MOUTable from "../components/mouTable";
import MOUList from "../components/mouList";
import "./analytics.css";

const Analytics = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Mock dataset
  const SAMPLE_DATA = {
    January: [
      { name: "Korea", value: 12 },
      { name: "Japan", value: 8 },
      { name: "USA", value: 6 },
      { name: "Australia", value: 4 },
      { name: "Canada", value: 3 },
    ],
    February: [
      { name: "Korea", value: 10 },
      { name: "Japan", value: 6 },
      { name: "USA", value: 7 },
      { name: "Australia", value: 5 },
      { name: "Canada", value: 2 },
    ],
    March: [
      { name: "Korea", value: 15 },
      { name: "Japan", value: 9 },
      { name: "USA", value: 5 },
      { name: "Australia", value: 3 },
      { name: "Canada", value: 4 },
    ],
    April: [
      { name: "Korea", value: 8 },
      { name: "Japan", value: 11 },
      { name: "USA", value: 6 },
      { name: "Australia", value: 7 },
      { name: "Canada", value: 5 },
    ],
  };

  const [mouData, setMouData] = useState(SAMPLE_DATA.January);

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

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}
      <div className="content-body">
        <Sidebar collapsed={collapsed} toggleCollapse={toggleCollapse} mobileShow={mobileShow} />

        <div className="main-content" onClick={() => mobileShow && setMobileShow(false)}>
          {isDesktop && (
            <div
              className={`floating-toggle-btn ${collapsed ? "collapsed" : ""}`}
              onClick={toggleCollapse}
            >
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </div>
          )}

          {/* Content */}
          <div className="analytics-content">
            <h3 className="analytics-map-placeholder">World Map (waley pa)</h3>

            <div className="analytics-chart-table">
              <MOUChart data={SAMPLE_DATA} onDataUpdate={setMouData} />
              <MOUTable data={mouData} />
            </div>

            <div className="analytics-partner-list">
              <MOUList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
