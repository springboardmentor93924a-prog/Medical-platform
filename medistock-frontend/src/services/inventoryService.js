import axiosClient from './axiosClient';
import { StockStatus } from '../types';

export const computeStockStatus = (medicine) => {
    const qty = Number(medicine.quantity) || 0;
    const minQty = Number(medicine.minQuantity) || 10;
    const expiry = medicine.expiryDate ? new Date(medicine.expiryDate) : null;
    const now = new Date();
    
    if (expiry) {
        const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 0) return StockStatus.EXPIRED;
        if (daysUntilExpiry <= 45) return StockStatus.EXPIRING_SOON;
    }
    
    if (qty <= 0) return StockStatus.OUT_OF_STOCK;
    if (qty <= minQty) return StockStatus.LOW_STOCK;
    return StockStatus.IN_STOCK;
};

export const inventoryService = {
    getAll: async () => {
        // Fetch real data from your backend
        const response = await axiosClient.get('/admin/inventory/medicines');
        return response.data.map(m => ({
            ...m,
            status: m.status || computeStockStatus(m) // Use backend status if available
        }));
    },

    getById: async (id) => {
        const response = await axiosClient.get('/admin/inventory/medicines');
        const found = response.data.find(m => m.id === id);
        return found ? { ...found, status: computeStockStatus(found) } : null;
    },

    create: async (medicineData) => {
        const response = await axiosClient.post('/admin/inventory/medicines', medicineData);
        return response.data;
    },

    update: async (id, updates) => {
        const response = await axiosClient.put(`/admin/inventory/medicines/${id}`, updates);
        return response.data;
    },

    delete: async (id) => {
        await axiosClient.delete(`/admin/inventory/medicines/${id}`);
        return true;
    }
};