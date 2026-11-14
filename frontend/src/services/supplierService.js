import api from './api';

export const supplierService = {
  getSuppliers: async (params = {}) => {
    return await api.get('/suppliers', { params });
  },

  getAll: async (params = {}) => {
    return await api.get('/suppliers', { params });
  },

  getSupplierById: async (id) => {
    return await api.get(`/suppliers/${id}`);
  },

  getById: async (id) => {
    return await api.get(`/suppliers/${id}`);
  },

  createSupplier: async (data) => {
    return await api.post('/suppliers', data);
  },

  create: async (data) => {
    return await api.post('/suppliers', data);
  },

  updateSupplier: async (id, data) => {
    return await api.put(`/suppliers/${id}`, data);
  },

  update: async (id, data) => {
    return await api.put(`/suppliers/${id}`, data);
  },

  updateStatus: async (id, data) => {
    return await api.patch(`/suppliers/${id}/status`, data);
  },

  deleteSupplier: async (id) => {
    return await api.delete(`/suppliers/${id}`);
  },

  delete: async (id) => {
    return await api.delete(`/suppliers/${id}`);
  },

  getSuppliedMedicines: async (id) => {
    return await api.get(`/suppliers/${id}/medicines`);
  },

  getMedicines: async (id) => {
    return await api.get(`/suppliers/${id}/medicines`);
  },

  getSupplierOrders: async (id, page = 0, size = 10) => {
    return await api.get(`/suppliers/${id}/orders`, { params: { page, size } });
  },

  // Dedicated Supplier Role operations
  getMyProfile: async () => {
    return await api.get('/supplier/profile');
  },

  updateMyProfile: async (data) => {
    return await api.put('/supplier/profile', data);
  },

  getMyOrders: async (params = {}) => {
    return await api.get('/supplier/orders', { params });
  },

  getMyMedicines: async (params = {}) => {
    return await api.get('/supplier/medicines', { params });
  },

  updateOrderStatus: async (id, statusOrData, maybeNotes = '') => {
    let payload = {};
    if (typeof statusOrData === 'object' && statusOrData !== null) {
      payload = statusOrData;
    } else {
      payload = { status: statusOrData, notes: maybeNotes };
    }
    return await api.patch(`/supplier/orders/${id}/status`, payload);
  },
};

export default supplierService;
