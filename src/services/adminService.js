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

    // --- DASHBOARD STATS ---
    getDashboardStats: async () => {
        const response = await axiosClient.get('/admin/inventory/dashboard-stats');
        return response.data;
    },
    // Add to adminService.js
getCategoryStats: async () => {
    const response = await axiosClient.get('/admin/inventory/dashboard-categories');
    return response.data;
}
};