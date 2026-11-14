import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const showToast = useCallback((arg1, arg2, duration = 4000) => {
    const knownTypes = ['success', 'error', 'info', 'warning'];
    let type = 'info';
    let message = '';
    if (knownTypes.includes(arg1)) {
      type = arg1;
      message = arg2;
    } else {
      message = arg1;
      type = arg2 && knownTypes.includes(arg2) ? arg2 : 'info';
    }
    addToast(message, type, duration);
  }, [addToast]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getUnreadCount();
      if (res.success) {
        setUnreadCount(res.data);
      }
    } catch (err) {
      // quiet fail on background count check
    }
  }, [isAuthenticated]);

  const loadNotifications = useCallback(async (page = 0, size = 10) => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getNotifications(page, size);
      if (res.success && res.data) {
        setNotifications(res.data.content || []);
      }
    } catch (err) {
      console.warn('Could not load notifications:', err);
    }
  }, [isAuthenticated]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      addToast('Failed to mark notification as read', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      addToast('All notifications marked as read', 'success');
    } catch (err) {
      addToast('Failed to mark all as read', 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshUnreadCount();
      loadNotifications(0, 10);
      const interval = setInterval(refreshUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, refreshUnreadCount, loadNotifications]);

  const value = {
    notifications,
    unreadCount,
    toasts,
    toast: toasts[0] || null,
    addToast,
    showToast,
    removeToast,
    hideToast: () => toasts.length > 0 && removeToast(toasts[0].id),
    loadNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
