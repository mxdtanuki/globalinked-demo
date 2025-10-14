import axios from "axios";

const API_ROOT = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";
const API_BASE = `${API_ROOT.replace(/\/$/, "")}/documents`;

export const documentService = {
  // upload a new version (multipart/form-data)
  uploadVersion: async (dtsNumber, file, versionComment, statusAtUpload) => {
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", file);
    if (versionComment) formData.append("version_comment", versionComment);
    if (statusAtUpload) formData.append("status_at_upload", statusAtUpload);

    const headers = {
      "Content-Type": "multipart/form-data",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await axios.post(`${API_BASE}/${dtsNumber}/versions`, formData, { headers });
    return res.data;
  },

  // list all versions across all DTS (used by docVer.jsx)
  getAllVersions: async () => {
    const token = localStorage.getItem("access_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${API_BASE}/versions/all`, { headers });
    return res.data;
  },

  // list versions for a single DTS
  getVersionsByDts: async (dtsNumber) => {
    const token = localStorage.getItem("access_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${API_BASE}/${dtsNumber}/versions`, { headers });
    return res.data;
  },

  // convenience: latest version object (or null)
  getLatestVersion: async (dtsNumber) => {
    const versions = await documentService.getVersionsByDts(dtsNumber);
    if (!versions || versions.length === 0) return null;
    return versions.reduce((a, b) => (a.version_number >= b.version_number ? a : b));
  },

  // get a signed download url for a version_id (returns { download_url })
  getDownloadUrl: async (versionId) => {
    const token = localStorage.getItem("access_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${API_BASE}/versions/${versionId}/download`, { headers });
    return res.data;
  },

  // update version metadata and/or replace file (multipart/form-data)
  updateVersion: async (versionId, formData) => {
    const token = localStorage.getItem("access_token");
    const headers = {
      "Content-Type": "multipart/form-data",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await axios.put(`${API_BASE}/versions/${versionId}`, formData, { headers });
    return res.data;
  },

  // delete a version
  deleteVersion: async (versionId) => {
    const token = localStorage.getItem("access_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.delete(`${API_BASE}/versions/${versionId}`, { headers });
    return res.data;
  },

  // extract metadata (NLP) - simple POST
  extractMetadata: async (file) => {
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", file);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(`${API_BASE}/extract-metadata`, formData, { headers });
    return res.data;
  },

  // optional: upload with progress using XHR for progress events
  extractMetadataWithProgress: (file, onProgress) => {
    const token = localStorage.getItem("access_token");
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${API_BASE}/extract-metadata`;
      const formData = new FormData();
      formData.append("file", file);

      xhr.open("POST", url, true);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof onProgress === "function") {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              reject({ detail: "Invalid JSON response" });
            }
          } else {
            let parsed;
            try {
              parsed = JSON.parse(xhr.responseText);
            } catch (e) {
              parsed = { detail: xhr.responseText || `Upload failed with status ${xhr.status}` };
            }
            parsed.status = xhr.status;
            reject(parsed);
          }
        }
      };

      xhr.onerror = () => reject({ detail: "Network error during upload" });
      xhr.send(formData);
    });
  },
};
