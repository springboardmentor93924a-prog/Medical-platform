import api from './api';

export const feedbackService = {
  submitFeedback: async (data) => {
    return await api.post('/feedback', data);
  },

  getAllFeedback: async (params = {}) => {
    return await api.get('/feedback', { params });
  },

  getMyFeedback: async (params = {}) => {
    return await api.get('/feedback/my', { params });
  },

  getFeedbackById: async (id) => {
    return await api.get(`/feedback/${id}`);
  },

  updateStatus: async (id, data) => {
    return await api.patch(`/feedback/${id}/status`, data);
  },

  getStats: async () => {
    return await api.get('/feedback/stats');
  },
};

export default feedbackService;
