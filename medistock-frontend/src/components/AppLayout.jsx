import React, { useState, useEffect } from 'react';
import { Sidebar } from './common/Sidebar';
import { Navbar } from './common/Navbar';

// Existing Views
import { InventoryManagementView } from './views/InventoryManagementView';
import { ExpiryTrackingView } from './views/ExpiryTrackingView';
import { SuppliersView } from './views/SuppliersView';
import { PurchaseOrdersView } from './views/PurchaseOrdersView'; 
import { PharmacistDashboardView } from './views/PharmacistDashboardView';
import { ProfileView } from './views/ProfileView';
import { NotificationsView } from './views/NotificationsView';
import { WastageReportView } from './views/WastageReportView';
import { BackupRestoreView } from './views/BackupRestoreView';


import { AuditLogsView } from './views/AuditLogsView';

// Pages
import AdminDashboardPage from '../pages/AdminDashboardPage';
import MedicinesManagementPage from '../pages/MedicinesManagementPage';
import CategoriesPage from '../pages/CategoriesPage';
import ReportsExportView from '../pages/ReportsExportView';

// Specific components
import { BillingPOSView } from './views/BillingPOSView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { UserRolesView } from './views/UserRolesView'; 

// Supplier Views
import { SupplierDashboard } from '../pages/SupplierDashboard';
import { SupplierOrdersView } from './views/SupplierOrdersView';
import { SupplierDeliveryView } from './views/SupplierDeliveryView';
import { SupplierHistoryView } from './views/SupplierHistoryView';
import { SupplierBillingView } from './views/SupplierBillingView';

// Modals
import { AddEditMedicineModal } from './modals/AddEditMedicineModal';
import { AddSupplierModal } from './modals/AddSupplierModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';

// Services & Context
import { adminService } from '../services/adminService'; 
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

//Staff
import { StaffDashboardView } from './views/StaffDashboardView';
import { StockCheckingView } from './views/StockCheckingView';
import { ReceiveMedicinesView } from './views/ReceiveMedicinesView';
import { TaskManagementView } from './views/TaskManagementView';

import { FeedbackButton } from './common/FeedbackButton';
import { FeedbackManagementView } from './views/FeedbackManagementView';

