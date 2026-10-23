import { api } from './api';
import { StockStatus } from '../types';

export const computeStockStatus = (medicine) => {
    const qty = Number(medicine.quantity) || 0;
    const minQty = Number(medicine.minQuantity) || 10;
    const expiry = new Date(medicine.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) return StockStatus.EXPIRED;
    if (qty <= 0) return StockStatus.OUT_OF_STOCK;
    if (daysUntilExpiry <= 45) return StockStatus.EXPIRING_SOON;
    if (qty <= minQty) return StockStatus.LOW_STOCK;
    return StockStatus.IN_STOCK;
};

export const inventoryService = {
    getAll: async () => {
        const items = await api.getMedicines();
        return items.map(m => ({
            ...m,
            status: computeStockStatus(m)
        }));
    },

    getById: async (id) => {
        const items = await api.getMedicines();
        const found = items.find(m => m.id === id);
        return found ? { ...found, status: computeStockStatus(found) } : null;
    },

    create: async (medicineData, currentUser) => {
        const items = await api.getMedicines();
        const newId = `MED-${Math.floor(100 + Math.random() * 900)}`;
        const newMedicine = {
            ...medicineData,
            id: newId,
            quantity: Number(medicineData.quantity) || 0,
            minQuantity: Number(medicineData.minQuantity) || 10,
            unitPrice: Number(medicineData.unitPrice) || 0
        };
        newMedicine.status = computeStockStatus(newMedicine);

        const updated = [newMedicine, ...items];
        await api.saveMedicines(updated);
        await api.logAction('MEDICINE_CREATED', `Added pharmaceutical record: ${newMedicine.name} (${newMedicine.dosageForm}) - Lot ${newMedicine.batchNumber}`, currentUser);
        return newMedicine;
    },

    update: async (id, updates, currentUser) => {
        const items = await api.getMedicines();
        const index = items.findIndex(m => m.id === id);
        if (index === -1) throw new Error('Medicine not found');

        const updatedMedicine = {
            ...items[index],
            ...updates,
            quantity: Number(updates.quantity !== undefined ? updates.quantity : items[index].quantity),
            minQuantity: Number(updates.minQuantity !== undefined ? updates.minQuantity : items[index].minQuantity),
            unitPrice: Number(updates.unitPrice !== undefined ? updates.unitPrice : items[index].unitPrice)
        };
        updatedMedicine.status = computeStockStatus(updatedMedicine);

        items[index] = updatedMedicine;
        await api.saveMedicines(items);
        await api.logAction('MEDICINE_UPDATED', `Updated record for ${updatedMedicine.name} (Qty: ${updatedMedicine.quantity})`, currentUser);
        return updatedMedicine;
    },

    delete: async (id, currentUser) => {
        const items = await api.getMedicines();
        const target = items.find(m => m.id === id);
        const filtered = items.filter(m => m.id !== id);
        await api.saveMedicines(filtered);
        await api.logAction('MEDICINE_DELETED', `Decommissioned item: ${target?.name || id} from formulary catalog`, currentUser);
        return true;
    },

    adjustStock: async (id, delta, reason, currentUser) => {
        const items = await api.getMedicines();
        const index = items.findIndex(m => m.id === id);
        if (index === -1) throw new Error('Medicine not found');

        const item = items[index];
        const newQty = Math.max(0, (Number(item.quantity) || 0) + delta);
        item.quantity = newQty;
        item.status = computeStockStatus(item);

        await api.saveMedicines(items);
        await api.logAction('STOCK_ADJUSTMENT', `Adjusted quantity of ${item.name} by ${delta > 0 ? '+' : ''}${delta} (${reason})`, currentUser);
        return item;
    }
};
