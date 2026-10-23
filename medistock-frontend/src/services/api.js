/**
 * MediStock Central API & LocalStorage Persistence Orchestrator
 */

import { INITIAL_MEDICINES, INITIAL_SUPPLIERS, INITIAL_AUDIT_LOGS } from './mockData';

const KEYS = {
    MEDICINES: 'medistock_medicines_v1',
    SUPPLIERS: 'medistock_suppliers_v1',
    AUDIT_LOGS: 'medistock_audit_logs_v1',
    AUTH_USER: 'medistock_auth_user_v1'
};

// Force clear previously seeded data to ensure 100% clean state
export const clearAllData = () => {
    localStorage.setItem(KEYS.MEDICINES, JSON.stringify([]));
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify([]));
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify([]));
};

// Initialize LocalStorage if empty
export const initializeStorage = () => {
    if (!localStorage.getItem(KEYS.MEDICINES)) {
        localStorage.setItem(KEYS.MEDICINES, JSON.stringify(INITIAL_MEDICINES));
    }
    if (!localStorage.getItem(KEYS.SUPPLIERS)) {
        localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    }
    if (!localStorage.getItem(KEYS.AUDIT_LOGS)) {
        localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
};

// Automatically run clear once if previous default mock items are detected
(() => {
    try {
        const existingMeds = localStorage.getItem(KEYS.MEDICINES);
        if (existingMeds && existingMeds !== '[]') {
            clearAllData();
        }
    } catch (e) {
        // ignore
    }
})();

// Generic Helpers
const getCollection = (key) => {
    initializeStorage();
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error(`Error reading ${key} from storage:`, e);
        return [];
    }
};

const setCollection = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving ${key} to storage:`, e);
    }
};

export const api = {
    // Medicines
    getMedicines: async () => {
        return getCollection(KEYS.MEDICINES);
    },
    saveMedicines: async (medicines) => {
        setCollection(KEYS.MEDICINES, medicines);
        return medicines;
    },

    // Suppliers
    getSuppliers: async () => {
        return getCollection(KEYS.SUPPLIERS);
    },
    saveSuppliers: async (suppliers) => {
        setCollection(KEYS.SUPPLIERS, suppliers);
        return suppliers;
    },

    // Audit Logs
    getAuditLogs: async () => {
        return getCollection(KEYS.AUDIT_LOGS);
    },
    logAction: async (action, details, user) => {
        const logs = getCollection(KEYS.AUDIT_LOGS);
        const newLog = {
            id: `AUD-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString(),
            userName: user?.name || 'Chief Pharmacist',
            userRole: user?.role || 'Pharmacist',
            action,
            details,
            status: 'Success'
        };
        const updated = [newLog, ...logs].slice(0, 100);
        setCollection(KEYS.AUDIT_LOGS, updated);
        return newLog;
    },

    // Reset to clean empty slate
    resetToDefaults: () => {
        clearAllData();
    }
};
