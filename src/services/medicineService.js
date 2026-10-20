import axiosClient from './axiosClient';

export const medicineService = {
    getAll: async () => (await axiosClient.get('/medicines')).data,
    create: async (data) => (await axiosClient.post('/medicines', data)).data,
    update: async (id, data) => (await axiosClient.put(`/medicines/${id}`, data)).data,
    delete: async (id) => (await axiosClient.delete(`/medicines/${id}`)).data,
    getSuppliers: async () => (await axiosClient.get('/suppliers')).data,

    // THIS IS THE MISSING FUNCTION:
    adjustStock: async (id, delta) => {
        const response = await axiosClient.put(`/medicines/${id}/adjust-stock?delta=${delta}`);
        return response.data;
    }
};