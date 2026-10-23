import axios from 'axios';

// Base API URL from Vite environment or default fallback (Spring Boot running on 8080)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const TOKEN_STORAGE_KEY = 'medistock_auth_token_v1';
export const USER_STORAGE_KEY = 'medistock_auth_user_v1';

/**
 * Configured Axios Instance for MediStock Clinical Platform
 */
export const axiosClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 10000 // 10 second timeout for clinical safety
});

/**
 * Request Interceptor: Injects Bearer token automatically
 */
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor: Handles 401 Unauthorized & global error normalization
 */
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const { status, data, config } = error.response;

            // Handle session expiry / invalid token (ignore for public login attempts)
            const isLoginUrl = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/register');
            if (status === 401 && !isLoginUrl) {
                console.warn('[MediStock Security] 401 Unauthorized encountered. Clearing session.');
                localStorage.removeItem(TOKEN_STORAGE_KEY);
                localStorage.removeItem(USER_STORAGE_KEY);

                // Dispatch global event so React AuthContext can react without hard-refreshing
                window.dispatchEvent(new CustomEvent('medistock:auth_expired', {
                    detail: { message: data?.message || 'Session expired. Please sign in again.' }
                }));
            }

            // Extract best error message: Spring Boot fieldErrors > message > error > generic status
            let errorMessage = data?.message || data?.error;
            if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
                const keys = Object.keys(data.fieldErrors);
                if (keys.length > 0) {
                    errorMessage = data.fieldErrors[keys[0]];
                }
            }
            if (!errorMessage) {
                errorMessage = `Server responded with status ${status}`;
            }

            return Promise.reject(new Error(errorMessage));
        } else if (error.request) {
            // Network failure or backend server not running
            return Promise.reject(new Error('Unable to connect to MediStock backend server at http://localhost:8080. Please ensure the backend is running.'));
        } else {
            return Promise.reject(error);
        }
    }
);

export default axiosClient;
