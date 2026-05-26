import { ADMIN_NOTIFICATIONS } from '../adminDummyData';

export const notificationService = {
  fetchNotifications() {
    // Return admin notifications
    return Promise.resolve([...ADMIN_NOTIFICATIONS]);
  },

  getNotificationsByUser(userId) {
    // Return notifications for specific user
    return Promise.resolve(ADMIN_NOTIFICATIONS.filter(n => 
      !n.user_id || n.user_id === userId
    ));
  },

  getUnreadNotifications(userId) {
    // Return unread notifications for user
    return Promise.resolve(ADMIN_NOTIFICATIONS.filter(n => 
      (!n.user_id || n.user_id === userId) && !n.read
    ));
  },

  markAsRead(id) {
    // Simulate marking notification as read
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, id });
      }, 300);
    });
  },

  deleteNotification(id) {
    // Simulate notification deletion
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, deleted: true });
      }, 300);
    });
  },
};