export const AppLayout = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    
    const role = (user?.role || 'ADMIN').toUpperCase();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [medicines, setMedicines] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [medicineModalOpen, setMedicineModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);

    const [supplierModalOpen, setSupplierModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('medicine'); 

        const loadAllData = async () => {
        try {
            setIsLoading(true);
            // Fetch medicines (Staff needs this)
            const medsData = await adminService.getAllMedicines();
            setMedicines(medsData || []);

            // Only fetch suppliers for Admin/Pharmacist (Staff doesn't need it)
            if (['ADMIN', 'PHARMACIST'].includes(role)) {
                const suppsData = await adminService.getAllSuppliers();
                setSuppliers(suppsData || []);
            }
        } catch (err) {
            console.error('Failed to load clinical data:', err);
            showToast('Failed to load repository data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, [role]); // Re-fetch if role changes

    // --- HANDLERS ---
    const handleSaveMedicine = async (medicineData) => {
        try {
            if (editingMedicine) {
                await adminService.updateMedicine(editingMedicine.id, medicineData);
                showToast(`Updated ${medicineData.name}`, 'success');
            } else {
                await adminService.createMedicine(medicineData);
                showToast(`Registered ${medicineData.name}`, 'success');
            }
            setMedicineModalOpen(false);
            setEditingMedicine(null);
            loadAllData();
        } catch (err) {
            showToast(err.message || 'Operation failed', 'error');
        }
    };

    const handleAdjustStock = async (id, delta, reason) => {
        try {
            const med = medicines.find(m => m.id === id);
            if (!med) return;
            const newQty = Math.max(0, med.quantity + delta);
            await adminService.updateMedicine(id, { ...med, quantity: newQty });
            loadAllData(); 
        } catch (err) {
            showToast('Failed to adjust stock', 'error');
        }
    };

    const handlePromptDeleteMedicine = (med) => {
        setItemToDelete(med);
        setDeleteType('medicine');
        setDeleteModalOpen(true);
    };

    const handleSaveSupplier = async (supplierData) => {
        try {
            if (editingSupplier) {
                await adminService.updateSupplier(editingSupplier.id, supplierData);
                showToast(`Updated supplier: ${supplierData.name}`, 'success');
            } else {
                const res = await adminService.createSupplier(supplierData);
                showToast(`Supplier + login created. Share credentials with ${supplierData.email}`, 'success');
            }
            setSupplierModalOpen(false);
            setEditingSupplier(null);
            loadAllData();
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Failed to save supplier', 'error');
        }
    };



    
    const handleEditSupplier = (supplier) => {
        setEditingSupplier(supplier);
        setSupplierModalOpen(true);
    };

    const handlePromptDeleteSupplier = (supp) => {
        setItemToDelete(supp);
        setDeleteType('supplier');
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            if (deleteType === 'medicine') {
                await adminService.deleteMedicine(itemToDelete.id);
            } else {
                await adminService.deleteSupplier(itemToDelete.id);
            }
            setDeleteModalOpen(false);
            setItemToDelete(null);
            loadAllData();
        } catch (err) {
            showToast(err.message || 'Deletion failed', 'error');
        }
    };

    const criticalCount = medicines.filter(m => m.status === 'EXPIRING_SOON' || m.status === 'LOW_STOCK' || m.status === 'OUT_OF_STOCK').length;

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-300">
            <Sidebar
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                counts={{ total: medicines.length, critical: criticalCount, suppliers: suppliers.length }}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar
                    onOpenProfile={() => setActiveTab('profile')}
                    onNavigate={setActiveTab}
                />
                <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
                   
                    


                   {/* DASHBOARD */}
                   {activeTab === 'dashboard' && role === 'ADMIN' && <AdminDashboardPage onNavigate={setActiveTab} />}
                   {activeTab === 'dashboard' && role === 'PHARMACIST' && <PharmacistDashboardView medicines={medicines} suppliers={suppliers} onNavigate={setActiveTab} />}
                   {activeTab === 'dashboard' && role === 'SUPPLIER' && <SupplierDashboard onNavigate={setActiveTab} />}
                   {activeTab === 'dashboard' && role === 'STAFF' && <StaffDashboardView medicines={medicines} onNavigate={setActiveTab} />}
                  
    {/* SUPPLIER PAGES */}
                   {activeTab === 'orders' && role === 'SUPPLIER' && <SupplierOrdersView />}
                   {activeTab === 'delivery' && role === 'SUPPLIER' && <SupplierDeliveryView />}
                   {activeTab === 'history' && role === 'SUPPLIER' && <SupplierHistoryView />}
                   {activeTab === 'billing' && role === 'SUPPLIER' && <SupplierBillingView />}

                   {/* MEDICINES (Admin & Pharmacist) */}
                   {activeTab === 'medicines' && ['ADMIN', 'PHARMACIST','STAFF'].includes(role) && (
                        <MedicinesManagementPage
                            isAdmin={role === 'ADMIN'}
                            onOpenAddModal={() => {
                                if (role !== 'ADMIN') return;
                                setEditingMedicine(null);
                                setMedicineModalOpen(true);
                            }}
                            onEditMedicine={(med) => {
                                if (role !== 'ADMIN') return;
                                setEditingMedicine(med);
                                setMedicineModalOpen(true);
                            }}
                            onDeleteMedicine={role === 'ADMIN' ? handlePromptDeleteMedicine : undefined}
                        />
                    )}

                    {/* CATEGORIES */}
                    {activeTab === 'categories' && <CategoriesPage />}
                    

                    {/* INVENTORY / STOCK MONITORING */}
                    {activeTab === 'inventory' && role === 'STAFF' && (<StockCheckingView medicines={medicines} onRefresh={loadAllData} />)}
                    {activeTab === 'inventory' && role !== 'STAFF' &&(
                        <InventoryManagementView
                            medicines={medicines}
                            suppliers={suppliers}
                            role = {role}
                            onOpenAddModal={() => { setEditingMedicine(null); setMedicineModalOpen(true); }}
                            onEditMedicine={(med) => { setEditingMedicine(med); setMedicineModalOpen(true); }}
                            onDeleteMedicine={role === 'ADMIN' ? handlePromptDeleteMedicine : (med) => showToast("Only Admin can delete medicines", "error")}
                            onAdjustStock={handleAdjustStock}
                        />
                    )}
                     {/* Recieve Mei=dicine - STAFF */}
                    {activeTab === 'receive' && role === 'STAFF' && <ReceiveMedicinesView />}

                    {/* EXPIRY */}
                    {activeTab === 'expiry' && (
                        <ExpiryTrackingView
                            medicines={medicines}
                            onDeleteMedicine={role === 'ADMIN' ? handlePromptDeleteMedicine : undefined}
                        />
                    )}

                    {/* PURCHASE ORDERS */}
                    {activeTab === 'purchase-orders' && (
                        <PurchaseOrdersView role={role} />
                    )}

                    {/* SUPPLIERS (Admin only) */}
                    {activeTab === 'suppliers' && (
                        <SuppliersView
                            suppliers={suppliers}
                            medicines={medicines}
                            role={role}
                            onOpenAddSupplier={role === 'ADMIN' ? () => { setEditingSupplier(null); setSupplierModalOpen(true); } : undefined}
                            onEditSupplier={role === 'ADMIN' ? handleEditSupplier : undefined}
                            onDeleteSupplier={role === 'ADMIN' ? handlePromptDeleteSupplier : undefined}
                        />
                    )}

                    {/* REPORTS */}
                    {activeTab === 'reports' && (
                        <ReportsExportView medicines={medicines} suppliers={suppliers} auditLogs={[]} />
                    )}

                    {/* PROFILE */}
                    {activeTab === 'profile' && <ProfileView />}

                    {/* ADMIN ONLY PAGES */}
                    {activeTab === 'users' && role === 'ADMIN' && <UserRolesView />}
                    {activeTab === 'billing' && role === 'ADMIN' && <BillingPOSView />}
                    {activeTab === 'sales' && role === 'ADMIN' && <SalesHistoryView />}
                    {activeTab === 'tasks' && role === 'ADMIN' && <TaskManagementView />}
                    {activeTab === 'audit' && role === 'ADMIN' && <AuditLogsView />}
                    {activeTab === 'feedback' && role === 'ADMIN' && <FeedbackManagementView />}
                    {activeTab === 'wastage' && role === 'ADMIN' && <WastageReportView />}
                    {activeTab === 'backup' && role === 'ADMIN' && <BackupRestoreView />}

                    
                    {/* NOTIFICATIONS */}
                    {activeTab === 'notifications' && <NotificationsView/>}
                </main>
            </div>

            {/* Modals */}
            <AddEditMedicineModal
                isOpen={medicineModalOpen}
                initialData={editingMedicine}
                suppliers={suppliers}
                onClose={() => { setMedicineModalOpen(false); setEditingMedicine(null); }}
                onSave={handleSaveMedicine}
            />

            <AddSupplierModal
                isOpen={supplierModalOpen}
                initialData={editingSupplier}
                onClose={() => { setSupplierModalOpen(false); setEditingSupplier(null); }}
                onSave={handleSaveSupplier}
            />

            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
                onConfirm={handleConfirmDelete}
                title={deleteType === 'medicine' ? 'Decommission Pharmaceutical Record' : 'Remove Certified Supplier'}
                message={`Are you sure you want to remove "${itemToDelete?.name}"?`}
            />

            {/* Floating feedback button — available to ALL roles */}
            <FeedbackButton />
        </div>
    );
};