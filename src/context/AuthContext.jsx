import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { showToast } = useToast ? useToast() : { showToast: console.log };
    const [user, setUser] = useState(() => authService.getCurrentUser());
    const [token, setToken] = useState(() => authService.getToken());
    const [isAuthenticated, setIsAuthenticated] = useState(!!user && !!token);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFacility, setSelectedFacility] = useState('Main Hospital Center - Central Pharmacy');

    // Synchronize initial session & check backend profile
    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            const currentToken = authService.getToken();
            if (currentToken) {
                try {
                    const verifiedUser = await authService.getProfile();
                    if (isMounted) {
                        setUser(verifiedUser);
                        setToken(currentToken);
                        setIsAuthenticated(!!verifiedUser);
                    }
                } catch {
                    if (isMounted) {
                        const cachedUser = authService.getCurrentUser();
                        setUser(cachedUser);
                        setToken(currentToken);
                        setIsAuthenticated(!!cachedUser);
                    }
                }
            } else {
                if (isMounted) {
                    setUser(null);
                    setToken(null);
                    setIsAuthenticated(false);
                }
            }
            if (isMounted) {
                setIsLoading(false);
            }
        };

        checkSession();

        // Listen for Axios 401 expiration event
        const handleAuthExpired = (event) => {
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
            if (showToast) {
                showToast(event.detail?.message || 'Session expired. Please sign in again.', 'warning');
            }
        };

        window.addEventListener('medistock:auth_expired', handleAuthExpired);
        return () => {
            isMounted = false;
            window.removeEventListener('medistock:auth_expired', handleAuthExpired);
        };
    }, []);

    const login = useCallback(async (email, password, role) => {
        setIsLoading(true);
        try {
            const result = await authService.login(email, password, role);
            setUser(result.user);
            setToken(result.token);
            setIsAuthenticated(true);
            return result;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (userData) => {
        setIsLoading(true);
        try {
            const result = await authService.register(userData);
            setUser(result.user);
            setToken(result.token);
            setIsAuthenticated(true);
            return result;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
    }, []);

    const updateProfile = useCallback(async (updates) => {
        const updated = await authService.updateProfile(updates);
        setUser(updated);
        return updated;
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            isLoading,
            selectedFacility,
            setSelectedFacility,
            login,
            register,
            logout,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
