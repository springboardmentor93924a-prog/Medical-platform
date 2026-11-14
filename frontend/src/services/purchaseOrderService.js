import api from './api';

export const purchaseOrderService = {
  getOrders: async (params = {}) => {
    const userStr = localStorage.getItem('medistock_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.role === 'SUPPLIER') {
      return await api.get('/supplier/orders', { params });
    }
    return await api.get('/purchase-orders', { params });
  },

  getAll: async (params = {}) => {
    const userStr = localStorage.getItem('medistock_user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.role === 'SUPPLIER') {
      return await api.get('/supplier/orders', { params });
    }
    return await api.get('/purchase-orders', { params });
  },

  getOrderById: async (id) => {
    return await api.get(`/purchase-orders/${id}`);
  },

  getById: async (id) => {
    return await api.get(`/purchase-orders/${id}`);
  },

  createOrder: async (data) => {
    return await api.post('/purchase-orders', data);
  },

  create: async (data) => {
    return await api.post('/purchase-orders', data);
  },

  approveOrder: async (id) => {
    return await api.patch(`/purchase-orders/${id}/approve`);
  },

  approve: async (id) => {
    return await api.patch(`/purchase-orders/${id}/approve`);
  },

  rejectOrder: async (id, reason = '') => {
    return await api.patch(`/purchase-orders/${id}/reject`, null, { params: { reason } });
  },

  reject: async (id, reason = '') => {
    return await api.patch(`/purchase-orders/${id}/reject`, null, { params: { reason } });
  },

  // Dedicated Supplier Actions
  acceptOrder: async (id, notes = '') => {
    return await api.patch(`/purchase-orders/${id}/supplier/accept`, null, { params: { notes } });
  },

  rejectOrderBySupplier: async (id, reason = '') => {
    return await api.patch(`/purchase-orders/${id}/supplier/reject`, null, { params: { reason } });
  },

  receiveStock: async (id, itemsOrPayload, maybeNotes = '') => {
    let payload = {};
    if (Array.isArray(itemsOrPayload)) {
      payload = { items: itemsOrPayload, notes: maybeNotes };
    } else {
      payload = itemsOrPayload;
    }
    return await api.post(`/purchase-orders/${id}/receive`, payload);
  },

  receive: async (id, itemsOrPayload, maybeNotes = '') => {
    let payload = {};
    if (Array.isArray(itemsOrPayload)) {
      payload = { items: itemsOrPayload, notes: maybeNotes };
    } else {
      payload = itemsOrPayload;
    }
    return await api.post(`/purchase-orders/${id}/receive`, payload);
  },

  cancelOrder: async (id) => {
    return await api.patch(`/purchase-orders/${id}/cancel`);
  },

  cancel: async (id) => {
    return await api.patch(`/purchase-orders/${id}/cancel`);
  },

  // Supplier action to update order status (SUPPLIER_ACCEPTED, SUPPLIER_REJECTED, SHIPPED, DELIVERED)
  updateStatus: async (id, statusOrData, maybeNotes = '') => {
    let payload = {};
    if (typeof statusOrData === 'object' && statusOrData !== null) {
      payload = statusOrData;
    } else {
      payload = { status: statusOrData, notes: maybeNotes };
    }
    return await api.patch(`/purchase-orders/${id}/supplier/status`, payload);
  },
};

export default purchaseOrderService;
