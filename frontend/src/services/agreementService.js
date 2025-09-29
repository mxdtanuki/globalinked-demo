const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const agreementService = {
  async getPartners() {
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${API_BASE_URL}/partners`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to load partners", error);
      throw error;
    }

    return response.json();
  },

  async createAgreement(formData) {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Please login first');
    }
    
    console.log('Sending agreement data:', formData);

    const response = await fetch(`${API_BASE_URL}/agreements/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("API Error: ", error);
      throw error;
    }

    return response.json();
  },

  async getAgreements(filters = {}) {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Please login first');
    }
    
    const queryParams = new URLSearchParams(filters).toString();
    
    const response = await fetch(`${API_BASE_URL}/agreements/?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch agreements');
    }

    return response.json();
  },

  async getAgreementById(id) {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Please login first');
    }

    const response = await fetch(`${API_BASE_URL}/agreements/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch agreement');
    }

    return response.json();
  },

  async updateAgreement(id, formData) {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Please login first');
    }

    const response = await fetch(`${API_BASE_URL}/agreements/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update agreement');
    }

    return response.json();
  },

  async deleteAgreement(id) {
    const token = localStorage.getItem('access_token');
    console.log("DeleteAgreement token:", token);
    const [, payloadB64] = token.split(".");
    console.log(JSON.parse(atob(payloadB64)));

    if (!token) {
      throw new Error('Please login first');
    }

    const response = await fetch(`${API_BASE_URL}/agreements/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete agreement');
    }

    // 204 means no content, so just return true
    if (response.status === 204) {
      return true;
    }

    return response.json();
  },

    async getArchivedAgreements() {
    const token = localStorage.getItem('access_token');

    if (!token) {
      throw new Error('Please login first');
    }

    const response = await fetch(`${API_BASE_URL}/agreements/archive`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // try to parse API error body if possible, otherwise throw generic
      let err;
      try {
        err = await response.json();
      } catch (_e) {
        err = { detail: 'Failed to fetch archived agreements' };
      }
      console.error('Failed to load archived agreements', err);
      throw err;
    }

    return response.json();
  },

};