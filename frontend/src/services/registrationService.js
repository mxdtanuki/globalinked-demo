// registrationService.js
import { API_BASE_URL } from "../config";

export async function approveUser(userId) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}/registration/${userId}/approve`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to approve user");
  }

  return response.json(); // returns the updated user object
}
export async function getPendingUsers() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_BASE_URL}/registration/pending`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error("Failed to fetch pending users");
  return response.json();
}

