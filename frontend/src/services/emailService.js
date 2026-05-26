import { ADMIN_EMAIL_TEMPLATES } from '../adminDummyData';

export const emailService = {
  getTemplates() {
    // Return admin email templates
    return Promise.resolve([...ADMIN_EMAIL_TEMPLATES]);
  },

  getActiveTemplates() {
    // Return only active templates
    return Promise.resolve(ADMIN_EMAIL_TEMPLATES.filter(t => t.active));
  },

  getTemplatesByCategory(category) {
    // Return templates by category
    return Promise.resolve(ADMIN_EMAIL_TEMPLATES.filter(t => t.category === category));
  },

  saveTemplate(templateData) {
    // Simulate template save
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, ...templateData });
      }, 600);
    });
  },

  sendEmail(emailData) {
    // Simulate email send
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message_id: Math.random() });
      }, 800);
    });
  }
};

