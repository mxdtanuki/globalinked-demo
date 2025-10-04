import { useQuery } from '@tanstack/react-query';
const API_BASE_URL = 'http://localhost:8000' || process.env.REACT_APP_API_BASE_URL;


export async function fetchAuditLogs() {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_BASE_URL}/audit/logs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return res.json();
}

