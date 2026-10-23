import axiosClient from './axiosClient';

export const adminService = {
    // Fetch all users
    getAllUsers: async () => {
        const response = await axiosClient.get('/admin/users');
        return response.data;
    },

    // Enable/Disable a user
    toggleUserStatus: async (userId) => {
        const response = await axiosClient.put(`/admin/users/${userId}/toggle-status`);
        return response.data;
    }
};