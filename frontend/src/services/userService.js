import api from './api';

export const userService = {
  getProfile: async () => {
    return await api.get('/profile');
  },

  updateProfile: async (data) => {
    return await api.put('/profile', data);
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    return await api.post('/profile/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  getAllUsers: async () => {
    return await api.get('/admin/users');
  },

  getAll: async (params = {}) => {
    // Return all users or filtered
    return await api.get('/admin/users', { params });
  },

  getUserById: async (id) => {
    return await api.get(`/admin/users/${id}`);
  },

  createUser: async (data) => {
    return await api.post('/admin/users', data);
  },

  create: async (data) => {
    return await api.post('/admin/users', data);
  },

  updateUserStatus: async (id, statusOrObj, maybeRole = null) => {
    let payload = {};
    if (typeof statusOrObj === 'object' && statusOrObj !== null) {
      payload = statusOrObj;
    } else {
      payload = { status: statusOrObj, role: maybeRole };
    }
    return await api.patch(`/admin/users/${id}/status`, payload);
  },

  updateStatus: async (id, statusOrObj, maybeRole = null) => {
    let payload = {};
    if (typeof statusOrObj === 'object' && statusOrObj !== null) {
      payload = statusOrObj;
    } else {
      payload = { status: statusOrObj, role: maybeRole };
    }
    return await api.patch(`/admin/users/${id}/status`, payload);
  },

  deleteUser: async (id) => {
    return await api.delete(`/admin/users/${id}`);
  },

  updateSupplierApprovalStatus: async (id, status, notes = '') => {
    return await api.patch(`/admin/suppliers/${id}/status`, { status, reason: notes });
  },

  getAuditLogs: async (page = 0, size = 20) => {
    return await api.get('/admin/audit-logs', { params: { page, size } });
  },

  getSystemMetrics: async () => {
    return await api.get('/admin/system-metrics');
  },
};
