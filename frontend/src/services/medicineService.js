import api from './api';

export const medicineService = {
  getMedicines: async (params = {}) => {
    return await api.get('/medicines', { params });
  },

  getAll: async (params = {}) => {
    return await api.get('/medicines', { params });
  },

  getMedicineById: async (id) => {
    return await api.get(`/medicines/${id}`);
  },

  getById: async (id) => {
    return await api.get(`/medicines/${id}`);
  },

  createMedicine: async (data) => {
    return await api.post('/medicines', data);
  },

  create: async (data) => {
    return await api.post('/medicines', data);
  },

  updateMedicine: async (id, data) => {
    return await api.put(`/medicines/${id}`, data);
  },

  update: async (id, data) => {
    return await api.put(`/medicines/${id}`, data);
  },

  deleteMedicine: async (id) => {
    return await api.delete(`/medicines/${id}`);
  },

  delete: async (id) => {
    return await api.delete(`/medicines/${id}`);
  },

  getLowStock: async () => {
    return await api.get('/medicines/alerts/low-stock');
  },

  getOutOfStock: async () => {
    return await api.get('/medicines/alerts/out-of-stock');
  },

  getNearExpiry: async (days = 60) => {
    return await api.get('/medicines/alerts/near-expiry', { params: { days } });
  },

  getExpired: async () => {
    return await api.get('/medicines/alerts/expired');
  },
};

export default medicineService;
