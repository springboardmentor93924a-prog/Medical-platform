import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  ShoppingCart, 
  Pill, 
  Clock, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { notificationService } from '../../services/notificationService';
import { useNotification } from '../../context/NotificationContext';

const NotificationsPage = () => {
  const { showToast, refreshUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [unreadOnly]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = unreadOnly 
        ? await notificationService.getUnread() 
        : await notificationService.getAll();
      const data = res?.data?.data || res?.data || res;
      const list = data?.content || (Array.isArray(data) ? data : []);
      setNotifications(list);
    } catch (err) {
      console.error('Error fetching notifications', err);
      showToast('error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      refreshUnreadCount();
      showToast('success', 'Notification marked as read');
    } catch (err) {
      console.error('Mark read error', err);
      showToast('error', 'Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      refreshUnreadCount();
      showToast('success', 'All notifications marked as read');
    } catch (err) {
      console.error('Mark all read error', err);
      showToast('error', 'Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      refreshUnreadCount();
      showToast('success', 'Notification removed');
    } catch (err) {
      console.error('Delete notification error', err);
      showToast('error', 'Failed to delete notification');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'LOW_STOCK':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'EXPIRY':
      case 'EXPIRY_ALERT':
        return <Clock className="w-5 h-5 text-rose-500" />;
      case 'ORDER_STATUS':
      case 'PURCHASE_ORDER':
        return <ShoppingCart className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            System alerts regarding inventory replenishment, medicine shelf life, and order status updates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={CheckCheck}
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => (n.isRead ?? n.read ?? false))}
          >
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            !unreadOnly
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            unreadOnly
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" message="Loading notifications..." />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={unreadOnly ? "No unread alerts" : "No notifications"}
              description={unreadOnly ? "You have reviewed all urgent notifications." : "Your notification inbox is clear."}
              icon={Bell}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => {
              const isRead = notif.isRead ?? notif.read ?? false;
              return (
                <div 
                  key={notif.id}
                  className={`p-5 transition-colors flex items-start justify-between gap-4 ${
                    isRead ? 'bg-white hover:bg-gray-50' : 'bg-emerald-50/40 hover:bg-emerald-50/60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{notif.title}</h3>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                        <span>{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Recent'}</span>
                        <span>•</span>
                        <span className="font-mono">{notif.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-white rounded"
                        title="Mark as Read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-white rounded"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
