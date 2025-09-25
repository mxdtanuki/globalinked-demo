const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';


export const emailService = {
  // Fetch email templates from backend
  async getTemplates() {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Please login first');

    const res = await fetch(`${API_BASE_URL}/emails/templates`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch email templates');
    return res.json();
  },

  // Create or update email template
  async saveTemplate(templateData) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Please login first');

    const res = await fetch(`${API_BASE_URL}/emails/templates`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(templateData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save template');
    }
    return res.json();
  },

  // Send email using template
  async sendEmail(emailData) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Please login first');

    const res = await fetch(`${API_BASE_URL}/emails/send`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(emailData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to send email');
    }
    return res.json();
  }
};

