import axiosClient from './axiosClient';

export const supplierService = {
    // Fetch all suppliers from Spring Boot
    getAll: async () => {
        const response = await axiosClient.get('/suppliers');
        return response.data;
    },

    // Create a new supplier
    create: async (supplierData) => {
        const response = await axiosClient.post('/suppliers', supplierData);
        return response.data;
    }
};