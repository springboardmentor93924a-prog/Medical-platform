import axiosClient from './axiosClient';

// Remove the local computeStockStatus, because our Backend now calculates it!
export const inventoryService = {
    // Fetch all from backend
    getAll: async () => {
        const response = await axiosClient.get('/medicines');
        return response.data;
    },

    // Add new
    create: async (medicineData) => {
        const response = await axiosClient.post('/medicines', medicineData);
        return response.data;
    },

    // Update existing
    update: async (id, updates) => {
        const response = await axiosClient.put(`/medicines/${id}`, updates);
        return response.data;
    },

    // Delete
    delete: async (id) => {
        const response = await axiosClient.delete(`/medicines/${id}`);
        return response.data;
    },

        // Add this to your medicineService object
    adjustStock: async (id, delta) => {
        const response = await axiosClient.put(`/medicines/${id}/adjust-stock?delta=${delta}`);
        return response.data;
    }
};