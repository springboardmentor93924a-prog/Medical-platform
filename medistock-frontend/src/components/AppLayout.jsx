import React, { useState, useEffect } from 'react';
import { Sidebar } from './common/Sidebar';
import { Navbar } from './common/Navbar';
import { DashboardOverviewView } from './views/DashboardOverviewView';
import { InventoryManagementView } from './views/InventoryManagementView';
import { ExpiryTrackingView } from './views/ExpiryTrackingView';
import { SuppliersView } from './views/SuppliersView';
import { ReportsExportView } from './views/ReportsExportView';
import { AuditLogsView } from './views/AuditLogsView';
import { ProfileView } from './views/ProfileView';

import { AddEditMedicineModal } from './modals/AddEditMedicineModal';
import { AddSupplierModal } from './modals/AddSupplierModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';

import { inventoryService } from '../services/inventoryService';
import { supplierService } from '../services/supplierService';
import { auditService } from '../services/auditService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import AdminDashboardPage from '../pages/AdminDashboardPage';


import { 
    LayoutDashboard, 
    Pill, 
    Snowflake, 
    Truck, 
    Menu 
} from 'lucide-react';

export const AppLayout = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [medicines, setMedicines] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [medicineModalOpen, setMedicineModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);

    const [supplierModalOpen, setSupplierModalOpen] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('medicine'); // 'medicine' | 'supplier'

    // Load Data
    const loadAllData = async () => {
        try {
            setIsLoading(true);
            const [medsData, suppsData, logsData] = await Promise.all([
                inventoryService.getAll(),
                supplierService.getAll(),
                auditService.getAll()
            ]);
            setMedicines(medsData);
            setSuppliers(suppsData);
            setAuditLogs(logsData);
        } catch (err) {
            console.error('Failed to load clinical data:', err);
            showToast('Failed to load repository data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // Medicine handlers
    const handleSaveMedicine = async (medicineData) => {
        try {
            if (editingMedicine) {
                const updated = await inventoryService.update(editingMedicine.id, medicineData, user);
                showToast(`Updated ${updated.name}`, 'success');
            } else {
                const created = await inventoryService.create(medicineData, user);
                showToast(`Registered ${created.name}`, 'success');
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
            await inventoryService.adjustStock(id, delta, reason, user);
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

    // Supplier handlers
    const handleSaveSupplier = async (supplierData) => {
        try {
            const created = await supplierService.create(supplierData, user);
            showToast(`Registered supplier: ${created.name}`, 'success');
            setSupplierModalOpen(false);
            loadAllData();
        } catch (err) {
            showToast(err.message || 'Failed to add supplier', 'error');
        }
    };

    const handlePromptDeleteSupplier = (supp) => {
        setItemToDelete(supp);
        setDeleteType('supplier');
        setDeleteModalOpen(true);
    };

    // Confirm Delete
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            if (deleteType === 'medicine') {
                await inventoryService.delete(itemToDelete.id, user);
                showToast(`Removed product ${itemToDelete.name}`, 'warning');
            } else {
                await supplierService.delete(itemToDelete.id, user);
                showToast(`Removed supplier ${itemToDelete.name}`, 'warning');
            }
            setDeleteModalOpen(false);
            setItemToDelete(null);
            loadAllData();
        } catch (err) {
            showToast('Deletion failed', 'error');
        }
    };

    // Counts for sidebar badges
    const criticalCount = medicines.filter(m => m.status === 'EXPIRING_SOON' || m.status === 'LOW_STOCK' || m.status === 'OUT_OF_STOCK').length;

    return (
        <div className="flex min-h-screen bg-white text-slate-900 font-sans">
            {/* Sidebar (Responsive Desktop Aside + Mobile Drawer) */}
            <Sidebar
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                mobileOpen={mobileSidebarOpen}
                onCloseMobile={() => setMobileSidebarOpen(false)}
                counts={{
                    total: medicines.length,
                    critical: criticalCount,
                    suppliers: suppliers.length
                }}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Navbar */}
                <Navbar 
                    onOpenProfile={() => setActiveTab('profile')}
                    onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
                />

                {/* View Container */}
                <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
                   
                   {activeTab === 'admin' && (
                        <AdminDashboardPage />
                    )}
                   
                   {activeTab === 'dashboard' && (
                        <DashboardOverviewView
                            medicines={medicines}
                            suppliers={suppliers}
                            auditLogs={auditLogs}
                            onNavigate={setActiveTab}
                            onOpenAddMedicine={() => {
                                setEditingMedicine(null);
                                setMedicineModalOpen(true);
                            }}
                        />
                    )}

                    {activeTab === 'inventory' && (
                        <InventoryManagementView
                            medicines={medicines}
                            suppliers={suppliers}
                            onOpenAddModal={() => {
                                setEditingMedicine(null);
                                setMedicineModalOpen(true);
                            }}
                            onEditMedicine={(med) => {
                                setEditingMedicine(med);
                                setMedicineModalOpen(true);
                            }}
                            onDeleteMedicine={handlePromptDeleteMedicine}
                            onAdjustStock={handleAdjustStock}
                        />
                    )}

                    {activeTab === 'expiry' && (
                        <ExpiryTrackingView
                            medicines={medicines}
                            onAdjustStock={handleAdjustStock}
                            onDeleteMedicine={handlePromptDeleteMedicine}
                        />
                    )}

                    {activeTab === 'suppliers' && (
                        <SuppliersView
                            suppliers={suppliers}
                            medicines={medicines}
                            onOpenAddSupplier={() => setSupplierModalOpen(true)}
                            onDeleteSupplier={handlePromptDeleteSupplier}
                        />
                    )}

                    {activeTab === 'reports' && (
                        <ReportsExportView
                            medicines={medicines}
                            suppliers={suppliers}
                            auditLogs={auditLogs}
                        />
                    )}

                    {activeTab === 'audit' && (
                        <AuditLogsView
                            auditLogs={auditLogs}
                        />
                    )}

                    {activeTab === 'profile' && (
                        <ProfileView />
                    )}
                </main>

                {/* Mobile Bottom Navigation Bar (Visible < lg) */}
                <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 px-2 py-1.5 flex items-center justify-around shadow-lg">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
                            activeTab === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <LayoutDashboard size={19} className={activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'} />
                        <span className="text-[10px] mt-0.5">Overview</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all relative cursor-pointer ${
                            activeTab === 'inventory' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Pill size={19} className={activeTab === 'inventory' ? 'text-emerald-600' : 'text-slate-400'} />
                        <span className="text-[10px] mt-0.5">Formulary</span>
                        {medicines.length > 0 && (
                            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('expiry')}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all relative cursor-pointer ${
                            activeTab === 'expiry' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Snowflake size={19} className={activeTab === 'expiry' ? 'text-cyan-600' : 'text-slate-400'} />
                        <span className="text-[10px] mt-0.5">Cold-Chain</span>
                        {criticalCount > 0 && (
                            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('suppliers')}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
                            activeTab === 'suppliers' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Truck size={19} className={activeTab === 'suppliers' ? 'text-teal-600' : 'text-slate-400'} />
                        <span className="text-[10px] mt-0.5">Vendors</span>
                    </button>

                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                    >
                        <Menu size={19} className="text-slate-500" />
                        <span className="text-[10px] mt-0.5">More</span>
                    </button>
                </nav>
            </div>

            {/* Modals */}
            <AddEditMedicineModal
                isOpen={medicineModalOpen}
                initialData={editingMedicine}
                suppliers={suppliers}
                onClose={() => {
                    setMedicineModalOpen(false);
                    setEditingMedicine(null);
                }}
                onSave={handleSaveMedicine}
            />

            <AddSupplierModal
                isOpen={supplierModalOpen}
                onClose={() => setSupplierModalOpen(false)}
                onSave={handleSaveSupplier}
            />

            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setItemToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title={deleteType === 'medicine' ? 'Decommission Pharmaceutical Record' : 'Remove Certified Supplier'}
                message={`Are you sure you want to remove "${itemToDelete?.name}"? An audit trail event will be logged permanently.`}
            />
        </div>
    );
};
