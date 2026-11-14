import api from './api';

export const backupService = {
  createBackup: async () => {
    return await api.post('/admin/backup');
  },

  getHistory: async () => {
    return await api.get('/admin/backup/history');
  },

  downloadBackup: async (id) => {
    return await api.get(`/admin/backup/${id}/download`, { responseType: 'blob' });
  },

  restoreBackup: async (id) => {
    return await api.post(`/admin/backup/${id}/restore`);
  },

  restoreFromUpload: async (formData) => {
    return await api.post('/admin/backup/restore-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteBackup: async (id) => {
    return await api.delete(`/admin/backup/${id}`);
  },
};

export default backupService;
