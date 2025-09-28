import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchAuditLogs } from "../services/auditService";

const AuditContext = createContext(null);

export function AuditProvider({ children }) {
  const [logs, setLogs] = useState([]);

  const refresh = async () => {
    try {
      const serverLogs = await fetchAuditLogs();
      setLogs(serverLogs);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  useEffect(() => {
    refresh();
    // Optionally poll every 20s
    const interval = setInterval(refresh, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuditContext.Provider value={{ logs, refresh }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAuditLogs() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAuditLogs must be used within AuditProvider");
  return ctx;
}