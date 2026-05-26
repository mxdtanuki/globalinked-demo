import { ADMIN_DOCUMENT_VERSIONS } from '../adminDummyData';

export const documentService = {
  uploadVersion(dtsNumber, file, versionComment, statusAtUpload) {
    // Simulate file upload with fake success
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          dtsNumber,
          file_name: file.name,
          version_comment: versionComment,
        });
      }, 1000);
    });
  },

  getAllVersions() {
    // Return all admin document versions
    return Promise.resolve([...ADMIN_DOCUMENT_VERSIONS]);
  },

  getVersionsByDts(dtsNumber) {
    // Filter versions by DTS number
    const versions = ADMIN_DOCUMENT_VERSIONS.filter(v => v.dtsNumber === dtsNumber);
    return Promise.resolve([...versions]);
  },

  getVersionsByAgreementId(agreementId) {
    // Filter versions by agreement ID
    const versions = ADMIN_DOCUMENT_VERSIONS.filter(v => v.agreement_id === agreementId);
    return Promise.resolve([...versions]);
  },

  async getLatestVersion(dtsNumber) {
    const versions = await this.getVersionsByDts(dtsNumber);
    if (!versions || versions.length === 0) return null;
    return versions.reduce((a, b) => (a.version_number >= b.version_number ? a : b));
  },

  getDownloadUrl(versionId) {
    // Simulate download URL generation
    return Promise.resolve({
      download_url: `/downloads/document-${versionId}.pdf`
    });
  },

  updateVersion(versionId, formData) {
    // Simulate version update
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, versionId, ...formData });
      }, 800);
    });
  },

  deleteVersion(versionId) {
    // Simulate version deletion
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, deleted: true });
      }, 600);
    });
  },

  extractMetadata(file) {
    // Simulate NLP extraction with fake metadata
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          filename: file.name,
          extracted_fields: {
            title: 'Extracted Title',
            parties: ['Party A', 'Party B'],
            date: new Date().toISOString(),
          }
        });
      }, 1500);
    });
  },

  extractMetadataWithProgress(file, onProgress) {
    // Simulate progress-based metadata extraction
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) progress = 100;
        if (onProgress) onProgress(Math.round(progress));
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            resolve({
              success: true,
              filename: file.name,
              extracted_fields: {
                title: 'Extracted Title',
                parties: ['Party A', 'Party B'],
              }
            });
          }, 300);
        }
      }, 200);
    });
  },
};
