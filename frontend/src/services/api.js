import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medistock_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle authentication errors & normalize API payload
api.interceptors.response.use(
  (response) => {
    if (response && response.data && typeof response.data === 'object') {
      if ('success' in response.data) {
        response.success = response.data.success;
      }
      if ('message' in response.data) {
        response.message = response.data.message;
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('medistock_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, { refreshToken });
          if (res.data && res.data.success) {
            const { accessToken, refreshToken: newRefresh } = res.data.data;
            localStorage.setItem('medistock_token', accessToken);
            if (newRefresh) {
              localStorage.setItem('medistock_refresh_token', newRefresh);
            }
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          // Token refresh failed; clear session
          localStorage.removeItem('medistock_token');
          localStorage.removeItem('medistock_refresh_token');
          localStorage.removeItem('medistock_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
