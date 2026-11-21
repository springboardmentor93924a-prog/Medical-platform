import { api } from './api';

export const auditService = {
    getAll: async () => {
        return api.getAuditLogs();
    },

    log: async (action, details, user) => {
        return api.logAction(action, details, user);
    }
};
