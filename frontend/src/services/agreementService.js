const API_BASE_URL = 'http://localhost:8000';

export const agreementService = {
  async createAgreement(formData) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Please login first');

    const res = await fetch(`${API_BASE_URL}/agreements/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create agreement');
    }
    return res.json();
  },

  async getAgreements(filters = {}) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Please login first');

    const qs = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE_URL}/agreements/?${qs}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch agreements');
    return res.json();
  },

  async getAgreementById(id) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Please login first');

    const res = await fetch(`${API_BASE_URL}/agreements/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch agreement');
    return res.json();
  },

  async updateAgreement(id, formData) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Please login first');

    const res = await fetch(`${API_BASE_URL}/agreements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update agreement');
    }
    return res.json();
  },

  async deleteAgreement(id) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Please login first');

    const res = await fetch(`${API_BASE_URL}/agreements/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 204) return { status: 'deleted' };
    if (!res.ok) throw new Error('Failed to delete agreement');
    return res.json();
  },

  async checkDuplicate({ dts_number, document_type, partnership_type }) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Please login first');

    const params = new URLSearchParams({ dts_number, document_type, partnership_type });
    const res = await fetch(`${API_BASE_URL}/agreements/check-duplicate?${params.toString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to check duplicate');
    }
    return res.json();
  }
};