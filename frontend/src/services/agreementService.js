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
    
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/agreements/?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch agreements');
    }

    return response.json();
  },

    // NEW: Get withdrawn agreements with server-side filtering
  async getWithdrawnAgreements() {
    return this.getAgreements({ status_filter: 'WITHDRAWN' });
  },
  
  // NEW: Get only active agreements
  async getActiveAgreements() {
    return this.getAgreements({ status_filter: 'ACTIVE' });
  },

  // NEW: Get only open agreements  
  async getOpenAgreements() {
    return this.getAgreements({ status_filter: 'OPEN' });
  },

  // NEW: Get mobility agreements with specific partnership types
  async getMobilityAgreements() {
    return this.getAgreements({ 
      status_filter: 'ACTIVE',
      partnership_type: 'MOA on Student Competition,MOA on Internship,MOA on Faculty Exchange,MOA on Student Exchange,MOA on Faculty and Student Exchange'
    });
  },
  // NEW: Lightweight summary for dashboard
  async getAgreementsSummary() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Please login first');
    }
    
    const response = await fetch(`${API_BASE_URL}/agreements/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch summary');
    }

    return response.json();
  },

  async getAgreementById(id) {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Please login first');

  const headers = { 'Authorization': `Bearer ${token}` };

  // Try multiple detail routes (with/without trailing slash, api prefix, singular)
  const detailPaths = [
    `/agreements/${id}/`,
    `/agreements/${id}`,
    `/api/agreements/${id}/`,
    `/agreement/${id}`,
  ];

  const tried = [];
  for (const path of detailPaths) {
    const url = `${API_BASE_URL}${path}`;
    try {
      const res = await fetch(url, { headers });
      tried.push({ url, status: res.status });
      if (res.ok) return res.json();
      if (res.status === 404 || res.status === 405) continue;
    } catch (e) {
      tried.push({ url, error: e.message });
      continue;
    }
  }

  // Fallback: list endpoint with filters (agreement_id, id, or dts_number)
  const queryPaths = [
    `/agreements/?agreement_id=${encodeURIComponent(id)}`,
    `/agreements/?id=${encodeURIComponent(id)}`,
    `/agreements/?dts_number=${encodeURIComponent(id)}`,
  ];
  for (const path of queryPaths) {
    const url = `${API_BASE_URL}${path}`;
    try {
      const res = await fetch(url, { headers });
      tried.push({ url, status: res.status });
      if (!res.ok) continue;
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (e) {
      tried.push({ url, error: e.message });
      continue;
    }
  }

  console.warn('getAgreementById failed. Tried:', tried);
  throw new Error('Failed to fetch agreement');
},

async getAgreementByDts(dts) {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Please login first');
  const headers = { 'Authorization': `Bearer ${token}` };

  const paths = [
    `/agreements/by-dts/${encodeURIComponent(dts)}`,
    `/agreements/?dts_number=${encodeURIComponent(dts)}`,
  ];
  for (const path of paths) {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    }
  }
  throw new Error('Failed to fetch by DTS');
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
    console.log("Fetching:", `${API_BASE_URL}/agreements/archive`);
    console.log("With method: GET");


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

  async extractAgreementMetadata(file) {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Please login first');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/documents/extract-metadata`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("NLP extraction failed:", error);
      throw error;
    }

    return response.json();
  },

  async extractAgreementMetadataWithProgress(file, onProgress) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Please login first');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${API_BASE_URL}/documents/extract-metadata`;
      const formData = new FormData();
      formData.append('file', file);

      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resp = JSON.parse(xhr.responseText);
              resolve(resp);
            } catch (err) {
              reject({ detail: 'Invalid JSON response from server' });
            }
          } else {
            // Provide detailed error with HTTP status and response body for debugging
            let parsed;
            try {
              parsed = JSON.parse(xhr.responseText);
            } catch (e) {
              parsed = { detail: xhr.responseText || `Upload failed with status ${xhr.status}` };
            }
            parsed.status = xhr.status;
            parsed.responseText = xhr.responseText;
            console.error('XHR upload error', parsed);
            reject(parsed);
          }
        }
      };

      xhr.onerror = () => reject({ detail: 'Network error during upload' });
      xhr.send(formData);
    });
  },

};