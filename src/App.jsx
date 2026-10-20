import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import { LoginView } from './components/views/LoginView';
import InventoryPage from './pages/InventoryPage';


// Protected Route Component
const ProtectedApp = () => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f2fbf9]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-semibold text-teal-800">Verifying practitioner session...</p>
                </div>
            </div>
        );
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return <AppLayout />;
};

// Auth Route Handler
const AuthViewHandler = () => {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return <LoginView onNavigateToRegister={() => window.location.href = '/register'} />;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<ProtectedApp />} />
            <Route path="/dashboard" element={<ProtectedApp />} />
            {/* If you decide to make Admin a separate route instead of a tab, use this: */}
            {/* <Route path="/admin" element={<ProtectedApp />} /> */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/clinical-login" element={<AuthViewHandler />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/inventory" element={<InventoryPage />} />

        </Routes>
    );
}

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;