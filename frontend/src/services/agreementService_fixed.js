import { mockAgreements } from '../mock/agreements';

export const agreementService = {
  getPartners() {
    // Return unique partners from mock data
    const partners = Array.from(new Set(mockAgreements.map(a => a.partner)));
    return Promise.resolve(partners.map(name => ({ name })));
  },

  createAgreement(formData) {
    // Simulate agreement creation with a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, ...formData });
      }, 800);
    });
  },

  getAgreements(filters = {}) {
    // Filter mock agreements by status or other fields
    let data = [...mockAgreements];
    if (filters.status_filter) {
      data = data.filter(a => a.status === filters.status_filter);
    }
    return Promise.resolve(data);
  },

  getPublicAgreements(filters = {}) {
    // Return all mock agreements for public
    return Promise.resolve([...mockAgreements]);
  },

  getWithdrawnAgreements() {
    return Promise.resolve(mockAgreements.filter(a => a.status === 'WITHDRAWN'));
  },

  getActiveAgreements() {
    return Promise.resolve(mockAgreements.filter(a => a.status === 'ACTIVE'));
  },

  getOpenAgreements() {
    return Promise.resolve(mockAgreements.filter(a => a.status === 'OPEN'));
  },

  getAgreementById(id) {
    // Find agreement by ID from mock data
    const agreement = mockAgreements.find(a => a.agreement_id == id);
    return Promise.resolve(agreement || null);
  },

  getAgreementByDts(dts) {
    // Find agreement by DTS number from mock data
    const agreement = mockAgreements.find(a => a.dts_number === dts);
    return Promise.resolve(agreement || null);
  },

  updateAgreement(id, formData) {
    // Simulate agreement update with a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, agreement_id: id, ...formData });
      }, 800);
    });
  },

  deleteAgreement(id) {
    // Simulate agreement deletion with a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, deleted: true });
      }, 600);
    });
  },

  getArchivedAgreements() {
    // Return archived agreements from mock data
    return Promise.resolve(mockAgreements.filter(a => a.status === 'ARCHIVED'));
  },

  extractAgreementMetadata(file) {
    // Simulate metadata extraction with a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          filename: file.name,
          extracted_fields: {
            title: 'Extracted Agreement Title',
            parties: ['Party A', 'Party B'],
            date: new Date().toISOString(),
          }
        });
      }, 1500);
    });
  },

  extractAgreementMetadataWithProgress(file, onProgress) {
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
                title: 'Extracted Agreement Title',
                parties: ['Party A', 'Party B'],
              }
            });
          }, 300);
        }
      }, 200);
    });
  },
};
