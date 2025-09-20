const API_BASE_URL = "http://localhost:8000";

export const notificationService = {
  async fetchNotifications() {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  

  async markAsRead(id) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to mark read");
    return res.json();
  },

async deleteNotification(id) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete notification");
    return res.json();
  },
};

