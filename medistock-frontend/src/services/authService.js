import axiosClient, { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './axiosClient';
import { api } from './api';

/**
 * Normalizes backend UserResponse into the shape expected across MediStock components.
 */
export const normalizeUser = (backendUser) => {
    if (!backendUser) return null;

    let role = backendUser.role;
    if (!role && Array.isArray(backendUser.roles) && backendUser.roles.length > 0) {
        const r = backendUser.roles[0];
        if (r === 'ROLE_ADMIN' || r === 'ADMIN') role = 'Admin';
        else if (r === 'ROLE_CHIEF_PHARMACIST' || r === 'CHIEF_PHARMACIST') role = 'Chief Pharmacist';
        else if (r === 'ROLE_PHARMACIST' || r === 'PHARMACIST') role = 'Pharmacist';
        else if (r === 'ROLE_CLINICAL_NURSE' || r === 'ROLE_NURSE') role = 'Clinical Nurse';
        else if (r === 'ROLE_STAFF' || r === 'STAFF') role = 'Staff';
        else if (r === 'ROLE_SUPPLIER' || r === 'SUPPLIER') role = 'Supplier';
        else role = r.replace(/^ROLE_/, '');
    }

    const displayName = backendUser.fullName || backendUser.name || (backendUser.email ? backendUser.email.split('@')[0] : 'Clinical Practitioner');

    return {
        id: backendUser.id ? String(backendUser.id) : `usr-${Date.now().toString().slice(-4)}`,
        name: displayName,
        fullName: displayName,
        email: backendUser.email || '',
        phone: backendUser.phone || '',
        role: role || 'Pharmacist',
        roles: backendUser.roles || (role ? [`ROLE_${role.toUpperCase()}`] : []),
        facility: backendUser.facility || 'Main Hospital Center - Central Pharmacy',
        avatar: backendUser.avatar || null,
        license: backendUser.license || 'RPh-VERIFIED-2026'
    };
};

export const authService = {
    /**
     * Get stored JWT token
     */
    getToken: () => {
        return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
    },

    /**
     * Get currently cached user object (null if unauthenticated)
     */
    getCurrentUser: () => {
        try {
            const raw = localStorage.getItem(USER_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Strip legacy external avatar url if present
                if (parsed && typeof parsed.avatar === 'string' && parsed.avatar.includes('photo-1559839734-2b71ea197ec2')) {
                    parsed.avatar = null;
                    try {
                        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(parsed));
                    } catch {}
                }
                return normalizeUser(parsed);
            }
            return null;
        } catch {
            return null;
        }
    },

    /**
     * Authenticate clinical staff via Spring Boot POST /api/auth/login
     */
    login: async (email, password, role) => {
        const trimmedEmail = (email || '').trim();
        const response = await axiosClient.post('/auth/login', {
            email: trimmedEmail,
            password
        });

        const { token, user } = response.data;
        const normalized = normalizeUser({
            ...user,
            role: user?.roles?.length ? undefined : (role || 'Pharmacist')
        });

        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        }
        if (normalized) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
            try {
                await api.logAction('USER_LOGIN', `Authenticated via API: ${normalized.name} (${normalized.role})`, normalized);
            } catch {}
        }

        return { token, user: normalized };
    },

    /**
     * Register new clinical staff via Spring Boot POST /api/auth/register
     */
    register: async (userData) => {
        const payload = {
            fullName: (userData.fullName || userData.name || '').trim(),
            email: (userData.email || '').trim(),
            password: userData.password,
            role: userData.role || 'PHARMACIST',
            phone: userData.phone || ''
        };

        const response = await axiosClient.post('/auth/register', payload);
        const { token, user } = response.data;
        const normalized = normalizeUser(user);

        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        }
        if (normalized) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
            try {
                await api.logAction('USER_REGISTER', `New practitioner registered: ${normalized.name} (${normalized.role})`, normalized);
            } catch {}
        }

        return { token, user: normalized };
    },

    /**
     * Verify token / fetch current profile via Spring Boot GET /api/auth/me
     */
    getProfile: async () => {
        try {
            const response = await axiosClient.get('/auth/me');
            const rawUser = response.data?.user || response.data;
            if (rawUser) {
                const normalized = normalizeUser(rawUser);
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
                return normalized;
            }
        } catch (err) {
            // Silently fallback to cached local user if profile call fails
        }
        return authService.getCurrentUser();
    },

    /**
     * Update clinical credentials locally and in state
     */
    updateProfile: async (updates) => {
        try {
            const response = await axiosClient.put('/auth/profile', updates);
            const updated = response.data?.user || response.data;
            if (updated) {
                const normalized = normalizeUser(updated);
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
                return normalized;
            }
        } catch (err) {
            // endpoint may not be implemented on backend yet; update local profile
        }

        const current = authService.getCurrentUser() || {};
        const updated = normalizeUser({ ...current, ...updates });
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
        try {
            await api.logAction('PROFILE_UPDATED', `Profile updated for ${updated.name}`, updated);
        } catch {}
        return updated;
    },

    /**
     * Terminate session & revoke tokens
     */
    logout: async () => {
        const user = authService.getCurrentUser();
        try {
            await axiosClient.post('/auth/logout');
        } catch (err) {
            // Ignore network disconnect during logout
        } finally {
            if (user) {
                try {
                    await api.logAction('USER_LOGOUT', `User ${user.name} logged out safely`, user);
                } catch {}
            }
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }
};

export default authService;
