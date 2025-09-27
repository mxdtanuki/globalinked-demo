import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/documents"; 

export const documentService = {
  uploadVersion: async (dtsNumber, file, versionComment, statusAtUpload) => {
    const formData = new FormData();
    formData.append("file", file);
    if (versionComment) formData.append("version_comment", versionComment);
    if (statusAtUpload) formData.append("status_at_upload", statusAtUpload);

    const res = await axios.post(
      `${API_BASE}/${dtsNumber}/versions`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  },

    getAllVersions: async () => {
    const res = await axios.get(`${API_BASE}/versions/all`);
    return res.data;
  },

    // list versions for one DTS (server route exists: GET /{dts_number}/versions)
  getVersionsByDts: async (dtsNumber) => {
    const res = await axios.get(`${API_BASE}/${dtsNumber}/versions`);
    return res.data; // expect an array of versions
  },

  // convenience: return the latest version object (or null)
  getLatestVersion: async (dtsNumber) => {
    const versions = await documentService.getVersionsByDts(dtsNumber);
    if (!versions || versions.length === 0) return null;
    // server should already return descending by version_number, but to be safe:
    return versions.reduce((a, b) =>
      (a.version_number >= b.version_number ? a : b)
    );
  },

};
