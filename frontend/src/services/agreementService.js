const API_BASE_URL = 'http://localhost:8000';

export const agreementService = {
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
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.detail || 'Failed to create agreement');
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

    return response.json();
  },

  checkDuplicate: async ({ dts_number, document_type, partnership_type }) => {
  const token = localStorage.getItem("access_token"); // match the other methods
  if (!token) {
    throw new Error("Please login first");
  }

  const params = new URLSearchParams({
    dts_number,
    document_type,
    partnership_type
  });

  const res = await fetch(`${API_BASE_URL}/agreements/check-duplicate?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to check duplicate");
  return await res.json();
}
};