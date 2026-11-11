import axiosClient from './axiosClient';

export const adminService = {
    // --- USER MANAGEMENT ---
    getAllUsers: async () => {
        const response = await axiosClient.get('/admin/users');
        return response.data;
    },

    toggleUserStatus: async (userId) => {
        const response = await axiosClient.put(`/admin/users/${userId}/toggle-status`);
        return response.data;
    },
        // --- USER MANAGEMENT UPGRADES ---
    createUser: async (userData) => {
        const response = await axiosClient.post('/admin/users', userData);
        return response.data;
    },

    deleteUser: async (userId) => {
        const response = await axiosClient.delete(`/admin/users/${userId}`);
        return response.data;
    },
        updateUser: async (id, data) => {
        const response = await axiosClient.put(`/admin/users/${id}`, data);
        return response.data;
    },

    // --- INVENTORY & MEDICINES ---
    getAllMedicines: async () => {
        const response = await axiosClient.get('/admin/inventory/medicines');
        return response.data;
    },

    createMedicine: async (medicineData) => {
        const response = await axiosClient.post('/admin/inventory/medicines', medicineData);
        return response.data;
    },

    updateMedicine: async (id, medicineData) => {
        const response = await axiosClient.put(`/admin/inventory/medicines/${id}`, medicineData);
        return response.data;
    },

    deleteMedicine: async (id) => {
        const response = await axiosClient.delete(`/admin/inventory/medicines/${id}`);
        return response.data;
    },

    // --- SUPPLIERS ---
    getAllSuppliers: async () => {
        const response = await axiosClient.get('/admin/suppliers');
        return response.data;
    },

    createSupplier: async (supplierData) => {
        const response = await axiosClient.post('/admin/suppliers', supplierData);
        return response.data;
    },

    updateSupplier: async (id, supplierData) => {
        const response = await axiosClient.put(`/admin/suppliers/${id}`, supplierData);
        return response.data;
    },

    deleteSupplier: async (id) => {
        const response = await axiosClient.delete(`/admin/suppliers/${id}`);
        return response.data;
    },
    // Fetch orders for the logged-in supplier only
getSupplierOrders: async () => {
    const response = await axiosClient.get('/admin/purchase-orders/supplier');
    return response.data;
},

// Update order status (used by supplier to mark delivered)
updatePurchaseOrderStatus: async (id, status) => {
    const response = await axiosClient.put(`/admin/purchase-orders/${id}/status?status=${status}`);
    return response.data;
},

    // --- DASHBOARD STATS ---
    getDashboardStats: async () => {
        const response = await axiosClient.get('/admin/inventory/dashboard-stats');
        return response.data;
    },
    
    getCategoryStats: async () => {
        const response = await axiosClient.get('/admin/inventory/dashboard-categories');
        return response.data;
    },
        // --- NOTIFICATIONS ---
    getNotifications: async () => {
        const response = await axiosClient.get('/admin/notifications');
        return response.data;
    },

        // --- NOTIFICATIONS ---
    getNotifications: async () => {
        const response = await axiosClient.get('/admin/notifications');
        return response.data;
    },
    
    clearNotification: async (id) => {
        const response = await axiosClient.delete(`/admin/notifications/${id}`);
        return response.data;
    },

        getPurchaseOrders: async () => {
        const response = await axiosClient.get('/admin/purchase-orders');
        return response.data;
    },
    approvePurchaseOrder: async (id) => {
        const response = await axiosClient.put(`/admin/purchase-orders/${id}/approve`);
        return response.data;
    },
    rejectPurchaseOrder: async (id) => {
        const response = await axiosClient.put(`/admin/purchase-orders/${id}/reject`);
        return response.data;
    },

        // --- CATEGORIES ---
    getAllCategories: async () => {
        const response = await axiosClient.get('/admin/categories');
        return response.data;
    },
    createCategory: async (data) => {
        const response = await axiosClient.post('/admin/categories', data);
        return response.data;
    },
    deleteCategory: async (id) => {
        await axiosClient.delete(`/admin/categories/${id}`);
    },

    // --- INVENTORY LOGS ---
    getStockLogs: async () => {
        const response = await axiosClient.get('/admin/inventory/stock-logs');
        return response.data;
    },

        // --- PURCHASE ORDERS ---
    getPurchaseOrders: async () => {
        const response = await axiosClient.get('/admin/purchase-orders');
        return response.data;
    },
    createPurchaseOrder: async (orderData) => {
        const response = await axiosClient.post('/admin/purchase-orders', orderData);
        return response.data;
    },
        updatePurchaseOrderStatus: async (id, status) => {
        const response = await axiosClient.put(`/admin/purchase-orders/${id}/status?status=${status}`);
        return response.data;
    },
    deletePurchaseOrder: async (id) => {
        const response = await axiosClient.delete(`/admin/purchase-orders/${id}`);
        return response.data;
    },

        // For Supplier Dashboard
       getSupplierOrders: async () => {
        const response = await axiosClient.get('/admin/purchase-orders/supplier');
        return response.data;
    
    },
    // --- BILLING ---
    processSale: async (saleData) => {
        const response = await axiosClient.post('/billing/checkout', saleData);
        return response.data;
    },
        getSalesHistory: async () => {
        const response = await axiosClient.get('/billing/sales');
        return response.data;
    },
        // --- SUPPLIER DELIVERY & HISTORY ---
    getSupplierDeliveries: async () => {
        const response = await axiosClient.get('/admin/purchase-orders/supplier/deliveries');
        return response.data;
    },

    getSupplierHistory: async () => {
        const response = await axiosClient.get('/admin/purchase-orders/supplier/history');
        return response.data;
    },

        // STAFF: View incoming deliveries
    getStaffDeliveries: async () => {
        const response = await axiosClient.get('/admin/purchase-orders/staff/deliveries');
        return response.data;
    },

        // STAFF RECEIVE MEDICINES
    receivePurchaseOrder: async (orderId) => {
        const response = await axiosClient.post(`/admin/purchase-orders/${orderId}/receive`);
        return response.data;
    },

    // STAFF TASKS
    getAllStaff: async () => {
        const response = await axiosClient.get('/admin/users/staff');
        return response.data;
    },
    getAllTasks: async () => {
        const response = await axiosClient.get('/admin/tasks');
        return response.data;
    },
    createTask: async (taskData) => {
        const response = await axiosClient.post('/admin/tasks', taskData);
        return response.data;
    },
    getMyTasks: async () => {
        const response = await axiosClient.get('/admin/tasks/my-tasks');
        return response.data;
    },
    updateTaskStatus: async (taskId, status) => {
        const response = await axiosClient.put(`/admin/tasks/${taskId}/status`, { status });
        return response.data;
    },
    deleteTask: async (taskId) => {
        const response = await axiosClient.delete(`/admin/tasks/${taskId}`);
        return response.data;
    },
        // AUDIT LOGS
    getAuditLogs: async () => {
        const response = await axiosClient.get('/admin/audit-logs');
        return response.data;
    },
        // FEFO
    getBatchesFEFO: async (medicineName) => {
        const response = await axiosClient.get(`/admin/inventory/medicines/fefo/${encodeURIComponent(medicineName)}`);
        return response.data;
    },
    dispenseFEFO: async (medicineId, quantity, reason = "Sale") => {
        const response = await axiosClient.post(`/admin/inventory/medicines/${medicineId}/dispense-fefo`, {
            quantity, reason
        });
        return response.data;
    },

        // FEEDBACK
    submitFeedback: async (feedbackData) => {
        const response = await axiosClient.post('/feedback', feedbackData);
        return response.data;
    },
    getAllFeedback: async () => {
        const response = await axiosClient.get('/feedback');
        return response.data;
    },
    getMyFeedback: async () => {
        const response = await axiosClient.get('/feedback/my-feedback');
        return response.data;
    },
    updateFeedback: async (id, data) => {
        const response = await axiosClient.put(`/feedback/${id}`, data);
        return response.data;
    },
    deleteFeedback: async (id) => {
        const response = await axiosClient.delete(`/feedback/${id}`);
        return response.data;
    },

    updateMyProfile: async (updates) => {
    const response = await axiosClient.put('/auth/profile', updates);
    return response.data;
},

    triggerLowStockAlert: async () => {
        const response = await axiosClient.post('/admin/inventory/send-low-stock-alert');
        return response.data;
    },

        triggerExpiryAlert: async () => {
        const response = await axiosClient.post('/admin/inventory/send-expiry-alert');
        return response.data;
    },

        // WASTAGE REPORT
    getWastageReport: async () => {
        const response = await axiosClient.get('/admin/inventory/reports/wastage');
        return response.data;
    },
    flagWastage: async (medicineId, reason) => {
        const response = await axiosClient.put(`/admin/inventory/medicines/${medicineId}/flag-wastage`, { reason });
        return response.data;
    },
    unflagWastage: async (medicineId) => {
        const response = await axiosClient.put(`/admin/inventory/medicines/${medicineId}/unflag-wastage`);
        return response.data;
    },
        // BACKUPS
    listBackups: async () => {
        const response = await axiosClient.get('/admin/backups');
        return response.data;
    },
    createBackup: async () => {
        const response = await axiosClient.post('/admin/backups/create');
        return response.data;
    },
    restoreBackup: async (fileName) => {
        const response = await axiosClient.post(`/admin/backups/restore/${fileName}`);
        return response.data;
    },
    deleteBackup: async (fileName) => {
        const response = await axiosClient.delete(`/admin/backups/${fileName}`);
        return response.data;
    },
    downloadBackupUrl: (fileName) => {
        // Returns full URL for the <a download> link
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        return `${base}/admin/backups/download/${fileName}`;
    },

};