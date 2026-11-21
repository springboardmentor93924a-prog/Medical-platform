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
        const response = await axiosClient.get('/supplier/purchase-orders');
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

};