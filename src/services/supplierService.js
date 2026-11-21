import { api } from './api';

export const supplierService = {
    getAll: async () => {
        return api.getSuppliers();
    },

    getById: async (id) => {
        const suppliers = await api.getSuppliers();
        return suppliers.find(s => s.id === id) || null;
    },

    create: async (supplierData, currentUser) => {
        const suppliers = await api.getSuppliers();
        const newId = `SUP-00${suppliers.length + 1}`;
        const newSupplier = {
            ...supplierData,
            id: newId,
            status: 'Active',
            rating: Number(supplierData.rating) || 5.0,
            leadTimeDays: Number(supplierData.leadTimeDays) || 3,
            totalOrders: 0
        };

        const updated = [newSupplier, ...suppliers];
        await api.saveSuppliers(updated);
        await api.logAction('SUPPLIER_ADDED', `Registered certified pharmaceutical vendor: ${newSupplier.name}`, currentUser);
        return newSupplier;
    },

    update: async (id, updates, currentUser) => {
        const suppliers = await api.getSuppliers();
        const index = suppliers.findIndex(s => s.id === id);
        if (index === -1) throw new Error('Supplier not found');

        suppliers[index] = { ...suppliers[index], ...updates };
        await api.saveSuppliers(suppliers);
        await api.logAction('SUPPLIER_UPDATED', `Updated supplier details for ${suppliers[index].name}`, currentUser);
        return suppliers[index];
    },

    delete: async (id, currentUser) => {
        const suppliers = await api.getSuppliers();
        const target = suppliers.find(s => s.id === id);
        const filtered = suppliers.filter(s => s.id !== id);
        await api.saveSuppliers(filtered);
        await api.logAction('SUPPLIER_DELETED', `Removed supplier: ${target?.name || id}`, currentUser);
        return true;
    }
};
