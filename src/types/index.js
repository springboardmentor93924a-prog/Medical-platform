/**
 * MediStock Domain Types & Constant Enums
 */

export const StockStatus = {
    IN_STOCK: 'IN_STOCK',
    LOW_STOCK: 'LOW_STOCK',
    EXPIRING_SOON: 'EXPIRING_SOON',
    OUT_OF_STOCK: 'OUT_OF_STOCK',
    EXPIRED: 'EXPIRED'
};

export const StorageCondition = {
    AMBIENT: 'Ambient (15°C to 25°C)',
    REFRIGERATED: 'Refrigerated (2°C to 8°C)',
    FROZEN: 'Frozen (-20°C to -10°C)',
    CONTROLLED: 'Controlled Room Temp'
};

export const UserRole = {
    SUPER_ADMIN: 'Super Administrator',
    CHIEF_PHARMACIST: 'Chief Pharmacist',
    CLINICAL_NURSE: 'Clinical Nurse',
    INVENTORY_CLERK: 'Inventory Clerk'
};

export const AuditAction = {
    STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',
    MEDICINE_CREATED: 'MEDICINE_CREATED',
    MEDICINE_UPDATED: 'MEDICINE_UPDATED',
    MEDICINE_DELETED: 'MEDICINE_DELETED',
    SUPPLIER_ADDED: 'SUPPLIER_ADDED',
    DISPOSAL_RECORDED: 'DISPOSAL_RECORDED',
    REPORT_EXPORTED: 'REPORT_EXPORTED',
    USER_LOGIN: 'USER_LOGIN'
};
