import api from './api';

export const dashboardService = {
  getAdminDashboard: async () => {
    return await api.get('/dashboard/admin');
  },

  getAdminStats: async () => {
    return await api.get('/dashboard/admin');
  },

  getPharmacistDashboard: async () => {
    return await api.get('/dashboard/pharmacist');
  },

  getPharmacistStats: async () => {
    return await api.get('/dashboard/pharmacist');
  },

  getStaffDashboard: async () => {
    return await api.get('/dashboard/staff');
  },

  getStaffStats: async () => {
    return await api.get('/dashboard/staff');
  },

  getSupplierDashboard: async () => {
    return await api.get('/dashboard/supplier');
  },

  getSupplierStats: async () => {
    return await api.get('/dashboard/supplier');
  },
};

export default dashboardService;
