import api from './api';

export const fefoService = {
  getRecommendations: async () => {
    return await api.get('/fefo/recommendations');
  },

  validateFefo: async (medicineId, quantity = 1) => {
    return await api.get('/fefo/validate', { params: { medicineId, quantity } });
  },

  recordOverride: async (data) => {
    return await api.post('/fefo/override', data);
  },

  getStats: async () => {
    return await api.get('/fefo/stats');
  },

  getOverrides: async (params = {}) => {
    return await api.get('/fefo/overrides', { params });
  },
};

export default fefoService;
