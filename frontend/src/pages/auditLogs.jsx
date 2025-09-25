import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "../components/layout.css";
import "./auditLogs.css";
import axios from "axios";
import { FiTrash2 } from "react-icons/fi"; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const FILTERS = [
  { label: "All", value: "all" },
  { label: "User Management Logs", value: "user" },
  { label: "Agreements Logs", value: "agreement" },
];

const AuditLogsPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_BASE_URL}/audit/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  // Placeholder delete
  const handleDelete = (id, description) => {
    alert(`Delete clicked on log #${id}\nDescription: ${description}`);
  };

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    if (filter === "user") {
      return (
        log.audit_description.toLowerCase().includes("user") ||
        log.audit_description.toLowerCase().includes("approved request") ||
        log.audit_description.toLowerCase().includes("rejected request") ||
        log.audit_description.toLowerCase().includes("deleted a user")
      );
    }
    if (filter === "agreement") {
      return (
        log.audit_description.toLowerCase().includes("agreement") ||
        log.audit_description.toLowerCase().includes("moa entry") ||
        log.audit_description.toLowerCase().includes("mou entry")
      );
    }
    return true;
  });

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

        <div className="auditlogs-container">
          <div className="auditlogs-title">Audit Logs</div>

          <div style={{ marginBottom: "18px", display: "flex", gap: "10px" }}>
            {FILTERS.map((f) => (
              <button
                key={f.value}
                className={filter === f.value ? "active-filter-btn" : "filter-btn"}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredLogs.length === 0 ? (
            <div className="auditlogs-empty">No audit logs found.</div>
          ) : (
            <table className="auditlogs-table">
              <thead>
                <tr>
                  <th>Logs</th>
                  <th>User</th>
                  <th>Timestamp</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.audit_id}>
                    <td>{log.audit_description}</td>
                    <td>{log.user_name}</td>
                    <td>{new Date(log.audit_timestamp).toLocaleString()}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(log.audit_id, log.audit_description)}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
