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
import { agreementService } from '../services/agreementService';

const Analytics = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const [agreements, setAgreements] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error, setError] = useState('');

  const [DATA_MOU, setDATA_MOU] = useState({});
  const [DATA_MOA, setDATA_MOA] = useState({});
  const [DATA_MOA_ACTIVITY, setDATA_MOA_ACTIVITY] = useState({});

  const [mouData, setMouData] = useState([]);
  const [moaData, setMoaData] = useState([]);
  const [moaActivityData, setMoaActivityData] = useState([]);

  // Fetch and process real data
  useEffect(() => {
    fetchAndProcessData();
  }, []);

  const fetchAndProcessData = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching agreements for analytics...');
      
      const data = await agreementService.getAgreements();
      setAgreements(data);
      
      console.log('📊 Processing', data.length, 'agreements');
      processAgreementData(data);
      
    } catch (err) {
      setError('Failed to fetch agreements: ' + err.message);
      console.error('Error fetching agreements:', err);
    } finally {
      setLoading(false);
    }
  };

  const processAgreementData = (agreementData) => {
    const mouData = {};
    const moaData = {};
    const moaActivityData = {};

    console.log('📋 Raw agreements:', agreementData);

    agreementData.forEach(agreement => {
      // Get date (priority: date_signed > entry_date > current date)
      let dateString = agreement.date_signed || agreement.entry_date;
      
      if (!dateString) {
        console.warn('⚠️ Agreement has no date:', agreement.agreement_id);
        return; // Skip agreements without dates
      }

      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.warn('⚠️ Invalid date for agreement:', agreement.agreement_id, dateString);
          return; // Skip agreements with invalid dates
        }
        
        const year = date.getFullYear().toString();
        const month = date.toLocaleString('default', { month: 'long' });
        const country = agreement.country || 'Unknown';
        const docType = agreement.document_type?.toUpperCase() || 'UNKNOWN';
        const partnershipType = agreement.partnership_type || 'General Partnership';

        console.log(`📈 Processing: ${docType} | ${country} | ${year}-${month} | Partnership: ${partnershipType}`);

        // Process MOU data by country
        if (docType === 'MOU') {
          if (!mouData[year]) mouData[year] = {};
          if (!mouData[year][month]) mouData[year][month] = {};
          mouData[year][month][country] = (mouData[year][month][country] || 0) + 1;
        }

        // Process MOA data by country
        if (docType === 'MOA') {
          if (!moaData[year]) moaData[year] = {};
          if (!moaData[year][month]) moaData[year][month] = {};
          moaData[year][month][country] = (moaData[year][month][country] || 0) + 1;

          // Process MOA activity data by partnership type
          if (!moaActivityData[year]) moaActivityData[year] = {};
          if (!moaActivityData[year][month]) moaActivityData[year][month] = {};
          moaActivityData[year][month][partnershipType] = (moaActivityData[year][month][partnershipType] || 0) + 1;
        }
      } catch (dateError) {
        console.warn('❌ Date parsing error for agreement:', agreement.agreement_id, dateError);
      }
    });

    // Convert to chart format
    const convertToChartFormat = (data) => {
      const result = {};
      Object.keys(data).forEach(year => {
        result[year] = {};
        Object.keys(data[year]).forEach(month => {
          result[year][month] = Object.entries(data[year][month])
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Sort by value descending
        });
      });
      return result;
    };

    const processedMOU = convertToChartFormat(mouData);
    const processedMOA = convertToChartFormat(moaData);
    const processedMOAActivity = convertToChartFormat(moaActivityData);

    console.log('📊 Processed MOU data:', processedMOU);
    console.log('📊 Processed MOA data:', processedMOA);
    console.log('📊 Processed MOA Activity data:', processedMOAActivity);

    // Update data states
    setDATA_MOU(processedMOU);
    setDATA_MOA(processedMOA);
    setDATA_MOA_ACTIVITY(processedMOAActivity);

    // Set current display data to latest available data
    const getLatestData = (data) => {
      const years = Object.keys(data).sort().reverse();
      for (const year of years) {
        const months = Object.keys(data[year]).sort().reverse();
        for (const month of months) {
          if (data[year][month] && data[year][month].length > 0) {
            return data[year][month];
          }
        }
      }
      return [];
    };

    const latestMOU = getLatestData(processedMOU);
    const latestMOA = getLatestData(processedMOA);
    const latestMOAActivity = getLatestData(processedMOAActivity);

    console.log('📊 Latest data - MOU:', latestMOU.length, 'items');
    console.log('📊 Latest data - MOA:', latestMOA.length, 'items');
    console.log('📊 Latest data - MOA Activity:', latestMOAActivity.length, 'items');

    setMouData(latestMOU);
    setMoaData(latestMOA);
    setMoaActivityData(latestMOAActivity);
  };

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

    if (loading) {
    return (
      <div className="dashboard-container">
        <TopBar toggleSidebar={toggleMobileSidebar} />
        <div className="content-body">
          <Sidebar collapsed={collapsed} toggleCollapse={toggleCollapse} mobileShow={mobileShow} />
          <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <div style={{ textAlign: 'center', fontSize: '18px' }}>
              <div>📊 Loading analytics data...</div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                Processing agreement entries...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <TopBar toggleSidebar={toggleMobileSidebar} />
        <div className="content-body">
          <Sidebar collapsed={collapsed} toggleCollapse={toggleCollapse} mobileShow={mobileShow} />
          <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <div style={{ textAlign: 'center', fontSize: '18px', color: 'red' }}>
              <div>❌ Error loading data</div>
              <div style={{ fontSize: '14px', marginTop: '10px' }}>
                {error}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
             <MOUChart ref={mouChartRef} data={DATA_MOU} onDataUpdate={setMouData} />
              <MOUTable data={mouData} />
            </div>

            <div className="analytics-chart-table">
              <MOAChart ref={moaChartRef} data={DATA_MOA} onDataUpdate={setMoaData} />
              <MOATable data={moaData} />
            </div>

            <div className="analytics-chart-table">
              <MOAActivityChart
                ref={moaActChartRef}
                data={DATA_MOA_ACTIVITY}
                onDataUpdate={setMoaActivityData}
              />
              <MOAActivityTable data={moaActivityData} />
            </div>
            
            <div className="analytics-partner-list">
              <MOUList agreements={agreements.filter(a => a.document_type === 'MOU')} />
            </div>

            <div className="analytics-partner-list">
              <MOAListPartners agreements={agreements.filter(a => a.document_type === 'MOA')} />
            </div>
            
            <ReportGenerator
               // Full chart data
              mouFullData={DATA_MOU}
              moaFullData={DATA_MOA}
              moaActivityFullData={DATA_MOA_ACTIVITY}
              
              // Current table data
              mouData={mouData}
              moaData={moaData}
              moaActivityData={moaActivityData}
              
              // Raw agreements for comprehensive data
              agreements={agreements}
              
              // Filtered agreement data for lists
              mouAgreements={agreements.filter(a => a.document_type?.toUpperCase() === 'MOU')}
              moaAgreements={agreements.filter(a => a.document_type?.toUpperCase() === 'MOA')}
              
              // Chart refs for capturing charts as images
              chartRefs={{
                mouChart: mouChartRef,
                moaChart: moaChartRef,
                moaActChart: moaActChartRef
              }}
            />

          </div>
        </div>
      </div>
  );
};

export default Analytics;
