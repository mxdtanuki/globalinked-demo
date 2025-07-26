import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Sidebar from '../components/sidebar';
import TopBar from '../components/topbar';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import '../components/layout.css';
import './docUpload.css'; 

const DocumentUpload = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    const handleResize = () => {
      const isNowDesktop = window.innerWidth >= 768;
      setIsDesktop(isNowDesktop);
      if (isNowDesktop) setMobileShow(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />

      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}

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
              className={`floating-toggle-btn ${collapsed ? 'collapsed' : ''}`}
              onClick={toggleCollapse}
            >
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </div>
          )}

          <div className="upload-container">
            <button
              className="upload-btn"
              onClick={() => navigate('/document-upload/mou')}
            >
              Memorandum of <br /> Understanding (MOU)
            </button>
            <button
              className="upload-btn"
              onClick={() => navigate('/document-upload/moa')}
            >
              Memorandum of <br /> Agreement (MOA)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
