const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';


export async function fetchAuditLogs() {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE_URL}/audit/logs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}