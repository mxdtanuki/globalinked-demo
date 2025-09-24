import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "../components/layout.css"; // style like notification.css
import axios from "axios";
import { AuditService } from '../services/auditService';


const AuditLogsPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [logs, setLogs] = useState([]);

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/audit/logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />

      {mobileShow && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileShow(false)}
        />
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
          <h2 className="audit-title">Audit Logs</h2>

          <div className="audit-container">
            {logs.length === 0 ? (
              <p>No audit logs found.</p>
            ) : (
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Audit ID</th>
                    <th>User Name</th>
                    <th>Description</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.audit_id}>
                      <td>{log.audit_id}</td>
                      <td>{log.username}</td>
                      <td>{log.audit_description}</td>
                      <td>{new Date(log.audit_timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
