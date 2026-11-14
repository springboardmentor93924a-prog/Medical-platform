import api from './api';

export const categoryService = {
  // Fetches all categories
  getCategories: async () => {
    return await api.get('/categories');
  },

  getAll: async () => {
    return await api.get('/categories');
  },

  getCategoryById: async (id) => {
    return await api.get(`/categories/${id}`);
  },

  getById: async (id) => {
    return await api.get(`/categories/${id}`);
  },

  createCategory: async (data) => {
    return await api.post('/categories', data);
  },

  create: async (data) => {
    return await api.post('/categories', data);
  },

  updateCategory: async (id, data) => {
    return await api.put(`/categories/${id}`, data);
  },

  update: async (id, data) => {
    return await api.put(`/categories/${id}`, data);
  },

  deleteCategory: async (id) => {
    return await api.delete(`/categories/${id}`);
  },

  delete: async (id) => {
    return await api.delete(`/categories/${id}`);
  },
};

export default categoryService;
