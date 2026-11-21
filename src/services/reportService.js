import { inventoryService } from './inventoryService';
import { api } from './api';

export const reportService = {
    generateInventoryReport: async () => {
        const medicines = await inventoryService.getAll();
        const totalItems = medicines.length;
        const totalUnits = medicines.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
        const totalValuation = medicines.reduce((sum, m) => sum + ((Number(m.quantity) || 0) * (Number(m.unitPrice) || 0)), 0);

        const lowStock = medicines.filter(m => m.status === 'LOW_STOCK');
        const outOfStock = medicines.filter(m => m.status === 'OUT_OF_STOCK');
        const expiringSoon = medicines.filter(m => m.status === 'EXPIRING_SOON');
        const coldChain = medicines.filter(m => m.storageCondition.toLowerCase().includes('refrigerated'));

        return {
            generatedAt: new Date().toISOString(),
            metrics: {
                totalItems,
                totalUnits,
                totalValuation: totalValuation.toFixed(2),
                lowStockCount: lowStock.length,
                outOfStockCount: outOfStock.length,
                expiringSoonCount: expiringSoon.length,
                coldChainCount: coldChain.length
            },
            data: medicines
        };
    },

    exportToCSV: (filename, rows) => {
        if (!rows || !rows.length) return;
        const separator = ',';
        const keys = Object.keys(rows[0]);
        const csvContent =
            keys.join(separator) +
            '\n' +
            rows.map(row => {
                return keys.map(k => {
                    let cell = row[k] === null || row[k] === undefined ? '' : row[k];
                    cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
                    if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
                    return cell;
                }).join(separator);
            }).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};
