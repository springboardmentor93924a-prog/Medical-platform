import api from './api';

export const stockService = {
  recordMovement: async (data) => {
    return await api.post('/inventory/movements', data);
  },

  getMovements: async (params = {}) => {
    return await api.get('/inventory/movements', { params });
  },

  getAll: async (params = {}) => {
    return await api.get('/inventory/movements', { params });
  },

  getMovementsForMedicine: async (id) => {
    return await api.get(`/inventory/movements/medicine/${id}`);
  },
};

export default stockService;
