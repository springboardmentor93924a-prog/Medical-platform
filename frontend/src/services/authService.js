import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  adminSetup: async (data) => {
    const response = await api.post('/auth/admin-setup', data);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword, confirmPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword, confirmPassword });
    return response.data;
  },
};

export default authService;
