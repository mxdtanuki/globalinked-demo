import { ADMIN_AGREEMENTS } from '../adminDummyData';

// Status overrides for archive page requirements (12 expired, 7 withdrawn)
const STATUS_OVERRIDES = {
  3: { status: 'EXPIRED', agreement_status: 'Expired' },    // UP Diliman
  12: { status: 'EXPIRED', agreement_status: 'Expired' },   // Aga Khan
  18: { status: 'EXPIRED', agreement_status: 'Expired' },   // EHL
  24: { status: 'EXPIRED', agreement_status: 'Expired' },   // KTH
  28: { status: 'EXPIRED', agreement_status: 'Expired' },   // Warsaw
  32: { status: 'EXPIRED', agreement_status: 'Expired' },   // USP
  37: { status: 'EXPIRED', agreement_status: 'Expired' },   // Cairo
  40: { status: 'EXPIRED', agreement_status: 'Expired' },   // UAEU
  // Withdrawn overrides
  5: { status: 'WITHDRAWN', agreement_status: 'Withdrawn', withdrawal_reason: 'Partner institutional restructuring', withdrawal_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], withdrawn_by: 'Dr. Maria Santos' },
  14: { status: 'WITHDRAWN', agreement_status: 'Withdrawn', withdrawal_reason: 'Budget constraints', withdrawal_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], withdrawn_by: 'Dr. Maria Santos' },
  19: { status: 'WITHDRAWN', agreement_status: 'Withdrawn', withdrawal_reason: 'Policy changes', withdrawal_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], withdrawn_by: 'Dr. Maria Santos' },
  21: { status: 'WITHDRAWN', agreement_status: 'Withdrawn', withdrawal_reason: 'Program discontinuation', withdrawal_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], withdrawn_by: 'Prof. John Reyes' },
  39: { status: 'WITHDRAWN', agreement_status: 'Withdrawn', withdrawal_reason: 'Partnership realignment', withdrawal_date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], withdrawn_by: 'Dr. Maria Santos' },
  35: { status: 'WITHDRAWN', agreement_status: 'Withdrawn', withdrawal_reason: 'Mutual agreement to terminate', withdrawal_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], withdrawn_by: 'Dr. Sarah Chen' },
};

// Apply status overrides
const applyStatusOverrides = (agreements) => {
  return agreements.map(agreement => {
    const override = STATUS_OVERRIDES[agreement.agreement_id];
    if (override) {
      return { ...agreement, ...override };
    }
    return agreement;
  });
};

export const agreementService = {
  getPartners() {
    // Return unique partners from admin data
    const partners = Array.from(new Set(ADMIN_AGREEMENTS.map(a => a.partner_name)));
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
    // Filter admin agreements by status or other fields
    let data = applyStatusOverrides([...ADMIN_AGREEMENTS]);
    if (filters.status_filter) {
      data = data.filter(a => a.status === filters.status_filter);
    }
    return Promise.resolve(data);
  },

  getPublicAgreements(filters = {}) {
    // Return active agreements for public
    const data = applyStatusOverrides([...ADMIN_AGREEMENTS]);
    return Promise.resolve(data.filter(a => 
      ['ACTIVE', 'NEARING_EXPIRATION'].includes(a.status)
    ));
  },

  getWithdrawnAgreements() {
    const data = applyStatusOverrides([...ADMIN_AGREEMENTS]);
    return Promise.resolve(data.filter(a => a.status === 'WITHDRAWN'));
  },

  getActiveAgreements() {
    const data = applyStatusOverrides([...ADMIN_AGREEMENTS]);
    return Promise.resolve(data.filter(a => 
      ['ACTIVE', 'NEARING_EXPIRATION'].includes(a.status)
    ));
  },

  getOpenAgreements() {
    const data = applyStatusOverrides([...ADMIN_AGREEMENTS]);
    return Promise.resolve(data.filter(a => a.status === 'OPEN'));
  },

  getAgreementById(id) {
    // Find agreement by ID from admin data
    const data = applyStatusOverrides([...ADMIN_AGREEMENTS]);
    const agreement = data.find(a => a.agreement_id === id);
    return Promise.resolve(agreement || null);
  },

  getAgreementByDts(dts) {
    // Find agreement by DTS number from admin data
    const data = applyStatusOverrides([...ADMIN_AGREEMENTS]);
    const agreement = data.find(a => a.dts_number === dts);
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
    // Return expired and withdrawn agreements from admin data
    const data = applyStatusOverrides([...ADMIN_AGREEMENTS]);
    return Promise.resolve(data.filter(a => 
      ['EXPIRED', 'WITHDRAWN'].includes(a.status)
    ));
  },

  extractAgreementMetadata(file) {
    // Simulate metadata extraction from file
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          filename: file.name,
          extracted_fields: {
            title: 'Extracted Agreement Title',
            parties: ['Party A', 'Party B'],
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

  getMobilityAgreements() {
    // Return agreements relevant for mobility/exchange programs
    const data = applyStatusOverrides([...ADMIN_AGREEMENTS]);
    return Promise.resolve(data.filter(a => 
      ['ACTIVE', 'NEARING_EXPIRATION'].includes(a.status) &&
      (a.scope_of_partnership?.includes('Student Exchange') || 
       a.scope_of_partnership?.includes('Faculty Exchange') ||
       a.partnership_type === 'Student Mobility')
    ));
  },

};