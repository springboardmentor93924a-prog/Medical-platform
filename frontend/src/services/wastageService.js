import api from './api';

export const wastageService = {
  reportWastage: async (data) => {
    return await api.post('/wastage', data);
  },

  getAllReports: async (params = {}) => {
    return await api.get('/wastage', { params });
  },

  getMyReports: async (params = {}) => {
    return await api.get('/wastage/my', { params });
  },

  getReportById: async (id) => {
    return await api.get(`/wastage/${id}`);
  },

  reviewWastage: async (id, data) => {
    return await api.patch(`/wastage/${id}/review`, data);
  },

  getStats: async () => {
    return await api.get('/wastage/stats');
  },
};

export default wastageService;
