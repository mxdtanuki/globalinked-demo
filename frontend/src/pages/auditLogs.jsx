import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import TopBar from "../components/topbar";
import "../components/layout.css";
import "./auditLogs.css";
import { FiTrash2 } from "react-icons/fi";
import { mockAuditLogs } from "../mock/auditLogs";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "User Management Logs", value: "user" },
  { label: "Agreements Logs", value: "agreement" },
];

const PAGE_SIZE = 10;

const AuditLogsPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileShow, setMobileShow] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleCollapse = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileShow(!mobileShow);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Use mock audit logs instead of API
      await new Promise(resolve => setTimeout(resolve, 500));
      setLogs(mockAuditLogs);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    const desc = (log.audit_description || log.action || "").toLowerCase();
    if (filter === "user") {
      return (
        desc.includes("user") ||
        desc.includes("approved") ||
        desc.includes("rejected") ||
        desc.includes("deleted")
      );
    }
    if (filter === "agreement") {
      return (
        desc.includes("agreement") ||
        desc.includes("moa") ||
        desc.includes("mou")
      );
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + PAGE_SIZE);

  const handleCheckboxChange = (id) => {
    setSelectedLogs((prev) =>
      prev.includes(id)
        ? prev.filter((logId) => logId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentPageIds = currentLogs.map((log) => log.audit_id);
    const allSelected = currentPageIds.every((id) => selectedLogs.includes(id));

    if (allSelected) {
      // Unselect all on current page
      setSelectedLogs((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      // Select all on current page
      setSelectedLogs((prev) => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedLogs.length === 0) {
      alert("No logs selected.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedLogs.length} selected logs?`)) {
      //backend call here
      setLogs((prev) => prev.filter((log) => !selectedLogs.includes(log.audit_id)));
      setSelectedLogs([]);
      alert("Selected logs deleted successfully.");
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm("Are you sure you want to delete all logs? This cannot be undone.")) {
      // backend call here
      setLogs([]);
      setSelectedLogs([]);
      alert("All logs deleted successfully.");
    }
  };

  const handleDeleteSingle = (id, description) => {
    if (window.confirm(`Delete this log?\n\n${description}`)) {
      setLogs((prev) => prev.filter((log) => log.audit_id !== id));
      setSelectedLogs((prev) => prev.filter((logId) => logId !== id));
      alert(`Deleted log #${id}`);
    }
  };

  return (
    <div className="dashboard-container">
      <TopBar toggleSidebar={toggleMobileSidebar} />
      {mobileShow && <div className="mobile-backdrop" onClick={() => setMobileShow(false)} />}
      <div className="content-body">
        <Sidebar collapsed={collapsed} toggleCollapse={toggleCollapse} mobileShow={mobileShow} />

        <div className="main-content">
          <div className="auditlogs-title">Audit Logs</div>

          <div className="auditlogs-container">
            {/* Filter Buttons */}
            <div style={{ marginBottom: "18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div className="audit-filter-group">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={filter === f.value ? "audit-active-filter-btn" : "audit-filter-btn"}
                  onClick={() => {
                    setFilter(f.value);
                    setCurrentPage(1);
                    setSelectedLogs([]);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            </div>

          {selectedLogs.length > 0 && (
            <div className="bulk-action-bar">
              <input
                type="checkbox"
                checked={currentLogs.every((log) => selectedLogs.includes(log.audit_id))}
                onChange={handleSelectAll}
              />
              <span>{selectedLogs.length} selected</span>
              <button
                className="bulk-delete-btn"
                onClick={handleDeleteSelected}
              >
                <FiTrash2 /> Delete Selected
              </button>
              <button
                className="bulk-delete-btn delete-all"
                onClick={handleDeleteAll}
              >
                <FiTrash2 /> Delete All
              </button>
            </div>
          )}

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading audit logs...</p>
              </div>
            ) : currentLogs.length === 0 ? (
              <div className="auditlogs-empty">No audit logs found.</div>
            ) : (
              <div className="table-wrapper">
                <table className="auditlogs-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={currentLogs.every((log) =>
                            selectedLogs.includes(log.audit_id)
                          )}
                        />
                      </th>
                      <th>Logs</th>
                      <th>User</th>
                      <th>Timestamp</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogs.map((log) => (
                      <tr key={log.audit_id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedLogs.includes(log.audit_id)}
                            onChange={() => handleCheckboxChange(log.audit_id)}
                          />
                        </td>
                        <td>{log.audit_description}</td>
                        <td>{log.user_name}</td>
                        <td>
                          {new Date(new Date(log.audit_timestamp).getTime() + 8 * 60 * 60 * 1000).toLocaleString("en-US", { hour12: true })}
                        </td>
                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteSingle(log.audit_id, log.audit_description)}
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Prev
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
 