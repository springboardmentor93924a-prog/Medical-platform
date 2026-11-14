import api from './api';

const downloadBlob = (response, defaultFilename) => {
  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Try to parse filename from content-disposition header if present
  let filename = defaultFilename;
  const disposition = response.headers ? response.headers['content-disposition'] : null;
  if (disposition && disposition.indexOf('filename=') !== -1) {
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const reportService = {
  exportInventoryPdf: async () => {
    const response = await api.get('/reports/inventory/pdf', { responseType: 'blob' });
    downloadBlob(response, 'medistock_inventory_report.pdf');
    return response;
  },

  exportInventoryExcel: async () => {
    const response = await api.get('/reports/inventory/excel', { responseType: 'blob' });
    downloadBlob(response, 'medistock_inventory_report.xlsx');
    return response;
  },

  exportInventoryCsv: async () => {
    const response = await api.get('/reports/inventory/csv', { responseType: 'blob' });
    downloadBlob(response, 'medistock_inventory_report.csv');
    return response;
  },

  exportExpiryPdf: async () => {
    const response = await api.get('/reports/expiry/pdf', { responseType: 'blob' });
    downloadBlob(response, 'medistock_expiry_audit.pdf');
    return response;
  },

  exportExpiryExcel: async () => {
    const response = await api.get('/reports/expiry/excel', { responseType: 'blob' });
    downloadBlob(response, 'medistock_expiry_audit.xlsx');
    return response;
  },

  exportSuppliersExcel: async () => {
    const response = await api.get('/reports/suppliers/excel', { responseType: 'blob' });
    downloadBlob(response, 'medistock_suppliers_report.xlsx');
    return response;
  },

  exportPurchaseOrdersExcel: async () => {
    const response = await api.get('/reports/purchase-orders/excel', { responseType: 'blob' });
    downloadBlob(response, 'medistock_purchase_orders.xlsx');
    return response;
  },

  exportMovementsCsv: async () => {
    const response = await api.get('/reports/movements/csv', { responseType: 'blob' });
    downloadBlob(response, 'medistock_stock_movements.csv');
    return response;
  },

  exportMovementsPdf: async () => {
    const response = await api.get('/reports/movements/pdf', { responseType: 'blob' });
    downloadBlob(response, 'medistock_stock_movements.pdf');
    return response;
  },

  exportMovementsExcel: async () => {
    const response = await api.get('/reports/movements/excel', { responseType: 'blob' });
    downloadBlob(response, 'medistock_stock_movements.xlsx');
    return response;
  },

  // Dynamic Multi-format Wrappers used by ReportsPage
  exportMedicines: async (format = 'excel') => {
    if (format === 'pdf') {
      return await reportService.exportInventoryPdf();
    } else if (format === 'csv') {
      return await reportService.exportInventoryCsv();
    }
    return await reportService.exportInventoryExcel();
  },

  exportExpiry: async (format = 'excel') => {
    if (format === 'pdf') {
      return await reportService.exportExpiryPdf();
    }
    return await reportService.exportExpiryExcel();
  },

  exportPurchaseOrders: async (format = 'excel') => {
    return await reportService.exportPurchaseOrdersExcel();
  },

  exportSuppliers: async (format = 'excel') => {
    return await reportService.exportSuppliersExcel();
  },

  exportStockMovements: async (format = 'excel') => {
    if (format === 'pdf') {
      return await reportService.exportMovementsPdf();
    } else if (format === 'csv') {
      return await reportService.exportMovementsCsv();
    }
    return await reportService.exportMovementsExcel();
  },
};

export default reportService;
