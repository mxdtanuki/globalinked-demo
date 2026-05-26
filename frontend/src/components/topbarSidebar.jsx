import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import TopBar from "./topbar";
import "../components/layout.css";

const TopbarSidebar = ({ children }) => {
  const [mobileShow, setMobileShow] = useState(false);

  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    const handleResize = () => {
      const isNowDesktop = window.innerWidth >= 768;
      if (isNowDesktop) setMobileShow(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} sidebarOpen={mobileShow} />

      {mobileShow && (
        <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />
      )}

      <div className="content-body">
        {/* Sidebar */}
        <Sidebar
          mobileShow={mobileShow}
          closeMobile={() => setMobileShow(false)}
        />

        {/* Main content */}
        <div
          className="main-content"
          onClick={() => mobileShow && setMobileShow(false)}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default TopbarSidebar;
