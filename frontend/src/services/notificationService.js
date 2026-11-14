import api from './api';

export const notificationService = {
  getNotifications: async (page = 0, size = 15) => {
    return await api.get('/notifications', { params: { page, size } });
  },

  getAll: async (params = {}) => {
    return await api.get('/notifications', { params });
  },

  getUnread: async () => {
    return await api.get('/notifications', { params: { unreadOnly: true } });
  },

  getUnreadCount: async () => {
    return await api.get('/notifications/unread-count');
  },

  markAsRead: async (id) => {
    return await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return await api.patch('/notifications/read-all');
  },

  deleteNotification: async (id) => {
    return await api.delete(`/notifications/${id}`);
  },

  delete: async (id) => {
    return await api.delete(`/notifications/${id}`);
  },
};

export default notificationService;
